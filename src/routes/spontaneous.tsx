import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell, Halftone, StampTag } from "@/components/yatra";
import { cities } from "@/data/city-data";

export const Route = createFileRoute("/spontaneous")({
  head: () => ({
    meta: [
      { title: "Got ₹X & a Few Hours? — YatraAI" },
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

const mockOutings: Record<string, (budget: number, hours: number) => OutingPlan> = {
  kolkata: (budget, hours) => {
    if (budget < 150) {
      return {
        title: "Trams & Tea Run",
        activities: [
          { name: "Tram Ride from Esplanade to College Street", cost: 10, duration: 0.5, note: "Retro slow travel at its cheapest." },
          { name: "Clay cup Chai at College Street", cost: 15, duration: 0.5, note: "Join the local student 'adda' debate." },
          { name: "Browse old book stalls", cost: 0, duration: 1.0, note: "Smell the paper history, negotiating is expected." }
        ],
        transport: "Tram + Walking",
        transportCost: 10,
        totalCost: 25,
        nudge: "Suman, ₹25 and 2 hours is all you need to experience the soul of College Street. Walk past the old Presidency gates, have a cutting chai, and head back. Clean break from the daily grind."
      };
    } else if (budget < 400) {
      return {
        title: "Dada's Thali & Cemeteries",
        activities: [
          { name: "Fish Thali at Dada's Dhaba", cost: 55, duration: 1.0, note: "Hot rice, mustard fish curry under a blue tarp." },
          { name: "South Park Street Cemetery walk", cost: 30, duration: 1.5, note: "Eerie moss-covered British-era tombs, dead silent." },
          { name: "Kulfi near Gariahat crossing", cost: 40, duration: 0.5, note: "Cold cardamom goodness to beat the humidity." }
        ],
        transport: "Shared Auto + Metro",
        transportCost: 40,
        totalCost: 165,
        nudge: "Have a filling lunch at Dada's (look for the tarp, don't ask for a menu) then walk off the rice among the roots at South Park Cemetery. It's quiet, cool, and costs almost nothing."
      };
    } else {
      return {
        title: "River Cross & Chinese Dumplings",
        activities: [
          { name: "Ferry ride to Howrah and back", cost: 20, duration: 1.5, note: "Ganga breeze, sunset silhouettes of the bridge." },
          { name: "Dumplings & Siu Mai at Chinese quarters", cost: 150, duration: 1.0, note: "Steaming pork momos at local family stalls." },
          { name: "Victoria Memorial gardens entry", cost: 50, duration: 1.5, note: "Sit on the grass, watch the evening fountain." }
        ],
        transport: "Ferry + Yellow Cab (Shared)",
        transportCost: 80,
        totalCost: 300,
        nudge: "If you've got ₹400 in your pocket, cross the river. The ferry breeze beats any AC café. Grab hot momos, walk through Victoria's gardens, and you'll still have change left over for tomorrow."
      };
    }
  },
  delhi: (budget, hours) => {
    if (budget < 150) {
      return {
        title: "Qawwali & CP Chai",
        activities: [
          { name: "Hazrat Nizamuddin Dargah Evening prayers", cost: 0, duration: 2.0, note: "Sufi qawwalis, incense, soulful atmosphere." },
          { name: "Cutting Chai near Nizamuddin station", cost: 15, duration: 0.5, note: "Hot cardamom tea to keep you sharp." }
        ],
        transport: "Walking + Ring Rail",
        transportCost: 15,
        totalCost: 30,
        nudge: "If you're feeling down, sit in the Nizamuddin Dargah courtyard. The music starts at sunset and is free. You only pay for a chai on the way out. It will clear your mind."
      };
    } else if (budget < 400) {
      return {
        title: "Baoli & Tibetan Noodles",
        activities: [
          { name: "Explore Agrasen ki Baoli stepwell", cost: 0, duration: 1.0, note: "Cool stone stairs hidden among high-rises." },
          { name: "Tibetan Thukpa at Majnu ka Tilla", cost: 90, duration: 1.5, note: "Warm noodle soup in narrow, colorful monastery lanes." },
          { name: "Butter tea at a local monk café", cost: 40, duration: 0.5, note: "Salty, buttery, completely different." }
        ],
        transport: "Metro + Shared E-Rickshaw",
        transportCost: 50,
        totalCost: 180,
        nudge: "Suman, if you've got 3 free hours, get on the Yellow Line. Majnu ka Tilla feels like another state. Get a hot Thukpa soup for ₹90. It's cheap, filling, and lets you escape the city heat."
      };
    } else {
      return {
        title: "Chandni Chowk Parantha Feast",
        activities: [
          { name: "Qutub Minar complex entry", cost: 35, duration: 1.5, note: "Stand below the massive red tower, look at the iron pillar." },
          { name: "Mix Parantha at Gali Paranthe Wali", cost: 150, duration: 1.0, note: "Deep-fried paranthas served with potato curry." },
          { name: "Rabdi & Jalebi at Old Famous Jalebi Wala", cost: 80, duration: 0.5, note: "Sweet, sticky, piping hot." }
        ],
        transport: "Metro Pass",
        transportCost: 80,
        totalCost: 345,
        nudge: "Spend the afternoon at Qutub Minar, then take the Metro straight to Chandni Chowk for deep-fried paranthas. Avoid the cycle-rickshaw overcharge: just walk from the station exit."
      };
    }
  },
  mumbai: (budget, hours) => {
    const defaultNudge = "Got a few hours? Head to Marine Drive. The sea breeze is free, and a Bun Maska + Chai at Café Military costs ₹50. Sit next to the kaali-peelis and watch the waves roll in.";
    if (budget < 150) {
      return {
        title: "Marine Drive Sea Wind",
        activities: [
          { name: "Sit on the Marine Drive tetrapods", cost: 0, duration: 2.0, note: "Watch the Queen's necklace light up at dusk." },
          { name: "Cutting Chai from cycle wallah", cost: 12, duration: 0.5, note: "Extra ginger, perfect with the sea salt air." }
        ],
        transport: "Local Train (Second Class)",
        transportCost: 10,
        totalCost: 22,
        nudge: defaultNudge
      };
    } else if (budget < 400) {
      return {
        title: "Irani Café & Banganga Tank",
        activities: [
          { name: "Bun Maska + Chai at Café Military", cost: 50, duration: 1.0, note: "Classic Parsi eatery, wooden tables, vintage vibes." },
          { name: "Explore Banganga Tank, Malabar Hill", cost: 0, duration: 1.5, note: "Ancient holy water pool, ducks, ringed by old temples." },
          { name: "Vada Pav from Ashok Vada Pav", cost: 35, duration: 0.5, note: "Mumbai's legendary burger, spicy chutney." }
        ],
        transport: "BEST Bus + Walking",
        transportCost: 30,
        totalCost: 115,
        nudge: "Take the BEST bus to Malabar Hill. Banganga Tank is a quiet sanctuary most tourists miss. Grab a bun maska first to keep you going. Total damage: only ₹115!"
      };
    } else {
      return {
        title: "Gateway Ferry & Koli Fish lunch",
        activities: [
          { name: "Ferry from Gateway of India to Elephanta (no entry)", cost: 40, duration: 2.0, note: "Ferry ride on the open harbor, watch the seagulls." },
          { name: "Koli Fish Thali at Versova lunch home", cost: 180, duration: 1.0, note: "Spicy mackerel fry, coconut curry, soft rice." }
        ],
        transport: "Ferry + Local train",
        transportCost: 70,
        totalCost: 290,
        nudge: "Got ₹300? Get on the ferry. You don't need to pay for the cave tour; just the boat ride itself clears the lungs. Head back for a Koli style thali. Best value in Mumbai."
      };
    }
  }
};

const defaultPlan = (city: string, budget: number): OutingPlan => {
  return {
    title: "Local Heritage Walk & Street Eats",
    activities: [
      { name: "Walk through local market/bazaar lanes", cost: 0, duration: 1.5, note: "Soak in the sights, smells, and bargaining voices." },
      { name: "Local snack (Samosa/Kachori) + hot Chai", cost: 35, duration: 0.5, note: "The universal fuel of budget Indian travel." },
      { name: "Visit a historical landmark or public park", cost: 20, duration: 1.0, note: "Quiet corner to watch the sunset." }
    ],
    transport: "Local Bus / Walking",
    transportCost: 20,
    totalCost: 55,
    nudge: `Suman, you've got ₹${budget} and a few hours in ${city}. Skip the expensive cafés. Hop on a local bus, walk the market lanes, grab a piping hot kachori and tea. You get out, you see the city, and you keep your budget intact.`
  };
};

function SpontaneousPage() {
  const [budget, setBudget] = useState(300);
  const [hours, setHours] = useState(3);
  const [citySlug, setCitySlug] = useState("kolkata");
  const [plan, setPlan] = useState<OutingPlan | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setPlan(null);
    setTimeout(() => {
      const cityConfig = mockOutings[citySlug];
      if (cityConfig) {
        setPlan(cityConfig(budget, hours));
      } else {
        const cityData = cities.find((c) => c.slug === citySlug);
        setPlan(defaultPlan(cityData?.name ?? "this city", budget));
      }
      setGenerating(false);
    }, 900);
  };

  const remaining = budget - (plan?.totalCost ?? 0);

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--hotpink)] py-16 text-[var(--cream)] sm:py-20">
        <Halftone />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <StampTag tone="mustard">Same-day Impulse</StampTag>
          <h1 className="poster-title mt-4 text-[clamp(2rem,7vw,5.5rem)]">
            GOT ₹X & A FEW HOURS?
          </h1>
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
              <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest">
                Impulse Ticket
              </span>
              <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest">
                YT-NOW
              </span>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-3">
              {/* Budget */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[var(--ink)]">
                  Cash in Pocket (₹)
                </label>
                <input
                  type="range"
                  min={50}
                  max={1000}
                  step={20}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="mt-3 w-full accent-[var(--hotpink)]"
                />
                <div className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[var(--hotpink)]">
                  ₹{budget}
                </div>
              </div>

              {/* Time */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[var(--ink)]">
                  Time Available (Hours)
                </label>
                <input
                  type="range"
                  min={1}
                  max={8}
                  step={0.5}
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="mt-3 w-full accent-[var(--hotpink)]"
                />
                <div className="mt-1 font-[family-name:var(--font-display)] text-3xl">
                  {hours} hours
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[var(--ink)]">
                  Current City
                </label>
                <select
                  value={citySlug}
                  onChange={(e) => setCitySlug(e.target.value)}
                  className="mt-2 w-full border-2 border-[var(--ink)] bg-[var(--cream)] p-2 font-[family-name:var(--font-heavy)] text-sm"
                >
                  {cities.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="btn-poster mt-6 w-full justify-center text-center"
            >
              {generating ? "⚡ Pulling ideas nearby..." : "🎫 Find My Outing"}
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
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-dashed border-[var(--ink)] pb-3">
                <StampTag tone="pink">TODAY'S ESCAPE</StampTag>
                <span className="font-[family-name:var(--font-display)] text-xl text-[var(--hotpink)]">
                  {plan.title.toUpperCase()}
                </span>
              </div>

              {/* List */}
              <div className="mt-5 space-y-4 divide-y-2 divide-dashed divide-[var(--ink)]/30">
                {plan.activities.map((act, index) => (
                  <div key={index} className={`flex items-start justify-between ${index > 0 ? "pt-4" : ""}`}>
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--mustard)] border-2 border-[var(--ink)] text-[10px] font-black">
                          {index + 1}
                        </span>
                        <h4 className="font-[family-name:var(--font-heavy)] text-sm uppercase tracking-widest text-[var(--ink)]">
                          {act.name}
                        </h4>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 ml-7">{act.note}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-[family-name:var(--font-display)] text-xl">
                        {act.cost === 0 ? "FREE" : `₹${act.cost}`}
                      </div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground">{act.duration} hr</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Transport & Cost Summary */}
              <div className="mt-6 border-t-2 border-dashed border-[var(--ink)] pt-4">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <span>🚗 Transit Mode: {plan.transport}</span>
                  <span>Cost: ₹{plan.transportCost}</span>
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

              {/* Gemma Nudge */}
              <div className="mt-6 border-[3px] border-[var(--ink)] bg-[var(--mustard)]/20 p-4">
                <div className="flex gap-2">
                  <span className="text-2xl shrink-0">💡</span>
                  <div>
                    <div className="font-[family-name:var(--font-heavy)] text-[10px] uppercase tracking-widest text-[var(--hotpink)]">
                      Gemma's Nudge (Impulse Guide)
                    </div>
                    <p className="mt-1 text-xs leading-relaxed italic">{plan.nudge}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center gap-3">
              <button
                onClick={handleGenerate}
                className="btn-poster"
              >
                🔄 Try Another Outing
              </button>
              <Link to="/trip-generator" className="btn-ghost !text-[var(--cream)] !border-[var(--cream)] hover:!bg-[var(--cream)] hover:!text-[var(--ink)]">
                Plan a Multi-day Trip →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Demo note */}
      <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--cream)] py-8">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="stamp-card inline-block">
            <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest text-muted-foreground">
              🧪 Gemma Same-Day Logic: Sized specifically for local outings. Real version uses GPS to check which markets, street food stalls, or heritage walks are within your walking/auto radius, active *right now*, and sized to the change in your pocket.
            </span>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
