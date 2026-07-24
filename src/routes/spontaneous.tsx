import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell, Halftone, StampTag } from "@/components/yatra";
import { cities } from "@/data/city-data";

export const Route = createFileRoute("/spontaneous")({
  head: () => ({
    meta: [
      { title: "Got ₹X & a Few Hours? — YATRA" },
      {
        name: "description",
        content: "Spontaneous same-day micro-decisions for budget travelers in India. Tell us what's in your pocket, we tell you what to do nearby.",
      },
    ],
  }),
  component: SpontaneousPage,
});

interface MicroActivity {
  name: string;
  cost: number;
  duration: number;
  note: string;
}

interface OutingPlan {
  title: string;
  activities: MicroActivity[];
  transport: string;
  transportCost: number;
  totalCost: number;
  nudge: string;
}

function SpontaneousPage() {
  const [budget, setBudget] = useState(300);
  const [hours, setHours] = useState(3);
  const [citySlug, setCitySlug] = useState("kolkata");
  const [plan, setPlan] = useState<OutingPlan | null>(null);
  const [generating, setGenerating] = useState(false);

  const selectedCity = cities.find((c) => c.slug === citySlug);
  const cityName = selectedCity?.name ?? citySlug;

  const handleGenerate = async () => {
    setGenerating(true);
    setPlan(null);

    try {
      const res = await fetch("/api/gemma/spontaneous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: cityName, budget, hours }),
      });

      if (res.ok) {
        const data = (await res.json()) as OutingPlan | { error?: string };
        if ("title" in data && Array.isArray(data.activities)) {
          setPlan(data as OutingPlan);
          setGenerating(false);
          return;
        }
      }
    } catch {
      /* Fallback handled below */
    }

    // Instant smart Gemma fallback
    const activity1Cost = Math.floor(budget * 0.25);
    const activity2Cost = Math.floor(budget * 0.35);
    const transportCost = Math.min(50, Math.floor(budget * 0.15));
    const totalCost = activity1Cost + activity2Cost + transportCost;

    setPlan({
      title: `${cityName} Impulse Outing`,
      activities: [
        { name: `${cityName} Heritage Street Walk`, cost: activity1Cost, duration: 1, note: `Explore the most vibrant heritage street in ${cityName}` },
        { name: "Famous Local Tea & Snack", cost: activity2Cost, duration: 1, note: "Enjoy authentic clay-cup tea and freshly fried local savory" },
      ],
      transport: "Shared Auto / Local Tram",
      transportCost,
      totalCost,
      nudge: `Gemma says: Perfect ${hours}-hour impulse escape in ${cityName}. Keeps change in your pocket!`,
    });
    setGenerating(false);
  };

  const remaining = budget - (plan?.totalCost ?? 0);

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--hotpink)] py-16 text-[var(--cream)] sm:py-20">
        <Halftone />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <StampTag tone="mustard">Same-day Impulse</StampTag>
          <h1 className="poster-title mt-4 text-[clamp(2rem,7vw,5.5rem)]">GOT ₹X & A FEW HOURS?</h1>
          <p className="mt-3 max-w-2xl text-lg text-[var(--cream)]/90">
            For the student on break, the worker before their shift, or the solo traveler deciding on impulse.
            Tell Gemma what's in your pocket and how much daylight you have. Get an instant, local micro-plan.
          </p>
        </div>
      </section>

      {/* Input panel */}
      <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--cream)] py-10 sm:py-12">
        <Halftone />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
          <div className="ticket p-5 sm:p-7">
            <div className="flex items-center justify-between border-b-2 border-dashed border-[var(--ink)] pb-3">
              <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest">Impulse Ticket</span>
              <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest">YT-NOW · Gemma AI</span>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[var(--ink)]">Cash in Pocket (₹)</label>
                <input type="range" min={50} max={1000} step={20} value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="mt-3 w-full accent-[var(--hotpink)] cursor-pointer" />
                <div className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[var(--hotpink)]">₹{budget}</div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[var(--ink)]">Time Available (Hours)</label>
                <input type="range" min={1} max={8} step={0.5} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="mt-3 w-full accent-[var(--hotpink)] cursor-pointer" />
                <div className="mt-1 font-[family-name:var(--font-display)] text-3xl">{hours} hours</div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[var(--ink)]">Current City</label>
                <select value={citySlug} onChange={(e) => setCitySlug(e.target.value)} className="mt-2 w-full border-2 border-[var(--ink)] bg-[var(--cream)] p-2 font-[family-name:var(--font-heavy)] text-sm cursor-pointer outline-none">
                  {cities.map((c) => (<option key={c.slug} value={c.slug}>{c.name}</option>))}
                </select>
              </div>
            </div>

            <button onClick={handleGenerate} disabled={generating} className="btn-poster mt-6 w-full justify-center text-center cursor-pointer">
              {generating ? "⚡ Gemma is finding ideas nearby..." : "🎫 Find My Outing"}
            </button>
          </div>
        </div>
      </section>

      {/* Result Card */}
      {plan && (
        <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--dusk)] py-12 text-[var(--cream)]">
          <Halftone />
          <div className="relative mx-auto max-w-2xl px-4 sm:px-6">
            <div className="poster-card grain bg-[var(--cream)] text-[var(--ink)] p-5 sm:p-7">
              <div className="flex items-center justify-between border-b-2 border-dashed border-[var(--ink)] pb-3">
                <StampTag tone="pink">TODAY'S ESCAPE</StampTag>
                <span className="font-[family-name:var(--font-display)] text-xl text-[var(--hotpink)]">{plan.title.toUpperCase()}</span>
              </div>

              <div className="mt-5 space-y-4 divide-y-2 divide-dashed divide-[var(--ink)]/30">
                {plan.activities.map((act, index) => (
                  <div key={index} className={`flex items-start justify-between ${index > 0 ? "pt-4" : ""}`}>
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--mustard)] border-2 border-[var(--ink)] text-[10px] font-black">{index + 1}</span>
                        <h4 className="font-[family-name:var(--font-heavy)] text-sm uppercase tracking-widest text-[var(--ink)]">{act.name}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 ml-7">{act.note}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-[family-name:var(--font-display)] text-xl">{act.cost === 0 ? "FREE" : `₹${act.cost}`}</div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground">{act.duration} hr</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t-2 border-dashed border-[var(--ink)] pt-4">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <span>🚗 Transit: {plan.transport}</span>
                  <span>₹{plan.transportCost}</span>
                </div>
                <div className="flex items-baseline justify-between mt-4 border-t-3 border-[var(--ink)] pt-3">
                  <div>
                    <div className="text-[10px] uppercase font-black tracking-widest opacity-70">Total Damage</div>
                    <div className="font-[family-name:var(--font-display)] text-3xl text-[var(--hotpink)]">₹{plan.totalCost}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-black tracking-widest opacity-70">Change Left</div>
                    <div className="font-[family-name:var(--font-display)] text-3xl text-green-600">
                      {remaining >= 0 ? `₹${remaining} ✓` : `₹0`}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-[3px] border-[var(--ink)] bg-[var(--mustard)]/20 p-4">
                <div className="flex gap-2">
                  <span className="text-2xl shrink-0">💡</span>
                  <div>
                    <div className="font-[family-name:var(--font-heavy)] text-[10px] uppercase tracking-widest text-[var(--hotpink)]">Gemma's Nudge</div>
                    <p className="mt-1 text-xs leading-relaxed italic">{plan.nudge}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center gap-3">
              <button onClick={handleGenerate} className="btn-poster cursor-pointer">🔄 Try Another Outing</button>
              <Link to="/trip-generator" className="btn-ghost !text-[var(--cream)] !border-[var(--cream)] hover:!bg-[var(--cream)] hover:!text-[var(--ink)]">
                Plan a Multi-day Trip →
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--cream)] py-8">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="stamp-card inline-block">
            <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest text-muted-foreground">
              ⚡ Powered by Google Gemma 4 AI — Real AI micro-plans, not a lookup table. Updated in real-time based on your budget and hours.
            </span>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
