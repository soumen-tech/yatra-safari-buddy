import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell, Halftone, StampTag } from "@/components/yatra";

export const Route = createFileRoute("/expense-tracker")({
  head: () => ({
    meta: [
      { title: "Expense Tracker — YatraAI" },
      {
        name: "description",
        content:
          "Snap a receipt or speak an amount. Auto-categorized, live budget gauge, and a full breakdown at the end.",
      },
    ],
  }),
  component: ExpenseTrackerPage,
});

/* ────── types & mock data ────── */

type Category = "Food" | "Transport" | "Stay" | "Activity" | "Shopping" | "Other";

interface Expense {
  id: number;
  title: string;
  amount: number;
  category: Category;
  time: string;
  source: "photo" | "voice" | "manual";
}

const mockReceipts: Omit<Expense, "id" | "time">[] = [
  { title: "Parotta + chai — bus stand stall", amount: 45, category: "Food", source: "photo" },
  { title: "Auto — station to hostel", amount: 80, category: "Transport", source: "photo" },
  { title: "Fish thali — Dada's Dhaba", amount: 110, category: "Food", source: "photo" },
  { title: "Museum entry ticket", amount: 30, category: "Activity", source: "photo" },
  { title: "Scarf from Hathi Pol", amount: 150, category: "Shopping", source: "photo" },
  { title: "Bottled water + biscuits", amount: 35, category: "Food", source: "photo" },
];

const mockVoice: Omit<Expense, "id" | "time">[] = [
  { title: "Chai, 20 rupees", amount: 20, category: "Food", source: "voice" },
  { title: "Shared auto to temple, 30", amount: 30, category: "Transport", source: "voice" },
  { title: "Banana from fruit stall, 10", amount: 10, category: "Food", source: "voice" },
  { title: "Boat ride, 100 rupees", amount: 100, category: "Activity", source: "voice" },
];

const categoryEmojis: Record<Category, string> = {
  Food: "🍛",
  Transport: "🛺",
  Stay: "🏠",
  Activity: "🎟️",
  Shopping: "🛍️",
  Other: "📦",
};

/* ────── page ────── */

function ExpenseTrackerPage() {
  const [dailyBudget] = useState(1200);
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: 1, title: "Chai", amount: 15, category: "Food", time: "7:30 AM", source: "voice" },
    { id: 2, title: "Auto — Sealdah to Kalighat", amount: 90, category: "Transport", time: "8:15 AM", source: "manual" },
    { id: 3, title: "Hostel bunk (1 night)", amount: 420, category: "Stay", time: "Check-in", source: "manual" },
  ]);
  const [scanning, setScanning] = useState(false);
  const [listening, setListening] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  let nextId = expenses.length + 1;

  const totalSpent = expenses.reduce((a, b) => a + b.amount, 0);
  const pct = Math.min(100, (totalSpent / dailyBudget) * 100);
  const gaugeColor =
    pct < 50 ? "bg-green-500" : pct < 80 ? "bg-amber-500" : "bg-[var(--hotpink)]";
  const gaugeLabel =
    pct < 50
      ? "Looking good"
      : pct < 80
        ? "Spending picking up"
        : pct < 100
          ? "Almost at limit"
          : "Over budget!";

  const handlePhoto = () => {
    setScanning(true);
    setTimeout(() => {
      const receipt = mockReceipts[Math.floor(Math.random() * mockReceipts.length)];
      const now = new Date();
      setExpenses((prev) => [
        {
          ...receipt,
          id: nextId++,
          time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`,
        },
        ...prev,
      ]);
      setScanning(false);
    }, 1000);
  };

  const handleVoice = () => {
    setListening(true);
    setTimeout(() => {
      const voice = mockVoice[Math.floor(Math.random() * mockVoice.length)];
      const now = new Date();
      setExpenses((prev) => [
        {
          ...voice,
          id: nextId++,
          time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`,
        },
        ...prev,
      ]);
      setListening(false);
    }, 1200);
  };

  // Category breakdown
  const byCat = expenses.reduce(
    (acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--hotpink)] py-16 text-[var(--cream)] sm:py-20">
        <Halftone />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <span className="chip !bg-[var(--cream)] !text-[var(--ink)]">
            Core Flow 03
          </span>
          <h1 className="poster-title mt-4 text-[clamp(2.5rem,8vw,6rem)]">
            EXPENSE TRACKER
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-[var(--cream)]/90">
            Snap a bill. Speak an amount. YatraAI categorizes it, tracks your
            burn rate, and nudges you before you overspend — not after.
          </p>
        </div>
      </section>

      {/* Budget Gauge */}
      <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--cream)] py-10 sm:py-12">
        <Halftone />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
          <div className="poster-card grain p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Today's budget
                </div>
                <div className="font-[family-name:var(--font-display)] text-3xl">
                  ₹{dailyBudget.toLocaleString("en-IN")}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Spent
                </div>
                <div
                  className={`font-[family-name:var(--font-display)] text-3xl ${pct >= 100 ? "text-[var(--hotpink)]" : ""}`}
                >
                  ₹{totalSpent.toLocaleString("en-IN")}
                </div>
              </div>
            </div>

            {/* Fuel gauge */}
            <div className="mt-4">
              <div className="h-6 w-full border-[3px] border-[var(--ink)] bg-[var(--cream)]">
                <div
                  className={`h-full ${gaugeColor} transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs font-black uppercase tracking-widest">
                <span className="text-muted-foreground">{gaugeLabel}</span>
                <span
                  className={
                    pct >= 100
                      ? "text-[var(--hotpink)]"
                      : pct >= 80
                        ? "text-amber-600"
                        : "text-green-600"
                  }
                >
                  {pct >= 100
                    ? `₹${(totalSpent - dailyBudget).toLocaleString("en-IN")} over`
                    : `₹${(dailyBudget - totalSpent).toLocaleString("en-IN")} remaining`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capture buttons */}
      <section className="relative border-b-[3px] border-[var(--ink)] paper py-8">
        <div className="relative mx-auto flex max-w-3xl flex-wrap justify-center gap-3 px-4 sm:px-6">
          <button onClick={handlePhoto} disabled={scanning} className="btn-poster">
            📷 {scanning ? "Reading bill…" : "Snap a receipt"}
          </button>
          <button
            onClick={handleVoice}
            disabled={listening}
            className={`btn-poster !bg-[var(--dusk)] ${listening ? "animate-pulse" : ""}`}
          >
            🎤 {listening ? "Listening…" : "Speak amount"}
          </button>
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="btn-ghost"
          >
            📊 {showBreakdown ? "Hide" : "Show"} breakdown
          </button>
        </div>
      </section>

      {/* Breakdown */}
      {showBreakdown && (
        <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--dusk)] py-10 text-[var(--cream)]">
          <Halftone />
          <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
            <StampTag tone="mustard">Category Breakdown</StampTag>
            <div className="mt-6 space-y-3">
              {Object.entries(byCat)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, amt]) => {
                  const catPct = Math.round((amt / totalSpent) * 100);
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-[family-name:var(--font-heavy)] uppercase tracking-widest">
                          {categoryEmojis[cat as Category]} {cat}
                        </span>
                        <span className="font-[family-name:var(--font-display)] text-xl text-[var(--mustard)]">
                          ₹{amt} ({catPct}%)
                        </span>
                      </div>
                      <div className="mt-1 h-3 w-full border-2 border-[var(--cream)]/30 bg-[var(--ink)]">
                        <div
                          className="h-full bg-[var(--mustard)] transition-all"
                          style={{ width: `${catPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </section>
      )}

      {/* Expense list */}
      <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--cream)] py-10 sm:py-12">
        <Halftone />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mb-6 flex items-center justify-between">
            <StampTag tone="pink">Today's Log</StampTag>
            <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest text-muted-foreground">
              {expenses.length} entries
            </span>
          </div>

          <div className="divide-y-2 divide-dashed divide-[var(--ink)] border-y-[3px] border-[var(--ink)]">
            {expenses.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between py-4 px-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {categoryEmojis[e.category]}
                  </span>
                  <div>
                    <div className="font-[family-name:var(--font-heavy)] text-sm uppercase tracking-widest">
                      {e.title}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{e.category}</span>
                      <span>·</span>
                      <span>{e.time}</span>
                      <span>·</span>
                      <span className="chip !text-[8px] !py-0 !px-1">
                        {e.source === "photo"
                          ? "📷"
                          : e.source === "voice"
                            ? "🎤"
                            : "✍️"}{" "}
                        {e.source}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="font-[family-name:var(--font-display)] text-2xl">
                  ₹{e.amount}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm">
              Total:{" "}
              <b className="font-[family-name:var(--font-display)] text-xl">
                ₹{totalSpent}
              </b>
            </span>
            <Link to="/trip-story" className="btn-ghost text-xs">
              Generate Trip Story →
            </Link>
          </div>
        </div>
      </section>

      {/* Demo tag */}
      <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--cream)] py-8">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="stamp-card inline-block">
            <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest text-muted-foreground">
              🧪 Demo only — simulated receipt OCR and voice input. Real version uses Gemma vision for receipt reading
              and Whisper for voice-to-expense in Hindi/Bengali/Tamil.
            </span>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
