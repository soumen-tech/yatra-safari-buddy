/**
 * POST /api/gemma/expense — Receipt OCR + voice expense extraction
 * Returns a DRAFT — never auto-saves
 */
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { callGemma, callGemmaVision, isGemmaError, requestJsonOutput } from "~/lib/gemma";

const SCHEMA = `{
  "title": "Short expense label (e.g. 'Fish thali at Dada Dhaba')",
  "amount": 150,
  "category": "Food",
  "confidence": "high",
  "note": "Brief extraction note"
}`;

const CATEGORIES = ["Food", "Transport", "Stay", "Activity", "Shopping", "Other"];

export default defineEventHandler(async (event) => {
  const body = await readBody(event) as {
    image_base64?: string;
    transcribed_text?: string;
    context?: string;
  };

  const { image_base64, transcribed_text, context } = body;

  if (!image_base64 && !transcribed_text) {
    setResponseStatus(event, 400);
    return { error: "Provide either image_base64 or transcribed_text" };
  }

  let result;

  if (image_base64) {
    const prompt = requestJsonOutput(
      `You are a receipt OCR assistant for Indian travelers.
Analyze this receipt image. Context: ${context ?? "travel expense in India"}
Extract: title (short label), amount (rupees, numeric only), category (${CATEGORIES.join("/")}), confidence (high/medium/low), note.
If amount unclear, set confidence to "low" and amount to 0.`,
      SCHEMA,
    );
    const base64Data = image_base64.replace(/^data:image\/\w+;base64,/, "");
    const mimeType = image_base64.startsWith("data:image/png") ? "image/png" as const : "image/jpeg" as const;
    result = await callGemmaVision(prompt, base64Data, mimeType);
  } else {
    const prompt = requestJsonOutput(
      `You are a voice expense parser for Indian travelers.
The user said: "${transcribed_text}"
Context: ${context ?? "group travel expense"}
Parse: amount, clean title, most likely category.
Common patterns: "paid 150 for tea", "auto se gaye 80 rupay", "hostel 400 raat ka"
If amount unclear, confidence "low" and amount 0.`,
      SCHEMA,
    );
    result = await callGemma(prompt);
  }

  if (isGemmaError(result)) {
    setResponseStatus(event, 503);
    return { error: result.message, fallback: true };
  }

  const parsed = result as Record<string, unknown>;
  if (!CATEGORIES.includes(parsed.category as string)) {
    parsed.category = "Other";
  }
  return parsed;
});
