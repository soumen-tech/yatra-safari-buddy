/**
 * Client-Side Gemma Type Definitions & Utility Helpers
 * All actual AI calls route through Backend API -> Gemma Service
 */

export interface GemmaError {
  error: true;
  message: string;
  fallback: boolean;
}

export function isGemmaError(v: unknown): v is GemmaError {
  return typeof v === "object" && v !== null && (v as GemmaError).error === true;
}

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
