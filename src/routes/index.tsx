import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Halftone as SharedHalftone, StampTag as SharedStampTag } from "@/components/yatra";
import heroImg from "@/assets/hero-yatra.jpg";
import kolkata from "@/assets/poster-kolkata.jpg";
import delhi from "@/assets/poster-delhi.jpg";
import mumbai from "@/assets/poster-mumbai.jpg";
import jaipur from "@/assets/poster-jaipur.jpg";
import varanasi from "@/assets/poster-varanasi.jpg";
import goa from "@/assets/poster-goa.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "YatraAI — Travel India Smart, Safe, Cheap" },
      {
        name: "description",
        content:
          "Gemma-powered AI travel co-pilot for budget & solo travelers in India. Plan trips on any budget, dodge overcharges, translate dialects, stay safe.",
      },
      { property: "og:title", content: "YatraAI — Travel India Smart, Safe, Cheap" },
      {
        property: "og:description",
        content:
          "For the traveler deciding if they can afford to go at all — and helping them go safely.",
      },
    ],
  }),
  component: Index,
});

/* -------------------- DATA -------------------- */

const cities = [
  {
    name: "KOLKATA",
    tag: "City of Joy",
    year: "1990 A.D.",
    img: kolkata,
    note: "Trams, taxis & timeless chai.",
  },
  {
    name: "DELHI",
    tag: "The Lost Capital",
    year: "3069 A.D.",
    img: delhi,
    note: "Auto-rickshaws negotiating history.",
  },
  {
    name: "MUMBAI",
    tag: "Maximum City",
    year: "1975 A.D.",
    img: mumbai,
    note: "BEST buses, kaali-peeli taxis, the sea.",
  },
  {
    name: "JAIPUR",
    tag: "The Pink Dream",
    year: "1799 A.D.",
    img: jaipur,
    note: "Palaces, camels, cycle-rickshaw lanes.",
  },
  {
    name: "VARANASI",
    tag: "The Eternal Ghat",
    year: "1200 B.C.",
    img: varanasi,
    note: "Boats, bells, and diyas on the Ganga.",
  },
  {
    name: "GOA",
    tag: "Susegad Coast",
    year: "1971 A.D.",
    img: goa,
    note: "Scooter keys, salt air, sunset shacks.",
  },
];

const featureGroups: {
  title: string;
  color: "pink" | "mustard" | "dusk";
  items: { name: string; blurb: string }[];
}[] = [
  {
    title: "Trip Planning & Impulse",
    color: "mustard",
    items: [
      {
        name: "Budget-First Trip Generator",
        blurb: "Tell YatraAI what's in your wallet. It builds the trip around ₹, and supports group sizes.",
      },
      {
        name: "Got ₹X and a Few Hours?",
        blurb: "Spontaneous same-day outing planner based on cash and time available nearby.",
      },
      {
        name: "Group Trip Splitter",
        blurb: "Split costs fairly based on uneven income weights so everyone can travel.",
      },
    ],
  },
  {
    title: "Budget & Language",
    color: "pink",
    items: [
      { name: "Verify-to-Log Expense Tracker", blurb: "OCR/Voice input with manual confirmation and beneficiary selection." },
      { name: "Interactive Bargaining Assistant", blurb: "Real-time dialect translator for Hindi, Bengali, and Tamil markets." },
      { name: "Trip Story Memory Postcards", blurb: "Tappable day cards showing itemized expenses, polaroids, and splits." },
    ],
  },
  {
    title: "Safety & Future Roadmap",
    color: "dusk",
    items: [
      { name: "Fare-Shield™ Overcharge Detector", blurb: "Pre-auto verification for fair fares + local counter-offer scripts." },
      { name: "'Am I Safe?' Emergency Chat", blurb: "Interactive safety advisor checking late arrivals and street scams." },
      { name: "Silent SOS Broadcast (Roadmap)", blurb: "Location-aware offline emergency broadcast to circles." },
      { name: "Solo Female Mode (Roadmap)", blurb: "Verified accommodations and female-driver routing preferences." },
    ],
  },
];

/* -------------------- SMALL BITS -------------------- */

function Halftone() {
  return <div className="halftone pointer-events-none absolute inset-0 opacity-40" />;
}

function StampTag({ children, tone = "mustard" }: { children: React.ReactNode; tone?: "mustard" | "pink" | "dusk" }) {
  const bg =
    tone === "pink" ? "bg-[var(--hotpink)] text-[var(--cream)]" :
    tone === "dusk" ? "bg-[var(--dusk)] text-[var(--mustard)]" :
    "bg-[var(--mustard)] text-[var(--ink)]";
  return (
    <span className={`chip ${bg}`}>{children}</span>
  );
}

/* -------------------- SECTIONS -------------------- */

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-[var(--ink)] bg-[var(--cream)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <a href="#top" className="flex items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm border-[3px] border-[var(--ink)] bg-[var(--hotpink)] font-[family-name:var(--font-heavy)] text-[var(--mustard)] shadow-[3px_3px_0_var(--ink)]">
            Y
          </span>
          <span className="font-[family-name:var(--font-heavy)] text-lg tracking-widest">
            YATRA<span className="text-[var(--hotpink)]">AI</span>
          </span>
        </a>
        <nav className="hidden gap-6 text-sm font-bold uppercase tracking-widest md:flex">
          <Link to="/cities" className="hover:text-[var(--hotpink)]">Cities</Link>
          <Link to="/features" className="hover:text-[var(--hotpink)]">Features</Link>
          <Link to="/trip-generator" className="hover:text-[var(--hotpink)]">Plan a Trip</Link>
          <Link to="/fare-shield" className="hover:text-[var(--hotpink)]">Fare-Shield</Link>
        </nav>
        <Link to="/trip-generator" className="btn-poster !py-2 !px-4 text-xs">Plan a Trip</Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden border-b-[3px] border-[var(--ink)]">
      <img
        src={heroImg}
        alt="Retro poster of an Indian city at dusk"
        width={1920}
        height={1088}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--dusk)]/40 via-transparent to-[var(--ink)]/70" />
      <Halftone />

      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-20 sm:px-6 sm:py-28 md:py-36 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-6 flex flex-wrap gap-2">
            <StampTag tone="mustard">Gemma-powered</StampTag>
            <StampTag tone="pink">Made for India</StampTag>
            <StampTag tone="dusk">Offline-first</StampTag>
          </div>
          <h1 className="poster-title-lg text-[clamp(3.5rem,11vw,9rem)]">YATRA<span className="block sm:inline">AI</span></h1>
          <p className="mt-3 max-w-xl text-lg font-bold uppercase tracking-widest text-[var(--cream)] sm:text-xl">
            The co-pilot for travelers who count every rupee — and every hour of daylight.
          </p>
          <p className="mt-4 max-w-xl text-base text-[var(--cream)]/85 sm:text-lg">
            Every other travel app monetizes travelers who've already decided to spend. YatraAI is
            for the student, the solo woman, the migrant worker, the six-friend bachelor group —
            the traveler deciding if they can afford to go at all. And helping them go safely.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#demos" className="btn-poster">Try the demos</a>
            <a href="#cities" className="btn-ghost !text-[var(--cream)] !border-[var(--cream)] hover:!bg-[var(--cream)] hover:!text-[var(--ink)]">See the cities</a>
          </div>
        </div>

        <div className="hidden lg:flex lg:items-end lg:justify-end">
          <div className="ticket w-full max-w-sm p-5">
            <div className="flex items-center justify-between border-b-2 border-dashed border-[var(--ink)] pb-2 text-xs font-black uppercase tracking-widest">
              <span>Boarding Pass</span>
              <span>YT-001</span>
            </div>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="font-[family-name:var(--font-display)] text-4xl leading-none">MUM</span>
              <span className="text-xs">→</span>
              <span className="font-[family-name:var(--font-display)] text-4xl leading-none">VNS</span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] font-bold uppercase tracking-widest">
              <div><div className="opacity-70">Budget</div><div className="text-base">₹4,200</div></div>
              <div><div className="opacity-70">Days</div><div className="text-base">6</div></div>
              <div><div className="opacity-70">Mode</div><div className="text-base">Sleeper</div></div>
            </div>
            <div className="mt-3 border-t-2 border-dashed border-[var(--ink)] pt-2 text-xs">
              Verified stays · Safe hours · Chai stops included.
            </div>
          </div>
        </div>
      </div>

      {/* marquee */}
      <div className="marquee-band relative border-y-[3px] border-[var(--ink)] py-3 overflow-hidden">
        <div className="marquee-track text-sm">
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i} className="inline-flex items-center gap-12">
              <span>★ Fare-Shield live</span>
              <span>★ Silent SOS</span>
              <span>★ Bengali · Hindi · Tamil · Marathi</span>
              <span>★ ₹0 to start</span>
              <span>★ Made for the streets, not the airport lounge</span>
              <span>★ Solo woman mode</span>
              <span>★ Voice-first</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Manifesto() {
  return (
    <section id="manifesto" className="relative border-b-[3px] border-[var(--ink)] paper py-20 sm:py-28">
      <Halftone />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-[1fr_2fr]">
        <div>
          <StampTag tone="pink">The Point</StampTag>
          <h2 className="poster-title mt-4 text-[clamp(2.5rem,6vw,5rem)]">Not for tourists.</h2>
          <p className="mt-3 max-w-sm font-[family-name:var(--font-hand)] text-2xl leading-tight text-[var(--dusk)]">
            For the ones deciding if they can even go.
          </p>
        </div>
        <div className="space-y-5 text-lg leading-relaxed">
          <p>
            Every travel app on your phone is designed for someone who's already decided to spend.
            Booking engines, luxury filters, "hidden gems" curated by influencers. Great for them.
          </p>
          <p className="font-bold">
            YatraAI is for the other India — the one that travels on general coaches, negotiates
            every fare, and needs to know if a lane is safe at 10pm.
          </p>
          <p>
            Students on a semester break. Bachelor groups pooling savings. Solo women who won't
            let fear cancel a trip. Migrant workers going home for Chhath. This app is for them,
            in their language, at their price point — with a smart friend's tone, not a corporate one.
          </p>
        </div>
      </div>
    </section>
  );
}

function Cities() {
  return (
    <section id="cities" className="relative border-b-[3px] border-[var(--ink)] bg-[var(--dusk)] py-20 text-[var(--cream)] sm:py-28">
      <Halftone />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <StampTag tone="mustard">The Gallery</StampTag>
            <h2 className="poster-title mt-4 text-[clamp(3rem,8vw,6rem)]">CITIES</h2>
            <p className="mt-2 max-w-xl text-[var(--cream)]/80">
              Every city YatraAI knows becomes a poster. Local vehicles, local landmarks, local prices —
              built by locals, not scraped from a wiki.
            </p>
          </div>
          <div className="font-[family-name:var(--font-heavy)] text-sm uppercase tracking-[0.3em] text-[var(--mustard)]">
            14 / 400+ coming
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map((c) => (
            <article key={c.name} className="poster-card grain group">
              <div className="relative aspect-[4/5] overflow-hidden">
                <img
                  src={c.img}
                  alt={`${c.name} retro poster`}
                  width={1024}
                  height={1280}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)]/60 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <div className="poster-title text-[clamp(2.2rem,5vw,3.6rem)]">{c.name}</div>
                  <div className="mt-1 flex items-center gap-2 font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest text-[var(--mustard)]">
                    <span>{c.tag}</span>
                    <span className="text-[var(--hotpink)]">·</span>
                    <span>{c.year}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t-[3px] border-[var(--ink)] bg-[var(--cream)] p-3 text-[var(--ink)]">
                <p className="text-sm">{c.note}</p>
                <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest text-[var(--hotpink)]">Plan →</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --- DEMO 1: Budget Trip Generator --- */
function DemoBudget() {
  const [budget, setBudget] = useState(4500);
  const [days, setDays] = useState(5);
  const plan = [
    { d: "Day 1", city: "Delhi", stay: "Paharganj hostel", cost: 550 },
    { d: "Day 2", city: "Delhi → Agra", stay: "Sleeper train + hostel", cost: 720 },
    { d: "Day 3", city: "Agra → Jaipur", stay: "Bus + dorm bed", cost: 680 },
    { d: "Day 4", city: "Jaipur", stay: "Old city dorm", cost: 640 },
    { d: "Day 5", city: "Jaipur → Delhi", stay: "Return train", cost: 510 },
  ].slice(0, days);
  const spent = plan.reduce((a, b) => a + b.cost, 0);
  const remaining = budget - spent;
  return (
    <div className="poster-card grain p-5 sm:p-7 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between">
          <StampTag tone="pink">Demo 01</StampTag>
          <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest">Budget Trip Generator</span>
        </div>
        <h3 className="mt-3 font-[family-name:var(--font-display)] text-4xl">Golden Triangle. Your money.</h3>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <div className="text-xs font-black uppercase tracking-widest">Budget (₹)</div>
            <input
              type="range" min={2000} max={10000} step={100}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="mt-2 w-full accent-[var(--hotpink)]"
            />
            <div className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[var(--hotpink)]">₹{budget.toLocaleString("en-IN")}</div>
          </label>
          <label className="block">
            <div className="text-xs font-black uppercase tracking-widest">Days</div>
            <input
              type="range" min={2} max={5} step={1}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="mt-2 w-full accent-[var(--hotpink)]"
            />
            <div className="mt-1 font-[family-name:var(--font-display)] text-3xl">{days} days</div>
          </label>
        </div>

        <div className="mt-6 divide-y-2 divide-dashed divide-[var(--ink)] border-y-[3px] border-[var(--ink)]">
          {plan.map((p) => (
            <div key={p.d} className="flex items-center justify-between py-3 text-sm">
              <div>
                <div className="font-[family-name:var(--font-heavy)] uppercase tracking-widest">{p.d} · {p.city}</div>
                <div className="text-muted-foreground">{p.stay}</div>
              </div>
              <div className="font-[family-name:var(--font-display)] text-2xl">₹{p.cost}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm">Spent <b>₹{spent}</b></div>
          <div className={`font-[family-name:var(--font-heavy)] text-sm uppercase tracking-widest ${remaining >= 0 ? "text-[var(--dusk)]" : "text-[var(--hotpink)]"}`}>
            {remaining >= 0 ? `₹${remaining} left ✓` : `₹${Math.abs(remaining)} short`}
          </div>
        </div>
      </div>
      <Link to="/trip-generator" className="mt-6 btn-poster w-full justify-center text-xs">
        🗺️ Build Full Itinerary →
      </Link>
    </div>
  );
}

/* --- DEMO 2: Fare-Shield --- */
function DemoFare() {
  const [from, setFrom] = useState("Howrah Stn");
  const [to, setTo] = useState("Park Street");
  const [quoted, setQuoted] = useState(280);
  const fair = 160;
  const overcharge = quoted - fair;
  return (
    <div className="poster-card grain p-5 sm:p-7 bg-[var(--mustard)] flex flex-col justify-between h-full text-[var(--ink)]">
      <div>
        <div className="flex items-center justify-between">
          <StampTag tone="dusk">Demo 02</StampTag>
          <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest">Fare-Shield™</span>
        </div>
        <h3 className="mt-3 font-[family-name:var(--font-display)] text-4xl">Auto quoted you ₹{quoted}?</h3>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <label className="stamp-card">
            <div className="text-[10px] font-black uppercase tracking-widest">From</div>
            <input value={from} onChange={(e) => setFrom(e.target.value)} className="w-full bg-transparent font-[family-name:var(--font-heavy)] text-lg outline-none" />
          </label>
          <label className="stamp-card">
            <div className="text-[10px] font-black uppercase tracking-widest">To</div>
            <input value={to} onChange={(e) => setTo(e.target.value)} className="w-full bg-transparent font-[family-name:var(--font-heavy)] text-lg outline-none" />
          </label>
          <label className="stamp-card">
            <div className="text-[10px] font-black uppercase tracking-widest">Quoted (₹)</div>
            <input type="number" value={quoted} onChange={(e) => setQuoted(Number(e.target.value) || 0)} className="w-full bg-transparent font-[family-name:var(--font-heavy)] text-lg outline-none" />
          </label>
        </div>

        <div className="mt-6 border-[3px] border-[var(--ink)] bg-[var(--cream)] p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-black uppercase tracking-widest">Fair fare · {from} → {to}</div>
            <div className="font-[family-name:var(--font-display)] text-3xl text-[var(--dusk)]">₹{fair}</div>
          </div>
          <div className="mt-2 h-3 w-full border-2 border-[var(--ink)] bg-[var(--cream)]">
            <div className="h-full bg-[var(--hotpink)]" style={{ width: `${Math.min(100, (quoted / (fair * 3)) * 100)}%` }} />
          </div>
          <div className="mt-3 font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest">
            {overcharge > 0 ? (
              <span className="text-[var(--hotpink)]">Overcharge alert: ₹{overcharge} above fair. Say: "Meter chalao."</span>
            ) : (
              <span className="text-[var(--dusk)]">Fair fare. Get in.</span>
            )}
          </div>
        </div>
      </div>
      <Link to="/fare-shield" className="mt-6 btn-poster !bg-[var(--ink)] !text-[var(--mustard)] w-full justify-center text-xs hover:!bg-[var(--hotpink)] hover:!text-[var(--cream)]">
        🛡️ Verify Fares & Get Phrases →
      </Link>
    </div>
  );
}

/* --- DEMO 3: Photo Expense --- */
function DemoExpense() {
  const [items, setItems] = useState([
    { t: "Chai", amt: 15, cat: "Food" },
    { t: "Auto — Sealdah to Kalighat", amt: 90, cat: "Transport" },
    { t: "Hostel bunk (1 night)", amt: 420, cat: "Stay" },
  ]);
  const [pending, setPending] = useState<string | null>(null);
  const capture = () => {
    setPending("Reading bill…");
    setTimeout(() => {
      setItems((x) => [{ t: "Rice plate — Dada's Dhaba", amt: 70, cat: "Food" }, ...x]);
      setPending(null);
    }, 900);
  };
  const total = items.reduce((a, b) => a + b.amt, 0);
  return (
    <div className="poster-card grain p-5 sm:p-7 bg-[var(--hotpink)] text-[var(--cream)] flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between">
          <span className="chip !bg-[var(--cream)] !text-[var(--ink)]">Demo 03</span>
          <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest">Expense & Split</span>
        </div>
        <h3 className="mt-3 font-[family-name:var(--font-display)] text-4xl">Snap the bill. That's it.</h3>
        <button onClick={capture} className="mt-4 btn-poster !bg-[var(--mustard)] !text-[var(--ink)]">
          📷 {pending ?? "Capture new bill"}
        </button>
        <ul className="mt-5 divide-y-2 divide-dashed divide-[var(--cream)]/40 border-y-2 border-[var(--cream)]/60">
          {items.map((it, i) => (
            <li key={i} className="flex items-center justify-between py-3">
              <div>
                <div className="font-[family-name:var(--font-heavy)] uppercase tracking-widest text-sm">{it.t}</div>
                <div className="text-xs opacity-80">{it.cat}</div>
              </div>
              <div className="font-[family-name:var(--font-display)] text-2xl">₹{it.amt}</div>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between font-[family-name:var(--font-heavy)] uppercase tracking-widest text-sm">
          <span>Today so far</span>
          <span className="text-2xl font-[family-name:var(--font-display)]">₹{total}</span>
        </div>
      </div>
      <Link to="/expense-tracker" className="mt-6 btn-poster !bg-[var(--cream)] !text-[var(--ink)] hover:!bg-[var(--mustard)] hover:!text-[var(--ink)] w-full justify-center text-xs">
        👥 Split Group Expenses & Invite →
      </Link>
    </div>
  );
}

/* --- DEMO 4: Trip Story Generator --- */
function DemoStory() {
  const [gen, setGen] = useState(false);
  return (
    <div className="poster-card grain p-5 sm:p-7 bg-[var(--dusk)] text-[var(--cream)] flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between">
          <span className="chip !bg-[var(--mustard)]">Demo 04</span>
          <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest">Trip Postcard Memory</span>
        </div>
        <h3 className="mt-3 font-[family-name:var(--font-display)] text-4xl">A postcard from your trip.</h3>
        <p className="mt-2 text-[var(--cream)]/85 text-sm">Photos, expenses, and notes stitched into a story worth keeping. Tap day cards to view detail logs.</p>
        <button onClick={() => setGen(true)} className="mt-4 btn-poster">✨ Generate my story</button>

        {gen && (
          <div className="mt-6 border-[3px] border-[var(--mustard)] bg-[var(--cream)] p-5 text-[var(--ink)]">
            <div className="font-[family-name:var(--font-hand)] text-2xl leading-tight text-[var(--hotpink)]">
              Kolkata, 4 days, ₹3,120 spent.
            </div>
            <p className="mt-3 text-xs leading-relaxed">
              You got off at Howrah before sunrise. A tram woke you up before your alarm did. The
              Victoria Memorial in the rain was smaller than the photos said, and much bigger than
              you expected. You paid 15 rupees too much for a rickshaw and 15 rupees too little for
              a fish thali — and both felt like winning.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <StampTag>#kolkata</StampTag>
              <StampTag tone="pink">#soloTrip</StampTag>
              <StampTag tone="dusk">#underBudget</StampTag>
            </div>
          </div>
        )}
      </div>
      <Link to="/trip-story" className="mt-6 btn-poster w-full justify-center text-xs">
        🌅 Open Interactive Day Cards →
      </Link>
    </div>
  );
}

function Demos() {
  return (
    <section id="demos" className="relative border-b-[3px] border-[var(--ink)] paper py-20 sm:py-28">
      <Halftone />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 max-w-2xl">
          <StampTag tone="pink">Live-ish demos</StampTag>
          <h2 className="poster-title mt-4 text-[clamp(2.5rem,7vw,5.5rem)]">TRY IT.</h2>
          <p className="mt-3 text-lg">
            Four flows that answer the four questions every budget traveler in India actually asks.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <DemoBudget />
          <DemoFare />
          <DemoExpense />
          <DemoStory />
        </div>
      </div>
    </section>
  );
}

function Features() {
  const toneMap = {
    mustard: "bg-[var(--mustard)] text-[var(--ink)]",
    pink: "bg-[var(--hotpink)] text-[var(--cream)]",
    dusk: "bg-[var(--dusk)] text-[var(--mustard)]",
  } as const;
  return (
    <section id="features" className="relative border-b-[3px] border-[var(--ink)] bg-[var(--cream)] py-20 sm:py-28">
      <Halftone />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-12 max-w-3xl">
          <StampTag tone="dusk">Everything inside</StampTag>
          <h2 className="poster-title mt-4 text-[clamp(2.5rem,7vw,5.5rem)]">THE WHOLE KIT</h2>
          <p className="mt-3 text-lg">Six groups, one co-pilot. Built for the streets, the sleeper coaches, and the 10pm arrivals.</p>
        </div>

        <div className="space-y-10">
          {featureGroups.map((g, gi) => (
            <div key={g.title} className="poster-card grain">
              <div className={`flex flex-wrap items-baseline justify-between gap-3 border-b-[3px] border-[var(--ink)] px-5 py-3 ${toneMap[g.color]}`}>
                <h3 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl">{g.title}</h3>
                <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-[0.3em]">0{gi + 1} / 06</span>
              </div>
              <ul className="grid gap-0 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((it, i) => (
                  <li
                    key={it.name}
                    className={`border-[var(--ink)] p-5 ${i % 3 !== 2 ? "lg:border-r-2" : ""} ${i < g.items.length - (g.items.length % 3 || 3) ? "border-b-2" : ""}`}
                    style={{ borderRightStyle: "dashed", borderBottomStyle: "dashed" }}
                  >
                    <div className="font-[family-name:var(--font-heavy)] uppercase tracking-widest text-sm text-[var(--hotpink)]">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div className="mt-1 font-[family-name:var(--font-display)] text-2xl leading-tight">{it.name}</div>
                    <p className="mt-2 text-sm text-muted-foreground">{it.blurb}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Personas() {
  const p = [
    { title: "Students", copy: "Semester break, ₹3k in the wallet, four friends and a sleeper coach.", tone: "mustard" as const },
    { title: "Solo Women", copy: "Verified stays, women-driver preferences, quiet check-ins from a friend.", tone: "pink" as const },
    { title: "Bachelor Groups", copy: "Six budgets, one plan. Fair splits without the WhatsApp math wars.", tone: "dusk" as const },
    { title: "Migrant Workers", copy: "Cheapest route home for Chhath, Eid, Diwali — in your first language.", tone: "mustard" as const },
  ];
  return (
    <section className="relative border-b-[3px] border-[var(--ink)] stripes-y py-20 sm:py-28">
      <div className="absolute inset-0 bg-[var(--cream)]/85" />
      <Halftone />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 max-w-2xl">
          <StampTag tone="dusk">Who this is for</StampTag>
          <h2 className="poster-title mt-4 text-[clamp(2.5rem,7vw,5.5rem)]">FELLOW TRAVELERS</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {p.map((x) => (
            <div key={x.title} className="poster-card grain p-5">
              <StampTag tone={x.tone}>0{p.indexOf(x) + 1}</StampTag>
              <h3 className="mt-3 font-[family-name:var(--font-display)] text-3xl">{x.title}</h3>
              <p className="mt-2 text-sm">{x.copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Waitlist() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  return (
    <section id="waitlist" className="relative border-b-[3px] border-[var(--ink)] bg-[var(--ink)] py-20 text-[var(--cream)] sm:py-28">
      <Halftone />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-[1.2fr_1fr]">
        <div>
          <StampTag tone="mustard">Boarding soon</StampTag>
          <h2 className="poster-title-lg mt-4 text-[clamp(3rem,9vw,7rem)]">TICKET IN.</h2>
          <p className="mt-3 max-w-xl text-lg text-[var(--cream)]/85">
            Get on the list. First 1,000 travelers get lifetime Fare-Shield and Solo Companion mode, free.
          </p>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); if (email) setDone(true); }}
          className="ticket p-6"
        >
          <label className="block text-xs font-black uppercase tracking-widest">Your email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@yatra.in"
            className="mt-2 w-full border-b-2 border-[var(--ink)] bg-transparent py-2 font-[family-name:var(--font-heavy)] text-lg outline-none"
          />
          <button className="btn-poster mt-5 w-full justify-center">
            {done ? "You're on the list ✓" : "Reserve my seat"}
          </button>
          <p className="mt-3 text-[10px] uppercase tracking-widest opacity-70">No spam. Only sunrise trains.</p>
        </form>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[var(--cream)] py-10 text-sm">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 sm:flex-row sm:items-center sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center border-[3px] border-[var(--ink)] bg-[var(--hotpink)] font-[family-name:var(--font-heavy)] text-[var(--mustard)] shadow-[3px_3px_0_var(--ink)]">Y</span>
          <div>
            <div className="font-[family-name:var(--font-heavy)] tracking-widest">YATRAAI</div>
            <div className="text-xs text-muted-foreground">Made in India, for India. Powered by Gemma.</div>
          </div>
        </div>
        <div className="flex gap-6 font-[family-name:var(--font-heavy)] uppercase tracking-widest text-xs">
          <a href="#cities">Cities</a>
          <a href="#features">Features</a>
          <a href="#demos">Demos</a>
          <a href="#waitlist">Early Access</a>
        </div>
      </div>
    </footer>
  );
}

function Index() {
  return (
    <main className="min-h-screen">
      <Nav />
      <Hero />
      <Manifesto />
      <Cities />
      <Demos />
      <Features />
      <Personas />
      <Waitlist />
      <Footer />
    </main>
  );
}
