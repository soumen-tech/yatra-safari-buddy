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

/* ────── types ────── */

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

/* ────── page ────── */

function TripGeneratorPage() {
  const [budget, setBudget] = useState(4500);
  const [days, setDays] = useState(5);
  const [origin, setOrigin] = useState("Delhi");
  const [vibe, setVibe] = useState("city");
  const [budgetMode, setBudgetMode] = useState<"person" | "group">("person");
  const [partySize, setPartySize] = useState(1);

  const [plan, setPlan] = useState<DayPlan[] | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [savedTripId, setSavedTripId] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  const origins = ["Delhi", "Mumbai", "Kolkata", "Bangalore", "Chennai", "Hyderabad"];
  const perPersonBudget = budgetMode === "group" ? Math.floor(budget / (partySize || 1)) : budget;

  const handleGenerate = async () => {
    setGenerating(true);
    setPlan(null);
    setExpandedDay(null);
    setAiError("");

    try {
      const res = await fetch("/api/gemma/trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budget,
          days,
          origin,
          vibe,
          budget_mode: budgetMode,
          party_size: partySize,
        }),
      });

      const data = (await res.json()) as DayPlan[] | { error?: string; fallback?: boolean };

      if (!res.ok || ("error" in data && data.error)) {
        const errMsg = "error" in data ? (data.error ?? "AI unavailable") : "AI unavailable";
        setAiError(errMsg);
        setGenerating(false);
        return;
      }

      setPlan(data as DayPlan[]);

      // Also save trip to DB (fire-and-forget — don't block UI on this)
      fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budget, days, origin, vibe, budget_mode: budgetMode, party_size: partySize }),
      })
        .then((r) => r.json())
        .then((t: { trip_id?: string; invite_code?: string }) => {
          if (t.trip_id) setSavedTripId(t.trip_id);
          if (t.invite_code) setInviteCode(t.invite_code);
        })
        .catch(() => {/* non-critical */});
    } catch {
      setAiError("Could not connect to AI service. Please check your connection and try again.");
    } finally {
      setGenerating(false);
    }
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
                YT-GEN · Gemma AI
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
                <div className="text-xs font-black uppercase tracking-widest">Days</div>
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
                <div className="text-xs font-black uppercase tracking-widest mb-2">Budgeting Mode</div>
                <div className="flex border-2 border-[var(--ink)] bg-[var(--cream)] overflow-hidden text-xs font-bold uppercase">
                  <button
                    type="button"
                    onClick={() => { setBudgetMode("person"); setPartySize(1); }}
                    className={`flex-1 py-2 text-center transition-colors ${budgetMode === "person" ? "bg-[var(--hotpink)] text-[var(--cream)]" : "hover:bg-[var(--mustard)]/20"}`}
                  >
                    Solo / Per-Person
                  </button>
                  <button
                    type="button"
                    onClick={() => { setBudgetMode("group"); setPartySize(4); }}
                    className={`flex-1 py-2 text-center transition-colors ${budgetMode === "group" ? "bg-[var(--hotpink)] text-[var(--cream)]" : "hover:bg-[var(--mustard)]/20"}`}
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
                <div className="text-xs font-black uppercase tracking-widest">Starting From</div>
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="mt-2 w-full border-2 border-[var(--ink)] bg-[var(--cream)] p-2 font-[family-name:var(--font-heavy)] text-lg"
                >
                  {origins.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </label>

              {/* Vibe */}
              <div className="sm:col-span-2">
                <div className="text-xs font-black uppercase tracking-widest">Vibe</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(["hills", "beach", "city", "spiritual"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setVibe(v)}
                      className={`chip capitalize cursor-pointer ${vibe === v ? "!bg-[var(--hotpink)] !text-[var(--cream)]" : ""}`}
                    >
                      {v === "hills" ? "🏔️" : v === "beach" ? "🏖️" : v === "city" ? "🏙️" : "🕉️"}{" "}{v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {aiError && (
              <div className="mt-4 border-2 border-[var(--ink)] bg-[var(--hotpink)] text-[var(--cream)] px-4 py-3 text-xs font-bold uppercase tracking-widest">
                ⚠️ {aiError}
                <div className="mt-1 text-[10px] font-normal normal-case">
                  Make sure GOOGLE_API_KEY is set in .env.local and the dev server is running.
                </div>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="btn-poster mt-8 w-full justify-center text-center"
            >
              {generating ? "✈️ Gemma is building your trip..." : "🗺️ Generate Itinerary with Gemma"}
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
                <StampTag tone="mustard">Gemma's Itinerary</StampTag>
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

            {/* Invite code banner if trip was saved */}
            {inviteCode && (
              <div className="mb-6 border-2 border-[var(--mustard)] bg-[var(--mustard)]/10 px-4 py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-[var(--mustard)]">Trip Saved — Share Invite Code</div>
                  <div className="font-[family-name:var(--font-heavy)] text-xl tracking-widest text-[var(--cream)]">{inviteCode}</div>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(inviteCode)}
                  className="chip !bg-[var(--mustard)] !text-[var(--ink)] shrink-0"
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
              {plan.map((p) => {
                const isExpanded = expandedDay === p.day;
                return (
                  <div key={p.day} className="poster-card grain bg-[var(--cream)] text-[var(--ink)]">
                    <button
                      onClick={() => setExpandedDay(isExpanded ? null : p.day)}
                      className="w-full text-left flex items-center justify-between border-b-2 border-dashed border-[var(--ink)] px-5 py-4 bg-transparent hover:bg-[var(--mustard)]/10 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-[family-name:var(--font-display)] text-2xl text-[var(--hotpink)]">DAY {p.day}</span>
                        <span className="font-[family-name:var(--font-heavy)] text-sm uppercase tracking-widest">{p.city}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-[family-name:var(--font-display)] text-2xl">₹{p.cost}</span>
                        <span className="text-muted-foreground text-xs">{isExpanded ? "▲" : "▼"}</span>
                      </div>
                    </button>

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
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Spots Selected</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {p.activities.map((a) => (
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

                          {/* Hidden Gems */}
                          <div className="border-[3px] border-[var(--ink)] p-4 bg-[var(--cream)] shadow-[3px_3px_0_var(--ink)]">
                            <h4 className="font-[family-name:var(--font-heavy)] text-[10px] uppercase tracking-widest text-[var(--hotpink)] border-b-2 border-dashed border-[var(--ink)] pb-1.5 mb-3">
                              💎 Gemma's Hidden Gems Sized to Budget
                            </h4>
                            <div className="space-y-3">
                              {(p.hiddenGems ?? []).map((gem, idx) => (
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

      {/* Powered-by note */}
      <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--cream)] py-8">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <div className="stamp-card inline-block">
            <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest text-muted-foreground">
              ⚡ Powered by Google Gemma 4 AI — Real AI reasoning, not a lookup table. Results saved to Supabase for group sharing.
            </span>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
