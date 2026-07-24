/**
 * Vite Dev Server Middleware for /api/* routes
 * Bridges Vite dev server (npm run dev) with server/routes/api/* handlers.
 */
import type { Plugin, Connect } from "vite";
import { callGemma, callGemmaVision, isGemmaError, requestJsonOutput } from "./lib/gemma";

export function apiDevMiddleware(): Plugin {
  return {
    name: "yatra-api-dev-middleware",
    configureServer(server) {
      server.middlewares.use(async (req: Connect.IncomingMessage, res, next) => {
        const url = req.url ?? "";
        if (!url.startsWith("/api/")) {
          return next();
        }

        // Parse JSON body for POST requests
        let body: Record<string, unknown> = {};
        if (req.method === "POST" || req.method === "PUT") {
          try {
            const rawBody = await new Promise<string>((resolve, reject) => {
              let data = "";
              req.on("data", (chunk) => { data += chunk; });
              req.on("end", () => resolve(data));
              req.on("error", reject);
            });
            body = rawBody ? JSON.parse(rawBody) : {};
          } catch {
            body = {};
          }
        }

        res.setHeader("Content-Type", "application/json");

        // 1. Health check
        if (url === "/api/health") {
          res.statusCode = 200;
          return res.end(JSON.stringify({
            status: "healthy",
            services: {
              supabase: process.env["VITE_SUPABASE_URL"] ? "ok" : "not_configured",
              google: process.env["GOOGLE_API_KEY"] ? "ok" : "not_configured",
              groq: process.env["GROQ_API_KEY"] ? "ok" : "not_configured",
            },
            timestamp: new Date().toISOString(),
            ai_provider: process.env["AI_PROVIDER"] ?? "google",
          }));
        }

        // 2. Gemma Trip Generator (/api/gemma/trip)
        if (url === "/api/gemma/trip" && req.method === "POST") {
          const { budget = 4500, days = 5, origin = "Delhi", vibe = "city", budget_mode = "person", party_size = 1 } = body;
          const perPersonBudget = budget_mode === "group" ? Math.floor(Number(budget) / Math.max(1, Number(party_size))) : Number(budget);
          const perDay = Math.floor(perPersonBudget / Number(days));

          const prompt = requestJsonOutput(
            `Generate a realistic ${days}-day budget travel itinerary in India starting from ${origin}.
Budget: ₹${perPersonBudget} per person total (₹${perDay}/day per person).
Vibe: ${vibe}. Party size: ${party_size}.
Rules:
- Include 2 cheaper lodging options per day with realistic rupee costs
- Include 2 hidden gems per day
- Total day cost must fit ₹${perDay + 100} per person.`,
            `[
  {
    "day": 1,
    "city": "Jaipur",
    "activities": ["Hawa Mahal photo stop", "Johari Bazaar street food walk"],
    "stay": "Zostel Jaipur Dorm",
    "stayNote": "Clean bunk near Hawa Mahal with rooftop cafe",
    "food": "₹250 (Pyaaz kachori & Dal Baati Thali)",
    "transport": "E-Rickshaw + Shared Auto",
    "cost": ${Math.min(perDay, 750)},
    "reasoning": "Fits well within the daily per-person budget",
    "cultureSnapshot": "Pink sandstone lanes filled with royal heritage and spice scents.",
    "cheaperLodging": [
      {"name": "Hostel Backpackers", "cost": 350, "note": "Shared 6-bed dorm"},
      {"name": "Heritage Homestay", "cost": 500, "note": "Private room near station"}
    ],
    "hiddenGems": [
      {"name": "Panna Meena ka Kund", "note": "Geometric stepwell away from crowds", "cost": "Free"},
      {"name": "Tapri Central Tea Rooftop", "note": "Kulhad chai with castle view", "cost": "₹60"}
    ]
  }
]`,
          );

          const result = await callGemma(prompt);

          if (isGemmaError(result)) {
            // Smart fallback itinerary if API key not configured
            res.statusCode = 200;
            return res.end(JSON.stringify(generateFallbackItinerary(Number(days), String(origin), String(vibe), perPersonBudget)));
          }

          res.statusCode = 200;
          return res.end(JSON.stringify(result));
        }

        // 3. Gemma Spontaneous (/api/gemma/spontaneous)
        if (url === "/api/gemma/spontaneous" && req.method === "POST") {
          const { city = "Kolkata", budget = 300, hours = 3 } = body;
          const prompt = requestJsonOutput(
            `Suggest a spontaneous same-day outing in ${city} for ₹${budget} and ${hours} hours.`,
            `{
  "title": "${city} Impulse Exploration",
  "activities": [
    {"name": "Local Heritage Spot", "cost": 50, "duration": 1, "note": "Explore historical street"},
    {"name": "Famous Street Food", "cost": 100, "duration": 1, "note": "Taste iconic local snack"}
  ],
  "transport": "Shared Auto & Walking",
  "transportCost": 40,
  "totalCost": 190,
  "nudge": "Great quick outing! Leaves change in your pocket."
}`,
          );

          const result = await callGemma(prompt);

          if (isGemmaError(result)) {
            res.statusCode = 200;
            return res.end(JSON.stringify({
              title: `${city} Pocket Escape`,
              activities: [
                { name: "Iconic Street Walk & Photo Spot", cost: Math.floor(Number(budget) * 0.2), duration: 1, note: `Explore the liveliest heritage lane in ${city}` },
                { name: "Famous Local Refreshment", cost: Math.floor(Number(budget) * 0.3), duration: 1, note: "Fresh clay-cup tea & famous local snack" },
              ],
              transport: "Shared Auto / Tram",
              transportCost: Math.min(50, Math.floor(Number(budget) * 0.15)),
              totalCost: Math.floor(Number(budget) * 0.65),
              nudge: `Perfect ${hours}-hour micro-trip in ${city}. Keeps you within ₹${budget} cash!`,
            }));
          }

          res.statusCode = 200;
          return res.end(JSON.stringify(result));
        }

        // 4. Gemma Fare Shield (/api/gemma/fare)
        if (url === "/api/gemma/fare" && req.method === "POST") {
          const { from = "Origin", to = "Destination", quoted_fare = 250, mode = "auto" } = body;
          const prompt = requestJsonOutput(
            `Analyze fare from ${from} to ${to} for ${mode} quoted at ₹${quoted_fare}.`,
            `{
  "fairFare": 120,
  "verdict": "overcharged",
  "distanceKm": 6,
  "reasoning": "Standard rates for ${mode} are ₹25 base + ₹15/km. ₹${quoted_fare} is higher than market rate.",
  "counterOffer": "Bhaiya, meter lagao ya ₹130 me chalo",
  "counterOfferHindi": "भैया 130 रुपये में चलोगे?"
}`,
          );

          const result = await callGemma(prompt);

          if (isGemmaError(result)) {
            const fair = Math.round(Number(quoted_fare) * 0.6);
            const verdict = Number(quoted_fare) > fair * 1.3 ? "overcharged" : "fair";
            res.statusCode = 200;
            return res.end(JSON.stringify({
              fairFare: fair,
              verdict,
              distanceKm: 5,
              reasoning: `Standard ${mode} rate for this route is around ₹${fair}. Quoted ₹${quoted_fare} is ${verdict === "overcharged" ? "above" : "matching"} market price.`,
              counterOffer: `Bhaiya, ₹${fair + 20} me chalo, prepaid counter is nearby.`,
              counterOfferHindi: `भैया ₹${fair + 20} में चलना है तो बताओ।`,
            }));
          }

          res.statusCode = 200;
          return res.end(JSON.stringify(result));
        }

        // 5. Gemma Translator (/api/gemma/translate)
        if (url === "/api/gemma/translate" && req.method === "POST") {
          const { text = "How much?", target_language = "hindi" } = body;
          const prompt = requestJsonOutput(
            `Translate "${text}" to ${target_language} for bargaining.`,
            `{
  "sourceText": "${text}",
  "targetLanguage": "${target_language}",
  "translatedText": "Local street translation",
  "pronunciation": "Phonetic guide",
  "bargainingSuggestion": "Bargaining counter-offer tip"
}`,
          );

          const result = await callGemma(prompt);

          if (isGemmaError(result)) {
            res.statusCode = 200;
            return res.end(JSON.stringify({
              sourceText: String(text),
              targetLanguage: String(target_language),
              translatedText: target_language === "bengali" ? "Dada, etar daam koto?" : target_language === "tamil" ? "Anna, evlo aagum?" : "Bhaiya, yeh kitne ka hai?",
              pronunciation: target_language === "bengali" ? "Da-da, e-tar daam ko-to?" : "Bhai-ya, yeh kit-ne ka hai?",
              bargainingSuggestion: "Ask nicely and offer 20% lower than the quoted price.",
            }));
          }

          res.statusCode = 200;
          return res.end(JSON.stringify(result));
        }

        // 6. Gemma Safety (/api/gemma/safety)
        if (url === "/api/gemma/safety" && req.method === "POST") {
          const { query = "Is it safe?" } = body;
          const prompt = requestJsonOutput(
            `Safety advice for: "${query}" in India.`,
            `{
  "query": "${query}",
  "safetyLevel": "safe",
  "advice": "Clear street advice",
  "safeRefuges": ["Prepaid booth", "Main station concourse"],
  "scamWarning": "Scam pattern to avoid"
}`,
          );

          const result = await callGemma(prompt);

          if (isGemmaError(result)) {
            res.statusCode = 200;
            return res.end(JSON.stringify({
              query: String(query),
              safetyLevel: "safe",
              advice: "Stick to main brightly lit roads and platforms with 24/7 police presence. Avoid dark alleyways.",
              safeRefuges: ["Prepaid Taxi Counter", "Main Railway Platform"],
              scamWarning: "Ignore touts claiming meters are broken; use official prepaid booths.",
            }));
          }

          res.statusCode = 200;
          return res.end(JSON.stringify(result));
        }

        // 7. Gemma Story (/api/gemma/story)
        if (url === "/api/gemma/story" && req.method === "POST") {
          const prompt = requestJsonOutput(
            `Write a 3-paragraph travel postcard story.`,
            `{
  "title": "Kolkata Chai & Cobblestones",
  "body": "Paragraph 1\\n\\nParagraph 2\\n\\nParagraph 3",
  "tags": ["#budget", "#kolkata", "#solo"]
}`,
          );

          const result = await callGemma(prompt);

          if (isGemmaError(result)) {
            res.statusCode = 200;
            return res.end(JSON.stringify({
              title: "Postcard Memories: Street Chai & Sunrise Trams",
              body: "The morning mist rose over Howrah Bridge as hot clay-cup chai warmed our hands. Every narrow alley held a new story, from vintage bookstalls on College Street to vibrant flower markets along the river.\n\nTraveling on a tight budget didn't mean missing out — it brought us closer to the heart of the city, eating local thalis and riding yellow taxis with open windows.\n\nAs night fell over Park Street, the trip felt complete: great memories, new friendships, and change left in our pockets.",
              tags: ["#budget-traveler", "#yatra-memories", "#street-food"],
            }));
          }

          res.statusCode = 200;
          return res.end(JSON.stringify(result));
        }

        // 8. Gemma Expense (/api/gemma/expense)
        if (url === "/api/gemma/expense" && req.method === "POST") {
          const { image_base64, transcribed_text } = body;

          let result: unknown;
          if (image_base64) {
            result = await callGemmaVision("Extract expense title, total amount, and category from this receipt.", String(image_base64).replace(/^data:image\/\w+;base64,/, ""));
          } else {
            result = await callGemma(requestJsonOutput(`Parse expense: "${transcribed_text ?? "Dinner 250"}"`, `{"title": "Dinner", "amount": 250, "category": "Food"}`));
          }

          if (isGemmaError(result)) {
            res.statusCode = 200;
            return res.end(JSON.stringify({
              title: transcribed_text ? String(transcribed_text) : "Street Food & Tea",
              amount: 150,
              category: "Food",
            }));
          }

          res.statusCode = 200;
          return res.end(JSON.stringify(result));
        }

        // 9. Generic Trips API (/api/trips)
        if (url.startsWith("/api/trips")) {
          if (req.method === "POST") {
            const tripId = crypto.randomUUID();
            const code = `YT-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            res.statusCode = 201;
            return res.end(JSON.stringify({ trip_id: tripId, invite_code: code, message: "Trip created" }));
          }
          res.statusCode = 200;
          return res.end(JSON.stringify([]));
        }

        // 10. Invites API (/api/invites)
        if (url.startsWith("/api/invites")) {
          res.statusCode = 200;
          return res.end(JSON.stringify({ success: true, trip_id: crypto.randomUUID(), message: "Joined trip successfully!" }));
        }

        // 11. Expenses API (/api/expenses)
        if (url.startsWith("/api/expenses")) {
          res.statusCode = 200;
          return res.end(JSON.stringify({ success: true, message: "Expense logged" }));
        }

        next();
      });
    },
  };
}

/* ────── Helper: Generate Fallback Itinerary ────── */
function generateFallbackItinerary(days: number, origin: string, vibe: string, budget: number) {
  const perDay = Math.floor(budget / days);
  const cityMap: Record<string, string[]> = {
    hills: ["Darjeeling", "Manali", "Rishikesh", "Munnar"],
    beach: ["Goa", "Varkala", "Gokarna", "Pondicherry"],
    city: ["Jaipur", "Kolkata", "Udaipur", "Hampi"],
    spiritual: ["Varanasi", "Amritsar", "Rishikesh", "Vrindavan"],
  };

  const pool = cityMap[vibe] ?? cityMap.city;

  return Array.from({ length: days }).map((_, idx) => {
    const dayNum = idx + 1;
    const city = pool[idx % pool.length];

    return {
      day: dayNum,
      city,
      activities: [
        `${city} Iconic Heritage Walk & Local Market`,
        `Sunset Viewpoint & Famous Street Food Tasting`,
      ],
      stay: `${city} Backpackers Hostel Dorm`,
      stayNote: "Clean bed, hot water, free WiFi near transit center",
      food: `₹${Math.floor(perDay * 0.35)} (Breakfast chai + Local Thali lunch & dinner)`,
      transport: "Shared Auto / E-Rickshaw",
      cost: Math.min(perDay, 850),
      reasoning: `Selected budget lodging and shared transit to keep Day ${dayNum} within ₹${perDay}/day per person.`,
      cultureSnapshot: `Experience authentic local rhythms in ${city} with bustling markets and historic lanes.`,
      cheaperLodging: [
        { name: `${city} Youth Hostel`, cost: Math.floor(perDay * 0.25), note: "Basic dorm with locker" },
        { name: `${city} Railway Retiring Room`, cost: Math.floor(perDay * 0.3), note: "Right inside the station" },
      ],
      hiddenGems: [
        { name: `${city} Secret Viewpoint`, note: "Quiet sunrise spot preferred by locals", cost: "Free" },
        { name: `${city} Old Tea Stall`, note: "Famous clay-cup chai since 1974", cost: "₹15" },
      ],
    };
  });
}
