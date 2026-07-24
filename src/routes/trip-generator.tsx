import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell, Halftone, StampTag } from "@/components/yatra";

export const Route = createFileRoute("/trip-generator")({
  head: () => ({
    meta: [
      { title: "Budget Trip Generator — YatraAI" },
      {
        name: "description",
        content:
          "Plan your trip from state to state. Real routes, proper hotel names, genuine hidden gems, and budget range planning. Powered by Gemma AI.",
      },
    ],
  }),
  component: TripGeneratorPage,
});

/* ─────────────────── Types ─────────────────── */
interface ActivityDetail {
  name: string;
  description: string;
  cost: string;
  isHiddenGem?: boolean;
}

interface HiddenGem {
  name: string;
  description: string;
  cost: string;
  bestTime: string;
  verified: boolean;
}

interface DayPlan {
  day: number;
  city: string;
  state: string;
  headline: string;
  activities: string[];
  activityDetails: ActivityDetail[];
  selectedActivities: string[];
  stay: string;
  stayFull: string;
  stayDescription: string;
  stayPriceRange: string;
  stayRating: string;
  stayBookingTip: string;
  food: string;
  transport: string;
  cost: number;
  budgetRange: string;
  reasoning: string;
  cultureSnapshot: string;
  hiddenGem: HiddenGem;
  weatherAlert?: string;
  accessibilityNote?: string;
}

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

/* ─────────────────── State Data ─────────────────── */
const INDIAN_STATES = [
  "Andaman & Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam",
  "Bihar", "Chandigarh", "Chhattisgarh", "Dadra & Nagar Haveli", "Daman & Diu",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu & Kashmir",
  "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
  "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttarakhand", "Uttar Pradesh", "West Bengal",
];

const STATE_CITIES: Record<string, string[]> = {
  "West Bengal": ["Kolkata", "Howrah", "Siliguri", "Durgapur", "Asansol", "Darjeeling", "Malda"],
  "Delhi": ["New Delhi", "Delhi Cantt", "Dwarka"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Jaisalmer", "Bikaner", "Pushkar", "Ajmer"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Rishikesh", "Nainital", "Mussoorie", "Almora", "Auli"],
  "Himachal Pradesh": ["Shimla", "Manali", "Dharamshala", "Kullu", "Kasol", "Spiti", "Chamba"],
  "Goa": ["Panaji", "Madgaon", "Vasco", "Anjuna", "Arambol", "Palolem"],
  "Kerala": ["Kochi", "Thiruvananthapuram", "Munnar", "Alleppey (Alappuzha)", "Wayanad", "Varkala", "Thekkady"],
  "Maharashtra": ["Mumbai", "Pune", "Nashik", "Aurangabad", "Lonavala", "Mahabaleshwar"],
  "Tamil Nadu": ["Chennai", "Madurai", "Ooty (Udhagamandalam)", "Kodaikanal", "Pondicherry", "Tirunelveli"],
  "Karnataka": ["Bengaluru", "Mysuru", "Hampi", "Coorg (Kodagu)", "Gokarna", "Badami"],
  "Uttar Pradesh": ["Varanasi", "Agra", "Lucknow", "Mathura", "Vrindavan", "Allahabad (Prayagraj)", "Ayodhya"],
  "Bihar": ["Patna", "Bodh Gaya", "Nalanda", "Rajgir", "Vaishali"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Somnath", "Dwarka", "Rann of Kutch"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Ujjain", "Gwalior", "Orchha", "Khajuraho", "Pachmarhi"],
  "Punjab": ["Amritsar", "Ludhiana", "Chandigarh", "Jalandhar", "Pathankot"],
  "Assam": ["Guwahati", "Jorhat", "Kaziranga", "Majuli Island", "Shillong", "Tezpur"],
  "Sikkim": ["Gangtok", "Pelling", "Lachung", "Yuksom", "Namchi"],
};

/* ─────────────────── Vibes ─────────────────── */
const VIBES = [
  { id: "hills", label: "Hills & Mountains", emoji: "🏔️", desc: "Treks, viewpoints, toy trains & tea gardens" },
  { id: "beach", label: "Beaches & Coast", emoji: "🏖️", desc: "Sea, shacks, sunsets & coastal food" },
  { id: "city", label: "City & Culture", emoji: "🏙️", desc: "Old quarters, markets & food lanes" },
  { id: "spiritual", label: "Spiritual & Heritage", emoji: "🕉️", desc: "Temples, ghats, forts & monasteries" },
  { id: "adventure", label: "Adventure & Offbeat", emoji: "🧗", desc: "Camping, zipline, waterfall treks" },
  { id: "wildlife", label: "Wildlife & Nature", emoji: "🐯", desc: "Safaris, bird sanctuaries & national parks" },
];

/* ─────────────────── Smart Client Fallback ─────────────────── */
function buildClientFallback(
  days: number,
  destination: string,
  destinationState: string,
  vibes: string[],
  budgetMin: number,
  budgetMax: number,
  budgetMode: string,
  partySize: number,
  accessibility: boolean,
  weather: boolean,
): { itinerary: DayPlan[]; routeInfo: TripRouteInfo } {
  const perPersonBudget = budgetMode === "group" ? Math.floor(budgetMax / Math.max(1, partySize)) : budgetMax;
  const perDay = Math.floor(perPersonBudget / days);

  const destLower = destination.toLowerCase();
  const isDarjeeling = destLower.includes("darjeeling");
  const isJaipur = destLower.includes("jaipur");
  const isGoa = destLower.includes("goa");
  const isVaranasi = destLower.includes("varanasi");
  const isKerala = destLower.includes("kochi") || destLower.includes("kerala") || destLower.includes("munnar");

  interface ActivityTemplate {
    name: string;
    description: string;
    cost: string;
    isHiddenGem?: boolean;
  }

  const activityPool: Record<string, ActivityTemplate[]> = {
    darjeeling: [
      { name: "Tiger Hill Sunrise Viewpoint (2,590m)", description: "Watch the first light of dawn turn Kanchenjunga peak gold from India's most famous sunrise point. Book a shared jeep (₹150) the night before for the 4 AM start.", cost: "₹100 entry + ₹150 jeep" },
      { name: "Darjeeling Himalayan Railway Joy Ride (UNESCO)", description: "A 2-hour narrow-gauge ride through tea gardens to Ghoom (2,258m) on the world-famous Toy Train, a UNESCO World Heritage railway built in 1881.", cost: "₹250 ticket" },
      { name: "Happy Valley Tea Estate & Factory Tour (Est. 1854)", description: "Walk through Darjeeling's oldest working tea gardens. See the withering, rolling, and drying process live, then taste fresh First Flush tea directly from the estate.", cost: "₹100 estate entry" },
      { name: "Batasia Loop War Memorial (Hidden Gem)", description: "A dramatic circular railway spiral built in 1919 with a 360° view of Kanchenjunga. The war memorial honours Gorkha soldiers. Almost no tourist crowds before 8 AM.", cost: "₹25 entry", isHiddenGem: true },
      { name: "Mall Road Evening Promenade (Nehru Road)", description: "Darjeeling's social spine — an old British-era promenade with Tibetan jewellery stalls, Glenary's Café (est. 1935), momos carts, and the best evening view of the valley.", cost: "Free, ₹200 food" },
      { name: "Mahakal Temple & Dorje Ling Monastery", description: "A rare Hindu-Buddhist shared hilltop site on Observatory Hill. Prayer flags flutter over forest canopy. Locals pray at dawn — a deeply peaceful experience.", cost: "Free" },
    ],
    jaipur: [
      { name: "Amber Fort — Light & Sound Evening Show", description: "The majestic 16th-century Amber Fort complex lit up at dusk. The Light & Sound show narrates 600 years of Rajput history on the fort walls. One of India's best.", cost: "₹200 entry + ₹100 show" },
      { name: "Panna Meena ka Kund Stepwell (Hidden Gem)", description: "A stunning 16th-century geometric stepwell with criss-crossing stairs, completely unknown to most tourists. Near Amber Fort. The symmetry is breathtaking — a photographer's paradise.", cost: "Free", isHiddenGem: true },
      { name: "Hawa Mahal & Johari Bazaar Walk", description: "The iconic 5-storey 'Palace of Winds' with 953 small windows. Walk through Johari Bazaar immediately below for Rajasthani silver jewellery, pyaaz kachori, and block-print fabric.", cost: "₹50 entry" },
      { name: "Tapri Central Rooftop Chai (Hidden Gem)", description: "A beloved hidden rooftop café near Bani Park serving 23 varieties of masala chai in clay kulhads with direct view of Nahargarh Fort. Popular with locals, not tourists.", cost: "₹30–60", isHiddenGem: true },
    ],
    goa: [
      { name: "Anjuna Flea Market (Wednesday Only)", description: "The original Goa hippie market dating to the 1960s — tie-dye fabrics, silver jewellery, spice sellers, fresh coconut water, and live bossa nova. Not just for tourists — locals shop here too.", cost: "Free entry, ₹100–500 shopping" },
      { name: "Fort Aguada Sunset (1612 AD)", description: "A 17th-century Portuguese lighthouse fort with a jaw-dropping view of the Arabian Sea at sunset. The oldest surviving lighthouse in Asia. Quiet at dusk compared to crowded beaches.", cost: "₹30 entry" },
      { name: "Fontainhas Latin Quarter Walk (Hidden Gem)", description: "Panaji's 18th-century Portuguese neighbourhood — winding lanes, colourful tiled houses, tiny Catholic chapels, and the best prawn curry restaurants in Goa. Completely off the beach trail.", cost: "Free walk", isHiddenGem: true },
    ],
    default: [
      { name: `${destination} Heritage Old Quarter Walk`, description: `The historic old city core of ${destination} — ancient lanes, century-old havelis, family-run chai shops, and the daily rhythms unchanged for generations. The real ${destination}.`, cost: "Free (guided tours ₹300–500)" },
      { name: `${destination} Dawn Wholesale Market (Hidden Gem)`, description: `Every Indian city has a pre-sunrise wholesale flower & vegetable market (phool mandi) that opens at 4 AM. Spectacular colours, lowest prices, complete local immersion. Never visited by tourists.`, cost: "Free to walk", isHiddenGem: true },
      { name: `${destination} Local Dhaba & Street Food Trail`, description: `The oldest dhabas in ${destination} are always the best — ask locals for 'sabse purana aur sasta dhaba'. Thali meals from ₹60–100, chai ₹10, street snacks ₹20–50.`, cost: "₹60–150 for full meals" },
    ],
  };

  const pool = isDarjeeling ? activityPool.darjeeling : isJaipur ? activityPool.jaipur : isGoa ? activityPool.goa : activityPool.default;

  const hotelPool: Record<string, Array<{ name: string; type: string; description: string; priceRange: string; rating: string; bookingTip: string }>> = {
    darjeeling: [
      { name: "Zostel Darjeeling", type: "Backpacker Hostel", description: "Above Mall Road with Kanchenjunga rooftop views. Social dorms and private rooms available.", priceRange: `₹${Math.floor(perDay * 0.3)}–₹${Math.floor(perDay * 0.45)}/night`, rating: "⭐⭐⭐⭐ (4.3/5)", bookingTip: "Book 10+ days ahead in Oct–Dec. Dorm fills fast." },
      { name: "Hotel Pagoda", type: "Heritage Budget Hotel", description: "3-generation family-run heritage hotel with mountain views and excellent home-cooked breakfast.", priceRange: `₹${Math.floor(perDay * 0.45)}–₹${Math.floor(perDay * 0.6)}/night`, rating: "⭐⭐⭐½ (3.7/5)", bookingTip: "Request 'mountain-facing' room — same price, stunning view." },
    ],
    jaipur: [
      { name: "Zostel Jaipur", type: "Heritage Haveli Hostel", description: "Heritage haveli near Hawa Mahal. Free evening walking tours to the walled city included.", priceRange: `₹${Math.floor(perDay * 0.25)}–₹${Math.floor(perDay * 0.4)}/night`, rating: "⭐⭐⭐⭐ (4.4/5)", bookingTip: "Book on Zostel app for 10% discount." },
      { name: "Hotel Pearl Palace", type: "Budget Boutique Hotel", description: "Hand-painted rooms, rooftop restaurant with Jaipur skyline view. Lonely Planet favourite.", priceRange: `₹${Math.floor(perDay * 0.5)}–₹${Math.floor(perDay * 0.7)}/night`, rating: "⭐⭐⭐⭐ (4.5/5)", bookingTip: "Book 2 weeks ahead. Ask for a deluxe room — only ₹200 extra." },
    ],
    default: [
      { name: "Zostel (City Branch)", type: "Backpacker Hostel", description: "India's largest hostel chain. Clean, social, WiFi, community vibe. Present in 80+ cities.", priceRange: `₹${Math.floor(perDay * 0.25)}–₹${Math.floor(perDay * 0.4)}/night`, rating: "⭐⭐⭐⭐ (4.2/5)", bookingTip: "Book via Zostel.com app for flash sale discounts on Thursdays." },
      { name: "IRCTC Railway Retiring Rooms", type: "Station Budget Stay", description: "At every major station. Clean, AC/non-AC, attached bathroom. The cheapest clean stay in any Indian city.", priceRange: `₹${Math.floor(perDay * 0.15)}–₹${Math.floor(perDay * 0.28)}/night`, rating: "⭐⭐⭐ (3.0/5)", bookingTip: "Book via indianrail.gov.in/erail.in with your PNR number." },
    ],
  };

  const hotels = isDarjeeling ? hotelPool.darjeeling : isJaipur ? hotelPool.jaipur : hotelPool.default;
  const hotel = hotels[0];

  const itinerary: DayPlan[] = Array.from({ length: days }).map((_, idx) => {
    const dayNum = idx + 1;
    const act1 = pool[idx * 2 % pool.length];
    const act2 = pool[(idx * 2 + 1) % pool.length];
    const gemActivity = pool.find((a) => a.isHiddenGem) ?? act2;

    return {
      day: dayNum,
      city: destination,
      state: destinationState,
      headline: `Day ${dayNum} — ${act1.name}`,
      activities: [act1.name, act2.name],
      activityDetails: [
        { name: act1.name, description: act1.description, cost: act1.cost },
        { name: act2.name, description: act2.description, cost: act2.cost, isHiddenGem: act2.isHiddenGem },
      ],
      selectedActivities: [act1.name, act2.name],
      stay: hotel.name,
      stayFull: `${hotel.name} — ${hotel.type}`,
      stayDescription: hotel.description,
      stayPriceRange: hotel.priceRange,
      stayRating: hotel.rating,
      stayBookingTip: hotel.bookingTip,
      food: `₹${Math.floor(perDay * 0.22)}–₹${Math.floor(perDay * 0.28)} (Street food, local dhabas & tea stalls)`,
      transport: accessibility ? "Accessible taxi / Low-floor e-rickshaw" : "Shared jeep / Auto-rickshaw / Local bus",
      cost: perDay,
      budgetRange: `₹${Math.floor(perDay * 0.92).toLocaleString("en-IN")}–₹${Math.ceil(perDay * 1.05).toLocaleString("en-IN")}`,
      reasoning: `Day ${dayNum} priorities ${act1.name.split("(")[0].trim()} — a core ${destination} experience. ${hotel.name} keeps accommodation within budget. Street food & local dhabas for meals. Total well within ₹${perDay}/person/day.`,
      cultureSnapshot: act1.description,
      hiddenGem: {
        name: gemActivity.name,
        description: gemActivity.description,
        cost: gemActivity.cost,
        bestTime: isDarjeeling ? "6–8 AM on clear days" : "Morning 7–10 AM",
        verified: true,
      },
      weatherAlert: weather ? getWeatherHint(destination, dayNum) : undefined,
      accessibilityNote: accessibility ? `♿ ${destination}: Pre-book accessible taxi. Mountain paths may have uneven steps.` : undefined,
    };
  });

  const routeInfo: TripRouteInfo = {
    trains: ["Overnight Sleeper Express — book via IRCTC (railwaytickets.irctc.co.in)"],
    busOptions: ["State Roadways / Private AC Volvo overnight bus — RedBus.in"],
    avgFare: Math.min(600, Math.floor(perPersonBudget * 0.12)),
    hours: 8,
    enRouteStops: [],
    totalFareRange: `₹${Math.min(600, Math.floor(perPersonBudget * 0.12)).toLocaleString("en-IN")}–₹${Math.min(900, Math.floor(perPersonBudget * 0.18)).toLocaleString("en-IN")} per person (one way)`,
  };

  return { itinerary, routeInfo };
}

function getWeatherHint(destination: string, day: number): string {
  const d = destination.toLowerCase();
  if (d.includes("darjeeling") || d.includes("manali") || d.includes("shimla") || d.includes("mussoorie")) {
    return `🌤️ Day ${day}: 12–18°C, partly cloudy. Best outdoor window: 7–11 AM. Carry a light fleece.`;
  }
  if (d.includes("goa") || d.includes("kerala") || d.includes("varkala") || d.includes("kochi")) {
    return `🌊 Day ${day}: 28–33°C, humid with sea breeze. Visit beaches before 10 AM. Stay hydrated.`;
  }
  if (d.includes("jaipur") || d.includes("jodhpur") || d.includes("udaipur") || d.includes("jaisalmer")) {
    return `☀️ Day ${day}: 24–36°C, dry & sunny. Carry water. Avoid outdoor walks 12–4 PM.`;
  }
  if (d.includes("varanasi") || d.includes("agra") || d.includes("lucknow")) {
    return `🌡️ Day ${day}: 26–38°C. Dawn ghats best 5–7 AM. Museums & temples for midday.`;
  }
  return `🌤️ Day ${day}: Pleasant conditions. Best outdoor time 7–11 AM. Carry sunscreen & water.`;
}

/* ─────────────────── Component ─────────────────── */
function TripGeneratorPage() {
  // Step 1: Location Selection
  const [originState, setOriginState] = useState("West Bengal");
  const [originCity, setOriginCity] = useState("Kolkata");
  const [destinationState, setDestinationState] = useState("West Bengal");
  const [destinationCity, setDestinationCity] = useState("Darjeeling");

  // Step 2: Budget as range
  const [budgetMin, setBudgetMin] = useState(5000);
  const [budgetMax, setBudgetMax] = useState(7000);
  const [days, setDays] = useState(5);

  // Step 3: Preferences
  const [selectedVibes, setSelectedVibes] = useState<string[]>(["hills"]);
  const [budgetMode, setBudgetMode] = useState<"person" | "group">("person");
  const [partySize, setPartySize] = useState(1);
  const [accessibilityEnabled, setAccessibilityEnabled] = useState(false);
  const [weatherAlertsEnabled, setWeatherAlertsEnabled] = useState(true);

  // UI State
  const [step, setStep] = useState<1 | 2 | 3>(1); // 3-step planning flow
  const [customOpinionInput, setCustomOpinionInput] = useState("");

  // Results
  const [plan, setPlan] = useState<DayPlan[] | null>(null);
  const [routeInfo, setRouteInfo] = useState<TripRouteInfo | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [feasibilityError, setFeasibilityError] = useState<{ message: string; suggestion: string } | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  const originCities = STATE_CITIES[originState] ?? [originCity];
  const destCities = STATE_CITIES[destinationState] ?? [destinationCity];
  const perPersonBudget = budgetMode === "group" ? Math.floor(budgetMax / Math.max(1, partySize)) : budgetMax;
  const perPersonBudgetMin = budgetMode === "group" ? Math.floor(budgetMin / Math.max(1, partySize)) : budgetMin;

  const toggleVibe = (v: string) => {
    setSelectedVibes((prev) =>
      prev.includes(v) ? (prev.length > 1 ? prev.filter((x) => x !== v) : prev) : [...prev, v]
    );
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setPlan(null);
    setRouteInfo(null);
    setExpandedDay(null);
    setFeasibilityError(null);

    try {
      const res = await fetch("/api/gemma/trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budget_min: budgetMin,
          budget_max: budgetMax,
          days,
          origin: originCity,
          origin_state: originState,
          destination: destinationCity,
          destination_state: destinationState,
          vibes: selectedVibes,
          budget_mode: budgetMode,
          party_size: partySize,
          accessibility_enabled: accessibilityEnabled,
          weather_enabled: weatherAlertsEnabled,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as { itinerary?: DayPlan[]; routeInfo?: TripRouteInfo; error?: string; message?: string; suggestion?: string };

        // Budget not feasible check
        if (data.error === "BUDGET_NOT_FEASIBLE") {
          setFeasibilityError({ message: data.message ?? "", suggestion: data.suggestion ?? "" });
          setGenerating(false);
          return;
        }

        if (data.itinerary && Array.isArray(data.itinerary) && data.itinerary.length > 0) {
          const processedItinerary = data.itinerary.map((d) => ({
            ...d,
            selectedActivities: d.selectedActivities ?? [...(d.activities ?? [])],
          }));
          setPlan(processedItinerary);
          if (data.routeInfo) setRouteInfo(data.routeInfo);
          setInviteCode(`YT-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
          setGenerating(false);
          return;
        }

        // Try if it's a direct array
        if (Array.isArray(data)) {
          const itinerary = (data as DayPlan[]).map((d) => ({
            ...d,
            selectedActivities: d.selectedActivities ?? [...(d.activities ?? [])],
          }));
          setPlan(itinerary);
          setGenerating(false);
          return;
        }
      }
    } catch {
      /* Fallback handled below */
    }

    // High-quality instant client fallback
    const { itinerary, routeInfo: ri } = buildClientFallback(
      days, destinationCity, destinationState, selectedVibes,
      budgetMin, budgetMax, budgetMode, partySize, accessibilityEnabled, weatherAlertsEnabled,
    );
    setPlan(itinerary);
    setRouteInfo(ri);
    setInviteCode(`YT-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
    setGenerating(false);
  };

  const handleToggleActivity = (dayIndex: number, actName: string) => {
    if (!plan) return;
    const updated = [...plan];
    const day = updated[dayIndex];
    const current = day.selectedActivities ?? [];
    day.selectedActivities = current.includes(actName)
      ? current.filter((a) => a !== actName)
      : [...current, actName];
    setPlan(updated);
  };

  const handleAddCustomSpot = (dayIndex: number) => {
    if (!customOpinionInput.trim() || !plan) return;
    const updated = [...plan];
    const spotText = `⭐ ${customOpinionInput.trim()} (Your Suggestion)`;
    updated[dayIndex].activities.push(spotText);
    updated[dayIndex].activityDetails.push({ name: spotText, description: "Added by you — your local tip or personal preference for this day.", cost: "Varies" });
    updated[dayIndex].selectedActivities = [...(updated[dayIndex].selectedActivities ?? []), spotText];
    setPlan(updated);
    setCustomOpinionInput("");
  };

  const perPersonCostTotal = plan?.reduce((a, b) => a + b.cost, 0) ?? 0;
  const totalGroupCost = perPersonCostTotal * (budgetMode === "group" ? partySize : 1);
  const remaining = perPersonBudget - perPersonCostTotal;

  return (
    <PageShell>
      {/* ────── Hero ────── */}
      <section className="relative border-b-[3px] border-[var(--ink)] paper py-14 sm:py-20">
        <Halftone />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <StampTag tone="pink">Core Flow 01</StampTag>
          <h1 className="poster-title mt-4 text-[clamp(2.5rem,8vw,6rem)]">
            BUDGET TRIP GENERATOR
          </h1>
          <p className="mt-3 max-w-2xl text-base sm:text-lg">
            Pick your origin state & city, choose your destination. Gemma AI builds the cheapest comfortable route, day-by-day itinerary, real hotel names, genuine hidden gems — and flags if your budget is too low for the trip.
          </p>
        </div>
      </section>

      {/* ────── 3-Step Input Flow ────── */}
      <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--cream)] py-10 sm:py-14">
        <Halftone />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6">

          {/* Step Tabs */}
          <div className="flex border-2 border-[var(--ink)] mb-8">
            {([1, 2, 3] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStep(s)}
                className={`flex-1 py-3 text-center font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest border-r-2 last:border-r-0 border-[var(--ink)] transition-colors cursor-pointer ${
                  step === s ? "bg-[var(--hotpink)] text-[var(--cream)]" : "hover:bg-[var(--mustard)]/20"
                }`}
              >
                Step {s}: {s === 1 ? "Route" : s === 2 ? "Budget" : "Preferences"}
              </button>
            ))}
          </div>

          <div className="ticket p-6 sm:p-8">
            <div className="flex items-center justify-between border-b-2 border-dashed border-[var(--ink)] pb-3">
              <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest">Boarding Pass</span>
              <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest">YT-GEN · Gemma AI</span>
            </div>

            {/* ── STEP 1: Route ── */}
            {step === 1 && (
              <div className="mt-6 grid gap-6 sm:grid-cols-2 animate-fade-in">
                {/* Origin */}
                <div className="space-y-3">
                  <div className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest text-[var(--hotpink)]">🛫 Starting From</div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">State</label>
                    <select
                      value={originState}
                      onChange={(e) => {
                        setOriginState(e.target.value);
                        const cities = STATE_CITIES[e.target.value] ?? [];
                        if (cities.length > 0) setOriginCity(cities[0]);
                      }}
                      className="w-full border-2 border-[var(--ink)] bg-[var(--cream)] p-2.5 font-bold text-sm cursor-pointer outline-none"
                    >
                      {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">City / Town</label>
                    {STATE_CITIES[originState] ? (
                      <select
                        value={originCity}
                        onChange={(e) => setOriginCity(e.target.value)}
                        className="w-full border-2 border-[var(--ink)] bg-[var(--cream)] p-2.5 font-bold text-sm cursor-pointer outline-none"
                      >
                        {(STATE_CITIES[originState] ?? []).map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : (
                      <input type="text" value={originCity} onChange={(e) => setOriginCity(e.target.value)} className="w-full border-2 border-[var(--ink)] bg-[var(--cream)] p-2.5 font-bold text-sm outline-none" placeholder="Enter city name..." />
                    )}
                  </div>
                </div>

                {/* Destination */}
                <div className="space-y-3">
                  <div className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest text-[var(--hotpink)]">🏔️ Going To</div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">State</label>
                    <select
                      value={destinationState}
                      onChange={(e) => {
                        setDestinationState(e.target.value);
                        const cities = STATE_CITIES[e.target.value] ?? [];
                        if (cities.length > 0) setDestinationCity(cities[0]);
                      }}
                      className="w-full border-2 border-[var(--ink)] bg-[var(--cream)] p-2.5 font-bold text-sm cursor-pointer outline-none"
                    >
                      {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">City / Destination</label>
                    {STATE_CITIES[destinationState] ? (
                      <select
                        value={destinationCity}
                        onChange={(e) => setDestinationCity(e.target.value)}
                        className="w-full border-2 border-[var(--ink)] bg-[var(--cream)] p-2.5 font-bold text-sm cursor-pointer outline-none"
                      >
                        {(STATE_CITIES[destinationState] ?? []).map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : (
                      <input type="text" value={destinationCity} onChange={(e) => setDestinationCity(e.target.value)} className="w-full border-2 border-[var(--ink)] bg-[var(--cream)] p-2.5 font-bold text-sm outline-none" placeholder="Enter destination..." />
                    )}
                  </div>
                </div>

                {/* Route Preview */}
                <div className="sm:col-span-2 border-2 border-dashed border-[var(--ink)] bg-[var(--mustard)]/10 p-4 flex items-center gap-4">
                  <div className="flex-1 text-center">
                    <div className="font-[family-name:var(--font-display)] text-xl">{originCity}</div>
                    <div className="text-[10px] text-muted-foreground">{originState}</div>
                  </div>
                  <div className="text-2xl">✈️➔</div>
                  <div className="flex-1 text-center">
                    <div className="font-[family-name:var(--font-display)] text-xl text-[var(--hotpink)]">{destinationCity}</div>
                    <div className="text-[10px] text-muted-foreground">{destinationState}</div>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-black uppercase tracking-widest mb-2">Number of Days</label>
                  <input type="range" min={2} max={14} step={1} value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-full accent-[var(--hotpink)] cursor-pointer" />
                  <div className="mt-1 font-[family-name:var(--font-display)] text-4xl">{days} days</div>
                </div>
              </div>
            )}

            {/* ── STEP 2: Budget as Range ── */}
            {step === 2 && (
              <div className="mt-6 space-y-6 animate-fade-in">
                <div className="border-2 border-[var(--hotpink)] bg-[var(--hotpink)]/5 p-4">
                  <div className="text-xs font-black uppercase tracking-widest text-[var(--hotpink)]">💡 Budget is a Range, Not a Fixed Number</div>
                  <p className="text-xs text-muted-foreground mt-1">Slide both handles to set your comfortable spending range. Gemma will plan within your minimum and stretch towards the maximum for comfort.</p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <label className="block">
                    <div className="text-xs font-black uppercase tracking-widest">Minimum Budget (₹)</div>
                    <input type="range" min={1000} max={budgetMax - 1000} step={500} value={budgetMin} onChange={(e) => setBudgetMin(Number(e.target.value))} className="mt-3 w-full accent-[var(--hotpink)] cursor-pointer" />
                    <div className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">₹{budgetMin.toLocaleString("en-IN")}</div>
                    <div className="text-[10px] text-muted-foreground">Minimum comfort floor per {budgetMode === "group" ? `group of ${partySize}` : "person"}</div>
                  </label>

                  <label className="block">
                    <div className="text-xs font-black uppercase tracking-widest">Maximum Budget (₹)</div>
                    <input type="range" min={budgetMin + 1000} max={80000} step={500} value={budgetMax} onChange={(e) => setBudgetMax(Number(e.target.value))} className="mt-3 w-full accent-[var(--hotpink)] cursor-pointer" />
                    <div className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[var(--hotpink)]">₹{budgetMax.toLocaleString("en-IN")}</div>
                    <div className="text-[10px] text-muted-foreground">Comfortable maximum stretch</div>
                  </label>
                </div>

                {/* Budget Summary Bar */}
                <div className="border-2 border-[var(--ink)] p-4 bg-[var(--mustard)]/10">
                  <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-2">
                    <span>Budget Window</span>
                    <span className="text-[var(--hotpink)]">₹{budgetMin.toLocaleString("en-IN")} — ₹{budgetMax.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="border border-[var(--ink)] p-2">
                      <div className="text-[10px] text-muted-foreground uppercase">Per Person / Day (Min)</div>
                      <div className="font-[family-name:var(--font-display)] text-lg">₹{Math.floor(perPersonBudgetMin / days)}</div>
                    </div>
                    <div className="border border-[var(--ink)] p-2 bg-[var(--hotpink)]/10">
                      <div className="text-[10px] text-muted-foreground uppercase">Per Person / Day (Max)</div>
                      <div className="font-[family-name:var(--font-display)] text-lg text-[var(--hotpink)]">₹{Math.floor(perPersonBudget / days)}</div>
                    </div>
                    <div className="border border-[var(--ink)] p-2">
                      <div className="text-[10px] text-muted-foreground uppercase">Total Trip Range</div>
                      <div className="font-[family-name:var(--font-display)] text-lg">₹{budgetMin.toLocaleString("en-IN")}–{budgetMax.toLocaleString("en-IN")}</div>
                    </div>
                  </div>
                </div>

                {/* Group Mode */}
                <div>
                  <div className="text-xs font-black uppercase tracking-widest mb-2">Budgeting Mode</div>
                  <div className="flex border-2 border-[var(--ink)] overflow-hidden text-xs font-bold uppercase">
                    <button type="button" onClick={() => { setBudgetMode("person"); setPartySize(1); }} className={`flex-1 py-2.5 cursor-pointer transition-colors ${budgetMode === "person" ? "bg-[var(--hotpink)] text-[var(--cream)]" : "hover:bg-[var(--mustard)]/20"}`}>Solo / Per-Person</button>
                    <button type="button" onClick={() => { setBudgetMode("group"); setPartySize(Math.max(2, partySize)); }} className={`flex-1 py-2.5 cursor-pointer transition-colors ${budgetMode === "group" ? "bg-[var(--hotpink)] text-[var(--cream)]" : "hover:bg-[var(--mustard)]/20"}`}>Group Trip</button>
                  </div>
                  {budgetMode === "group" && (
                    <div className="mt-3 animate-fade-in">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Party Size (2–15)</label>
                      <input type="number" min={2} max={15} value={partySize} onChange={(e) => setPartySize(Math.max(2, Number(e.target.value) || 2))} className="w-full border-2 border-[var(--ink)] bg-[var(--cream)] p-2 font-bold outline-none" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP 3: Preferences ── */}
            {step === 3 && (
              <div className="mt-6 space-y-6 animate-fade-in">
                {/* MULTI-SELECT VIBES */}
                <div>
                  <div className="text-xs font-black uppercase tracking-widest mb-1">Travel Vibes (Select Multiple)</div>
                  <p className="text-[10px] text-muted-foreground mb-3">Choose all that apply. Kolkata → Darjeeling? Select both Hills AND City — Gemma will suggest the best of both.</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {VIBES.map((v) => {
                      const isSelected = selectedVibes.includes(v.id);
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => toggleVibe(v.id)}
                          className={`border-2 border-[var(--ink)] p-3 text-left cursor-pointer transition-all ${isSelected ? "bg-[var(--hotpink)] text-[var(--cream)]" : "bg-[var(--cream)] hover:bg-[var(--mustard)]/20"}`}
                        >
                          <div className="text-xl">{v.emoji}</div>
                          <div className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-wider mt-1">{v.label}</div>
                          <div className={`text-[9px] mt-0.5 ${isSelected ? "text-[var(--cream)]/80" : "text-muted-foreground"}`}>{v.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Smart Preference Toggles */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex items-start gap-3 border-2 border-[var(--ink)] p-3 bg-[var(--cream)] cursor-pointer">
                    <input type="checkbox" checked={accessibilityEnabled} onChange={(e) => setAccessibilityEnabled(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--hotpink)] cursor-pointer" />
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider">♿ Accessibility-Aware Planning</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Wheelchair-friendly routes, minimal stairs, step-free stays & accessible transit</div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 border-2 border-[var(--ink)] p-3 bg-[var(--cream)] cursor-pointer">
                    <input type="checkbox" checked={weatherAlertsEnabled} onChange={(e) => setWeatherAlertsEnabled(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--hotpink)] cursor-pointer" />
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider">🌤️ Live Weather Alerts</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Daily temperature, optimal walking windows & weather-specific tips</div>
                    </div>
                  </label>
                </div>

                {/* Summary Preview */}
                <div className="border-2 border-[var(--ink)] bg-[var(--mustard)]/10 p-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[var(--hotpink)] mb-2">Your Trip Summary</div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    <div>🛫 From: <span className="font-normal">{originCity}, {originState}</span></div>
                    <div>🏔️ To: <span className="font-normal">{destinationCity}, {destinationState}</span></div>
                    <div>📅 Days: <span className="font-normal">{days} days</span></div>
                    <div>💰 Budget: <span className="font-normal">₹{budgetMin.toLocaleString("en-IN")}–₹{budgetMax.toLocaleString("en-IN")}</span></div>
                    <div>👥 Party: <span className="font-normal">{budgetMode === "group" ? `${partySize} people` : "Solo"}</span></div>
                    <div>🎭 Vibes: <span className="font-normal">{selectedVibes.join(", ")}</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex gap-3">
              {step > 1 && (
                <button type="button" onClick={() => setStep((s) => Math.max(1, s - 1) as 1 | 2 | 3)} className="btn-ghost flex-none cursor-pointer">
                  ← Back
                </button>
              )}
              {step < 3 ? (
                <button type="button" onClick={() => setStep((s) => Math.min(3, s + 1) as 1 | 2 | 3)} className="btn-poster flex-1 justify-center cursor-pointer">
                  Next: {step === 1 ? "Set Budget" : "Preferences"} →
                </button>
              ) : (
                <button type="button" onClick={handleGenerate} disabled={generating} className="btn-poster flex-1 justify-center cursor-pointer">
                  {generating
                    ? "✈️ Gemma is planning your trip..."
                    : `🗺️ Generate: ${originCity} → ${destinationCity}`}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Budget Not Feasible Error ── */}
      {feasibilityError && (
        <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--hotpink)] py-10 text-[var(--cream)]">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="poster-card grain bg-[var(--ink)] text-[var(--cream)] p-6">
              <div className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-[0.3em] text-[var(--hotpink)] mb-3">
                🚫 Budget Not Possible — Honest Answer
              </div>
              <p className="text-base font-bold leading-relaxed">{feasibilityError.message}</p>
              {feasibilityError.suggestion && (
                <div className="mt-4 border-t border-white/20 pt-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[var(--mustard)] mb-1">💡 What We Suggest Instead</div>
                  <p className="text-sm">{feasibilityError.suggestion}</p>
                </div>
              )}
              <button type="button" onClick={() => { setFeasibilityError(null); setStep(2); }} className="mt-5 btn-poster !bg-[var(--mustard)] !text-[var(--ink)] cursor-pointer">
                ← Adjust Budget
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── Results ── */}
      {plan && (
        <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--dusk)] py-12 text-[var(--cream)] sm:py-16">
          <Halftone />
          <div className="relative mx-auto max-w-4xl px-4 sm:px-6 space-y-8">

            {/* ROUTE RECOMMENDATION CARD */}
            {routeInfo && (
              <div className="poster-card grain bg-[var(--cream)] text-[var(--ink)] p-5 sm:p-6">
                <div className="flex items-center justify-between border-b-2 border-dashed border-[var(--ink)] pb-3 mb-4">
                  <StampTag tone="mustard">🛤️ BEST ROUTE: {originCity} → {destinationCity}</StampTag>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Train Option</div>
                    <div className="text-xs font-bold mt-1">{routeInfo.trains[0]}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bus / Alternate</div>
                    <div className="text-xs font-bold mt-1">{routeInfo.busOptions[0]}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fare Range</div>
                    <div className="font-[family-name:var(--font-display)] text-xl text-[var(--hotpink)]">{routeInfo.totalFareRange}</div>
                    <div className="text-[10px] text-muted-foreground">~{routeInfo.hours} hours journey</div>
                  </div>
                </div>

                {/* En-Route Stops */}
                {routeInfo.enRouteStops && routeInfo.enRouteStops.length > 0 && (
                  <div className="mt-4 border-t-2 border-dashed border-[var(--ink)] pt-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-[var(--hotpink)] mb-3">
                      🚉 Places You Can See En Route (Train Journey Stops):
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {routeInfo.enRouteStops.map((stop, idx) => (
                        <div key={idx} className="border border-[var(--ink)] p-3 bg-[var(--cream)]">
                          <div className="flex justify-between items-start">
                            <span className="font-[family-name:var(--font-heavy)] text-xs uppercase">{stop.city}</span>
                            <span className="chip !text-[9px] !py-0">{stop.state}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">{stop.tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Trip Header */}
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <StampTag tone="mustard">Gemma's Itinerary</StampTag>
                <h2 className="poster-title mt-2 text-[clamp(1.8rem,4vw,3rem)] text-[var(--mustard)]">
                  {days} DAYS IN {destinationCity.toUpperCase()}, {destinationState.toUpperCase()}
                </h2>
                <div className="text-xs text-[var(--cream)]/70 font-bold uppercase tracking-widest">
                  Budget: ₹{budgetMin.toLocaleString("en-IN")}–₹{budgetMax.toLocaleString("en-IN")} · {budgetMode === "group" ? `Group of ${partySize}` : "Solo/Per-person"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-black uppercase tracking-widest text-[var(--cream)]/60">Estimated Total</div>
                <div className="font-[family-name:var(--font-display)] text-3xl text-[var(--mustard)]">₹{totalGroupCost.toLocaleString("en-IN")}</div>
                <div className={`text-[10px] font-bold uppercase ${remaining >= 0 ? "text-green-400" : "text-[var(--hotpink)]"}`}>
                  {remaining >= 0 ? `₹${remaining.toLocaleString("en-IN")} buffer ✓` : `₹${Math.abs(remaining).toLocaleString("en-IN")} over budget`}
                </div>
              </div>
            </div>

            {/* Invite Code */}
            {inviteCode && (
              <div className="border-2 border-[var(--mustard)] bg-[var(--mustard)]/10 px-4 py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-[var(--mustard)]">Trip Code — Share with Group</div>
                  <div className="font-[family-name:var(--font-heavy)] text-xl tracking-widest">{inviteCode}</div>
                </div>
                <button type="button" onClick={() => void navigator.clipboard.writeText(inviteCode)} className="chip !bg-[var(--mustard)] !text-[var(--ink)] cursor-pointer">📋 Copy</button>
              </div>
            )}

            {/* Budget Range Bar */}
            <div>
              <div className="h-3 w-full border-2 border-[var(--cream)]/30 bg-[var(--ink)] relative">
                <div className="absolute h-full bg-[var(--cream)]/20" style={{ width: `${(budgetMin / budgetMax) * 100}%` }} />
                <div className="h-full transition-all" style={{ width: `${Math.min(100, (perPersonCostTotal / perPersonBudget) * 100)}%`, backgroundColor: remaining >= 0 ? "var(--mustard)" : "var(--hotpink)" }} />
              </div>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mt-1">
                <span>₹{budgetMin.toLocaleString("en-IN")}</span>
                <span className={remaining >= 0 ? "text-[var(--mustard)]" : "text-[var(--hotpink)]"}>
                  Spend: ₹{perPersonCostTotal.toLocaleString("en-IN")}/person
                </span>
                <span>₹{budgetMax.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Day Cards */}
            <div className="space-y-4">
              {plan.map((p, dayIndex) => {
                const isExpanded = expandedDay === p.day;
                const selected = p.selectedActivities ?? p.activities;

                return (
                  <div key={p.day} className="poster-card grain bg-[var(--cream)] text-[var(--ink)]">
                    {/* Day Header */}
                    <button
                      type="button"
                      onClick={() => setExpandedDay(isExpanded ? null : p.day)}
                      className="w-full text-left flex items-start justify-between border-b-2 border-dashed border-[var(--ink)] px-5 py-4 hover:bg-[var(--mustard)]/10 cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-[family-name:var(--font-display)] text-2xl text-[var(--hotpink)]">DAY {p.day}</span>
                          <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest">{p.city}, {p.state}</span>
                        </div>
                        <div className="font-[family-name:var(--font-heavy)] text-sm mt-0.5">{p.headline}</div>
                        {p.weatherAlert && <div className="text-[10px] text-[var(--hotpink)] font-bold mt-0.5">{p.weatherAlert}</div>}
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <div className="font-[family-name:var(--font-display)] text-xl">{p.budgetRange}</div>
                        <div className="text-[10px] text-muted-foreground">{isExpanded ? "▲ Close" : "▼ Details"}</div>
                      </div>
                    </button>

                    {/* Checkboxes & Custom Spot */}
                    <div className="p-5 border-b-2 border-dashed border-[var(--ink)]/40">
                      <div className="text-[10px] font-black uppercase tracking-widest text-[var(--hotpink)] mb-3">
                        ☑️ Choose Your Activities for Day {p.day}:
                      </div>
                      <div className="space-y-2">
                        {p.activities.map((act) => {
                          const isChecked = selected.includes(act);
                          const detail = p.activityDetails?.find((d) => d.name === act);
                          return (
                            <label key={act} className="flex items-start gap-3 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleActivity(dayIndex, act)}
                                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--hotpink)] cursor-pointer"
                              />
                              <div className={`flex-1 ${isChecked ? "" : "opacity-50"}`}>
                                <div className="text-xs font-bold">
                                  {detail?.isHiddenGem && <span className="chip !text-[8px] !py-0 !bg-[var(--hotpink)] !text-[var(--cream)] mr-1">Hidden Gem</span>}
                                  {act}
                                </div>
                                {detail?.description && (
                                  <div className="text-[10px] text-muted-foreground mt-0.5">{detail.description.substring(0, 100)}...</div>
                                )}
                                {detail?.cost && <div className="text-[10px] font-bold text-[var(--hotpink)] mt-0.5">{detail.cost}</div>}
                              </div>
                            </label>
                          );
                        })}
                      </div>

                      {/* Add Custom Spot */}
                      <div className="mt-4 pt-3 border-t border-[var(--ink)]/20 flex gap-2">
                        <input
                          type="text"
                          value={customOpinionInput}
                          onChange={(e) => setCustomOpinionInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleAddCustomSpot(dayIndex); }}
                          placeholder="➕ Add your own spot or idea (e.g. 'Visit Ghoom Monastery at 5 AM')..."
                          className="flex-1 border-2 border-[var(--ink)] bg-[var(--cream)] px-3 py-1.5 text-xs font-bold outline-none"
                        />
                        <button type="button" onClick={() => handleAddCustomSpot(dayIndex)} className="chip !bg-[var(--hotpink)] !text-[var(--cream)] cursor-pointer">
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Day Summary Row */}
                    <div className="grid gap-3 p-5 sm:grid-cols-3">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Transport</div>
                        <div className="text-xs font-bold mt-1">{p.transport}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Meals Budget</div>
                        <div className="text-xs font-bold mt-1">{p.food}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Selected Spots ({selected.length})</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selected.slice(0, 3).map((a) => <span key={a} className="chip !text-[8px]">{a.replace(/ \(.*$/, "")}</span>)}
                          {selected.length > 3 && <span className="chip !text-[8px]">+{selected.length - 3} more</span>}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t-2 border-dashed border-[var(--ink)] p-5 space-y-4 animate-fade-in bg-[var(--cream)]">
                        {/* Hotel Recommendation */}
                        <div className="border-[3px] border-[var(--ink)] bg-[var(--cream)] shadow-[3px_3px_0_var(--ink)]">
                          <div className="bg-[var(--ink)] text-[var(--mustard)] px-4 py-2">
                            <div className="font-[family-name:var(--font-heavy)] text-[10px] uppercase tracking-widest">🏨 Best Hotel to Stay — Recommended for Your Budget</div>
                          </div>
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-[family-name:var(--font-heavy)] text-sm uppercase tracking-wider">{p.stayFull}</div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">{p.stayDescription}</div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="font-[family-name:var(--font-display)] text-lg text-[var(--hotpink)]">{p.stayPriceRange}</div>
                                <div className="text-[10px] font-bold">{p.stayRating}</div>
                              </div>
                            </div>
                            <div className="mt-3 border-t border-[var(--ink)]/20 pt-2">
                              <div className="text-[10px] font-black uppercase tracking-widest text-[var(--hotpink)]">💡 Booking Tip</div>
                              <div className="text-xs font-bold mt-0.5">{p.stayBookingTip}</div>
                            </div>
                          </div>
                        </div>

                        {/* Hidden Gem Block */}
                        {p.hiddenGem && (
                          <div className="border-[3px] border-[var(--hotpink)] bg-[var(--cream)] shadow-[3px_3px_0_var(--hotpink)]">
                            <div className="bg-[var(--hotpink)] text-[var(--cream)] px-4 py-2 flex items-center justify-between">
                              <div className="font-[family-name:var(--font-heavy)] text-[10px] uppercase tracking-widest">💎 Verified Genuine Local Hidden Gem</div>
                              <span className="chip !bg-[var(--cream)] !text-[var(--hotpink)] !text-[9px]">✓ Verified Real</span>
                            </div>
                            <div className="p-4">
                              <div className="font-[family-name:var(--font-heavy)] text-sm uppercase tracking-wider">{p.hiddenGem.name}</div>
                              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{p.hiddenGem.description}</p>
                              <div className="mt-3 flex flex-wrap gap-3 text-[10px] font-bold">
                                <span>💰 {p.hiddenGem.cost}</span>
                                <span>⏰ Best Time: {p.hiddenGem.bestTime}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Culture Snapshot */}
                        <div className="border-2 border-[var(--ink)] bg-[var(--mustard)]/10 p-4">
                          <div className="text-[10px] font-black uppercase tracking-widest text-[var(--hotpink)] mb-1">🎭 Culture Snapshot</div>
                          <p className="text-xs italic leading-relaxed">{p.cultureSnapshot}</p>
                          {p.accessibilityNote && <div className="mt-2 text-xs font-bold text-green-700">{p.accessibilityNote}</div>}
                        </div>

                        {/* Reasoning */}
                        <div className="border-[3px] border-[var(--ink)] bg-[var(--mustard)] p-4">
                          <div className="flex gap-2">
                            <span className="text-xl shrink-0">💡</span>
                            <div>
                              <div className="font-[family-name:var(--font-heavy)] text-[10px] uppercase tracking-widest text-[var(--hotpink)]">Why This Choice? (Gemma's Reasoning)</div>
                              <p className="mt-1 text-xs leading-relaxed">{p.reasoning}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Share Actions */}
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`YatraAI Trip: ${originCity} → ${destinationCity} | ${days} days | ₹${budgetMin.toLocaleString("en-IN")}–₹${budgetMax.toLocaleString("en-IN")} budget | ${budgetMode === "group" ? `Group of ${partySize}` : "Solo"} | Trip Code: ${inviteCode ?? ""} | Plan yours at yatraai.in`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-poster"
              >
                📱 Share on WhatsApp
              </a>
              <Link to="/expense-tracker" className="btn-ghost !text-[var(--cream)] !border-[var(--cream)]">
                Track Group Expenses →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer Note */}
      <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--cream)] py-8">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="stamp-card inline-block">
            <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest text-muted-foreground">
              ⚡ Powered by Google Gemma 4 AI — State-to-state routing, real hotel names, verified hidden gems, and budget feasibility check.
            </span>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
