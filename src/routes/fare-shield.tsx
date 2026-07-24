import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell, Halftone, StampTag } from "@/components/yatra";

export const Route = createFileRoute("/fare-shield")({
  head: () => ({
    meta: [
      { title: "Fare-Shield™ — YatraAI" },
      {
        name: "description",
        content:
          "Know the fair fare before you sit in the auto. YatraAI's overcharge detector with counter-offer phrases.",
      },
    ],
  }),
  component: FareShieldPage,
});

/* ────── fare data ────── */

interface FareResult {
  fairFare: number;
  verdict: "fair" | "borderline" | "overcharged";
  reasoning: string;
  counterOffer: string;
  counterOfferHindi: string;
  distanceKm: number;
}

function analyzeFare(
  from: string,
  to: string,
  quoted: number,
  mode: string,
): FareResult {
  // Mock fare calculation based on rough per-km rates
  const rateMap: Record<string, number> = {
    auto: 14,
    cab: 18,
    rickshaw: 10,
    ebike: 8,
  };
  const rate = rateMap[mode] || 14;
  const distanceKm = Math.max(2, Math.round(3 + Math.random() * 8));
  const baseFare = mode === "auto" ? 25 : mode === "cab" ? 30 : 15;
  const fairFare = baseFare + distanceKm * rate;
  const diff = quoted - fairFare;
  const pct = (diff / fairFare) * 100;

  let verdict: FareResult["verdict"];
  let reasoning: string;
  let counterOffer: string;
  let counterOfferHindi: string;

  if (pct <= 10) {
    verdict = "fair";
    reasoning = `₹${quoted} for ~${distanceKm}km by ${mode} is within 10% of the expected fare. The going rate is ₹${rate}/km after a ₹${baseFare} base. This is a fair deal — get in.`;
    counterOffer = "No need to negotiate. This is a fair fare.";
    counterOfferHindi = "Sahi hai bhaiya, chaliye.";
  } else if (pct <= 40) {
    verdict = "borderline";
    reasoning = `₹${quoted} is about ${Math.round(pct)}% above the expected ₹${fairFare} for ~${distanceKm}km. This could be peak-hour pricing or a slight markup. You could try negotiating down ₹${Math.round(diff * 0.6)}.`;
    counterOffer = `"How about ₹${fairFare + Math.round(diff * 0.3)}? That's fair for this distance."`;
    counterOfferHindi = `"Bhaiya ₹${fairFare + Math.round(diff * 0.3)} mein chaliye. Itna hi hota hai."`;
  } else {
    verdict = "overcharged";
    reasoning = `₹${quoted} is ${Math.round(pct)}% above the fair rate of ₹${fairFare} for ~${distanceKm}km. At ₹${rate}/km (${mode} standard), the real fare is ₹${fairFare}. You're being overcharged by ₹${diff}. ${mode === "auto" ? "Ask them to start the meter." : "Try the next driver."}`;
    counterOffer = `"₹${fairFare} is the correct fare. Meter chalao or I'll take the next one."`;
    counterOfferHindi = `"Bhaiya ₹${fairFare} hi sahi hai. Meter lagao, ya agla waala le lunga."`;
  }

  return { fairFare, verdict, reasoning, counterOffer, counterOfferHindi, distanceKm };
}

/* ────── page ────── */

function FareShieldPage() {
  const [from, setFrom] = useState("Howrah Station");
  const [to, setTo] = useState("Park Street");
  const [quoted, setQuoted] = useState(280);
  const [mode, setMode] = useState("auto");
  const [result, setResult] = useState<FareResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [micActive, setMicActive] = useState(false);

  const handleCheck = () => {
    setAnalyzing(true);
    setResult(null);
    setTimeout(() => {
      setResult(analyzeFare(from, to, quoted, mode));
      setAnalyzing(false);
    }, 800);
  };

  const verdictColors = {
    fair: {
      bg: "bg-green-600",
      text: "text-green-100",
      label: "🟢 FAIR FARE",
      border: "border-green-600",
    },
    borderline: {
      bg: "bg-amber-500",
      text: "text-amber-100",
      label: "🟡 BORDERLINE",
      border: "border-amber-500",
    },
    overcharged: {
      bg: "bg-[var(--hotpink)]",
      text: "text-[var(--cream)]",
      label: "🔴 OVERCHARGED",
      border: "border-[var(--hotpink)]",
    },
  };

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--mustard)] py-16 sm:py-20">
        <Halftone />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <StampTag tone="dusk">Core Flow 02</StampTag>
          <h1 className="poster-title mt-4 text-[clamp(2.5rem,8vw,6rem)]">
            FARE-SHIELD™
          </h1>
          <p className="mt-3 max-w-2xl text-lg">
            Tells you the fair fare before you sit in the auto. Traffic-light
            verdict, plain-language reasoning, and a counter-offer phrase you can
            say out loud — in Hindi or English.
          </p>
        </div>
      </section>

      {/* Input */}
      <section className="relative border-b-[3px] border-[var(--ink)] paper py-12 sm:py-16">
        <Halftone />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
          <div className="poster-card grain p-6 sm:p-8 bg-[var(--mustard)]">
            <div className="flex items-center justify-between border-b-2 border-dashed border-[var(--ink)] pb-3">
              <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest">
                Fare Check
              </span>
              <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest">
                YT-FARE
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="stamp-card">
                <div className="text-[10px] font-black uppercase tracking-widest">
                  From
                </div>
                <input
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full bg-transparent font-[family-name:var(--font-heavy)] text-lg outline-none"
                />
              </label>
              <label className="stamp-card">
                <div className="text-[10px] font-black uppercase tracking-widest">
                  To
                </div>
                <input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full bg-transparent font-[family-name:var(--font-heavy)] text-lg outline-none"
                />
              </label>
              <label className="stamp-card">
                <div className="text-[10px] font-black uppercase tracking-widest">
                  Quoted Fare (₹)
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={quoted}
                    onChange={(e) => setQuoted(Number(e.target.value) || 0)}
                    className="w-full bg-transparent font-[family-name:var(--font-heavy)] text-lg outline-none"
                  />
                  <button
                    onClick={() => {
                      setMicActive(true);
                      setTimeout(() => {
                        setMicActive(false);
                        setQuoted(280);
                      }, 1500);
                    }}
                    className={`grid h-10 w-10 shrink-0 place-items-center border-2 border-[var(--ink)] text-lg transition-colors ${
                      micActive
                        ? "bg-[var(--hotpink)] text-[var(--cream)] animate-pulse"
                        : "bg-[var(--cream)]"
                    }`}
                    title="Tap to speak the fare"
                  >
                    🎤
                  </button>
                </div>
              </label>
              <div className="stamp-card">
                <div className="text-[10px] font-black uppercase tracking-widest">
                  Transport
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(["auto", "cab", "rickshaw", "ebike"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`chip capitalize ${
                        mode === m
                          ? "!bg-[var(--hotpink)] !text-[var(--cream)]"
                          : ""
                      }`}
                    >
                      {m === "auto"
                        ? "🛺"
                        : m === "cab"
                          ? "🚕"
                          : m === "rickshaw"
                            ? "🚲"
                            : "🛵"}{" "}
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleCheck}
              disabled={analyzing}
              className="btn-poster mt-6 w-full justify-center"
            >
              {analyzing ? "🔍 Checking fare…" : "🛡️ Shield Me"}
            </button>
          </div>
        </div>
      </section>

      {/* Result */}
      {result && (
        <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--cream)] py-12 sm:py-16">
          <Halftone />
          <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
            {/* Verdict banner */}
            <div
              className={`poster-card grain ${verdictColors[result.verdict].bg} ${verdictColors[result.verdict].text} p-6`}
            >
              <div className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-[0.3em]">
                {verdictColors[result.verdict].label}
              </div>
              <div className="mt-3 flex items-baseline justify-between gap-4">
                <div>
                  <div className="text-xs opacity-80">Quoted</div>
                  <div className="font-[family-name:var(--font-display)] text-5xl">
                    ₹{quoted}
                  </div>
                </div>
                <div className="font-[family-name:var(--font-display)] text-3xl opacity-60">
                  vs
                </div>
                <div>
                  <div className="text-xs opacity-80">Fair fare</div>
                  <div className="font-[family-name:var(--font-display)] text-5xl">
                    ₹{result.fairFare}
                  </div>
                </div>
              </div>

              {/* Distance & fare bar */}
              <div className="mt-4">
                <div className="text-xs opacity-80">
                  ~{result.distanceKm}km · {mode}
                </div>
                <div className="mt-2 h-4 w-full border-2 border-current/30 bg-black/20">
                  <div
                    className="h-full bg-white/80 transition-all"
                    style={{
                      width: `${Math.min(100, (quoted / (result.fairFare * 2.5)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Reasoning */}
            <div className="mt-6 poster-card grain p-5">
              <div className="text-xs font-black uppercase tracking-widest text-[var(--hotpink)]">
                💡 Reasoning
              </div>
              <p className="mt-2 text-sm leading-relaxed">{result.reasoning}</p>
            </div>

            {/* Counter-offer */}
            {result.verdict !== "fair" && (
              <div className="mt-4 poster-card grain p-5 bg-[var(--dusk)] text-[var(--cream)]">
                <div className="text-xs font-black uppercase tracking-widest text-[var(--mustard)]">
                  🗣️ Say This
                </div>
                <p className="mt-2 font-[family-name:var(--font-heavy)] text-lg">
                  {result.counterOffer}
                </p>
                <p className="mt-2 font-[family-name:var(--font-hand)] text-xl text-[var(--mustard)]">
                  {result.counterOfferHindi}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => {
                  setResult(null);
                  setQuoted(0);
                }}
                className="btn-poster"
              >
                Check Another Fare
              </button>
              <Link to="/trip-generator" className="btn-ghost">
                Plan a Trip →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Demo tag */}
      <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--cream)] py-8">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="stamp-card inline-block">
            <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest text-muted-foreground">
              🧪 Demo only — mock fare data. Real version uses Gemma + live fare databases + GPS distance
              to compute exact fair fares for your city.
            </span>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
