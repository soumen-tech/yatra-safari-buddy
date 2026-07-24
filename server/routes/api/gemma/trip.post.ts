/**
 * POST /api/gemma/trip — Gemma-powered trip itinerary generator
 */
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { callGemma, isGemmaError, requestJsonOutput } from "~/lib/gemma";
import { supabaseServer } from "~/lib/supabase-server";

const INDIAN_CITIES: Record<string, string[]> = {
  hills: ["Manali", "Darjeeling", "Rishikesh", "Munnar", "Kasol", "Shimla"],
  beach: ["Goa", "Varkala", "Gokarna", "Pondicherry", "Kovalam"],
  city: ["Delhi", "Jaipur", "Kolkata", "Mumbai", "Udaipur", "Hampi", "Mysore"],
  spiritual: ["Varanasi", "Amritsar", "Pushkar", "Rishikesh", "Tirupati", "Vrindavan"],
};

export default defineEventHandler(async (event) => {
  const body = await readBody(event) as {
    budget: number;
    days: number;
    origin: string;
    vibe: string;
    budget_mode: "person" | "group";
    party_size: number;
    trip_id?: string;
  };

  const { budget, days, origin, vibe, budget_mode, party_size, trip_id } = body;
  const perPersonBudget =
    budget_mode === "group" ? Math.floor(budget / Math.max(1, party_size)) : budget;
  const perDay = Math.floor(perPersonBudget / days);
  const cityPool = INDIAN_CITIES[vibe] ?? INDIAN_CITIES.city;

  const prompt = requestJsonOutput(
    `You are YatraAI, an expert budget travel planner for India.

Generate a realistic ${days}-day trip itinerary for a traveler starting from ${origin}.
Budget: ₹${perPersonBudget} per person total (₹${perDay}/day per person).
Travel vibe: ${vibe}.
Party size: ${party_size} (budget_mode: ${budget_mode}).

Rules:
- Suggest cities from this pool in order: ${cityPool.join(", ")}
- Every activity must be genuinely budget-friendly and real (no made-up places)
- Include 2 cheaper lodging options per day with realistic rupee costs
- Include 2 hidden gems (off-tourist-trail spots) per day
- The "reasoning" field must explain WHY this choice fits the exact budget
- The "cultureSnapshot" must be 1-2 vivid sentences about the city's soul
- Total costs per day must not exceed ₹${perDay + 100} per person
- All costs must be in Indian Rupees (₹)`,
    `[
  {
    "day": 1,
    "city": "city name",
    "activities": ["activity 1", "activity 2"],
    "stay": "type of stay",
    "stayNote": "details about the stay",
    "food": "₹amount (description)",
    "transport": "transport mode",
    "cost": 850,
    "reasoning": "why this fits the budget",
    "cultureSnapshot": "vivid cultural description",
    "cheaperLodging": [
      {"name": "Option name", "cost": 300, "note": "details"},
      {"name": "Option 2", "cost": 400, "note": "details"}
    ],
    "hiddenGems": [
      {"name": "Hidden spot", "note": "why it's special", "cost": "Free"},
      {"name": "Another gem", "note": "details", "cost": "₹50"}
    ]
  }
]`,
  );

  const result = await callGemma<unknown[]>(prompt);

  if (isGemmaError(result)) {
    setResponseStatus(event, 503);
    return { error: result.message, fallback: true };
  }

  const itinerary = Array.isArray(result) ? result.slice(0, days) : [];

  // Persist to DB if trip_id provided
  if (trip_id && itinerary.length > 0) {
    const rows = itinerary.map((day, i) => {
      const d = day as Record<string, unknown>;
      return {
        trip_id,
        day_number: (d.day as number) ?? i + 1,
        city: d.city,
        activities: d.activities,
        stay: d.stay,
        stay_note: d.stayNote,
        food: d.food,
        transport: d.transport,
        cost: d.cost,
        reasoning_text: d.reasoning,
        culture_snapshot: d.cultureSnapshot,
        cheaper_lodging: d.cheaperLodging,
        hidden_gems: d.hiddenGems,
      };
    });
    await supabaseServer.from("itinerary_days").upsert(rows, { onConflict: "trip_id,day_number" });
  }

  return itinerary;
});
