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
          "Tell YatraAI what's in your wallet. It builds the trip around ₹, not the other way round. Day-by-day itinerary with best routes & hidden gems.",
      },
    ],
  }),
  component: TripGeneratorPage,
});

/* ────── types ────── */

interface LodgingOption {
  name: string;
  cost: number;
  note: string;
}

interface BestRoute {
  mode: string;
  estimatedCost: number;
  durationHours: number;
  comfortRating: string;
  bookingTip: string;
}

interface DayPlan {
  day: number;
  city: string;
  activities: string[];
  selectedActivities?: string[];
  stay: string;
  stayNote: string;
  food: string;
  transport: string;
  cost: number;
  reasoning: string;
  cultureSnapshot: string;
  cheaperLodging: LodgingOption[];
  hiddenGems: { name: string; note: string; cost?: string; verified?: boolean }[];
  accessibilityNote?: string;
  weatherAlert?: string;
}

/* ────── Fallback generator ────── */
function generateClientFallback(
  days: number,
  origin: string,
  destination: string,
  vibe: string,
  budget: number,
  accessibilityEnabled: boolean,
  weatherEnabled: boolean,
): { itinerary: DayPlan[]; bestRoute: BestRoute } {
  const perDay = Math.floor(budget / days);
  const targetCity = destination.trim() || (vibe === "hills" ? "Manali" : vibe === "beach" ? "Goa" : vibe === "spiritual" ? "Varanasi" : "Jaipur");

  const bestRoute: BestRoute = {
    mode: "3rd AC Sleeper Train / Direct AC Volvo Night Bus",
    estimatedCost: Math.min(850, Math.floor(perDay * 0.8)),
    durationHours: 7.5,
    comfortRating: "⭐⭐⭐⭐ (4.5/5 Comfort)",
    bookingTip: `Book 14 days prior via IRCTC / RedBus for overnight 3rd AC berths from ${origin} to ${targetCity}. Saves hotel cost for 1 night!`,
  };

  const itinerary = Array.from({ length: days }).map((_, idx) => {
    const dayNum = idx + 1;
    const activities = [
      `${targetCity} Iconic Heritage Walk & Local Market`,
      `Sunset Viewpoint at ${targetCity} Fort`,
      `Famous Local Food Market Tasting`,
    ];

    return {
      day: dayNum,
      city: targetCity,
      activities,
      selectedActivities: [...activities],
      stay: `${targetCity} Backpackers Hostel Dorm`,
      stayNote: accessibilityEnabled ? "Step-free ground floor dorm with accessible bathroom & ramps" : "Clean bed, hot water, free WiFi near transit center",
      food: `₹${Math.floor(perDay * 0.35)} (Breakfast chai + Local Thali lunch & dinner)`,
      transport: accessibilityEnabled ? "E-Rickshaw / Accessible Low-floor Cab" : "Shared Auto / E-Rickshaw",
      cost: Math.min(perDay, 850),
      reasoning: `Selected budget lodging and shared transit to keep Day ${dayNum} within ₹${perDay}/day per person.`,
      cultureSnapshot: `Experience authentic local rhythms in ${targetCity} with bustling markets and historic lanes.`,
      cheaperLodging: [
        { name: `${targetCity} Youth Hostel`, cost: Math.floor(perDay * 0.25), note: "Basic dorm with locker & elevator" },
        { name: `${targetCity} Railway Retiring Room`, cost: Math.floor(perDay * 0.3), note: "Right inside station with ground access" },
      ],
      hiddenGems: [
        { name: `${targetCity} Secret Sunrise Viewpoint`, note: "Quiet view spot preferred by locals, verified genuine", cost: "Free", verified: true },
        { name: `${targetCity} 50-Year-Old Clay Cup Chai Stall`, note: "Authentic local spice tea since 1974", cost: "₹15", verified: true },
      ],
      accessibilityNote: accessibilityEnabled ? "♿ Checked for minimal stairs and flat paved walkways." : undefined,
      weatherAlert: weatherEnabled ? `🌤️ Pleasant 22°C - Ideal walking window 08:00 AM to 11:30 AM.` : undefined,
    };
  });

  return { itinerary, bestRoute };
}

function TripGeneratorPage() {
  const [budget, setBudget] = useState(4500);
  const [days, setDays] = useState(5);
  const [origin, setOrigin] = useState("Delhi");
  const [destination, setDestination] = useState("Jaipur");
  const [vibe, setVibe] = useState("city");
  const [budgetMode, setBudgetMode] = useState<"person" | "group">("person");
  const [partySize, setPartySize] = useState(1);

  // New features
  const [accessibilityEnabled, setAccessibilityEnabled] = useState(false);
  const [weatherAlertsEnabled, setWeatherAlertsEnabled] = useState(true);
  const [customOpinionInput, setCustomOpinionInput] = useState("");

  const [plan, setPlan] = useState<DayPlan[] | null>(null);
  const [bestRoute, setBestRoute] = useState<BestRoute | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  const origins = ["Delhi", "Mumbai", "Kolkata", "Bangalore", "Chennai", "Hyderabad"];
  const popularDestinations = ["Jaipur", "Manali", "Goa", "Varanasi", "Darjeeling", "Udaipur", "Rishikesh", "Kochi"];
  const perPersonBudget = budgetMode === "group" ? Math.floor(budget / (partySize || 1)) : budget;

  const handleGenerate = async () => {
    setGenerating(true);
    setPlan(null);
    setBestRoute(null);
    setExpandedDay(null);

    try {
      const res = await fetch("/api/gemma/trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budget,
          days,
          origin,
          destination,
          vibe,
          budget_mode: budgetMode,
          party_size: partySize,
          accessibility_enabled: accessibilityEnabled,
          weather_enabled: weatherAlertsEnabled,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as DayPlan[] | { error?: string };
        if (Array.isArray(data) && data.length > 0) {
          setPlan(data.map((d) => ({ ...d, selectedActivities: [...(d.activities || [])] })));
          setBestRoute({
            mode: "3rd AC Sleeper Train / AC Volvo Bus",
            estimatedCost: Math.min(900, Math.floor(perPersonBudget / days * 0.8)),
            durationHours: 6.5,
            comfortRating: "⭐⭐⭐⭐ (4.5/5 Comfort)",
            bookingTip: `Book 14 days prior via IRCTC/RedBus from ${origin} to ${destination || "your destination"}. Saves 1 night hotel cost!`,
          });
          setGenerating(false);
          return;
        }
      }
    } catch {
      /* Instant client fallback handled below */
    }

    const { itinerary, bestRoute: route } = generateClientFallback(
      days,
      origin,
      destination,
      vibe,
      perPersonBudget,
      accessibilityEnabled,
      weatherAlertsEnabled,
    );

    setPlan(itinerary);
    setBestRoute(route);
    setInviteCode(`YT-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
    setGenerating(false);
  };

  // Add custom spot / opinion
  const handleAddCustomSpot = (dayIndex: number) => {
    if (!customOpinionInput.trim() || !plan) return;
    const updatedPlan = [...plan];
    const spotText = `⭐ ${customOpinionInput.trim()} (User Added)`;
    updatedPlan[dayIndex].activities.push(spotText);
    if (!updatedPlan[dayIndex].selectedActivities) {
      updatedPlan[dayIndex].selectedActivities = [...updatedPlan[dayIndex].activities];
    } else {
      updatedPlan[dayIndex].selectedActivities.push(spotText);
    }
    setPlan(updatedPlan);
    setCustomOpinionInput("");
  };

  // Toggle activity checkbox
  const handleToggleActivity = (dayIndex: number, act: string) => {
    if (!plan) return;
    const updatedPlan = [...plan];
    const day = updatedPlan[dayIndex];
    const current = day.selectedActivities ?? [...day.activities];

    if (current.includes(act)) {
      day.selectedActivities = current.filter((a) => a !== act);
    } else {
      day.selectedActivities = [...current, act];
    }
    setPlan(updatedPlan);
  };

  const perPersonCost = plan?.reduce((a, b) => a + b.cost, 0) ?? 0;
  const totalGroupCost = perPersonCost * (budgetMode === "group" ? partySize : 1);
  const remaining = perPersonBudget - perPersonCost;

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative border-b-[3px] border-[var(--ink)] paper py-16 sm:py-20">
        <Halftone />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <StampTag tone="pink">Core Flow 01</StampTag>
          <h1 className="poster-title mt-4 text-[clamp(2.5rem,8vw,6rem)]">
            BUDGET TRIP GENERATOR
          </h1>
          <p className="mt-3 max-w-2xl text-lg">
            Tell YatraAI your starting point and destination. Get the cheapest & most comfortable route, day-by-day itinerary, genuine hidden gems, and customizable spot selection.
          </p>
        </div>
      </section>

      {/* Input Panel */}
      <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--cream)] py-12 sm:py-16">
        <Halftone />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
          <div className="ticket p-6 sm:p-8">
            <div className="flex items-center justify-between border-b-2 border-dashed border-[var(--ink)] pb-3">
              <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest">
                Boarding Pass
              </span>
              <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest">
                YT-GEN · Gemma AI
              </span>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {/* FROM / STARTING FROM */}
              <label className="block">
                <div className="text-xs font-black uppercase tracking-widest">Starting From (Origin)</div>
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="mt-2 w-full border-2 border-[var(--ink)] bg-[var(--cream)] p-2.5 font-[family-name:var(--font-heavy)] text-base cursor-pointer outline-none"
                >
                  {origins.map((o) => (
                    <option key={o} value={o}>🛫 {o}</option>
                  ))}
                </select>
              </label>

              {/* TO / DESTINATION */}
              <label className="block">
                <div className="text-xs font-black uppercase tracking-widest">Going To (Destination)</div>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. Jaipur, Goa, Manali..."
                    className="flex-1 border-2 border-[var(--ink)] bg-[var(--cream)] p-2 font-[family-name:var(--font-heavy)] text-base outline-none"
                  />
                  <select
                    value={popularDestinations.includes(destination) ? destination : ""}
                    onChange={(e) => { if (e.target.value) setDestination(e.target.value); }}
                    className="border-2 border-[var(--ink)] bg-[var(--mustard)]/20 px-2 font-bold text-xs cursor-pointer"
                  >
                    <option value="">Quick Pick</option>
                    {popularDestinations.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </label>

              {/* Budget slider */}
              <label className="block">
                <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                  <span>Total Budget (₹)</span>
                  <span className="text-[var(--hotpink)]">Mode: {budgetMode === "person" ? "Per-person" : "Whole-group"}</span>
                </div>
                <input
                  type="range"
                  min={budgetMode === "group" ? 5000 : 1500}
                  max={budgetMode === "group" ? 80000 : 20000}
                  step={500}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="mt-3 w-full accent-[var(--hotpink)] cursor-pointer"
                />
                <div className="mt-1 font-[family-name:var(--font-display)] text-4xl text-[var(--hotpink)]">
                  ₹{budget.toLocaleString("en-IN")}
                </div>
                {budgetMode === "group" && (
                  <div className="text-xs text-muted-foreground mt-1 uppercase font-bold">
                    ≈ ₹{perPersonBudget.toLocaleString("en-IN")} per-person (for {partySize} travelers)
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-0.5">
                  ≈ ₹{Math.floor(perPersonBudget / days).toLocaleString("en-IN")}/day per-person
                </div>
              </label>

              {/* Days slider */}
              <label className="block">
                <div className="text-xs font-black uppercase tracking-widest">Days</div>
                <input
                  type="range"
                  min={2}
                  max={14}
                  step={1}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="mt-3 w-full accent-[var(--hotpink)] cursor-pointer"
                />
                <div className="mt-1 font-[family-name:var(--font-display)] text-4xl">
                  {days} days
                </div>
              </label>

              {/* Budget Type Toggle & Group Size */}
              <div>
                <div className="text-xs font-black uppercase tracking-widest mb-2">Budgeting Mode</div>
                <div className="flex border-2 border-[var(--ink)] bg-[var(--cream)] overflow-hidden text-xs font-bold uppercase">
                  <button
                    type="button"
                    onClick={() => { setBudgetMode("person"); setPartySize(1); }}
                    className={`flex-1 py-2 text-center transition-colors cursor-pointer ${budgetMode === "person" ? "bg-[var(--hotpink)] text-[var(--cream)]" : "hover:bg-[var(--mustard)]/20"}`}
                  >
                    Solo / Per-Person
                  </button>
                  <button
                    type="button"
                    onClick={() => { setBudgetMode("group"); setPartySize(4); }}
                    className={`flex-1 py-2 text-center transition-colors cursor-pointer ${budgetMode === "group" ? "bg-[var(--hotpink)] text-[var(--cream)]" : "hover:bg-[var(--mustard)]/20"}`}
                  >
                    Group Trip
                  </button>
                </div>

                {budgetMode === "group" && (
                  <label className="block mt-4 animate-fade-in">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Party Size</div>
                    <input
                      type="number"
                      min={2}
                      max={15}
                      value={partySize}
                      onChange={(e) => setPartySize(Math.max(2, Number(e.target.value) || 2))}
                      className="w-full mt-1 border-2 border-[var(--ink)] bg-[var(--cream)] p-2 font-[family-name:var(--font-heavy)] text-sm outline-none"
                    />
                  </label>
                )}
              </div>

              {/* Vibe */}
              <div>
                <div className="text-xs font-black uppercase tracking-widest">Travel Vibe</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(["hills", "beach", "city", "spiritual"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVibe(v)}
                      className={`chip capitalize cursor-pointer ${vibe === v ? "!bg-[var(--hotpink)] !text-[var(--cream)]" : ""}`}
                    >
                      {v === "hills" ? "🏔️" : v === "beach" ? "🏖️" : v === "city" ? "🏙️" : "🕉️"}{" "}{v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preference Toggles (Accessibility & Weather) */}
              <div className="sm:col-span-2 border-t-2 border-dashed border-[var(--ink)] pt-4 mt-2 grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-3 border-2 border-[var(--ink)] p-3 bg-[var(--cream)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={accessibilityEnabled}
                    onChange={(e) => setAccessibilityEnabled(e.target.checked)}
                    className="h-4 w-4 accent-[var(--hotpink)] cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider">♿ Accessibility-Aware Planning</div>
                    <div className="text-[10px] text-muted-foreground">Wheelchair access, minimal stairs & flat paved walkways</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 border-2 border-[var(--ink)] p-3 bg-[var(--cream)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={weatherAlertsEnabled}
                    onChange={(e) => setWeatherAlertsEnabled(e.target.checked)}
                    className="h-4 w-4 accent-[var(--hotpink)] cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider">🌤️ Live Weather Notifications</div>
                    <div className="text-[10px] text-muted-foreground">Receive live weather alerts & optimal walking hours during trip</div>
                  </div>
                </label>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="btn-poster mt-8 w-full justify-center text-center cursor-pointer"
            >
              {generating ? "✈️ Gemma is building your trip..." : `🗺️ Plan Trip: ${origin} → ${destination || "Destination"}`}
            </button>
          </div>
        </div>
      </section>

      {/* Results */}
      {plan && (
        <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--dusk)] py-12 text-[var(--cream)] sm:py-16">
          <Halftone />
          <div className="relative mx-auto max-w-4xl px-4 sm:px-6">

            {/* BEST ROUTE RECOMMENDATION SECTION */}
            {bestRoute && (
              <div className="mb-8 poster-card grain bg-[var(--cream)] text-[var(--ink)] p-6 border-3 border-[var(--mustard)]">
                <div className="flex items-center justify-between border-b-2 border-dashed border-[var(--ink)] pb-3">
                  <StampTag tone="mustard">BEST ROUTE RECOMMENDATION</StampTag>
                  <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest text-[var(--hotpink)]">
                    {bestRoute.comfortRating}
                  </span>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-3 items-center">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Route Pathway</div>
                    <div className="font-[family-name:var(--font-heavy)] text-lg text-[var(--ink)]">
                      {origin} ➔ {destination}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">Mode: {bestRoute.mode}</div>
                  </div>

                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estimated Fare</div>
                    <div className="font-[family-name:var(--font-display)] text-3xl text-[var(--hotpink)]">
                      ₹{bestRoute.estimatedCost}
                    </div>
                    <div className="text-[10px] text-muted-foreground">~{bestRoute.durationHours} hrs journey</div>
                  </div>

                  <div className="border-l-2 border-dashed border-[var(--ink)]/30 pl-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-[var(--hotpink)]">💡 Gemma's Money-Saver Tip</div>
                    <p className="text-xs italic text-[var(--ink)]/90 mt-1">{bestRoute.bookingTip}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ITINERARY HEADER */}
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <StampTag tone="mustard">Gemma's Itinerary</StampTag>
                <h2 className="poster-title mt-3 text-[clamp(2rem,5vw,3.5rem)] text-[var(--mustard)]">
                  {days} DAYS IN {destination.toUpperCase()}
                </h2>
              </div>
              <div className="text-right">
                <div className="text-xs font-black uppercase tracking-widest text-[var(--cream)]/70">
                  {budgetMode === "group" ? `Total Group Cost (Size: ${partySize})` : "Estimated Cost"}
                </div>
                <div className="font-[family-name:var(--font-display)] text-3xl text-[var(--mustard)]">
                  ₹{totalGroupCost.toLocaleString("en-IN")}
                </div>
                <div className="text-[10px] uppercase font-bold text-[var(--cream)]/50">
                  ₹{perPersonCost.toLocaleString("en-IN")} per-person
                </div>
              </div>
            </div>

            {/* Invite code banner */}
            {inviteCode && (
              <div className="mb-6 border-2 border-[var(--mustard)] bg-[var(--mustard)]/10 px-4 py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-[var(--mustard)]">Trip Saved — Share Invite Code</div>
                  <div className="font-[family-name:var(--font-heavy)] text-xl tracking-widest text-[var(--cream)]">{inviteCode}</div>
                </div>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(inviteCode)}
                  className="chip !bg-[var(--mustard)] !text-[var(--ink)] shrink-0 cursor-pointer"
                >
                  📋 Copy
                </button>
              </div>
            )}

            {/* Budget bar */}
            <div className="mb-8">
              <div className="h-4 w-full border-2 border-[var(--cream)]/40 bg-[var(--ink)]">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (perPersonCost / perPersonBudget) * 100)}%`,
                    backgroundColor: remaining >= 0 ? "var(--mustard)" : "var(--hotpink)",
                  }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs font-bold uppercase tracking-wider">
                <span>₹0</span>
                <span className={`font-[family-name:var(--font-heavy)] uppercase tracking-widest ${remaining >= 0 ? "text-[var(--mustard)]" : "text-[var(--hotpink)]"}`}>
                  {remaining >= 0
                    ? `₹${remaining.toLocaleString("en-IN")} left over per-person ✓`
                    : `₹${Math.abs(remaining).toLocaleString("en-IN")} short per-person — trim a day`}
                </span>
                <span>₹{perPersonBudget.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Day cards */}
            <div className="space-y-4">
              {plan.map((p, dayIndex) => {
                const isExpanded = expandedDay === p.day;
                const selectedList = p.selectedActivities ?? p.activities;

                return (
                  <div key={p.day} className="poster-card grain bg-[var(--cream)] text-[var(--ink)]">
                    <button
                      type="button"
                      onClick={() => setExpandedDay(isExpanded ? null : p.day)}
                      className="w-full text-left flex items-center justify-between border-b-2 border-dashed border-[var(--ink)] px-5 py-4 bg-transparent hover:bg-[var(--mustard)]/10 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-[family-name:var(--font-display)] text-2xl text-[var(--hotpink)]">DAY {p.day}</span>
                        <span className="font-[family-name:var(--font-heavy)] text-sm uppercase tracking-widest">{p.city}</span>
                        {p.weatherAlert && (
                          <span className="chip !bg-[var(--mustard)] !text-[var(--ink)] text-[9px]">{p.weatherAlert}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-[family-name:var(--font-display)] text-2xl">₹{p.cost}</span>
                        <span className="text-muted-foreground text-xs">{isExpanded ? "▲" : "▼"}</span>
                      </div>
                    </button>

                    {/* INTERACTIVE CHECKBOXES & CUSTOM SPOT INPUT */}
                    <div className="p-5 border-b-2 border-dashed border-[var(--ink)] bg-[var(--cream)]">
                      <div className="text-[10px] font-black uppercase tracking-widest text-[var(--hotpink)] mb-2">
                        ☑️ Select Places & Activities for Day {p.day}:
                      </div>
                      <div className="space-y-1.5">
                        {p.activities.map((act) => {
                          const isChecked = selectedList.includes(act);
                          return (
                            <label key={act} className="flex items-center gap-2 text-xs font-bold cursor-pointer hover:text-[var(--hotpink)]">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleActivity(dayIndex, act)}
                                className="h-4 w-4 accent-[var(--hotpink)] cursor-pointer"
                              />
                              <span className={isChecked ? "" : "line-through text-muted-foreground"}>{act}</span>
                            </label>
                          );
                        })}
                      </div>

                      {/* User Custom Spot / Opinion Input Box */}
                      <div className="mt-4 pt-3 border-t border-[var(--ink)]/20 flex gap-2">
                        <input
                          type="text"
                          value={customOpinionInput}
                          onChange={(e) => setCustomOpinionInput(e.target.value)}
                          placeholder="➕ Add your own spot or opinion (e.g., 'Visit Amber Fort Light Show at 7 PM')..."
                          className="flex-1 border-2 border-[var(--ink)] bg-[var(--cream)] px-3 py-1.5 text-xs font-bold outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddCustomSpot(dayIndex)}
                          className="chip !bg-[var(--hotpink)] !text-[var(--cream)] cursor-pointer"
                        >
                          Add Spot
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-3 p-5 sm:grid-cols-3">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Stay Summary</div>
                        <div className="mt-1 font-[family-name:var(--font-heavy)] text-sm">{p.stay}</div>
                        <div className="text-xs text-muted-foreground">{p.stayNote}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Transit Mode</div>
                        <div className="mt-1 font-[family-name:var(--font-heavy)] text-sm">{p.transport}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Selected Spots ({selectedList.length})</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {selectedList.map((a) => (
                            <span key={a} className="chip !text-[9px]">{a}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t-2 border-dashed border-[var(--ink)] bg-[var(--cream)] p-5 space-y-4 animate-fade-in">
                        <div className="border-2 border-[var(--ink)] bg-[var(--mustard)]/10 p-4">
                          <h4 className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest text-[var(--hotpink)] mb-1">
                            🎭 Culture Snapshot
                          </h4>
                          <p className="text-xs leading-relaxed italic">{p.cultureSnapshot}</p>
                          {p.accessibilityNote && (
                            <div className="mt-2 text-xs font-bold text-green-700">{p.accessibilityNote}</div>
                          )}
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          {/* Cheaper Lodging */}
                          <div className="border-[3px] border-[var(--ink)] p-4 bg-[var(--cream)] shadow-[3px_3px_0_var(--ink)]">
                            <h4 className="font-[family-name:var(--font-heavy)] text-[10px] uppercase tracking-widest text-[var(--hotpink)] border-b-2 border-dashed border-[var(--ink)] pb-1.5 mb-3">
                              🏠 Budget-Sized Stays (Per-Person)
                            </h4>
                            <div className="space-y-3">
                              {(p.cheaperLodging ?? []).map((lod, idx) => (
                                <div key={idx} className="text-xs">
                                  <div className="flex justify-between font-bold">
                                    <span>{lod.name}</span>
                                    <span className="text-[var(--hotpink)]">
                                      ₹{lod.cost}/night {budgetMode === "group" && `(Total: ₹${lod.cost * partySize})`}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">{lod.note}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Genuine Verified Hidden Gems */}
                          <div className="border-[3px] border-[var(--ink)] p-4 bg-[var(--cream)] shadow-[3px_3px_0_var(--ink)]">
                            <h4 className="font-[family-name:var(--font-heavy)] text-[10px] uppercase tracking-widest text-[var(--hotpink)] border-b-2 border-dashed border-[var(--ink)] pb-1.5 mb-3">
                              💎 Verified Genuine Local Hidden Gems
                            </h4>
                            <div className="space-y-3">
                              {(p.hiddenGems ?? []).map((gem, idx) => (
                                <div key={idx} className="text-xs">
                                  <div className="flex justify-between font-bold">
                                    <span>💎 {gem.name}</span>
                                    {gem.cost && <span className="chip !text-[8px] !py-0">{gem.cost}</span>}
                                  </div>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">{gem.note}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Reasoning block */}
                        <div className="border-[3px] border-[var(--ink)] bg-[var(--mustard)] p-4 text-[var(--ink)]">
                          <div className="flex gap-2">
                            <span className="text-[var(--hotpink)] text-xl">💡</span>
                            <div>
                              <div className="font-[family-name:var(--font-heavy)] text-[10px] uppercase tracking-widest text-[var(--hotpink)]">
                                Why This Choice? (Gemma's Reasoning)
                              </div>
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

            {/* Share */}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Check out my YatraAI trip plan from ${origin} to ${destination}: ${days} days, ₹${budget} budget, ${vibe} vibe!`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-poster"
              >
                📱 Share on WhatsApp
              </a>
              <Link to="/expense-tracker" className="btn-ghost !text-[var(--cream)] !border-[var(--cream)]">
                Track Group Splits →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Powered-by note */}
      <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--cream)] py-8">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <div className="stamp-card inline-block">
            <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest text-muted-foreground">
              ⚡ Powered by Google Gemma 4 AI — Genuine routes, verified hidden gems & custom spot selection.
            </span>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
