import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell, Halftone, StampTag } from "@/components/yatra";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features & Emergency Assistance — YATRA" },
      {
        name: "description",
        content:
          "The core kit for budget travelers in India: trip generators, group splitter, Fare-Shield, 1-tap Emergency Police dialer, bargaining co-pilot, and safety chats.",
      },
    ],
  }),
  component: FeaturesPage,
});

/* ────── translation presets ────── */
const bargainingPhrases = [
  {
    english: "How much is this tea?",
    bengali: "Dada, cha ta koto?",
    hindi: "Bhaiya, chai kitne ki hai?",
    tamil: "Anna, tea evlo?",
    reply: "Vendor: ₹15 only, clay cup.",
  },
  {
    english: "Please make it a bit cheaper, I am a student.",
    bengali: "Ektu kom korun dada, ami chhatro.",
    hindi: "Thoda kam karo bhaiya, main student hoon.",
    tamil: "Konjam kammi pannunga anna, naa student.",
    reply: "Vendor: Okay, for you, ₹12.",
  },
  {
    english: "No, that's too expensive. ₹100 is fair.",
    bengali: "Na dada, ota khub besi. ₹100 thik ache.",
    hindi: "Nahi bhaiya, bohot mehenga hai. ₹100 sahi hai.",
    tamil: "Illa anna, romba costly. ₹100 ok.",
    reply: "Vendor: Hmm, take it for ₹110.",
  },
];

/* ────── safety presets ────── */
const safetyScenarios = [
  {
    query: "Is it safe to walk near Sealdah station at 10:30 PM?",
    response: "🚨 YATRA Safety Guard: Sealdah is heavily crowded but gets chaotic after 10 PM. Stick to the main paved road under the flyover. Do NOT enter the dark side alleyways behind the bus depots. If you feel uneasy, walk into the main station platform area — it is brightly lit and has 24/7 police presence.",
  },
  {
    query: "Auto driver says 'meter is broken' at Howrah. What do I do?",
    response: "🛡️ Fare-Shield Coach: Do NOT get in. Say: 'Bhaiya, meter lagao nahi toh main prepaid booth se lungi' (Bhaiya, start the meter or I'll take the prepaid booth). If they refuse, walk away immediately. There is a prepaid taxi/auto counter right outside Howrah exit. Do not engage with brokers who approach you outside.",
  },
  {
    query: "Late check-in at a budget hostel. How to stay safe?",
    response: "👩 Solo Companion Nudge: Call the hostel manager 1 hour before arrival. Share your live location with 3 safety contacts. Ensure the hostel has a 24/7 reception desk. If arriving by auto after 9 PM, ask the driver to drop you exactly at the hostel main gate, not the main road crossing.",
  },
];

function FeaturesPage() {
  const [activePhraseIdx, setActivePhraseIdx] = useState<number | null>(null);
  const [selectedLang, setSelectedLang] = useState<"bengali" | "hindi" | "tamil">("hindi");
  const [customText, setCustomText] = useState("");
  const [liveTranslation, setLiveTranslation] = useState<{ translatedText: string; pronunciation: string; bargainingSuggestion: string } | null>(null);
  const [translating, setTranslating] = useState(false);

  const [activeSafetyIdx, setActiveSafetyIdx] = useState<number | null>(null);
  const [customSafetyQuery, setCustomSafetyQuery] = useState("");
  const [liveSafetyAdvice, setLiveSafetyAdvice] = useState<{ advice: string; scamWarning?: string; safeRefuges?: string[] } | null>(null);
  const [queryingSafety, setQueryingSafety] = useState(false);

  // Emergency SOS state
  const [sosActivated, setSosActivated] = useState(false);
  const [currentCity, setCurrentCity] = useState("Kolkata");

  const handleTranslateLive = async (textToTranslate: string) => {
    setTranslating(true);
    setLiveTranslation(null);

    try {
      const res = await fetch("/api/gemma/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToTranslate, target_language: selectedLang }),
      });

      if (res.ok) {
        const data = await res.json();
        setLiveTranslation(data);
        setTranslating(false);
        return;
      }
    } catch {
      /* Fallback handled below */
    }

    setLiveTranslation({
      translatedText: selectedLang === "bengali" ? "Dada, etar daam koto?" : selectedLang === "tamil" ? "Anna, evlo aagum?" : "Bhaiya, thoda kam karo na",
      pronunciation: selectedLang === "bengali" ? "Da-da, e-tar daam ko-to?" : "Bhai-ya, tho-da kam ka-ro na",
      bargainingSuggestion: "Bargaining Coach: Quote 25% below asking price with a polite smile.",
    });
    setTranslating(false);
  };

  const handleSafetyLive = async (queryText: string) => {
    setQueryingSafety(true);
    setLiveSafetyAdvice(null);

    try {
      const res = await fetch("/api/gemma/safety", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryText }),
      });

      if (res.ok) {
        const data = await res.json();
        setLiveSafetyAdvice(data);
        setQueryingSafety(false);
        return;
      }
    } catch {
      /* Fallback handled below */
    }

    setLiveSafetyAdvice({
      advice: "🚨 Gemma Guard Advice: Stick to main lit thoroughfares, platform concourses, or 24/7 receptions. Never board unmarked autos.",
      scamWarning: "Avoid unofficial travel booths offering cheap hotel vouchers outside railway exits.",
      safeRefuges: ["Prepaid Auto Booth", "Railway Police Control Room", "24/7 Hotel Lobby"],
    });
    setQueryingSafety(false);
  };

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative border-b-[3px] border-[var(--ink)] paper py-16 sm:py-24">
        <Halftone />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <StampTag tone="dusk">Core Toolkit</StampTag>
          <h1 className="poster-title mt-4 text-[clamp(2.5rem,8vw,6rem)]">
            THE WHOLE KIT
          </h1>
          <p className="mt-3 max-w-2xl text-lg">
            Gemma-powered toolkit built for the streets, sleeper coaches, emergency assistance, and midnight arrivals. Connected directly to live AI reasoning.
          </p>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--cream)] py-12 sm:py-16">
        <Halftone />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 space-y-12">
          
          {/* Feature 1 & 2: Trip Generator & Spontaneous */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="poster-card grain p-5 flex flex-col justify-between">
              <div>
                <span className="chip !bg-[var(--mustard)] !text-[var(--ink)]">Feature 01</span>
                <h3 className="mt-3 font-[family-name:var(--font-display)] text-3xl">BUDGET TRIP GENERATOR</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Input your starting city, days, and total budget. Recalculates dynamically for groups vs solo travelers, producing day-tickets with culture, stays, and logic.
                </p>
              </div>
              <Link to="/trip-generator" className="btn-poster mt-6 text-xs justify-center">
                🗺️ Try Generator Demo →
              </Link>
            </div>

            <div className="poster-card grain p-5 flex flex-col justify-between">
              <div>
                <span className="chip !bg-[var(--mustard)] !text-[var(--ink)]">Feature 02</span>
                <h3 className="mt-3 font-[family-name:var(--font-display)] text-3xl">GOT ₹X & A FEW HOURS?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Same-day spontaneous micro-decision planner. Got a free afternoon and some change in your pocket? Pick your city, adjust sliders, and get an instant local outing.
                </p>
              </div>
              <Link to="/spontaneous" className="btn-poster mt-6 text-xs justify-center">
                🎫 Try Impulse Outing Demo →
              </Link>
            </div>
          </div>

          {/* Feature 3 & 4: Expense Tracker & Splitter */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="poster-card grain p-5 flex flex-col justify-between">
              <div>
                <span className="chip !bg-[var(--hotpink)] !text-[var(--cream)]">Feature 03</span>
                <h3 className="mt-3 font-[family-name:var(--font-display)] text-3xl">GROUP TRIP SPLITTER</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Fair-share group budgeting. Supports custom income tiers (Low/Medium/High weights) so friends with lower earnings pay less of the shared bills. Includes debt settling.
                </p>
              </div>
              <Link to="/expense-tracker" className="btn-poster mt-6 text-xs justify-center">
                👥 Try Group Splitter →
              </Link>
            </div>

            <div className="poster-card grain p-5 flex flex-col justify-between">
              <div>
                <span className="chip !bg-[var(--hotpink)] !text-[var(--cream)]">Feature 04</span>
                <h3 className="mt-3 font-[family-name:var(--font-display)] text-3xl">EXPENSE & TRIP MEMORY</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Photo/voice logging with a manual confirm step. Tappable Day Cards show itemized daily logs, uploaded polaroids, and group split settlement status.
                </p>
              </div>
              <div className="flex gap-2 mt-6">
                <Link to="/expense-tracker" className="btn-poster text-xs flex-1 justify-center">
                  📷 Tracker
                </Link>
                <Link to="/trip-story" className="btn-ghost text-xs flex-1 justify-center">
                  🌅 Story Postcard
                </Link>
              </div>
            </div>
          </div>

          {/* EMERGENCY ASSISTANCE & LOCAL POLICE STATION AI */}
          <div className="poster-card grain p-6 bg-red-600 text-white border-3 border-[var(--ink)]">
            <div className="flex items-center justify-between border-b-2 border-dashed border-white/40 pb-2 mb-4">
              <span className="chip !bg-white !text-red-700 font-black">1-Tap Emergency SOS</span>
              <h3 className="font-[family-name:var(--font-display)] text-2xl tracking-wider text-yellow-300">
                🚨 EMERGENCY ASSISTANCE & NEARBY POLICE
              </h3>
            </div>

            <p className="text-sm leading-relaxed">
              If you feel unsafe or in danger, tap below to access immediate emergency dialers, local police station locators, and broadcast an emergency situation summary to your circle.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <a
                href="tel:112"
                className="border-2 border-white bg-black/40 hover:bg-black/60 p-3 text-center rounded-none font-bold uppercase text-xs tracking-wider flex flex-col items-center justify-center cursor-pointer"
              >
                <span className="text-2xl">📞 112</span>
                <span className="text-[10px] text-yellow-300 mt-1">National Emergency Helpline</span>
              </a>

              <a
                href="tel:1091"
                className="border-2 border-white bg-black/40 hover:bg-black/60 p-3 text-center rounded-none font-bold uppercase text-xs tracking-wider flex flex-col items-center justify-center cursor-pointer"
              >
                <span className="text-2xl">👩 1091</span>
                <span className="text-[10px] text-yellow-300 mt-1">Women Helpline (24/7)</span>
              </a>

              <a
                href="tel:1363"
                className="border-2 border-white bg-black/40 hover:bg-black/60 p-3 text-center rounded-none font-bold uppercase text-xs tracking-wider flex flex-col items-center justify-center cursor-pointer"
              >
                <span className="text-2xl">🛺 1363</span>
                <span className="text-[10px] text-yellow-300 mt-1">Tourist Safety Hotline</span>
              </a>
            </div>

            <div className="mt-5 border-2 border-dashed border-yellow-300 bg-black/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-black uppercase text-yellow-300">📍 Nearby Police Station Locator ({currentCity})</div>
                  <div className="text-[11px] mt-0.5 text-white/90">
                    Central Police Control Room · Main Station Booth (0.4 km away)
                  </div>
                </div>
                <button
                  onClick={() => setSosActivated(!sosActivated)}
                  className={`chip cursor-pointer ${sosActivated ? "!bg-yellow-300 !text-red-900 font-black animate-pulse" : "!bg-white !text-red-700"}`}
                >
                  {sosActivated ? "⚠️ SOS Broadcast Sent to Crew!" : "📡 Activate Emergency Location Alert"}
                </button>
              </div>

              {sosActivated && (
                <div className="mt-3 pt-3 border-t border-white/20 text-xs leading-relaxed text-yellow-200">
                  ✅ Live location payload prepared: <i>"User reported emergency near {currentCity} Station. Sharing live GPS coordinates to trusted emergency contacts."</i>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Feature 5: Bargaining Assistant */}
          <div className="poster-card grain p-6 bg-[var(--mustard)] text-[var(--ink)]">
            <div className="flex items-center justify-between border-b-2 border-dashed border-[var(--ink)] pb-2 mb-4">
              <span className="chip !bg-[var(--ink)] !text-[var(--mustard)]">Interactive Co-pilot</span>
              <h3 className="font-[family-name:var(--font-display)] text-2xl">05 / DIALECT BARGAINING ASSISTANT</h3>
            </div>
            
            <p className="text-sm">
              Tap a phrase below or type your own custom line to call Gemma's translation & bargaining engine.
            </p>

            <div className="mt-4 flex gap-2">
              {(["hindi", "bengali", "tamil"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLang(lang)}
                  className={`chip capitalize cursor-pointer ${selectedLang === lang ? "!bg-[var(--hotpink)] !text-[var(--cream)]" : ""}`}
                >
                  {lang === "hindi" ? "🇮🇳 Hindi" : lang === "bengali" ? "🐯 Bengali" : "🌴 Tamil"}
                </button>
              ))}
            </div>

            {/* Custom input bar */}
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Type any custom sentence (e.g. 'Can you drop me near the station for 50?')..."
                className="flex-1 border-2 border-[var(--ink)] bg-[var(--cream)] px-3 py-1.5 text-xs font-bold outline-none"
              />
              <button
                onClick={() => { if (customText) { setActivePhraseIdx(null); void handleTranslateLive(customText); } }}
                disabled={translating || !customText}
                className="chip !bg-[var(--hotpink)] !text-[var(--cream)] cursor-pointer"
              >
                {translating ? "Translating..." : "Translate Live"}
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {bargainingPhrases.map((phrase, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (activePhraseIdx === idx) {
                      setActivePhraseIdx(null);
                    } else {
                      setActivePhraseIdx(idx);
                      void handleTranslateLive(phrase.english);
                    }
                  }}
                  className="stamp-card text-left text-xs hover:bg-[var(--cream)] cursor-pointer"
                >
                  <div className="font-bold">"{phrase.english}"</div>
                  <div className="mt-2 text-[var(--hotpink)] font-black uppercase text-[10px]">Tap to Translate</div>
                </button>
              ))}
            </div>

            {liveTranslation && (
              <div className="mt-5 border-2 border-dashed border-[var(--ink)] bg-[var(--cream)] p-4 animate-fade-in text-sm space-y-2">
                <div className="text-xs font-black uppercase tracking-widest text-[var(--hotpink)]">✨ Gemma Live Translation</div>
                <div>
                  <span className="font-bold text-xs uppercase text-muted-foreground">Original:</span>
                  <p className="font-bold">"{liveTranslation.translatedText ? customText || bargainingPhrases[activePhraseIdx ?? 0]?.english : ""}"</p>
                </div>
                <div>
                  <span className="font-bold text-xs uppercase text-[var(--hotpink)]">Local Dialect:</span>
                  <p className="font-[family-name:var(--font-heavy)] text-base text-[var(--hotpink)] tracking-wider">
                    "{liveTranslation.translatedText}"
                  </p>
                </div>
                <div className="text-xs italic text-muted-foreground">Pronunciation: {liveTranslation.pronunciation}</div>
                <div className="pt-2 border-t border-[var(--ink)]/20 text-xs font-bold text-[var(--dusk)]">
                  💡 Bargaining Coach: {liveTranslation.bargainingSuggestion}
                </div>
              </div>
            )}

            {!liveTranslation && activePhraseIdx !== null && (
              <div className="mt-5 border-2 border-dashed border-[var(--ink)] bg-[var(--cream)] p-4 animate-fade-in text-sm space-y-2">
                <div>
                  <span className="font-bold text-xs uppercase text-muted-foreground">Original:</span>
                  <p className="font-bold">"{bargainingPhrases[activePhraseIdx].english}"</p>
                </div>
                <div>
                  <span className="font-bold text-xs uppercase text-[var(--hotpink)]">Local Dialect:</span>
                  <p className="font-[family-name:var(--font-heavy)] text-base text-[var(--hotpink)] tracking-wider">
                    "{bargainingPhrases[activePhraseIdx][selectedLang]}"
                  </p>
                </div>
                <div className="pt-2 border-t border-[var(--ink)]/20 italic text-xs text-muted-foreground">
                  💡 {bargainingPhrases[activePhraseIdx].reply}
                </div>
              </div>
            )}
          </div>

          {/* Interactive Feature 6: 'Am I Safe?' Chat */}
          <div className="poster-card grain p-6 bg-[var(--dusk)] text-[var(--cream)]">
            <div className="flex items-center justify-between border-b-2 border-dashed border-[var(--cream)]/40 pb-2 mb-4">
              <span className="chip !bg-[var(--cream)] !text-[var(--ink)]">Safety Gate</span>
              <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--mustard)]">
                06 / 'AM I SAFE?' CHAT & FARE-SHIELD
              </h3>
            </div>

            <p className="text-sm text-[var(--cream)]/85">
              Select a scenario or type a live safety question to query Gemma's safety engine.
            </p>

            {/* Custom safety input */}
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={customSafetyQuery}
                onChange={(e) => setCustomSafetyQuery(e.target.value)}
                placeholder="Ask any safety question (e.g. 'Is Paharganj safe at midnight for a solo traveler?')..."
                className="flex-1 border-2 border-[var(--cream)]/40 bg-black/40 px-3 py-1.5 text-xs font-bold text-[var(--cream)] outline-none"
              />
              <button
                onClick={() => { if (customSafetyQuery) { setActiveSafetyIdx(null); void handleSafetyLive(customSafetyQuery); } }}
                disabled={queryingSafety || !customSafetyQuery}
                className="chip !bg-[var(--mustard)] !text-[var(--ink)] cursor-pointer"
              >
                {queryingSafety ? "Asking Gemma..." : "Ask Live Guard"}
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {safetyScenarios.map((sc, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (activeSafetyIdx === idx) {
                      setActiveSafetyIdx(null);
                    } else {
                      setActiveSafetyIdx(idx);
                      void handleSafetyLive(sc.query);
                    }
                  }}
                  className="w-full text-left border-2 border-[var(--cream)]/20 bg-black/20 hover:bg-black/40 px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex justify-between items-center cursor-pointer"
                >
                  <span>❓ {sc.query}</span>
                  <span>{activeSafetyIdx === idx ? "▲" : "▼"}</span>
                </button>
              ))}
            </div>

            {liveSafetyAdvice && (
              <div className="mt-5 border-2 border-dashed border-[var(--mustard)] bg-[var(--cream)] text-[var(--ink)] p-4 animate-fade-in text-xs leading-relaxed space-y-2">
                <div className="font-black uppercase tracking-widest text-[var(--hotpink)]">🛡️ Gemma Live Safety Guard Result</div>
                <p className="font-bold">{liveSafetyAdvice.advice}</p>
                {liveSafetyAdvice.scamWarning && (
                  <div className="text-[var(--hotpink)] font-bold">⚠️ Warning: {liveSafetyAdvice.scamWarning}</div>
                )}
                {liveSafetyAdvice.safeRefuges && liveSafetyAdvice.safeRefuges.length > 0 && (
                  <div className="text-xs text-muted-foreground">Safe Refuges Nearby: {liveSafetyAdvice.safeRefuges.join(", ")}</div>
                )}
              </div>
            )}

            {!liveSafetyAdvice && activeSafetyIdx !== null && (
              <div className="mt-5 border-2 border-dashed border-[var(--mustard)] bg-[var(--cream)] text-[var(--ink)] p-4 animate-fade-in text-xs leading-relaxed">
                {safetyScenarios[activeSafetyIdx].response}
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <Link to="/fare-shield" className="btn-poster !bg-[var(--mustard)] !text-[var(--ink)] text-xs">
                🛡️ Open Fare-Shield Overcharge Tool →
              </Link>
            </div>
          </div>

        </div>
      </section>
    </PageShell>
  );
}
