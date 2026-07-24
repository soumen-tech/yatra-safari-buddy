/**
 * POST /api/gemma/fare — Fare-Shield AI verdict
 */
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { callGemma, isGemmaError, requestJsonOutput } from "~/lib/gemma";

export default defineEventHandler(async (event) => {
  const body = await readBody(event) as {
    from: string;
    to: string;
    quoted_fare: number;
    mode: string;
  };

  const { from, to, quoted_fare, mode } = body;

  const prompt = requestJsonOutput(
    `You are YatraAI's Fare-Shield. Analyze this transport fare in India.

Route: ${from} → ${to}
Transport mode: ${mode}
Quoted fare: ₹${quoted_fare}

Standard Indian city transport rates:
- Auto-rickshaw: ₹25 base + ₹14-18/km
- Cab/taxi: ₹30 base + ₹18-25/km
- Cycle rickshaw: ₹10-15/km
- E-bike/scooter: ₹8-12/km

Estimate realistic distance between these points.
Calculate fair fare based on standard rates.
Verdict: "fair" (within 10%), "borderline" (10-40% above), or "overcharged" (over 40% above).
Counter-offer phrases must be conversational and practical.`,
    `{
  "fairFare": 120,
  "verdict": "overcharged",
  "distanceKm": 5,
  "reasoning": "For a 5km auto ride, standard fare = ₹25 base + ₹14×5 = ₹95. Quoted ₹${quoted_fare} is X% above market rate.",
  "counterOffer": "Practical English phrase to say to driver",
  "counterOfferHindi": "Romanized Hindi phrase"
}`,
  );

  const result = await callGemma(prompt);

  if (isGemmaError(result)) {
    setResponseStatus(event, 503);
    return { error: result.message, fallback: true };
  }

  return result;
});
