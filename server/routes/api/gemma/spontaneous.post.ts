/**
 * POST /api/gemma/spontaneous — Same-day micro-plan
 */
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { callGemma, isGemmaError, requestJsonOutput } from "~/lib/gemma";

export default defineEventHandler(async (event) => {
  const body = await readBody(event) as {
    city: string;
    budget: number;
    hours: number;
  };

  const { city, budget, hours } = body;

  const prompt = requestJsonOutput(
    `You are YatraAI's spontaneous outing planner for Indian budget travelers.
Current city: ${city}. Cash: ₹${budget}. Time available: ${hours} hours (same day).

Rules:
- Total cost must NOT exceed ₹${budget}
- All places must be REAL and currently open to public
- Prioritize free or very cheap activities
- Transport must be practical (auto/bus/metro), not Ola/Uber
- Give 2-4 activities fitting within ${hours} hours
- "nudge" must be warm, personal 2-3 sentences addressed to "you"`,
    `{
  "title": "Catchy trip title",
  "activities": [
    {"name": "Real place/activity", "cost": 0, "duration": 1.5, "note": "Practical tip"}
  ],
  "transport": "Walking + Metro",
  "transportCost": 30,
  "totalCost": 120,
  "nudge": "Personal 2-3 sentence encouragement"
}`,
  );

  const result = await callGemma(prompt);

  if (isGemmaError(result)) {
    setResponseStatus(event, 503);
    return { error: result.message, fallback: true };
  }

  return result;
});
