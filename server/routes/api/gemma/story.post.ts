/**
 * POST /api/gemma/story — Trip narrative generator
 */
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { callGemma, isGemmaError, requestJsonOutput } from "~/lib/gemma";
import { supabaseServer } from "~/lib/supabase-server";

export default defineEventHandler(async (event) => {
  const body = await readBody(event) as {
    trip_id?: string;
    days?: { city: string; spent: number; highlights: string[] }[];
    members_count?: number;
  };

  const { trip_id, days: fallbackDays, members_count } = body;
  let tripSummary = "";

  if (trip_id) {
    const [tripRes, expensesRes, itineraryRes] = await Promise.all([
      supabaseServer.from("trips").select("*").eq("id", trip_id).single(),
      supabaseServer.from("expenses").select("*").eq("trip_id", trip_id),
      supabaseServer.from("itinerary_days").select("*").eq("trip_id", trip_id).order("day_number"),
    ]);

    const trip = tripRes.data as Record<string, unknown> | null;
    const expenses = (expensesRes.data ?? []) as { amount: number; title: string }[];
    const itinerary = (itineraryRes.data ?? []) as { day_number: number; city: string; activities: string[] }[];

    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
    const cities = [...new Set(itinerary.map((d) => d.city))].join(", ");
    const dayHighlights = itinerary
      .map((d) => `Day ${d.day_number} in ${d.city}: ${(d.activities as string[]).slice(0, 2).join(" + ")}`)
      .join("\n");
    const topExpenses = expenses
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3)
      .map((e) => `${e.title} (₹${e.amount})`)
      .join(", ");

    tripSummary = `Trip: ${trip?.days ?? itinerary.length} days across ${cities}
Origin: ${trip?.origin ?? "India"}. Vibe: ${trip?.vibe ?? "mixed"}
Total spent: ₹${totalSpent}. Party size: ${trip?.party_size ?? 1}
Highlights:\n${dayHighlights}
Top expenses: ${topExpenses}`;
  } else if (fallbackDays) {
    const totalSpent = fallbackDays.reduce((s, d) => s + d.spent, 0);
    const cities = [...new Set(fallbackDays.map((d) => d.city))].join(", ");
    tripSummary = `${fallbackDays.length} days across ${cities}. Total spent: ₹${totalSpent}. Party size: ${members_count ?? 1}.
Highlights: ${fallbackDays.flatMap((d) => d.highlights).slice(0, 5).join(", ")}`;
  } else {
    setResponseStatus(event, 400);
    return { error: "Provide trip_id or days data" };
  }

  const prompt = requestJsonOutput(
    `You are YatraAI's storyteller — write WhatsApp-worthy travel narratives for Indian budget travelers.

Trip data:
${tripSummary}

Write a postcard-style travel story (3-4 short paragraphs, ~200 words total).
Style: personal, vivid, grounded in real Indian travel culture.
Tone: nostalgic, warm, specific — NOT generic tourist brochure language.
End with a moment that captures the soul of the trip.
Generate 4-5 relevant hashtags.
The story must feel written by the traveler, not by AI.`,
    `{
  "title": "City, X days, ₹XXXX spent.",
  "body": "First paragraph.\\n\\nSecond paragraph.\\n\\nThird paragraph.",
  "tags": ["#hashtag1", "#hashtag2", "#hashtag3"]
}`,
  );

  const result = await callGemma(prompt);

  if (isGemmaError(result)) {
    setResponseStatus(event, 503);
    return { error: result.message, fallback: true };
  }

  return result;
});
