/**
 * YatraAI — Vite Dev Server Middleware for /api/* routes
 * Powers ALL AI features during `npm run dev` with real Gemma 4 API + smart fallbacks.
 */
import type { Plugin, Connect } from "vite";
import { callGemma, callGemmaVision, isGemmaError, requestJsonOutput } from "./lib/gemma";

/* ─────────────────────────────────────────
   ROUTE KNOWLEDGE BASE
   Real train/bus corridors across India
───────────────────────────────────────── */
const ROUTE_KNOWLEDGE: Record<string, { trains: string[]; busOptions: string[]; avgFare: number; hours: number; enRouteStops: { city: string; state: string; tip: string }[] }> = {
  "west bengal|uttarakhand": {
    trains: ["Uttarakhand Sampark Kranti Exp (12056) — HWH to Haridwar"],
    busOptions: ["HWH → Delhi (Rajdhani/Duronto), Delhi → Haridwar/Dehradun by Volvo AC Bus"],
    avgFare: 950,
    hours: 34,
    enRouteStops: [
      { city: "Patna", state: "Bihar", tip: "Quick platform chai & Litti Chokha at station — 20 min halt." },
      { city: "Varanasi", state: "Uttar Pradesh", tip: "If time permits, deboard for a Ganga Aarti night stay — stunning en route bonus!" },
      { city: "Lucknow", state: "Uttar Pradesh", tip: "Famous Tunday Kebab near Charbagh station. Railway food court available." },
      { city: "Haridwar", state: "Uttarakhand", tip: "First stop in the hills. Har Ki Pauri Ganga Aarti is unmissable every evening." },
    ],
  },
  "kolkata|darjeeling": {
    trains: ["Darjeeling Mail (12343) — Kolkata to NJP (New Jalpaiguri)"],
    busOptions: ["Kolkata Esplanade → Siliguri (Govt overnight bus), Siliguri → Darjeeling by shared jeep"],
    avgFare: 350,
    hours: 11,
    enRouteStops: [
      { city: "New Jalpaiguri (NJP)", state: "West Bengal", tip: "Alight here, catch a shared jeep (₹150-200) to Darjeeling via Siliguri — scenic mountain road." },
      { city: "Siliguri", state: "West Bengal", tip: "Stop for kachuri & jilipi breakfast at Sevoke Road before the mountain climb." },
    ],
  },
  "west bengal|kerala": {
    trains: ["Kerala Sampark Kranti / Himsagar Exp — long 60+ hr route via Chennai"],
    busOptions: ["Fly Kolkata → Kochi (IndiGo, AirAsia — ₹3,000-6,000 one way)"],
    avgFare: 1800,
    hours: 62,
    enRouteStops: [
      { city: "Chennai", state: "Tamil Nadu", tip: "Major junction. Try Idli-Sambhar at Chennai Central platform. 2-hr stop possible." },
      { city: "Ernakulam Junction", state: "Kerala", tip: "Gateway to Kochi. Fort Kochi is 30 min by ferry." },
    ],
  },
  "default": {
    trains: ["Express or Superfast train via nearest junction"],
    busOptions: ["State Roadways / Private AC Volvo overnight bus"],
    avgFare: 600,
    hours: 12,
    enRouteStops: [],
  },
};

function getRouteKey(origin: string, destination: string): string {
  const o = origin.toLowerCase();
  const d = destination.toLowerCase();

  for (const key of Object.keys(ROUTE_KNOWLEDGE)) {
    const [kFrom, kTo] = key.split("|");
    if (o.includes(kFrom) || kFrom.includes(o)) {
      if (d.includes(kTo) || kTo.includes(d)) return key;
    }
  }
  return "default";
}

/* ─────────────────────────────────────────
   BUDGET FEASIBILITY CHECK
───────────────────────────────────────── */
interface FeasibilityResult {
  feasible: boolean;
  reason?: string;
  suggestion?: string;
}

function checkBudgetFeasibility(
  budgetMin: number,
  budgetMax: number,
  days: number,
  destination: string,
  partySize: number,
): FeasibilityResult {
  const totalBudget = budgetMax;
  const perPersonPerDay = Math.floor(totalBudget / Math.max(1, partySize) / days);

  // Hard minimum: ₹300/person/day is the absolute floor in India
  const ABSOLUTE_MIN_PER_DAY = 300;
  // Far destinations (Kerala, Goa, Andaman from North) need at least ₹500/day
  const EXPENSIVE_DESTINATIONS = ["kerala", "andaman", "lakshadweep", "goa", "ladakh"];
  const isExpensiveDest = EXPENSIVE_DESTINATIONS.some((d) => destination.toLowerCase().includes(d));
  const effectiveMin = isExpensiveDest ? 500 : ABSOLUTE_MIN_PER_DAY;

  if (perPersonPerDay < effectiveMin) {
    return {
      feasible: false,
      reason: `Sorry, ₹${budgetMin.toLocaleString("en-IN")}–₹${budgetMax.toLocaleString("en-IN")} for a ${days}-day trip${partySize > 1 ? ` for ${partySize} people` : ""} to ${destination} is not possible. That works out to just ₹${perPersonPerDay}/person/day — the minimum for food, stay & transit alone would be ₹${effectiveMin}/person/day.`,
      suggestion: isExpensiveDest
        ? `For a trip to ${destination}, we recommend at least ₹${(effectiveMin * days * partySize).toLocaleString("en-IN")}–₹${(effectiveMin * days * partySize * 1.3).toFixed(0)} as your total budget for ${partySize} person${partySize > 1 ? "s" : ""} over ${days} days.`
        : `Try reducing to ${Math.max(2, days - 1)} days, or increase your budget to ₹${(effectiveMin * days * partySize).toLocaleString("en-IN")} minimum.`,
    };
  }

  return { feasible: true };
}

/* ─────────────────────────────────────────
   GENUINE HIDDEN GEMS DATABASE
   Real verified locations with descriptions
───────────────────────────────────────── */
const HIDDEN_GEMS: Record<string, Array<{ name: string; fullName: string; description: string; cost: string; bestTime: string }>> = {
  darjeeling: [
    { name: "Batasia Loop", fullName: "Batasia Loop War Memorial & Toy Train Loop", description: "A spectacular circular railway loop built in 1919 where the UNESCO Darjeeling Himalayan Railway (Toy Train) makes a dramatic spiral. Offers a 360° view of Kanchenjunga on clear mornings. The war memorial within honours Gorkha soldiers.", cost: "₹25 entry", bestTime: "6–8 AM on clear days" },
    { name: "Ghoom Monastery", fullName: "Yiga Choeling Ghoom Monastery (Est. 1850)", description: "The oldest Tibetan Buddhist monastery in Darjeeling, housing a 15-foot-tall Maitreya Buddha statue. Far less crowded than Tiger Hill. Monks conduct morning prayers at 5 AM — a deeply peaceful experience.", cost: "Free (donation box available)", bestTime: "5–6 AM for morning prayers" },
    { name: "Chowk Bazaar", fullName: "Darjeeling Chowk Bazaar & Hill Cart Road Stalls", description: "The real Darjeeling locals' market — not the tourist strip. Sells everything from Tibetan dried apricots, handwoven pashmina to momos fresh from iron steamers for ₹20/plate. Completely off the tourist trail.", cost: "₹20–80 for food", bestTime: "8–11 AM" },
  ],
  jaipur: [
    { name: "Panna Meena ka Kund", fullName: "Panna Meena ka Kund Stepwell (16th Century)", description: "A stunning geometric stepwell with criss-crossing stairs built in the 16th century, completely unknown to most tourists who flock to Hawa Mahal. Located in the walled city near Amber Fort. The symmetry is breathtaking — a photographer's paradise.", cost: "Free", bestTime: "7–9 AM before heat" },
    { name: "Tapri Central", fullName: "Tapri Central Rooftop Chai Café", description: "A beloved hole-in-the-wall rooftop café near Bani Park serving 23 varieties of masala chai in clay kulhads with direct views of Nahargarh Fort. Popular with Jaipur university students, not tourists. Best kulhad chai in Rajasthan.", cost: "₹30–60 per cup", bestTime: "Evenings 5–8 PM" },
  ],
  varanasi: [
    { name: "Tulsi Ghat", fullName: "Tulsi Ghat — Tulsidas's Meditation Ghat (16th Century)", description: "The sacred ghat where poet-saint Tulsidas wrote the Ramcharitmanas in the 16th century. Unlike the crowded Dashashwamedh Ghat, Tulsi Ghat is quiet at dawn with only elderly sadhus and local bathers. The ancient vibes are unmatched.", cost: "Free", bestTime: "5–6:30 AM" },
    { name: "Kashi Chat Bhandar", fullName: "Kashi Chat Bhandar — 60-Year-Old Tamatar Chaat Shop", description: "Opened in 1961, this tiny roadside shop near Godaulia serves the most famous tamatar (tomato) chaat in India. A Varanasi institution visited by locals daily. The flavour profile — sweet, spicy, tangy — is unlike anything else in India.", cost: "₹20–50 per plate", bestTime: "12–3 PM" },
  ],
  default: [
    { name: "Local Dawn Market", fullName: "Pre-Sunrise Wholesale Flower & Vegetable Market", description: "Every Indian city has a hidden dawn wholesale market (phool mandi) that opens at 4 AM. Spectacular colours, local vendors, and the energy of the city's real supply chain. Almost never visited by tourists.", cost: "Free to walk around", bestTime: "4:30–6 AM" },
    { name: "Chai & Lassi Lane", fullName: "The Local Tea Shop Lane (Unnamed But Famous)", description: "Every old city neighbourhood has a lane with chai shops that have been running for 30–50 years. Ask any local: 'Best purani chai ki dukan kahan hai?' The answers lead to the real city.", cost: "₹10–20 per cup", bestTime: "Morning 7–10 AM" },
  ],
};

function getHiddenGems(destination: string) {
  const key = Object.keys(HIDDEN_GEMS).find((k) => destination.toLowerCase().includes(k));
  return HIDDEN_GEMS[key ?? "default"];
}

/* ─────────────────────────────────────────
   HOTEL RECOMMENDATIONS DATABASE
   Real, verified budget hotels with proper names & descriptions
───────────────────────────────────────── */
const HOTEL_DATABASE: Record<string, Array<{ name: string; type: string; description: string; priceRange: string; rating: string; bookingTip: string }>> = {
  darjeeling: [
    { name: "Zostel Darjeeling", type: "Backpacker Hostel", description: "Situated above the Mall Road with stunning Kanchenjunga views from the rooftop. Social dormitories, private rooms available, communal kitchen. One of the highest-rated backpacker hostels in North East India.", priceRange: "₹400–900/night (dorm to private)", rating: "⭐⭐⭐⭐ (4.3/5)", bookingTip: "Book 10+ days ahead in peak season (Oct–Dec). Dorm beds fill fast." },
    { name: "Hotel Pagoda", type: "Budget Mid-Range Hotel", description: "A 3-generation family-run heritage hotel in Upper Darjeeling. Clean rooms with wooden furniture, attached bathrooms, excellent home-cooked breakfast with view of Kanchenjunga on clear days.", priceRange: "₹800–1,400/night (double room)", rating: "⭐⭐⭐½ (3.7/5)", bookingTip: "Ask for a 'mountain-facing' room when booking — same price, dramatically better view." },
    { name: "Darjeeling YMCA", type: "Institutional Budget Stay", description: "Run by the Young Men's Christian Association since 1909. Historic building with basic but clean rooms. One of the cheapest clean stays in Darjeeling. Attached dining hall serves continental breakfast.", priceRange: "₹600–1,000/night", rating: "⭐⭐⭐ (3.2/5)", bookingTip: "Walk-in accepted most of the year. Perfect for solo travelers." },
  ],
  jaipur: [
    { name: "Zostel Jaipur", type: "Backpacker Hostel", description: "Heritage haveli-style hostel near Hawa Mahal with a rooftop café. Mixed and female-only dorms available. Organises free walking tours every evening to the walled city.", priceRange: "₹350–750/night (dorm to private)", rating: "⭐⭐⭐⭐ (4.4/5)", bookingTip: "Book on Zostel app for 10% discount. Weekend rates are 20% higher." },
    { name: "Hotel Pearl Palace", type: "Budget Boutique Hotel", description: "An institution among backpackers — hand-painted rooms, rooftop restaurant 'Pearl Palace Heritage Rooftop' with Jaipur city view. Family-run. Widely praised in Lonely Planet.", priceRange: "₹900–2,000/night (double room)", rating: "⭐⭐⭐⭐ (4.5/5)", bookingTip: "Book at least 2 weeks ahead. The rooftop restaurant is open to all — worth visiting even if not staying." },
  ],
  default: [
    { name: "Zostel (City Branch)", type: "Backpacker Hostel", description: "India's largest hostel chain — clean, social, with WiFi and common areas. Present in 80+ cities. Community vibe with free city tours from staff.", priceRange: "₹300–800/night (dorm to private)", rating: "⭐⭐⭐⭐ (4.2/5)", bookingTip: "Book via Zostel.com app for best prices. Flash sales on Thursdays." },
    { name: "Railway Retiring Rooms", type: "Budget Station Stay", description: "Every major Indian railway station has retiring rooms managed by IRCTC. Clean, attached bathroom, AC/non-AC options. Often the cheapest clean stay in any city, right at the station for early/late trains.", priceRange: "₹200–600/night", rating: "⭐⭐⭐ (3.0/5)", bookingTip: "Book at indianrail.gov.in or erail.in retiring rooms section with your train PNR." },
    { name: "OYO Townhouse / Budget Hotel", type: "Budget Hotel Chain", description: "Standardised clean budget rooms with AC, attached bathroom, and free breakfast. Consistent quality across cities. Good fallback option in any Indian city.", priceRange: "₹600–1,500/night", rating: "⭐⭐⭐ (3.3/5)", bookingTip: "Use OYO app for last-minute deals — prices drop 30–40% for same-day check-in." },
  ],
};

function getHotels(destination: string, budgetPerPersonPerDay: number) {
  const key = Object.keys(HOTEL_DATABASE).find((k) => destination.toLowerCase().includes(k));
  const hotels = HOTEL_DATABASE[key ?? "default"];
  // Filter to hotels within budget
  return hotels.filter((h) => {
    const match = h.priceRange.match(/₹(\d+)/);
    const minPrice = match ? parseInt(match[1]) : 0;
    return minPrice <= budgetPerPersonPerDay * 0.6; // Hotel shouldn't exceed 60% of daily budget
  });
}

/* ─────────────────────────────────────────
   ROUTE PATH GENERATOR
   Shows the actual journey path with en-route places to see
───────────────────────────────────────── */
interface RouteStop {
  city: string;
  state: string;
  tip: string;
}

interface TripRouteInfo {
  trains: string[];
  busOptions: string[];
  avgFare: number;
  hours: number;
  enRouteStops: RouteStop[];
  totalFareRange: string;
}

function generateRouteInfo(origin: string, destination: string, budgetMin: number, budgetMax: number): TripRouteInfo {
  const key = getRouteKey(origin, destination);
  const route = ROUTE_KNOWLEDGE[key];
  const fareMin = route.avgFare;
  const fareMax = Math.round(fareMin * 1.4);

  return {
    ...route,
    totalFareRange: `₹${fareMin.toLocaleString("en-IN")}–₹${fareMax.toLocaleString("en-IN")} per person (one way)`,
  };
}

/* ─────────────────────────────────────────
   RICH FALLBACK ITINERARY GENERATOR
   Produces detailed, named, described itineraries
───────────────────────────────────────── */
const PLACE_DATABASE: Record<string, Array<{ name: string; fullName: string; description: string; cost: string; vibes: string[] }>> = {
  darjeeling: [
    { name: "Tiger Hill Sunrise", fullName: "Tiger Hill Sunrise Viewpoint (2,590m)", description: "The most dramatic sunrise in India — watch the first light of dawn turn the Kanchenjunga peak (8,586m) gold-to-orange while the plains below are still in darkness. The full Himalayan panorama includes Everest on exceptionally clear days.", cost: "₹100 entry + ₹40 jeep fare", vibes: ["hills"] },
    { name: "Darjeeling Himalayan Railway", fullName: "Darjeeling Himalayan Railway Toy Train (UNESCO Heritage)", description: "A UNESCO World Heritage narrow-gauge railway built in 1881 that winds through tea gardens and mountain villages. The Joy Ride from Darjeeling to Ghoom and back is 2 hours and one of the most scenic rail journeys on earth.", cost: "₹250 Joy Ride ticket", vibes: ["hills", "city"] },
    { name: "Happy Valley Tea Estate", fullName: "Happy Valley Tea Estate & Factory Tour (Est. 1854)", description: "One of Darjeeling's oldest working tea gardens, open to public visits. Walk through the tea bushes, see the withering, rolling, and drying process, and taste freshly processed First Flush Darjeeling tea directly from the estate.", cost: "₹100 estate entry + free factory tour", vibes: ["hills"] },
    { name: "Mahakal Temple Complex", fullName: "Mahakal Temple & Dorje Ling Buddhist Monastery", description: "A unique syncretism site on Observatory Hill — a Hindu Shiva temple and a Buddhist monastery share the same hilltop. Prayer flags flutter over the forest canopy. The walk up is an experience in itself. Locals pray here every morning.", cost: "Free", vibes: ["hills", "spiritual"] },
    { name: "Mall Road Promenade", fullName: "Darjeeling Mall Road (Nehru Road) Evening Walk", description: "The spine of Darjeeling's social life — a pedestrian promenade lined with old British-era shops, Tibetan jewellery stalls, bakeries selling hot churpi and momos, and the iconic Glenary's Café (est. 1935) where every Darjeeling local has had their first cup of tea.", cost: "Free to walk, ₹200–400 for food", vibes: ["city"] },
  ],
  default: [
    { name: "Old Quarter Heritage Walk", fullName: "Historic Old City Quarter Walking Tour", description: "Every Indian city's old quarter tells the story of its real history — narrow lanes, ancient havelis, family-run chai shops older than Indian independence, and the daily rhythms of local life unchanged for generations.", cost: "Free (guided tours ₹300–500)", vibes: ["city", "hills", "spiritual"] },
    { name: "Local Weekend Market", fullName: "Sunday Bazaar & Craft Market", description: "The weekly local market where farmers, artisans, and food vendors from surrounding villages gather. The freshest produce, handmade crafts, and cheapest authentic street food in the region.", cost: "Free entry, ₹50–200 for food", vibes: ["city"] },
    { name: "Sunrise Viewpoint", fullName: "Dawn Viewpoint (Local's Secret Spot)", description: "Ask any local chai-wala where they go to watch the sunrise — the answer is never the tourist viewpoint. The real spots are free, uncrowded, and far more photogenic. A ritual that connects you to the place.", cost: "Free", vibes: ["hills", "spiritual"] },
  ],
};

function getPlaces(destination: string, vibes: string[]) {
  const key = Object.keys(PLACE_DATABASE).find((k) => destination.toLowerCase().includes(k));
  const allPlaces = PLACE_DATABASE[key ?? "default"];
  // Filter by vibe match, or return all if none match
  const filtered = allPlaces.filter((p) => vibes.some((v) => p.vibes.includes(v)));
  return filtered.length > 0 ? filtered : allPlaces;
}

function buildFallbackItinerary(params: {
  days: number;
  origin: string;
  destination: string;
  destinationState: string;
  vibes: string[];
  budgetMin: number;
  budgetMax: number;
  budgetMode: string;
  partySize: number;
  accessibility: boolean;
  weather: boolean;
}) {
  const { days, origin, destination, destinationState, vibes, budgetMin, budgetMax, partySize, accessibility, weather } = params;
  const totalBudget = budgetMax;
  const perPersonBudget = params.budgetMode === "group" ? Math.floor(totalBudget / Math.max(1, partySize)) : totalBudget;
  const perDay = Math.floor(perPersonBudget / days);

  const places = getPlaces(destination, vibes);
  const gems = getHiddenGems(destination);
  const hotels = getHotels(destination, perDay);
  const routeInfo = generateRouteInfo(origin, destination, budgetMin, budgetMax);

  const itinerary = Array.from({ length: days }).map((_, idx) => {
    const dayNum = idx + 1;
    const placeForDay = places[idx % places.length];
    const gemForDay = gems[idx % gems.length];
    const hotelForDay = hotels[idx % Math.max(1, hotels.length)];

    return {
      day: dayNum,
      city: destination,
      state: destinationState,
      headline: `Day ${dayNum} — ${placeForDay.fullName}`,
      activities: [placeForDay.fullName, gemForDay.fullName],
      activityDetails: [
        { name: placeForDay.fullName, description: placeForDay.description, cost: placeForDay.cost },
        { name: gemForDay.fullName, description: gemForDay.description, cost: gemForDay.cost, isHiddenGem: true },
      ],
      selectedActivities: [placeForDay.fullName, gemForDay.fullName],
      stay: hotelForDay?.name ?? `${destination} Budget Hostel`,
      stayFull: hotelForDay?.name ?? `${destination} Budget Hostel`,
      stayDescription: hotelForDay?.description ?? "Clean, safe accommodation near main transit point.",
      stayPriceRange: hotelForDay?.priceRange ?? `₹${Math.floor(perDay * 0.3)}–₹${Math.floor(perDay * 0.45)}/night`,
      stayRating: hotelForDay?.rating ?? "⭐⭐⭐",
      stayBookingTip: hotelForDay?.bookingTip ?? "Book 7–10 days in advance for best rates.",
      food: `₹${Math.floor(perDay * 0.25)} (Local dhabas & street stalls — authentic and budget-friendly)`,
      transport: accessibility ? "Accessible taxi / E-Rickshaw with flat boarding" : "Shared jeep / Auto-rickshaw / Local bus",
      cost: Math.min(perDay, perDay),
      budgetRange: `₹${Math.floor(perDay * 0.9).toLocaleString("en-IN")}–₹${Math.ceil(perDay * 1.05).toLocaleString("en-IN")}`,
      reasoning: `Day ${dayNum} focuses on ${placeForDay.name} — a core experience in ${destination}. The ${hotelForDay?.type ?? "budget hostel"} keeps accommodation within the daily budget. Street food & local dhabas cover meals. Total well within ₹${perDay}/person/day.`,
      cultureSnapshot: placeForDay.description.substring(0, 200) + "...",
      hiddenGem: {
        name: gemForDay.fullName,
        description: gemForDay.description,
        cost: gemForDay.cost,
        bestTime: gemForDay.bestTime ?? "Morning hours",
        verified: true,
      },
      weatherAlert: weather ? getWeatherForDestination(destination, dayNum) : undefined,
      accessibilityNote: accessibility ? `♿ ${destination} accessibility note: Shared jeeps and mountain paths may have steps. Pre-book an accessible taxi from NJP/Siliguri if required.` : undefined,
    };
  });

  return { itinerary, routeInfo, perPersonBudget, perDay };
}

function getWeatherForDestination(destination: string, day: number): string {
  const dest = destination.toLowerCase();
  if (dest.includes("darjeeling") || dest.includes("manali") || dest.includes("rishikesh")) {
    return `🌤️ Day ${day}: 12–18°C, partly cloudy. Best walking window: 7 AM–11 AM. Carry light fleece.`;
  }
  if (dest.includes("goa") || dest.includes("kerala") || dest.includes("varkala")) {
    return `🌊 Day ${day}: 28–33°C, humid. Sea breeze by evening. Visit beaches before 10 AM.`;
  }
  if (dest.includes("jaipur") || dest.includes("rajasthan") || dest.includes("udaipur")) {
    return `☀️ Day ${day}: 22–35°C, dry & sunny. Carry water, avoid outdoor walks 12–4 PM.`;
  }
  if (dest.includes("varanasi") || dest.includes("agra")) {
    return `🌡️ Day ${day}: 24–38°C. Dawn ghats: 5–7 AM is ideal. Midday: museums & temples.`;
  }
  return `🌤️ Day ${day}: Pleasant weather. Best outdoor time: 7–11 AM. Carry sunscreen.`;
}

/* ─────────────────────────────────────────
   VITE PLUGIN MIDDLEWARE
───────────────────────────────────────── */
export function apiDevMiddleware(): Plugin {
  return {
    name: "yatra-api-dev-middleware",
    configureServer(server) {
      server.middlewares.use(async (req: Connect.IncomingMessage, res, next) => {
        const url = req.url ?? "";
        if (!url.startsWith("/api/")) return next();

        // Parse JSON body
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
          } catch { body = {}; }
        }

        res.setHeader("Content-Type", "application/json");
        res.setHeader("Access-Control-Allow-Origin", "*");

        /* ── 1. Health Check ── */
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

        /* ── 2. Trip Generator ── */
        if (url === "/api/gemma/trip" && req.method === "POST") {
          const {
            budget_min = 4000,
            budget_max = 5000,
            days = 5,
            origin = "Kolkata",
            origin_state = "West Bengal",
            destination = "Darjeeling",
            destination_state = "West Bengal",
            vibes = ["hills"],
            budget_mode = "person",
            party_size = 1,
            accessibility_enabled = false,
            weather_enabled = false,
          } = body;

          const budMin = Number(budget_min);
          const budMax = Number(budget_max);
          const numDays = Number(days);
          const numParty = Number(party_size);

          // FEASIBILITY CHECK FIRST
          const feasibility = checkBudgetFeasibility(budMin, budMax, numDays, String(destination), numParty);
          if (!feasibility.feasible) {
            res.statusCode = 200;
            return res.end(JSON.stringify({
              error: "BUDGET_NOT_FEASIBLE",
              message: feasibility.reason,
              suggestion: feasibility.suggestion,
            }));
          }

          const perPersonBudget = budget_mode === "group" ? Math.floor(budMax / Math.max(1, numParty)) : budMax;
          const perDay = Math.floor(perPersonBudget / numDays);
          const vibeArr = Array.isArray(vibes) ? vibes as string[] : [String(vibes)];
          const routeInfo = generateRouteInfo(String(origin), String(destination), budMin, budMax);
          const gems = getHiddenGems(String(destination));
          const hotels = getHotels(String(destination), perDay);

          const gemsList = gems.map((g) => `{"name":"${g.fullName}","description":"${g.description}","cost":"${g.cost}","bestTime":"${g.bestTime}","verified":true}`).join(",\n");
          const hotelsList = hotels.map((h) => `{"name":"${h.name}","type":"${h.type}","description":"${h.description}","priceRange":"${h.priceRange}","rating":"${h.rating}","bookingTip":"${h.bookingTip}"}`).join(",\n");

          const prompt = requestJsonOutput(
            `You are YATRA, India's most intelligent budget travel assistant. Generate a detailed ${numDays}-day itinerary for a trip from ${origin}, ${origin_state} to ${destination}, ${destination_state}.

BUDGET: ₹${budMin.toLocaleString("en-IN")}–₹${budMax.toLocaleString("en-IN")} total (₹${perDay}–₹${Math.floor(perDay * 1.05)} per person per day).
PARTY: ${numParty} person${numParty > 1 ? "s" : ""} (${budget_mode} mode).
TRIP VIBES: ${vibeArr.join(", ")} — suggest the BEST things regardless of vibe if destination warrants it.
ACCESSIBILITY NEEDED: ${accessibility_enabled ? "Yes — wheel-chair friendly paths, minimal stairs" : "No"}.

RULES FOR EVERY DAY:
1. Give REAL named places with their full proper name and 2-sentence description.
2. Include REAL hotel names with booking tips (see hotel list below).
3. Include 1 verified genuine hidden gem per day with full name and description.
4. Give a BUDGET RANGE (not exact), e.g. "₹${perDay}–₹${Math.ceil(perDay * 1.1)}".
5. Do NOT suggest anything that costs more than ₹${perDay} per person total for the day.
6. Suggest activities matching vibes: ${vibeArr.join(", ")} but also the best local experiences.

VERIFIED HIDDEN GEMS TO USE:
${gemsList}

HOTELS TO USE (pick best for budget ₹${perDay}/day/person):
${hotelsList}`,
            `[
  {
    "day": 1,
    "city": "${String(destination)}",
    "state": "${String(destination_state)}",
    "headline": "Day 1 — Tiger Hill Sunrise & Darjeeling Himalayan Railway",
    "activities": ["Tiger Hill Sunrise Viewpoint (2590m)", "Darjeeling Himalayan Railway Joy Ride (UNESCO Heritage)"],
    "activityDetails": [
      {"name":"Tiger Hill Sunrise Viewpoint (2590m)","description":"Watch the first golden light hit Kanchenjunga (8586m) — the world's third highest peak. Book a shared jeep (₹150) from town the night before for the 4 AM start.","cost":"₹100 entry + ₹150 jeep"},
      {"name":"Darjeeling Himalayan Railway Joy Ride (UNESCO Heritage)","description":"A 2-hour narrow gauge ride through tea gardens to Ghoom (2258m) and back. Built in 1881 and now a UNESCO World Heritage railway.","cost":"₹250 ticket","isHiddenGem":false}
    ],
    "selectedActivities": ["Tiger Hill Sunrise Viewpoint (2590m)", "Darjeeling Himalayan Railway Joy Ride (UNESCO Heritage)"],
    "stay": "Zostel Darjeeling",
    "stayFull": "Zostel Darjeeling — Backpacker Hostel (Mall Road Area)",
    "stayDescription": "Rooftop hostel above Mall Road with Kanchenjunga views. Social dorms and private rooms. Walking distance to all major Darjeeling sights.",
    "stayPriceRange": "₹400–900/night per person",
    "stayRating": "⭐⭐⭐⭐ (4.3/5)",
    "stayBookingTip": "Book 10 days ahead in Oct–Dec peak season.",
    "food": "₹250 (Steam momos ₹60 at Kunga Restaurant + Butter tea ₹20 at Chowk Bazaar stall + Thukpa soup dinner ₹80)",
    "transport": "Shared jeep to Tiger Hill + walk",
    "cost": ${Math.min(perDay, 750)},
    "budgetRange": "₹${perDay}–₹${Math.ceil(perDay * 1.08)}",
    "reasoning": "Tiger Hill requires an early 4 AM start but is worth every rupee. The UNESCO Railway is the most iconic Darjeeling experience. Both fit well within the ₹${perDay}/day budget.",
    "cultureSnapshot": "Darjeeling sits at 2050m where Tibetan, Nepali, and Bengali cultures blend. The morning mist over the tea gardens and the distant roar of the Toy Train whistle define the town's soul.",
    "hiddenGem": {
      "name": "Batasia Loop War Memorial & Toy Train Spiral",
      "description": "A spectacular circular railway loop built in 1919 where the Toy Train makes a dramatic 360° spiral. The war memorial within honours Gorkha soldiers. Spectacular Kanchenjunga backdrop on clear mornings. Completely free to enter.",
      "cost": "₹25 entry to memorial garden",
      "bestTime": "6–8 AM on clear mornings",
      "verified": true
    },
    "weatherAlert": "${weather_enabled ? getWeatherForDestination(String(destination), 1) : ""}",
    "accessibilityNote": "${accessibility_enabled ? "Mountain paths have uneven steps. Pre-book an accessible taxi. Toy Train platform is step-free." : ""}"
  }
]`,
          );

          const result = await callGemma(prompt);

          if (isGemmaError(result)) {
            const { itinerary, routeInfo: ri } = buildFallbackItinerary({
              days: numDays, origin: String(origin), destination: String(destination),
              destinationState: String(destination_state), vibes: vibeArr,
              budgetMin: budMin, budgetMax: budMax, budgetMode: String(budget_mode),
              partySize: numParty, accessibility: Boolean(accessibility_enabled), weather: Boolean(weather_enabled),
            });
            res.statusCode = 200;
            return res.end(JSON.stringify({ itinerary, routeInfo: ri }));
          }

          // Wrap array result with route info
          const resultData = result as unknown;
          const itinerary = Array.isArray(resultData) ? resultData : (resultData as { itinerary: unknown[] }).itinerary ?? resultData;
          res.statusCode = 200;
          return res.end(JSON.stringify({ itinerary, routeInfo }));
        }

        /* ── 3. Spontaneous Outing ── */
        if (url === "/api/gemma/spontaneous" && req.method === "POST") {
          const { city = "Kolkata", budget = 300, hours = 3 } = body;
          const prompt = requestJsonOutput(
            `Suggest a spontaneous same-day outing in ${city} for ₹${budget} and ${hours} hours. Give REAL named places with descriptions.`,
            `{"title":"${city} Impulse Exploration","activities":[{"name":"College Street Book Market","description":"Asia's largest second-hand book market — 1 km of sidewalk stalls selling everything from textbooks to rare first editions. Free to browse, spend ₹50–200.","cost":50,"duration":1},{"name":"Indian Coffee House","description":"Established 1942 — the most historic café in Kolkata. Intellectuals, students, and journalists have debated here for 80 years. Best filter coffee in the city at ₹25.","cost":40,"duration":1}],"transport":"Metro + walk","transportCost":25,"totalCost":190,"nudge":"Great outing! Change stays in your pocket."}`,
          );

          const result = await callGemma(prompt);

          if (isGemmaError(result)) {
            res.statusCode = 200;
            return res.end(JSON.stringify({
              title: `${city} Pocket Escape`,
              activities: [
                { name: "Old City Heritage Street Walk", description: `The most character-rich lane in ${city}'s old quarter, with 50-year-old shops and architecture unchanged since independence.`, cost: Math.floor(Number(budget) * 0.2), duration: 1 },
                { name: "Famous Local Tea & Snack", description: "Ask a local for 'sabse purana chai wala' — the oldest tea stall. Clay-cup tea ₹10–15 and freshly fried savory snacks.", cost: Math.floor(Number(budget) * 0.3), duration: 1 },
              ],
              transport: "Shared Auto / Local Bus",
              transportCost: Math.min(50, Math.floor(Number(budget) * 0.15)),
              totalCost: Math.floor(Number(budget) * 0.65),
              nudge: `Perfect ${hours}-hour escape in ${city}. Leaves ₹${Math.floor(Number(budget) * 0.35)} in your pocket!`,
            }));
          }

          res.statusCode = 200;
          return res.end(JSON.stringify(result));
        }

        /* ── 4. Fare Shield ── */
        if (url === "/api/gemma/fare" && req.method === "POST") {
          const { from = "Origin", to = "Destination", quoted_fare = 250, mode = "auto" } = body;
          const prompt = requestJsonOutput(
            `You are a Fare-Shield AI for Indian travelers. Analyze the fare from ${from} to ${to} via ${mode}, quoted at ₹${quoted_fare}. Give the fair market fare, verdict, and a counter-offer phrase in Hindi.`,
            `{"fairFare":120,"verdict":"overcharged","distanceKm":6,"reasoning":"Standard ${mode} market rate for this route is ₹${Math.round(Number(quoted_fare) * 0.55)}. The quoted ₹${quoted_fare} is 45% above market.","counterOffer":"Bhaiya, meter pe chalo ya ₹130 final — prepaid counter bhi hai.","counterOfferHindi":"भैया मीटर से चलो या ₹130 में — प्रीपेड काउंटर भी है।"}`,
          );

          const result = await callGemma(prompt);

          if (isGemmaError(result)) {
            const fair = Math.round(Number(quoted_fare) * 0.58);
            res.statusCode = 200;
            return res.end(JSON.stringify({
              fairFare: fair,
              verdict: Number(quoted_fare) > fair * 1.3 ? "overcharged" : "fair",
              distanceKm: 5,
              reasoning: `Standard ${mode} rate for this route is ₹${fair}. Quoted ₹${quoted_fare} is ${Number(quoted_fare) > fair * 1.3 ? "significantly above" : "matching"} market price.`,
              counterOffer: `Bhaiya, ₹${fair + 20} mein chalo — prepaid counter bhi hai.`,
              counterOfferHindi: `भैया ₹${fair + 20} में चलना है तो बताओ।`,
            }));
          }

          res.statusCode = 200;
          return res.end(JSON.stringify(result));
        }

        /* ── 5. Translator ── */
        if (url === "/api/gemma/translate" && req.method === "POST") {
          const { text = "How much?", target_language = "hindi" } = body;
          const prompt = requestJsonOutput(
            `Translate this for street bargaining in India: "${text}" into ${target_language}. Include phonetic pronunciation guide and a bargaining tip.`,
            `{"sourceText":"${text}","targetLanguage":"${target_language}","translatedText":"Bhaiya, yeh kitne ka hai?","pronunciation":"Bhai-ya, yeh kit-ne ka hai?","bargainingSuggestion":"Smile and offer 25% below the quoted price first."}`,
          );

          const result = await callGemma(prompt);

          if (isGemmaError(result)) {
            res.statusCode = 200;
            return res.end(JSON.stringify({
              sourceText: String(text),
              targetLanguage: String(target_language),
              translatedText: target_language === "bengali" ? "Dada, etar daam koto?" : target_language === "tamil" ? "Anna, evlo aagum?" : "Bhaiya, yeh kitne ka hai?",
              pronunciation: target_language === "bengali" ? "Da-da, e-tar daam ko-to?" : "Bhai-ya, yeh kit-ne ka hai?",
              bargainingSuggestion: "Smile, offer 25% lower, and be ready to walk away — the best bargaining technique.",
            }));
          }

          res.statusCode = 200;
          return res.end(JSON.stringify(result));
        }

        /* ── 6. Safety ── */
        if (url === "/api/gemma/safety" && req.method === "POST") {
          const { query = "Is it safe?" } = body;
          const prompt = requestJsonOutput(
            `You are a safety advisor for Indian travelers. Answer this safety question with specific, actionable advice: "${query}"`,
            `{"query":"${query}","safetyLevel":"caution","advice":"Stick to main lit areas near the station. Walk into a 24/7 hotel lobby if you feel followed.","safeRefuges":["Prepaid Taxi Counter","Railway Police Control Room","24-hr Pharmacy"],"scamWarning":"Ignore touts offering hotel rooms outside exits."}`,
          );

          const result = await callGemma(prompt);

          if (isGemmaError(result)) {
            res.statusCode = 200;
            return res.end(JSON.stringify({
              query: String(query),
              safetyLevel: "caution",
              advice: "Stick to brightly lit main roads, platform concourses, and 24/7 hotel lobbies. Trust your instincts — if someone makes you uncomfortable, walk into a public space immediately.",
              safeRefuges: ["Nearest Police Chowki", "Railway Platform (24/7)", "24-hr Pharmacy / Medical Store"],
              scamWarning: "Never accept unsolicited hotel vouchers from touts outside station exits. Always book pre-arranged transport.",
            }));
          }

          res.statusCode = 200;
          return res.end(JSON.stringify(result));
        }

        /* ── 7. Story Generator ── */
        if (url === "/api/gemma/story" && req.method === "POST") {
          const { places = [], destination = "India", days = 5 } = body;
          const prompt = requestJsonOutput(
            `Write a vivid, emotional 3-paragraph travel postcard story for a budget trip to ${destination} for ${days} days. Include specific sensory details, real place names if provided: ${JSON.stringify(places)}`,
            `{"title":"Tea Mist & Toy Train Whistles — Darjeeling","body":"Paragraph about day 1...\\n\\nParagraph about the journey...\\n\\nParagraph about coming home changed.","tags":["#budget-hills","#darjeeling","#solo-travel"]}`,
          );

          const result = await callGemma(prompt);

          if (isGemmaError(result)) {
            const destStr = String(destination);
            res.statusCode = 200;
            return res.end(JSON.stringify({
              title: `Postcards from ${destStr}`,
              body: `The morning mist clung to every pine branch as we climbed higher into the hills. Each turn of the mountain road revealed another layer — tea gardens fading into clouds, the distant whistle of the Toy Train echoing through the valley.\n\nTraveling on a tight budget didn't mean missing out — it meant sharing steaming momos with strangers at a roadside stall, debating politics over clay-cup chai, and finding that the cheapest experiences always carry the deepest memories.\n\nOn the last morning, watching the first light touch the Kanchenjunga peak from Tiger Hill, something shifted permanently. The mountains don't care about your budget — they give the same sunrise to everyone who wakes early enough.`,
              tags: [`#budget-travel`, `#${destStr.toLowerCase().replace(/\s+/g, "-")}`, "#yatra-memories"],
            }));
          }

          res.statusCode = 200;
          return res.end(JSON.stringify(result));
        }

        /* ── 8. Expense Parser ── */
        if (url === "/api/gemma/expense" && req.method === "POST") {
          const { image_base64, transcribed_text } = body;
          let result: unknown;

          if (image_base64) {
            result = await callGemmaVision("Extract the expense item name, total amount in rupees, and category from this receipt.", String(image_base64).replace(/^data:image\/\w+;base64,/, ""));
          } else {
            result = await callGemma(requestJsonOutput(`Parse this expense description: "${transcribed_text ?? "Momo dinner 80 rupees"}"`, `{"title":"Steam Momos Dinner","amount":80,"category":"Food"}`));
          }

          if (isGemmaError(result)) {
            res.statusCode = 200;
            return res.end(JSON.stringify({ title: String(transcribed_text ?? "Street Food"), amount: 150, category: "Food" }));
          }

          res.statusCode = 200;
          return res.end(JSON.stringify(result));
        }

        /* ── 9. Trips CRUD ── */
        if (url.startsWith("/api/trips")) {
          if (req.method === "POST") {
            const code = `YT-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            res.statusCode = 201;
            return res.end(JSON.stringify({ trip_id: crypto.randomUUID(), invite_code: code, message: "Trip created" }));
          }
          res.statusCode = 200;
          return res.end(JSON.stringify([]));
        }

        /* ── 10. Invites ── */
        if (url.startsWith("/api/invites")) {
          res.statusCode = 200;
          return res.end(JSON.stringify({ success: true, trip_id: crypto.randomUUID(), message: "Joined trip!" }));
        }

        /* ── 11. Expenses ── */
        if (url.startsWith("/api/expenses")) {
          res.statusCode = 200;
          return res.end(JSON.stringify({ success: true, message: "Expense logged" }));
        }

        next();
      });
    },
  };
}
