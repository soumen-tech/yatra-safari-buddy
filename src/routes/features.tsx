import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell, Halftone, StampTag } from "@/components/yatra";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — YatraAI" },
      {
        name: "description",
        content:
          "The whole kit. 30+ features built for budget travelers, solo women, student groups, and migrant workers across India.",
      },
    ],
  }),
  component: FeaturesPage,
});

/* ────── feature data ────── */

interface Feature {
  name: string;
  blurb: string;
  icon: string;
  status: "demo" | "backend" | "coming";
  persona: string;
}

interface FeatureGroup {
  title: string;
  tone: "mustard" | "pink" | "dusk";
  features: Feature[];
}

const featureGroups: FeatureGroup[] = [
  {
    title: "Trip Planning",
    tone: "mustard",
    features: [
      {
        name: "Budget-First Trip Generator",
        blurb: "Tell YatraAI what's in your wallet. It builds the trip around ₹, not the other way round.",
        icon: "🗺️",
        status: "demo",
        persona: "Rahul needs this — ₹4k for 5 friends, no spreadsheet, just vibes.",
      },
      {
        name: "Can I Afford It Right Now?",
        blurb: "One tap. Real-time answer. No spreadsheets, no shame.",
        icon: "💰",
        status: "backend",
        persona: "Suman checks this before buying a ticket home for Chhath.",
      },
      {
        name: "Group Trip Splitter",
        blurb: "Six friends, six budgets. One plan that doesn't leave anyone out.",
        icon: "👥",
        status: "backend",
        persona: "Rahul's friend group — one earns ₹15k, another ₹8k. Both should go.",
      },
      {
        name: "Weather & Festival Timing",
        blurb: "Monsoon in Kerala? Diwali in Varanasi? YatraAI knows when to go, when to wait.",
        icon: "🌧️",
        status: "backend",
        persona: "Ananya planning her first solo trip — doesn't want to arrive during a flood.",
      },
    ],
  },
  {
    title: "Budget Tools",
    tone: "pink",
    features: [
      {
        name: "Photo-to-Expense Tracker",
        blurb: "Snap a bill, it's logged. In your language, in your currency.",
        icon: "📷",
        status: "demo",
        persona: "Rahul snaps every receipt so the group can split at the end.",
      },
      {
        name: "Voice Expense Logging",
        blurb: '"Chai, 20 rupees." That\'s it. Done.',
        icon: "🎤",
        status: "demo",
        persona: "Suman speaks Hindi/Bengali — typing is slow, voice is instant.",
      },
      {
        name: "Overspending Alerts",
        blurb: "A gentle nudge before, not a sinking feeling after.",
        icon: "⚠️",
        status: "backend",
        persona: "Ananya set a daily limit. YatraAI tells her before she crosses it.",
      },
      {
        name: "Split-Cost Calculator",
        blurb: "Handles the awkward math between friends so you don't have to.",
        icon: "🧮",
        status: "backend",
        persona: "Rahul's group: 3 shared a cab, 2 had dinner, 1 paid for the hostel. Who owes what?",
      },
      {
        name: "Post-Trip Budget Report",
        blurb: "Where every rupee went. What surprised you. What to remember.",
        icon: "📊",
        status: "backend",
        persona: "All three personas — the trip's over, here's the honest accounting.",
      },
    ],
  },
  {
    title: "Safety",
    tone: "dusk",
    features: [
      {
        name: "Fare-Shield™ Overcharge Detector",
        blurb: "Tells you the fair fare before you sit in the auto.",
        icon: "🛡️",
        status: "demo",
        persona: "Ananya in a new city — doesn't know if ₹300 for 4km is normal.",
      },
      {
        name: "Scam-Phrase Detector",
        blurb: '"Meter kharaab hai" — YatraAI hears it, warns you, coaches your reply.',
        icon: "🚨",
        status: "backend",
        persona: "Ananya's highest anxiety: being scammed because she looks like a tourist.",
      },
      {
        name: "'Am I Safe?' Chat",
        blurb: "Late night in an unfamiliar lane? Ask. Get grounded, honest answers.",
        icon: "🆘",
        status: "backend",
        persona: "Ananya at 10pm in a lane she doesn't recognize. Needs a quick check.",
      },
      {
        name: "Silent SOS + AI Context Summary",
        blurb: "One tap sends your live location and a plain-English situation summary to your circle.",
        icon: "📍",
        status: "backend",
        persona: "Ananya's emergency button. Sends location + 'she's near X, last known safe at Y' to 3 contacts.",
      },
      {
        name: "Solo Female Companion Mode",
        blurb: "Verified stays, women-driver preferences, safe-hour routing, quiet check-ins.",
        icon: "👩",
        status: "backend",
        persona: "Ananya's default mode. Everything filtered through a safety-first lens.",
      },
    ],
  },
  {
    title: "Language",
    tone: "mustard",
    features: [
      {
        name: "Dialect-Aware Voice Translator",
        blurb: "Bengali, Hindi, Tamil, Marathi, Bhojpuri — the way locals actually talk.",
        icon: "🗣️",
        status: "backend",
        persona: "Suman speaks Bhojpuri at home, Hindi at work. Needs both to work.",
      },
      {
        name: "Bargaining Assistant",
        blurb: "Real market prices + polite phrases. You'll never overpay for a shawl again.",
        icon: "🤝",
        status: "backend",
        persona: "Rahul's group at Janpath Market. 'How much should this actually cost?'",
      },
      {
        name: "Menu & Sign Photo Reader",
        blurb: "Point your camera. Get it in your language, with allergen flags.",
        icon: "📖",
        status: "backend",
        persona: "Suman can't read the Tamil menu in a Madurai restaurant. Camera → translation.",
      },
    ],
  },
  {
    title: "Navigation",
    tone: "pink",
    features: [
      {
        name: "Cheapest Multi-Modal Route",
        blurb: "Bus + local + walk vs. cab. YatraAI reasons out the honest cheapest way.",
        icon: "🚌",
        status: "backend",
        persona: "Suman going home: train to junction, then bus, then shared auto. Cheapest path = ₹340 vs ₹1,200 cab.",
      },
      {
        name: "Offline Landmark Navigation",
        blurb: '"Left after the red mandir, past the tea stall." Works with no signal.',
        icon: "🧭",
        status: "backend",
        persona: "All three — in a village with no data. Directions that use landmarks, not GPS.",
      },
    ],
  },
  {
    title: "Memories & Culture",
    tone: "dusk",
    features: [
      {
        name: "Auto Trip Story",
        blurb: "Your photos, expenses, and voice notes stitched into a story worth keeping.",
        icon: "📝",
        status: "demo",
        persona: "Rahul wants a shareable summary of the bachelor trip. Not a spreadsheet.",
      },
      {
        name: "Postcard Captions",
        blurb: "Shareable, warm, funny — never AI-generic.",
        icon: "💌",
        status: "backend",
        persona: "Rahul posting on Instagram. Needs a caption that sounds like him, not a bot.",
      },
      {
        name: "Offline Emergency Phrasebook",
        blurb: "20 essential phrases in the local language. Works without data.",
        icon: "📒",
        status: "coming",
        persona: "All three — 'Where is the hospital?', 'I need help', 'How much?' in local dialect.",
      },
      {
        name: "Cultural Etiquette Tips",
        blurb: "Temple rules, tipping norms, what to wear where. Don't be that tourist.",
        icon: "🙏",
        status: "coming",
        persona: "Ananya visiting a mosque for the first time. What should she know?",
      },
      {
        name: "Voice-Only / Simple Mode",
        blurb: "For users with limited literacy. Everything works through voice and simple icons.",
        icon: "🔊",
        status: "coming",
        persona: "Suman's father. Can't read English, barely reads Hindi. Voice-first everything.",
      },
    ],
  },
];

const statusLabels = {
  demo: { label: "Try Demo", color: "!bg-green-600 !text-white" },
  backend: { label: "Needs Backend", color: "!bg-amber-500 !text-[var(--ink)]" },
  coming: { label: "Coming Soon", color: "!bg-[var(--dusk)] !text-[var(--mustard)]" },
};

const demoLinks: Record<string, string> = {
  "Budget-First Trip Generator": "/trip-generator",
  "Fare-Shield™ Overcharge Detector": "/fare-shield",
  "Photo-to-Expense Tracker": "/expense-tracker",
  "Voice Expense Logging": "/expense-tracker",
  "Auto Trip Story": "/trip-story",
};

/* ────── page ────── */

function FeaturesPage() {
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  const totalFeatures = featureGroups.reduce((a, g) => a + g.features.length, 0);
  const demoCount = featureGroups.reduce(
    (a, g) => a + g.features.filter((f) => f.status === "demo").length,
    0,
  );

  const toneMap = {
    mustard: "bg-[var(--mustard)] text-[var(--ink)]",
    pink: "bg-[var(--hotpink)] text-[var(--cream)]",
    dusk: "bg-[var(--dusk)] text-[var(--mustard)]",
  } as const;

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative border-b-[3px] border-[var(--ink)] paper py-16 sm:py-24">
        <Halftone />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <StampTag tone="dusk">Everything Inside</StampTag>
          <h1 className="poster-title mt-4 text-[clamp(2.5rem,8vw,6rem)]">
            THE WHOLE KIT
          </h1>
          <p className="mt-3 max-w-2xl text-lg">
            {totalFeatures} features across {featureGroups.length} groups. {demoCount} have live demos.
            Built for the streets, the sleeper coaches, and the 10pm arrivals.
          </p>

          {/* Stats */}
          <div className="mt-8 flex flex-wrap gap-6">
            <div className="ticket px-4 py-3">
              <div className="text-[10px] font-black uppercase tracking-widest opacity-70">
                Features
              </div>
              <div className="font-[family-name:var(--font-display)] text-3xl">
                {totalFeatures}
              </div>
            </div>
            <div className="ticket px-4 py-3">
              <div className="text-[10px] font-black uppercase tracking-widest opacity-70">
                Live Demos
              </div>
              <div className="font-[family-name:var(--font-display)] text-3xl">
                {demoCount}
              </div>
            </div>
            <div className="ticket px-4 py-3">
              <div className="text-[10px] font-black uppercase tracking-widest opacity-70">
                Personas
              </div>
              <div className="font-[family-name:var(--font-display)] text-3xl">3</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Groups */}
      <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--cream)] py-12 sm:py-16">
        <Halftone />
        <div className="relative mx-auto max-w-7xl space-y-8 px-4 sm:px-6">
          {featureGroups.map((g, gi) => (
            <div key={g.title} className="poster-card grain">
              <div
                className={`flex flex-wrap items-baseline justify-between gap-3 border-b-[3px] border-[var(--ink)] px-5 py-3 ${toneMap[g.tone]}`}
              >
                <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl">
                  {g.title}
                </h2>
                <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-[0.3em]">
                  0{gi + 1} / 0{featureGroups.length} · {g.features.length}{" "}
                  features
                </span>
              </div>

              <div className="divide-y-2 divide-dashed divide-[var(--ink)]">
                {g.features.map((f, fi) => {
                  const isExpanded = expandedFeature === f.name;
                  const link = demoLinks[f.name];

                  return (
                    <div key={f.name} className="px-5">
                      <button
                        onClick={() =>
                          setExpandedFeature(isExpanded ? null : f.name)
                        }
                        className="flex w-full items-center gap-4 py-4 text-left"
                      >
                        <span className="text-2xl">{f.icon}</span>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest text-[var(--hotpink)]">
                              {String(fi + 1).padStart(2, "0")}
                            </span>
                            <span className="font-[family-name:var(--font-display)] text-xl leading-tight">
                              {f.name}
                            </span>
                            <span
                              className={`chip !text-[8px] !py-0.5 ${statusLabels[f.status].color}`}
                            >
                              {statusLabels[f.status].label}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {f.blurb}
                          </p>
                        </div>
                        <span className="text-muted-foreground">
                          {isExpanded ? "▲" : "▼"}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="pb-4 pl-12">
                          <div className="bg-[var(--mustard)]/10 border-l-4 border-[var(--mustard)] p-3 text-sm">
                            <div className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest text-[var(--hotpink)] mb-1">
                              Who needs this
                            </div>
                            {f.persona}
                          </div>
                          {link && (
                            <Link
                              to={link}
                              className="btn-poster mt-3 text-xs !py-1.5 !px-3"
                            >
                              Try the demo →
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Persona section */}
      <section className="relative border-b-[3px] border-[var(--ink)] stripes-y py-16 sm:py-20">
        <div className="absolute inset-0 bg-[var(--cream)]/85" />
        <Halftone />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <StampTag tone="dusk">Who This Is For</StampTag>
          <h2 className="poster-title mt-4 text-[clamp(2rem,6vw,4.5rem)]">
            FELLOW TRAVELERS
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <div className="poster-card grain p-5">
              <StampTag tone="mustard">01</StampTag>
              <h3 className="mt-3 font-[family-name:var(--font-display)] text-3xl">
                Rahul, 21
              </h3>
              <p className="mt-1 font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest text-[var(--hotpink)]">
                Engineering student
              </p>
              <p className="mt-2 text-sm">
                ₹3–6k budget, travels with 4–5 friends, wants the trip to feel
                like an adventure not a spreadsheet. Needs group splitting that
                doesn't create drama and a trip story worth posting.
              </p>
            </div>
            <div className="poster-card grain p-5">
              <StampTag tone="pink">02</StampTag>
              <h3 className="mt-3 font-[family-name:var(--font-display)] text-3xl">
                Ananya, 24
              </h3>
              <p className="mt-1 font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest text-[var(--hotpink)]">
                First solo trip
              </p>
              <p className="mt-2 text-sm">
                Highest anxiety around safety and scams. Needs Fare-Shield before
                every auto, verified stays, safe-hour routing, and the 'Am I
                Safe?' chat at 10pm in a city she doesn't know yet.
              </p>
            </div>
            <div className="poster-card grain p-5">
              <StampTag tone="dusk">03</StampTag>
              <h3 className="mt-3 font-[family-name:var(--font-display)] text-3xl">
                Suman, 34
              </h3>
              <p className="mt-1 font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest text-[var(--hotpink)]">
                Migrant worker
              </p>
              <p className="mt-2 text-sm">
                Limited English, voice-first, needs the cheapest and safest route
                home for Chhath/Eid/Diwali. Translation that understands
                Bhojpuri, not just textbook Hindi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--ink)] py-16 text-[var(--cream)] sm:py-20">
        <Halftone />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <StampTag tone="mustard">Try It</StampTag>
          <h2 className="poster-title-lg mt-4 text-[clamp(2.5rem,7vw,5rem)]">
            DEMOS ARE LIVE.
          </h2>
          <p className="mt-3 text-lg text-[var(--cream)]/85">
            Four core flows you can try right now. The rest needs Gemma, a
            database, and your city's fare data — but the product thinking is
            here.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/trip-generator" className="btn-poster">
              Plan a Trip
            </Link>
            <Link to="/fare-shield" className="btn-poster !bg-[var(--mustard)] !text-[var(--ink)]">
              Fare-Shield
            </Link>
            <Link to="/expense-tracker" className="btn-ghost !text-[var(--cream)] !border-[var(--cream)]">
              Track Expenses
            </Link>
            <Link to="/trip-story" className="btn-ghost !text-[var(--cream)] !border-[var(--cream)]">
              Trip Story
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
