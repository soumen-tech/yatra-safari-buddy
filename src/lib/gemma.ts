/**
 * YatraAI — Unified Gemma AI Interface
 *
 * callGemma(prompt) tries Groq first (gemma2-9b-it),
 * falls back to Google AI Studio (gemma-3-4b-it) if:
 *   - GROQ_API_KEY is missing
 *   - Groq returns a 429 (rate limit) or 5xx
 * Includes exponential backoff: 1s → 2s → 4s (3 attempts per provider).
 * On full failure: returns a GemmaError with graceful message.
 *
 * ALL prompts must request JSON output — wrap your prompt in
 * requestJsonOutput(prompt, schema) for reliable structured responses.
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

/** Wraps a prompt to guarantee JSON output from the model */
export function requestJsonOutput(prompt: string, schema: string): string {
  return `${prompt}

CRITICAL: Respond with ONLY valid JSON matching this schema — no markdown fences, no explanation text, no trailing commas:
${schema}`;
}

// ─── Retry helper ────────────────────────────────────────────────────────────
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
): Promise<T | GemmaError> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const isLast = attempt === maxAttempts;
      const isRateLimit =
        err instanceof Error && err.message.includes("429");
      if (isLast || !isRateLimit) {
        if (isLast) {
          return {
            error: true,
            message: `AI temporarily unavailable after ${maxAttempts} attempts. Please try again in a moment.`,
            fallback: true,
          };
        }
      }
      // Exponential backoff: 1s, 2s, 4s
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
    }
  }
  return {
    error: true,
    message: "AI service unavailable. Please try again later.",
    fallback: true,
  };
}

// ─── Groq provider ───────────────────────────────────────────────────────────
async function callGroq(prompt: string): Promise<string> {
  const apiKey =
    (typeof process !== "undefined" && process.env?.["GROQ_API_KEY"]) ||
    (typeof import.meta !== "undefined" && (import.meta as { env?: Record<string, string> }).env?.["GROQ_API_KEY"]) ||
    "";

  if (!apiKey || apiKey.includes("YOUR_GROQ")) {
    throw new Error("GROQ_API_KEY not configured");
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
      temperature: 0.4,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq ${res.status}: ${body}`);
  }

  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  return data.choices[0]?.message?.content ?? "";
}

// ─── Google AI Studio provider ───────────────────────────────────────────────
async function callGoogle(prompt: string): Promise<string> {
  const apiKey =
    (typeof process !== "undefined" && process.env?.["GOOGLE_AI_STUDIO_KEY"]) ||
    (typeof import.meta !== "undefined" && (import.meta as { env?: Record<string, string> }).env?.["GOOGLE_AI_STUDIO_KEY"]) ||
    "";

  if (!apiKey || apiKey.includes("YOUR_GOOGLE")) {
    throw new Error("GOOGLE_AI_STUDIO_KEY not configured");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GOOGLE_MODEL}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 4096,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google AI ${res.status}: ${body}`);
  }

  const data = (await res.json()) as {
    candidates: { content: { parts: { text: string }[] } }[];
  };
  return data.candidates[0]?.content?.parts?.[0]?.text ?? "";
}

// ─── Main interface ──────────────────────────────────────────────────────────
export async function callGemma<T = unknown>(
  prompt: string,
): Promise<T | GemmaError> {
  const provider =
    (typeof process !== "undefined" && process.env?.["AI_PROVIDER"]) ||
    (typeof import.meta !== "undefined" && (import.meta as { env?: Record<string, string> }).env?.["AI_PROVIDER"]) ||
    "groq";

  // Primary path
  const primaryFn = provider === "google" ? callGoogle : callGroq;
  const fallbackFn = provider === "google" ? callGroq : callGoogle;

  const primaryResult = await withRetry(() => primaryFn(prompt));

  let rawText: string;

  if (isGemmaError(primaryResult)) {
    // Try fallback provider
    const fallbackResult = await withRetry(() => fallbackFn(prompt));
    if (isGemmaError(fallbackResult)) {
      return fallbackResult;
    }
    rawText = fallbackResult as string;
  } else {
    rawText = primaryResult as string;
  }

  // Parse JSON from response
  try {
    // Strip markdown fences if model added them anyway
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return {
      error: true,
      message: "AI returned an unexpected response format. Please try again.",
      fallback: true,
    };
  }
}

// ─── Multimodal (image) variant ──────────────────────────────────────────────
/** Send a base64 image + text prompt to Gemma via Google AI Studio */
export async function callGemmaVision<T = unknown>(
  prompt: string,
  imageBase64: string,
  mimeType: "image/jpeg" | "image/png" | "image/webp" = "image/jpeg",
): Promise<T | GemmaError> {
  const apiKey =
    (typeof process !== "undefined" && process.env?.["GOOGLE_AI_STUDIO_KEY"]) ||
    (typeof import.meta !== "undefined" && (import.meta as { env?: Record<string, string> }).env?.["GOOGLE_AI_STUDIO_KEY"]) ||
    "";

  if (!apiKey || apiKey.includes("YOUR_GOOGLE")) {
    // Fallback: try text-only Groq with a note that image can't be processed
    return callGemma<T>(
      `${prompt}\n\n[Note: Receipt image could not be processed — image analysis unavailable. Please extract expense details from description only.]`,
    );
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-4b-it:generateContent?key=${apiKey}`;

  const result = await withRetry(async () => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
      }),
    });

    if (!res.ok) throw new Error(`Google Vision ${res.status}`);
    const data = (await res.json()) as {
      candidates: { content: { parts: { text: string }[] } }[];
    };
    return data.candidates[0]?.content?.parts?.[0]?.text ?? "";
  });

  if (isGemmaError(result)) return result;

  try {
    const cleaned = (result as string)
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return {
      error: true,
      message: "Could not parse receipt. Please enter details manually.",
      fallback: true,
    };
  }
}
