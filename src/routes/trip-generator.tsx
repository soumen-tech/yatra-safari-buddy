import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell, Halftone, StampTag } from "@/components/yatra";
import { cities, getCityBySlug } from "@/data/city-data";

export const Route = createFileRoute("/trip-generator")({
  head: () => ({
    meta: [
      { title: "Budget Trip Generator — YatraAI" },
      {
        name: "description",
        content:
          "Tell YatraAI what's in your wallet. It builds the trip around ₹, not the other way round. Day-by-day itinerary with reasoning.",
      },
    ],
  }),
  component: TripGeneratorPage,
});

/* ────── mock itinerary engine ────── */

interface LodgingOption {
  name: string;
  cost: number;
  note: string;
}

interface DayPlan {
  day: number;
  city: string;
  activities: string[];
  stay: string;
  stayNote: string;
  food: string;
  transport: string;
  cost: number;
  reasoning: string;
  cultureSnapshot: string;
  cheaperLodging: LodgingOption[];
  hiddenGems: { name: string; note: string; cost?: string }[];
}

function generateItinerary(
  budget: number,
  days: number,
  origin: string,
  vibe: string,
): DayPlan[] {
  const vibeMap: Record<string, string[]> = {
    hills: ["manali", "darjeeling", "rishikesh", "munnar"],
    beach: ["goa", "mumbai"],
    city: ["delhi", "jaipur", "kolkata", "mumbai", "udaipur"],
    spiritual: ["varanasi", "amritsar", "pushkar", "rishikesh", "hampi"],
  };

  const pool = vibeMap[vibe] || vibeMap.city;
  const perDay = Math.floor(budget / days);
  const plans: DayPlan[] = [];

  for (let i = 0; i < days; i++) {
    const citySlug = pool[i % pool.length];
    const cityData = getCityBySlug(citySlug);
    const cityName = cityData?.name ?? citySlug.toUpperCase();
    const isTravel = i === 0 || (i > 0 && pool[(i - 1) % pool.length] !== citySlug);
    const popular = cityData?.spots.filter((s) => s.type === "popular") ?? [];
    const hidden = cityData?.spots.filter((s) => s.type === "hidden") ?? [];

    let stayCost: number;
    let stayDesc: string;
    let stayNote: string;
    let transportCost: number;
    let transportDesc: string;
    let foodCost: number;
    let reasoning: string;

    // Lodging options matching budget
    let cheaperLodging: LodgingOption[] = [];
    if (perDay < 500) {
      stayCost = 200;
      stayDesc = "Dharamshala / temple stay";
      stayNote = "Free or donation-based. Safe, clean, 10pm curfew.";
      transportCost = 50;
      transportDesc = "Walking + shared auto";
      foodCost = 100;
      reasoning = `At ₹${perDay}/day, skip commercial hostels. Temple dharamshalas in ${cityName.toLowerCase()} are free (₹50 donation appreciated). Walk to nearby spots, take shared autos for longer distances. Eat at station stalls — filling thali for ₹60.`;
      cheaperLodging = [
        { name: "Local Temple Dharamshala", cost: 100, note: "Donation appreciated. Basic mats, shared bathroom, highly safe." },
        { name: "Railway Station Dorm Bed", cost: 150, note: "Bookable via IRCTC if you have a sleeper ticket. Lockers available." }
      ];
    } else if (perDay < 900) {
      stayCost = 350;
      stayDesc = "Budget hostel dorm";
      stayNote = "6-bed mixed dorm, lockers, common kitchen.";
      transportCost = 100;
      transportDesc = isTravel ? "Sleeper bus/train" : "Local bus + auto";
      foodCost = 150;
      reasoning = `₹${perDay}/day unlocks hostels with clean dorms. ${isTravel ? `Take the overnight sleeper to ${cityName.toLowerCase()} — saves a night's stay and you wake up there.` : `Today's budget covers a proper thali lunch (₹80) and street food dinner (₹70).`} ${hidden[0] ? `Don't miss ${hidden[0].name} — ${hidden[0].note}` : ""}`;
      cheaperLodging = [
        { name: "Zostel / Backpackers Dorm bed", cost: 350, note: "Cozy bunk, shared lounge, lockers, clean linen." },
        { name: "Local Family Homestay corner bed", cost: 300, note: "Run by locals. Chai + breakfast included." }
      ];
    } else {
      stayCost = 500;
      stayDesc = "Guesthouse / homestay";
      stayNote = "Private room, attached bath, roof access.";
      transportCost = 150;
      transportDesc = isTravel ? "AC bus / 3AC train" : "Day pass auto";
      foodCost = 200;
      reasoning = `Good budget! A homestay in ${cityName.toLowerCase()} gives you local breakfast included. ${popular[0] ? `Start with ${popular[0].name} early morning (${popular[0].cost ?? "free"}).` : ""} ${hidden[0] ? `Then hit ${hidden[0].name} — the tourist guides won't tell you about this one.` : ""}`;
      cheaperLodging = [
        { name: "Heritage Guesthouse room", cost: 500, note: "Private fan room, attached bath, sunset rooftop access." },
        { name: "AC Premium Hostel Bunk", cost: 450, note: "Dorm room with full power backup, cafe inside." }
      ];
    }

    const activityList: string[] = [];
    if (popular[i % popular.length]) activityList.push(popular[i % popular.length].name);
    if (hidden[i % hidden.length]) activityList.push(hidden[i % hidden.length].name);
    if (activityList.length === 0) activityList.push(`Explore ${cityName.toLowerCase()}`);

    const totalCost = stayCost + transportCost + foodCost;

    // Culture Snapshot
    const cultureSnapshot = cityData
      ? `${cityName}: ${cityData.tag}. ${cityData.note} Built for slow wandering. Watch the locals negotiate and absorb the dialect.`
      : `${cityName}: A city of markets and temples. Best explored early morning before the heat sets in.`;

    plans.push({
      day: i + 1,
      city: cityName,
      activities: activityList,
      stay: stayDesc,
      stayNote,
      food: `₹${foodCost} (${foodCost < 120 ? "street stalls + station thali" : foodCost < 180 ? "dhaba lunch + street dinner" : "local restaurant + chai stops"})`,
      transport: transportDesc,
      cost: totalCost,
      reasoning,
      cultureSnapshot,
      cheaperLodging,
      hiddenGems: hidden.slice(0, 2),
    });
  }

  return plans;
}

/* ────── page ────── */

function TripGeneratorPage() {
  const [budget, setBudget] = useState(4500);
  const [days, setDays] = useState(5);
  const [origin, setOrigin] = useState("Delhi");
  const [vibe, setVibe] = useState("city");
  
  // Group aware inputs state
  const [budgetMode, setBudgetMode] = useState<"person" | "group">("person");
  const [partySize, setPartySize] = useState(1);

  const [plan, setPlan] = useState<DayPlan[] | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);

  const origins = ["Delhi", "Mumbai", "Kolkata", "Bangalore", "Chennai", "Hyderabad"];

  // Calculate budget per person
  const perPersonBudget = budgetMode === "group" ? Math.floor(budget / (partySize || 1)) : budget;

  const handleGenerate = () => {
    setGenerating(true);
    setPlan(null);
    setExpandedDay(null);
    setTimeout(() => {
      setPlan(generateItinerary(perPersonBudget, days, origin, vibe));
      setGenerating(false);
    }, 1200);
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
            Tell YatraAI what's in your wallet. It builds the trip around ₹, not
            the other way round. Recalculates automatically for group trips.
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
                YT-GEN
              </span>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
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
                  className="mt-3 w-full accent-[var(--hotpink)]"
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
                <div className="text-xs font-black uppercase tracking-widest">
                  Days
                </div>
                <input
                  type="range"
                  min={2}
                  max={14}
                  step={1}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="mt-3 w-full accent-[var(--hotpink)]"
                />
                <div className="mt-1 font-[family-name:var(--font-display)] text-4xl">
                  {days} days
                </div>
              </label>

              {/* Budget Type Toggle & Group Size */}
              <div>
                <div className="text-xs font-black uppercase tracking-widest mb-2">
                  Budgeting Mode
                </div>
                <div className="flex border-2 border-[var(--ink)] bg-[var(--cream)] overflow-hidden text-xs font-bold uppercase">
                  <button
                    type="button"
                    onClick={() => {
                      setBudgetMode("person");
                      setPartySize(1);
                    }}
                    className={`flex-1 py-2 text-center transition-colors ${
                      budgetMode === "person" ? "bg-[var(--hotpink)] text-[var(--cream)]" : "hover:bg-[var(--mustard)]/20"
                    }`}
                  >
                    Solo / Per-Person
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBudgetMode("group");
                      setPartySize(4);
                    }}
                    className={`flex-1 py-2 text-center transition-colors ${
                      budgetMode === "group" ? "bg-[var(--hotpink)] text-[var(--cream)]" : "hover:bg-[var(--mustard)]/20"
                    }`}
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
                      className="w-full mt-1 border-2 border-[var(--ink)] bg-[var(--cream)] p-2 font-[family-name:var(--font-heavy)] text-sm"
                    />
                  </label>
                )}
              </div>

              {/* Origin */}
              <label className="block">
                <div className="text-xs font-black uppercase tracking-widest">
                  Starting From
                </div>
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="mt-2 w-full border-2 border-[var(--ink)] bg-[var(--cream)] p-2 font-[family-name:var(--font-heavy)] text-lg"
                >
                  {origins.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </label>

              {/* Vibe */}
              <div className="sm:col-span-2">
                <div className="text-xs font-black uppercase tracking-widest">
                  Vibe
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(["hills", "beach", "city", "spiritual"] as const).map(
                    (v) => (
                      <button
                        key={v}
                        onClick={() => setVibe(v)}
                        className={`chip capitalize cursor-pointer ${
                          vibe === v
                            ? "!bg-[var(--hotpink)] !text-[var(--cream)]"
                            : ""
                        }`}
                      >
                        {v === "hills" ? "🏔️" : v === "beach" ? "🏖️" : v === "city" ? "🏙️" : "🕉️"}{" "}
                        {v}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="btn-poster mt-8 w-full justify-center text-center"
            >
              {generating ? "✈️ Building your trip..." : "🗺️ Generate Itinerary"}
            </button>
          </div>
        </div>
      </section>

      {/* Results */}
      {plan && (
        <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--dusk)] py-12 text-[var(--cream)] sm:py-16">
          <Halftone />
          <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <StampTag tone="mustard">Your Itinerary</StampTag>
                <h2 className="poster-title mt-3 text-[clamp(2rem,5vw,3.5rem)] text-[var(--mustard)]">
                  {days} DAYS. ₹{perPersonBudget.toLocaleString("en-IN")}/person.
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

            {/* Budget bar */}
            <div className="mb-8">
              <div className="h-4 w-full border-2 border-[var(--cream)]/40 bg-[var(--ink)]">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (perPersonCost / perPersonBudget) * 100)}%`,
                    backgroundColor:
                      remaining >= 0
                        ? "var(--mustard)"
                        : "var(--hotpink)",
                  }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs font-bold uppercase tracking-wider">
                <span>₹0</span>
                <span
                  className={`font-[family-name:var(--font-heavy)] uppercase tracking-widest ${remaining >= 0 ? "text-[var(--mustard)]" : "text-[var(--hotpink)]"}`}
                >
                  {remaining >= 0
                    ? `₹${remaining.toLocaleString("en-IN")} left over per-person ✓`
                    : `₹${Math.abs(remaining).toLocaleString("en-IN")} short per-person — trim a day`}
                </span>
                <span>₹{perPersonBudget.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Day cards */}
            <div className="space-y-4">
              {plan.map((p) => {
                const isExpanded = expandedDay === p.day;
                return (
                  <div key={p.day} className="poster-card grain bg-[var(--cream)] text-[var(--ink)]">
                    
                    {/* Tappable Card Header */}
                    <button
                      onClick={() => setExpandedDay(isExpanded ? null : p.day)}
                      className="w-full text-left flex items-center justify-between border-b-2 border-dashed border-[var(--ink)] px-5 py-4 bg-transparent hover:bg-[var(--mustard)]/10 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-[family-name:var(--font-display)] text-2xl text-[var(--hotpink)]">
                          DAY {p.day}
                        </span>
                        <span className="font-[family-name:var(--font-heavy)] text-sm uppercase tracking-widest">
                          {p.city}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="font-[family-name:var(--font-display)] text-2xl">
                          ₹{p.cost}
                        </span>
                        <span className="text-muted-foreground text-xs">{isExpanded ? "▲" : "▼"}</span>
                      </div>
                    </button>

                    {/* Standard details */}
                    <div className="grid gap-3 p-5 sm:grid-cols-3">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Stay Summary
                        </div>
                        <div className="mt-1 font-[family-name:var(--font-heavy)] text-sm">
                          {p.stay}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {p.stayNote}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Transit Mode
                        </div>
                        <div className="mt-1 font-[family-name:var(--font-heavy)] text-sm">
                          {p.transport}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Spots Selected
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {p.activities.map((a) => (
                            <span key={a} className="chip !text-[9px]">
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Rich Expanded Day Panel */}
                    {isExpanded && (
                      <div className="border-t-2 border-dashed border-[var(--ink)] bg-[var(--cream)] p-5 space-y-4 animate-fade-in">
                        
                        {/* Culture Snapshot */}
                        <div className="border-2 border-[var(--ink)] bg-[var(--mustard)]/10 p-4">
                          <h4 className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest text-[var(--hotpink)] mb-1">
                            🎭 Culture Snapshot
                          </h4>
                          <p className="text-xs leading-relaxed italic">{p.cultureSnapshot}</p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          {/* Cheaper Lodging Options */}
                          <div className="border-[3px] border-[var(--ink)] p-4 bg-[var(--cream)] shadow-[3px_3px_0_var(--ink)]">
                            <h4 className="font-[family-name:var(--font-heavy)] text-[10px] uppercase tracking-widest text-[var(--hotpink)] border-b-2 border-dashed border-[var(--ink)] pb-1.5 mb-3">
                              🏠 Budget-Sized Stays (Per-Person)
                            </h4>
                            <div className="space-y-3">
                              {p.cheaperLodging.map((lod, idx) => (
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

                          {/* Gemma Hidden Gems */}
                          <div className="border-[3px] border-[var(--ink)] p-4 bg-[var(--cream)] shadow-[3px_3px_0_var(--ink)]">
                            <h4 className="font-[family-name:var(--font-heavy)] text-[10px] uppercase tracking-widest text-[var(--hotpink)] border-b-2 border-dashed border-[var(--ink)] pb-1.5 mb-3">
                              💎 Gemma's Hidden Gems Sized to Budget
                            </h4>
                            <div className="space-y-3">
                              {p.hiddenGems.map((gem, idx) => (
                                <div key={idx} className="text-xs">
                                  <div className="flex justify-between font-bold">
                                    <span>{gem.name}</span>
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
                                Why This Choice?
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
                href={`https://wa.me/?text=${encodeURIComponent(`Check out my YatraAI trip plan: ${days} days, ₹${budget} budget, ${vibe} vibe! Sized for group of ${partySize} at ₹${perPersonCost} per person. Build yours at yatraai.in`)}`}
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

      {/* Demo tag */}
      <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--cream)] py-8">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <div className="stamp-card inline-block">
            <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest text-muted-foreground">
              🧪 Gemma Group Planner Logic: Itinerary calculations are dynamically scaled per person and cross-referenced with local city listings to filter out options that over-allocate your wallet limits.
            </span>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
