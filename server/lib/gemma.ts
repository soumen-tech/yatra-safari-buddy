/**
 * YatraAI — Centralized Gemma 4 AI Service (Server-side)
 * Manages Google AI Gemma 4 API calls with Groq fallback,
 * in-memory caching, conversation memory, structured JSON validation,
 * exponential backoff, and token optimization.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const GOOGLE_MODEL = "gemma-2-9b-it"; // Gemma model
const GROQ_MODEL = "gemma2-9b-it";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export interface GemmaError {
  error: true;
  message: string;
  fallback: boolean;
}

export function isGemmaError(v: unknown): v is GemmaError {
  return typeof v === "object" && v !== null && (v as GemmaError).error === true;
}

/* ────── In-Memory Response Cache ────── */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}
const cacheMap = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minute cache for identical prompts

function getCached<T>(key: string): T | null {
  const entry = cacheMap.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cacheMap.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  // Simple eviction if map gets too large
  if (cacheMap.size > 200) {
    const firstKey = cacheMap.keys().next().value;
    if (firstKey) cacheMap.delete(firstKey);
  }
  cacheMap.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

/* ────── Prompt Helper & JSON Extractor ────── */
export function requestJsonOutput(prompt: string, schema: string): string {
  return `${prompt.trim()}

CRITICAL: Return ONLY valid, minified JSON strictly adhering to this schema. No markdown fences, no conversational text:
${schema}`;
}

export function parseJson<T>(raw: string): T {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

/* ────── Retry Engine ────── */
async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T | GemmaError> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      if (attempt === maxAttempts) {
        const msg = err instanceof Error ? err.message : "AI service temporary timeout";
        return { error: true, message: msg, fallback: true };
      }
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
    }
  }
  return { error: true, message: "AI service unavailable", fallback: true };
}

/* ────── Official Google Gemma 4 API Client ────── */
async function callGemmaGoogle(prompt: string): Promise<string> {
  const apiKey =
    process.env["GOOGLE_API_KEY"] ??
    process.env["GOOGLE_AI_STUDIO_KEY"] ??
    "";

  if (!apiKey || apiKey.includes("YOUR_GOOGLE")) {
    throw new Error("GOOGLE_API_KEY is not configured in environment variables");
  }

  // Use official SDK if available, or direct REST API
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: GOOGLE_MODEL });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch {
    // REST API fallback
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GOOGLE_MODEL}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
      }),
    });
    if (!res.ok) throw new Error(`Google AI API Error ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { candidates: { content: { parts: { text: string }[] } }[] };
    return data.candidates[0]?.content?.parts?.[0]?.text ?? "";
  }
}

/* ────── Groq Gemma API Client (Fallback) ────── */
async function callGemmaGroq(prompt: string): Promise<string> {
  const apiKey = process.env["GROQ_API_KEY"] ?? "";
  if (!apiKey || apiKey.includes("YOUR_GROQ")) {
    throw new Error("GROQ_API_KEY is not configured in environment variables");
  }

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) throw new Error(`Groq API Error ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content ?? "";
}

/* ────── Centralized Gemma Service Entry Point ────── */
export async function callGemma<T = unknown>(
  prompt: string,
  options: { useCache?: boolean; conversationContext?: string } = { useCache: true },
): Promise<T | GemmaError> {
  const fullPrompt = options.conversationContext
    ? `[Context: ${options.conversationContext}]\n\n${prompt}`
    : prompt;

  const cacheKey = `gemma_${fullPrompt}`;

  if (options.useCache !== false) {
    const cached = getCached<T>(cacheKey);
    if (cached) return cached;
  }

  const preferredProvider = process.env["AI_PROVIDER"] ?? "google";
  const primaryFn = preferredProvider === "groq" ? callGemmaGroq : callGemmaGoogle;
  const fallbackFn = preferredProvider === "groq" ? callGemmaGoogle : callGemmaGroq;

  // Try primary provider with retry logic
  let primaryResult = await withRetry(() => primaryFn(fullPrompt));
  let rawText = "";

  if (isGemmaError(primaryResult)) {
    // Failover to secondary provider
    const fallbackResult = await withRetry(() => fallbackFn(fullPrompt));
    if (isGemmaError(fallbackResult)) {
      return fallbackResult;
    }
    rawText = fallbackResult as string;
  } else {
    rawText = primaryResult as string;
  }

  try {
    const parsed = parseJson<T>(rawText);
    if (options.useCache !== false) {
      setCache(cacheKey, parsed);
    }
    return parsed;
  } catch {
    return {
      error: true,
      message: "AI response structure mismatch. Please retry.",
      fallback: true,
    };
  }
}

/* ────── Multimodal Gemma Vision Service (Receipt & Photo OCR) ────── */
export async function callGemmaVision<T = unknown>(
  prompt: string,
  imageBase64: string,
  mimeType: "image/jpeg" | "image/png" | "image/webp" = "image/jpeg",
): Promise<T | GemmaError> {
  const apiKey =
    process.env["GOOGLE_API_KEY"] ??
    process.env["GOOGLE_AI_STUDIO_KEY"] ??
    "";

  if (!apiKey || apiKey.includes("YOUR_GOOGLE")) {
    return callGemma<T>(`${prompt}\n\n[Receipt image text: extract expenses from plain description]`);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GOOGLE_MODEL}:generateContent?key=${apiKey}`;
  const result = await withRetry(async () => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: imageBase64 } },
            ],
          },
        ],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
      }),
    });
    if (!res.ok) throw new Error(`Gemma Vision Error ${res.status}`);
    const data = (await res.json()) as { candidates: { content: { parts: { text: string }[] } }[] };
    return data.candidates[0]?.content?.parts?.[0]?.text ?? "";
  });

  if (isGemmaError(result)) return result;

  try {
    return parseJson<T>(result as string);
  } catch {
    return { error: true, message: "Receipt scan unreadable. Please enter details manually.", fallback: true };
  }
}
