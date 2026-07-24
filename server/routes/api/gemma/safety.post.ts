/**
 * POST /api/gemma/safety — 'Am I Safe?' Emergency & Night Travel Advisor
 * Powered by Gemma AI via Groq with Google AI Studio Fallback
 */
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { callGemma, isGemmaError, requestJsonOutput } from "~/lib/gemma";
import { supabaseServer } from "~/lib/supabase-server";

export default defineEventHandler(async (event) => {
  const body = await readBody(event) as {
    query: string;
    city?: string;
    time_of_day?: string;
  };

  const { query, city, time_of_day } = body;

  if (!query) {
    setResponseStatus(event, 400);
    return { error: "query is required" };
  }

  const prompt = requestJsonOutput(
    `You are YatraAI's Grounded Travel Safety Guard for India.
User Situation / Question: "${query}"
Location: ${city ?? "Indian City"}
Time: ${time_of_day ?? "Night / Evening"}

Instructions:
- Give immediate, practical safety guidance for an Indian street situation.
- Warn against active local scams (auto/taxi meter tricks, fake tourist info booths, station touts, unlit alleyways).
- Highlight safe refuges (prepaid taxi counters, main station concourses, police booths, 24/7 receptions).
- Keep response authoritative, empathetic, concise, and structured.`,
    `{
  "query": "${query}",
  "safetyLevel": "safe" | "caution" | "warning",
  "advice": "Actionable street safety instructions",
  "safeRefuges": ["Prepaid booth", "Main platform"],
  "scamWarning": "Scam pattern to avoid"
}`,
  );

  const startTime = Date.now();
  const result = await callGemma<Record<string, unknown>>(prompt);
  const responseTime = Date.now() - startTime;

  if (isGemmaError(result)) {
    setResponseStatus(event, 503);
    return { error: result.message, fallback: true };
  }

  void supabaseServer.from("ai_logs").insert({
    feature: "safety",
    provider_used: process.env["AI_PROVIDER"] ?? "groq",
    response_time: responseTime,
    status: "success",
  });

  return result;
});
