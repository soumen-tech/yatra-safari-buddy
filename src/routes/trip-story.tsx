import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageShell, Halftone, StampTag } from "@/components/yatra";

export const Route = createFileRoute("/trip-story")({
  head: () => ({
    meta: [
      { title: "Trip Story Generator — YatraAI" },
      {
        name: "description",
        content:
          "Your photos, expenses, and voice notes — stitched into a story worth sharing. Postcard style, WhatsApp-ready.",
      },
    ],
  }),
  component: TripStoryPage,
});

/* ────── types & sample data ────── */

interface TripDay {
  day: number;
  city: string;
  spent: number;
  highlights: string[];
  photos: string[]; // photo descriptions/captions
  isSettled: boolean;
}

const initialTripDays: TripDay[] = [
  {
    day: 1,
    city: "Kolkata",
    spent: 135,
    highlights: ["Howrah Bridge at dawn", "Tiretti Bazaar breakfast", "Tram from Esplanade"],
    photos: ["🌅 Howrah Bridge in orange haze", "🥟 Steaming street dumplings"],
    isSettled: false,
  },
  {
    day: 2,
    city: "Kolkata",
    spent: 180,
    highlights: ["Victoria Memorial", "Kumartuli potters", "College Street books"],
    photos: ["🏛️ Victoria Memorial reflection pool", "🎨 Clay Durga eye paint close-up"],
    isSettled: true,
  },
  {
    day: 3,
    city: "Kolkata",
    spent: 120,
    highlights: ["Kalighat temple", "South Park Cemetery", "Park Street dinner"],
    photos: ["🛕 Temple gates early morning", "🪦 Mossy banyan cemetery path"],
    isSettled: false,
  },
  {
    day: 4,
    city: "Kolkata",
    spent: 35,
    highlights: ["Flower market", "Indian Museum", "Departure chai"],
    photos: ["💐 Bundles of marigold at Howrah", "☕ Earthen cup chai at platform"],
    isSettled: true,
  },
];

const stories = [
  {
    title: "Kolkata, 4 days, ₹3,120 spent.",
    body: `You got off at Howrah before sunrise. A tram woke you up before your alarm did. The Victoria Memorial in the rain was smaller than the photos said, and much bigger than you expected.

You paid 15 rupees too much for a rickshaw and 15 rupees too little for a fish thali — and both felt like winning. The potters in Kumartuli didn't look up when you walked in; they were painting Durga's eyes, and you understood why the city doesn't rush.

On the last night, someone on College Street handed you a book you didn't ask for. You brought it home. The chai on the train platform tasted better than anything from any café, and you already know you'll be back — not because you have to, but because Kolkata doesn't let go that easy.`,
    tags: ["#kolkata", "#soloTrip", "#underBudget", "#cityOfJoy"],
  },
  {
    title: "Varanasi, 3 days, ₹1,850 spent.",
    body: `The ghats hit you before the sun did. You could hear the bells from the hostel roof at 4:30am and decided sleep could wait. The boat ride was ₹100 and worth ₹10,000 in memories.

You ate lassi from a clay cup at a shop with no name and no Google review. The lassi didn't care. It was perfect. The evening aarti was loud and beautiful and confusing and you stood there with a thousand strangers who were all having the same private moment.

A sadhu asked where you were from. You told him. He said "good" and walked away. That was enough. The train home smelled like incense and you didn't wash the smell off your bag for a week.`,
    tags: ["#varanasi", "#spiritual", "#budgetTravel", "#gangaVibes"],
  },
];

function TripStoryPage() {
  const [generating, setGenerating] = useState(false);
  const [storyIndex, setStoryIndex] = useState<number | null>(null);
  const [typing, setTyping] = useState(false);
  const [displayedChars, setDisplayedChars] = useState(0);

  // Expanded day card state
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  // Group split details from Expense page
  const [loggedExpenses, setLoggedExpenses] = useState<any[]>([]);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);

  useEffect(() => {
    const storedExp = localStorage.getItem("yatra_expenses");
    const storedMem = localStorage.getItem("yatra_members");
    if (storedExp) {
      try {
        setLoggedExpenses(JSON.parse(storedExp));
      } catch (e) {}
    }
    if (storedMem) {
      try {
        setGroupMembers(JSON.parse(storedMem));
      } catch (e) {}
    }
  }, []);

  // Map expenses to specific days
  const getExpensesForDay = (day: number) => {
    // If we have actual logged expenses from the Expense Tracker,
    // we map them. For demonstration, we mix them with mock itemized details.
    if (day === 1 && loggedExpenses.length > 0) {
      return loggedExpenses.map((e) => ({
        title: e.title,
        amount: e.amount,
        paidBy: e.paidBy,
        splitMode: e.splitMode,
      }));
    }

    // Default mock items if no user expenses exist
    const mockDetails: Record<number, { title: string; amount: number; paidBy: string; splitMode: string }[]> = {
      1: [
        { title: "Morning tea & biscuits", amount: 45, paidBy: "Rahul", splitMode: "equal" },
        { title: "Auto — station to hostel", amount: 90, paidBy: "Rahul", splitMode: "fair" },
      ],
      2: [
        { title: "Museum Entry Ticket", amount: 30, paidBy: "Rahul", splitMode: "equal" },
        { title: "Fish thali — Dada's Dhaba", amount: 150, paidBy: "Amit", splitMode: "fair" },
      ],
      3: [
        { title: "College Street old books", amount: 120, paidBy: "Rohit", splitMode: "fair" },
      ],
      4: [
        { title: "Ferry across Ganga", amount: 20, paidBy: "Rahul", splitMode: "equal" },
        { title: "Platform tea cups", amount: 15, paidBy: "Rahul", splitMode: "equal" },
      ],
    };

    return mockDetails[day] || [];
  };

  // Get photo cards for each day
  const getPhotosForDay = (day: number) => {
    const defaultPhotos = initialTripDays.find((d) => d.day === day)?.photos || [];
    return defaultPhotos;
  };

  // Compute settlement for each day card
  const getSettlementStatus = (day: number) => {
    const dayData = initialTripDays.find((d) => d.day === day);
    if (!dayData) return "Settled ✓";

    if (groupMembers.length <= 1) {
      return "Solo Trip — All Settled ✓";
    }

    if (dayData.isSettled) {
      return "Group Bill Settled ✓";
    }

    // Generate simulated pending split message based on group members
    const debtor = groupMembers.find((m) => m.name !== "Rahul")?.name || "Amit";
    return `Pending Split: ${debtor} owes Rahul ₹${Math.round(dayData.spent * 0.4)}`;
  };

  const handleGenerate = () => {
    setGenerating(true);
    setStoryIndex(null);
    setDisplayedChars(0);

    setTimeout(() => {
      const idx = Math.floor(Math.random() * stories.length);
      setStoryIndex(idx);
      setGenerating(false);
      setTyping(true);

      // Typing animation
      const story = stories[idx];
      const totalChars = story.body.length;
      let current = 0;
      const interval = setInterval(() => {
        current += 3;
        setDisplayedChars(current);
        if (current >= totalChars) {
          clearInterval(interval);
          setTyping(false);
        }
      }, 8);
    }, 1500);
  };

  const story = storyIndex !== null ? stories[storyIndex] : null;

  // Recalculate spent totals from the itemized day records
  const getDayTotal = (day: number) => {
    return getExpensesForDay(day).reduce((sum, item) => sum + item.amount, 0);
  };

  const totalSpent = [1, 2, 3, 4].reduce((sum, day) => sum + getDayTotal(day), 0);
  const totalPhotosCount = initialTripDays.reduce((sum, d) => sum + d.photos.length, 0);

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--dusk)] py-16 text-[var(--cream)] sm:py-20">
        <Halftone />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <span className="chip !bg-[var(--mustard)]">Core Flow 04</span>
          <h1 className="poster-title mt-4 text-[clamp(2.5rem,8vw,6rem)]">
            TRIP STORY
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-[var(--cream)]/90">
            Stitch your photos, expenses, and voice notes into a visual diary. Tap any day card to view itemized logs, uploads, and split status.
          </p>
        </div>
      </section>

      {/* Trip Data Summary */}
      <section className="relative border-b-[3px] border-[var(--ink)] paper py-12 sm:py-16">
        <Halftone />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
          <StampTag tone="mustard">Your Trip Log</StampTag>
          <h2 className="poster-title mt-4 text-[clamp(1.5rem,4vw,3rem)]">
            TRIP MEMORIES
          </h2>

          {/* Stats ticket */}
          <div className="mt-6 ticket p-5">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest opacity-70">
                  Days
                </div>
                <div className="font-[family-name:var(--font-display)] text-3xl">
                  {initialTripDays.length}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest opacity-70">
                  Photos
                </div>
                <div className="font-[family-name:var(--font-display)] text-3xl">
                  {totalPhotosCount}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest opacity-70">
                  Total Spent
                </div>
                <div className="font-[family-name:var(--font-display)] text-3xl">
                  ₹{totalSpent}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest opacity-70">
                  Crew Size
                </div>
                <div className="font-[family-name:var(--font-display)] text-3xl">
                  {groupMembers.length || 1}
                </div>
              </div>
            </div>
          </div>

          {/* Tappable Day Cards */}
          <div className="mt-6 grid gap-4">
            {initialTripDays.map((d) => {
              const isExpanded = expandedDay === d.day;
              const dayTotal = getDayTotal(d.day);
              const dayExpenses = getExpensesForDay(d.day);
              const dayPhotos = getPhotosForDay(d.day);
              const daySplit = getSettlementStatus(d.day);

              return (
                <div key={d.day} className="poster-card grain flex flex-col transition-all">
                  {/* Tappable Header */}
                  <button
                    onClick={() => setExpandedDay(isExpanded ? null : d.day)}
                    className="w-full text-left flex items-center justify-between px-5 py-4 border-none bg-transparent hover:bg-[var(--mustard)]/10 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-[family-name:var(--font-display)] text-2xl text-[var(--hotpink)]">
                          DAY {d.day}
                        </span>
                        <span className="font-[family-name:var(--font-heavy)] text-sm uppercase tracking-widest">
                          {d.city}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {d.highlights.map((h) => (
                          <span key={h} className="chip !text-[8px] !py-0.5">
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-[family-name:var(--font-display)] text-2xl">
                          ₹{dayTotal}
                        </div>
                        <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                          {dayPhotos.length} Photos
                        </div>
                      </div>
                      <span className="text-lg font-bold text-muted-foreground">
                        {isExpanded ? "▲" : "▼"}
                      </span>
                    </div>
                  </button>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="border-t-2 border-dashed border-[var(--ink)] bg-[var(--cream)] p-5 animate-fade-in space-y-4">
                      
                      {/* Settle up alert */}
                      <div className={`border-2 border-[var(--ink)] px-4 py-2 text-xs font-bold uppercase tracking-widest ${
                        daySplit.includes("Pending") ? "bg-[var(--hotpink)] text-[var(--cream)]" : "bg-green-600 text-white"
                      }`}>
                        🛡️ {daySplit}
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        {/* Itemized Spend list */}
                        <div>
                          <h4 className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest text-[var(--hotpink)] mb-2">
                            Itemized Log
                          </h4>
                          <div className="divide-y-2 divide-dashed divide-[var(--ink)]/20 border-y-2 border-[var(--ink)]/40 bg-[var(--cream)]">
                            {dayExpenses.length === 0 ? (
                              <p className="text-xs text-muted-foreground p-3 italic">No expenses logged for this day.</p>
                            ) : (
                              dayExpenses.map((exp, idx) => (
                                <div key={idx} className="flex justify-between items-center py-2 px-1 text-xs">
                                  <div>
                                    <span className="font-bold uppercase tracking-wider">{exp.title}</span>
                                    <div className="text-[9px] text-muted-foreground mt-0.5">
                                      Paid: {exp.paidBy} ({exp.splitMode === "fair" ? "Fair split" : "Equal split"})
                                    </div>
                                  </div>
                                  <span className="font-[family-name:var(--font-display)] text-lg">₹{exp.amount}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Photo uploads gallery */}
                        <div>
                          <h4 className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest text-[var(--hotpink)] mb-2">
                            Day's Polaroid Gallery
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            {dayPhotos.map((desc, idx) => (
                              <div key={idx} className="border-2 border-[var(--ink)] bg-[var(--cream)] p-2 shadow-[2px_2px_0_var(--ink)] rotate-[1.5deg] even:-rotate-[1.5deg]">
                                <div className="aspect-[4/3] bg-[var(--ink)]/10 border border-[var(--ink)] flex items-center justify-center text-xl">
                                  📸
                                </div>
                                <p className="text-[9px] font-bold text-center mt-2 leading-tight uppercase text-[var(--ink)] tracking-wider">
                                  {desc}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-poster mt-8 w-full justify-center"
          >
            {generating ? "✨ Stitching your postcard..." : "✨ Generate My Postcard Story"}
          </button>
        </div>
      </section>

      {/* Generated Story */}
      {story && (
        <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--dusk)] py-12 text-[var(--cream)] sm:py-16">
          <Halftone />
          <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
            {/* Postcard frame */}
            <div className="poster-card grain bg-[var(--cream)] p-6 text-[var(--ink)] sm:p-8">
              <div className="flex items-center justify-between border-b-2 border-dashed border-[var(--ink)] pb-3">
                <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest text-[var(--hotpink)]">
                  Postcard
                </span>
                <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest text-muted-foreground">
                  YatraAI Story
                </span>
              </div>

              <div className="mt-4 font-[family-name:var(--font-hand)] text-3xl leading-tight text-[var(--hotpink)]">
                {story.title}
              </div>

              <div className="mt-4 space-y-3 text-sm leading-relaxed">
                {story.body
                  .substring(0, displayedChars)
                  .split("\n\n")
                  .map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                {typing && (
                  <span className="inline-block h-4 w-1 animate-pulse bg-[var(--hotpink)]" />
                )}
              </div>

              {!typing && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {story.tags.map((tag) => (
                    <StampTag
                      key={tag}
                      tone={
                        tag.includes("solo") || tag.includes("spiritual")
                          ? "pink"
                          : tag.includes("budget") || tag.includes("under")
                            ? "dusk"
                            : "mustard"
                      }
                    >
                      {tag}
                    </StampTag>
                  ))}
                </div>
              )}

              <div className="mt-6 flex items-end justify-between border-t-2 border-dashed border-[var(--ink)] pt-3">
                <div className="text-xs text-muted-foreground">
                  Generated by YatraAI · Hand-stitched travel memory.
                </div>
                <div className="grid h-12 w-12 place-items-center border-2 border-[var(--hotpink)] text-lg font-bold text-[var(--hotpink)] rotate-[-8deg]">
                  ✈️
                </div>
              </div>
            </div>

            {/* Share options */}
            {!typing && (
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${story.title}\n\n${story.body.substring(0, 300)}...\n\nGenerated by YatraAI`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-poster"
                >
                  📱 Share on WhatsApp
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${story.title}\n\n${story.body}`);
                  }}
                  className="btn-ghost !text-[var(--cream)] !border-[var(--cream)]"
                >
                  📋 Copy Text
                </button>
              </div>
            )}
          </div>
        </section>
      )}
    </PageShell>
  );
}
