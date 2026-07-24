import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell, Halftone, StampTag } from "@/components/yatra";
import { cities } from "@/data/city-data";

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
    const cityData = cities.find((c) => c.slug === citySlug);
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

    if (perDay < 500) {
      stayCost = 200;
      stayDesc = "Dharamshala / temple stay";
      stayNote = "Free or donation-based. Safe, clean, 10pm curfew.";
      transportCost = 50;
      transportDesc = "Walking + shared auto";
      foodCost = 100;
      reasoning = `At ₹${perDay}/day, skip commercial hostels. Temple dharamshalas in ${cityName.toLowerCase()} are free (₹50 donation appreciated). Walk to nearby spots, take shared autos for longer distances. Eat at station stalls — filling thali for ₹60.`;
    } else if (perDay < 900) {
      stayCost = 350;
      stayDesc = "Budget hostel dorm";
      stayNote = "6-bed mixed dorm, lockers, common kitchen.";
      transportCost = 100;
      transportDesc = isTravel ? "Sleeper bus/train" : "Local bus + auto";
      foodCost = 150;
      reasoning = `₹${perDay}/day unlocks hostels with clean dorms. ${isTravel ? `Take the overnight sleeper to ${cityName.toLowerCase()} — saves a night's stay and you wake up there.` : `Today's budget covers a proper thali lunch (₹80) and street food dinner (₹70).`} ${hidden[0] ? `Don't miss ${hidden[0].name} — ${hidden[0].note}` : ""}`;
    } else {
      stayCost = 500;
      stayDesc = "Guesthouse / homestay";
      stayNote = "Private room, attached bath, roof access.";
      transportCost = 150;
      transportDesc = isTravel ? "AC bus / 3AC train" : "Day pass auto";
      foodCost = 200;
      reasoning = `Good budget! A homestay in ${cityName.toLowerCase()} gives you local breakfast included. ${popular[0] ? `Start with ${popular[0].name} early morning (${popular[0].cost ?? "free"}).` : ""} ${hidden[0] ? `Then hit ${hidden[0].name} — the tourist guides won't tell you about this one.` : ""}`;
    }

    const activityList: string[] = [];
    if (popular[i % popular.length]) activityList.push(popular[i % popular.length].name);
    if (hidden[i % hidden.length]) activityList.push(hidden[i % hidden.length].name);
    if (activityList.length === 0) activityList.push(`Explore ${cityName.toLowerCase()}`);

    const totalCost = stayCost + transportCost + foodCost;

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
  const [plan, setPlan] = useState<DayPlan[] | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);

  const origins = ["Delhi", "Mumbai", "Kolkata", "Bangalore", "Chennai", "Hyderabad"];

  const handleGenerate = () => {
    setGenerating(true);
    setPlan(null);
    setTimeout(() => {
      setPlan(generateItinerary(budget, days, origin, vibe));
      setGenerating(false);
    }, 1200);
  };

  const totalSpent = plan?.reduce((a, b) => a + b.cost, 0) ?? 0;
  const remaining = budget - totalSpent;

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
            the other way round. Every choice comes with a reason — so you know
            exactly why you're skipping the hotel and taking the night bus.
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
                <div className="text-xs font-black uppercase tracking-widest">
                  Total Budget (₹)
                </div>
                <input
                  type="range"
                  min={1500}
                  max={20000}
                  step={500}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="mt-3 w-full accent-[var(--hotpink)]"
                />
                <div className="mt-1 font-[family-name:var(--font-display)] text-4xl text-[var(--hotpink)]">
                  ₹{budget.toLocaleString("en-IN")}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  ≈ ₹{Math.floor(budget / days).toLocaleString("en-IN")}/day
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
              <div>
                <div className="text-xs font-black uppercase tracking-widest">
                  Vibe
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(["hills", "beach", "city", "spiritual"] as const).map(
                    (v) => (
                      <button
                        key={v}
                        onClick={() => setVibe(v)}
                        className={`chip capitalize ${
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
              {generating ? "✈️ Building your trip…" : "🗺️ Generate Itinerary"}
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
                <h2 className="poster-title mt-3 text-[clamp(2rem,5vw,3.5rem)]">
                  {days} DAYS. ₹{budget.toLocaleString("en-IN")}.
                </h2>
              </div>
              <div className="text-right">
                <div className="text-xs font-black uppercase tracking-widest text-[var(--cream)]/70">
                  Total estimated
                </div>
                <div className="font-[family-name:var(--font-display)] text-3xl text-[var(--mustard)]">
                  ₹{totalSpent.toLocaleString("en-IN")}
                </div>
              </div>
            </div>

            {/* Budget bar */}
            <div className="mb-8">
              <div className="h-4 w-full border-2 border-[var(--cream)]/40 bg-[var(--ink)]">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (totalSpent / budget) * 100)}%`,
                    backgroundColor:
                      remaining >= 0
                        ? "var(--mustard)"
                        : "var(--hotpink)",
                  }}
                />
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span>₹0</span>
                <span
                  className={`font-[family-name:var(--font-heavy)] uppercase tracking-widest ${remaining >= 0 ? "text-[var(--mustard)]" : "text-[var(--hotpink)]"}`}
                >
                  {remaining >= 0
                    ? `₹${remaining.toLocaleString("en-IN")} left over ✓`
                    : `₹${Math.abs(remaining).toLocaleString("en-IN")} over — trim a day or tighten the vibe`}
                </span>
                <span>₹{budget.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Day cards */}
            <div className="space-y-4">
              {plan.map((p) => (
                <div key={p.day} className="poster-card grain bg-[var(--cream)] text-[var(--ink)]">
                  <div className="flex items-center justify-between border-b-2 border-dashed border-[var(--ink)] px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="font-[family-name:var(--font-display)] text-2xl text-[var(--hotpink)]">
                        DAY {p.day}
                      </span>
                      <span className="font-[family-name:var(--font-heavy)] text-sm uppercase tracking-widest">
                        {p.city}
                      </span>
                    </div>
                    <span className="font-[family-name:var(--font-display)] text-2xl">
                      ₹{p.cost}
                    </span>
                  </div>

                  <div className="grid gap-3 p-5 sm:grid-cols-3">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Stay
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
                        Transport
                      </div>
                      <div className="mt-1 font-[family-name:var(--font-heavy)] text-sm">
                        {p.transport}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        See
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

                  {/* Reasoning toggle */}
                  <div className="border-t-2 border-dashed border-[var(--ink)]">
                    <button
                      onClick={() =>
                        setExpandedDay(
                          expandedDay === p.day ? null : p.day,
                        )
                      }
                      className="flex w-full items-center justify-between px-5 py-3 text-left text-xs font-black uppercase tracking-widest text-[var(--hotpink)] hover:bg-[var(--mustard)]/20"
                    >
                      <span>
                        {expandedDay === p.day
                          ? "Hide reasoning"
                          : "Why this choice?"}
                      </span>
                      <span>{expandedDay === p.day ? "▲" : "▼"}</span>
                    </button>
                    {expandedDay === p.day && (
                      <div className="bg-[var(--mustard)]/10 px-5 py-4 text-sm leading-relaxed">
                        <div className="flex gap-2">
                          <span className="text-[var(--hotpink)]">💡</span>
                          <p>{p.reasoning}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Share */}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`My YatraAI trip plan: ${days} days, ₹${budget} budget, ${vibe} vibe! Check it out at yatraai.in`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-poster"
              >
                📱 Share on WhatsApp
              </a>
              <Link to="/expense-tracker" className="btn-ghost !text-[var(--cream)] !border-[var(--cream)]">
                Track Expenses →
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
              🧪 Demo only — mocked itinerary engine. Real version uses Gemma to reason about
              live train/bus prices, hostel availability, and weather patterns.
            </span>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
