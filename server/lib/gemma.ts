/**
 * YatraAI — Unified Gemma AI Interface (server-side, Nitro compatible)
 * callGemma(prompt) → tries Groq first, falls back to Google AI Studio
 * Includes exponential backoff: 1s → 2s → 4s (3 attempts per provider)
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "gemma2-9b-it";
const GOOGLE_MODEL = "gemma-3-4b-it";

export interface GemmaError {
  error: true;
  message: string;
  fallback: boolean;
}

export function isGemmaError(v: unknown): v is GemmaError {
  return typeof v === "object" && v !== null && (v as GemmaError).error === true;
}

export function requestJsonOutput(prompt: string, schema: string): string {
  return `${prompt}

CRITICAL: Respond with ONLY valid JSON matching this schema — no markdown fences, no explanation:
${schema}`;
}

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T | GemmaError> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const isLast = attempt === maxAttempts;
      if (isLast) {
        return { error: true, message: `AI temporarily unavailable after ${maxAttempts} attempts.`, fallback: true };
      }
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
    }
  }
  return { error: true, message: "AI service unavailable.", fallback: true };
}

async function callGroq(prompt: string): Promise<string> {
  const apiKey = process.env["GROQ_API_KEY"] ?? "";
  if (!apiKey || apiKey.includes("YOUR_GROQ")) throw new Error("GROQ_API_KEY not configured");

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const data = await res.json() as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content ?? "";
}

async function callGoogle(prompt: string): Promise<string> {
  const apiKey = process.env["GOOGLE_AI_STUDIO_KEY"] ?? "";
  if (!apiKey || apiKey.includes("YOUR_GOOGLE")) throw new Error("GOOGLE_AI_STUDIO_KEY not configured");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GOOGLE_MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 4096 },
    }),
  });

  if (!res.ok) throw new Error(`Google AI ${res.status}: ${await res.text()}`);
  const data = await res.json() as { candidates: { content: { parts: { text: string }[] } }[] };
  return data.candidates[0]?.content?.parts?.[0]?.text ?? "";
}

function parseJson<T>(raw: string): T {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(cleaned) as T;
}

export async function callGemma<T = unknown>(prompt: string): Promise<T | GemmaError> {
  const provider = process.env["AI_PROVIDER"] ?? "groq";
  const primaryFn = provider === "google" ? callGoogle : callGroq;
  const fallbackFn = provider === "google" ? callGroq : callGoogle;

  const primaryResult = await withRetry(() => primaryFn(prompt));
  let rawText: string;

  if (isGemmaError(primaryResult)) {
    const fallbackResult = await withRetry(() => fallbackFn(prompt));
    if (isGemmaError(fallbackResult)) return fallbackResult;
    rawText = fallbackResult as string;
  } else {
    rawText = primaryResult as string;
  }

  try {
    return parseJson<T>(rawText);
  } catch {
    return { error: true, message: "AI returned unexpected format. Please try again.", fallback: true };
  }
}

export async function callGemmaVision<T = unknown>(
  prompt: string,
  imageBase64: string,
  mimeType: "image/jpeg" | "image/png" | "image/webp" = "image/jpeg",
): Promise<T | GemmaError> {
  const apiKey = process.env["GOOGLE_AI_STUDIO_KEY"] ?? "";
  if (!apiKey || apiKey.includes("YOUR_GOOGLE")) {
    return callGemma<T>(`${prompt}\n\n[Receipt image unavailable — extract from description only.]`);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GOOGLE_MODEL}:generateContent?key=${apiKey}`;
  const result = await withRetry(async () => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: imageBase64 } }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
      }),
    });
    if (!res.ok) throw new Error(`Vision ${res.status}`);
    const data = await res.json() as { candidates: { content: { parts: { text: string }[] } }[] };
    return data.candidates[0]?.content?.parts?.[0]?.text ?? "";
  });

  if (isGemmaError(result)) return result;

  try {
    return parseJson<T>(result as string);
  } catch {
    return { error: true, message: "Could not parse receipt. Enter manually.", fallback: true };
  }
}
