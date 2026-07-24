/**
 * POST /api/gemma/translate — Dialect-Aware Bargaining & Translation Engine
 * Powered by Gemma AI via Groq with Google AI Studio Fallback
 */
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { callGemma, isGemmaError, requestJsonOutput } from "~/lib/gemma";
import { supabaseServer } from "~/lib/supabase-server";

export default defineEventHandler(async (event) => {
  const body = await readBody(event) as {
    text: string;
    target_language: "hindi" | "bengali" | "tamil" | "marathi";
    user_id?: string;
  };

  const { text, target_language, user_id } = body;

  if (!text) {
    setResponseStatus(event, 400);
    return { error: "text is required for translation" };
  }

  const langName =
    target_language === "bengali" ? "Bengali (Kolkata street dialect)" :
    target_language === "tamil" ? "Tamil (Chennai auto/market dialect)" :
    target_language === "marathi" ? "Marathi (Mumbai local dialect)" :
    "Hindi (Delhi/North Indian street dialect)";

  const prompt = requestJsonOutput(
    `You are YatraAI's Dialect-Aware Bargaining & Translation Assistant for budget travelers in India.

Source Text / Voice Input: "${text}"
Target Language: ${langName}

Task:
1. Translate the text into authentic, natural local street language (Romanized script so any traveler can read it aloud easily).
2. Provide precise phonetic pronunciation guidance.
3. Provide a practical bargaining suggestion or seller-response prediction (e.g. what the vendor will say back, or how much to counter-offer).`,
    `{
  "sourceText": "${text}",
  "targetLanguage": "${target_language}",
  "translatedText": "Local street translation",
  "pronunciation": "Phonetic guide in simple English",
  "bargainingSuggestion": "Vendor response or counter-offer tip"
}`,
  );

  const startTime = Date.now();
  const result = await callGemma<Record<string, string>>(prompt);
  const responseTime = Date.now() - startTime;

  if (isGemmaError(result)) {
    setResponseStatus(event, 503);
    return { error: result.message, fallback: true };
  }

  // Log AI activity asynchronously
  void supabaseServer.from("ai_logs").insert({
    feature: "translator",
    provider_used: process.env["AI_PROVIDER"] ?? "groq",
    response_time: responseTime,
    status: "success",
  });

  // Log translation history if user_id present
  if (user_id) {
    void supabaseServer.from("translator_history").insert({
      user_id,
      source_text: text,
      target_language: target_language ?? "hindi",
      translated_text: result.translatedText ?? "",
      pronunciation: result.pronunciation ?? "",
      bargaining_suggestion: result.bargainingSuggestion ?? "",
    });
  }

  return result;
});
