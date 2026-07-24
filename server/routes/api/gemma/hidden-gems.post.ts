/**
 * POST /api/gemma/hidden-gems
 */
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { callGemma, isGemmaError, requestJsonOutput } from "~/lib/gemma";

export default defineEventHandler(async (event) => {
  const body = await readBody(event) as { city: string; remaining_budget: number };

  const prompt = requestJsonOutput(
    `You are YatraAI's Hidden Gem detector for budget travelers in India.
City: ${body.city}. Remaining daily budget: ₹${body.remaining_budget} per person.
Suggest 3 genuinely hidden, lesser-known spots that fit this budget.
These must be REAL places — not tourist traps.
Think: local dhabas, free viewpoints, student canteens with ₹30-50 thalis, transport shortcuts, cheap accommodation hacks.`,
    `{"gems": [{"name": "Specific place", "type": "food", "cost_range": "₹20-50", "reasoning": "Why this is a great budget find", "tip": "Practical advice"}]}`,
  );

  const result = await callGemma(prompt);

  if (isGemmaError(result)) {
    setResponseStatus(event, 503);
    return { error: result.message, fallback: true };
  }

  return result;
});
