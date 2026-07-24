import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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

/* ────── mock data ────── */

interface TripDay {
  day: number;
  city: string;
  spent: number;
  highlights: string[];
  photos: number;
}

const sampleTrip: TripDay[] = [
  {
    day: 1,
    city: "Kolkata",
    spent: 680,
    highlights: ["Howrah Bridge at dawn", "Tiretti Bazaar breakfast", "Tram from Esplanade"],
    photos: 12,
  },
  {
    day: 2,
    city: "Kolkata",
    spent: 520,
    highlights: ["Victoria Memorial", "Kumartuli potters", "College Street books"],
    photos: 8,
  },
  {
    day: 3,
    city: "Kolkata",
    spent: 790,
    highlights: ["Kalighat temple", "South Park Cemetery", "Park Street dinner"],
    photos: 9,
  },
  {
    day: 4,
    city: "Kolkata",
    spent: 430,
    highlights: ["Flower market", "Indian Museum", "Departure chai"],
    photos: 11,
  },
];

const stories = [
  {
    title: "Kolkata, 4 days, ₹2,420 spent.",
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

/* ────── page ────── */

function TripStoryPage() {
  const [generating, setGenerating] = useState(false);
  const [storyIndex, setStoryIndex] = useState<number | null>(null);
  const [typing, setTyping] = useState(false);
  const [displayedChars, setDisplayedChars] = useState(0);

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
  const totalSpent = sampleTrip.reduce((a, b) => a + b.spent, 0);
  const totalPhotos = sampleTrip.reduce((a, b) => a + b.photos, 0);

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
            Your photos, expenses, and voice notes stitched into a story only
            you could tell. Postcard style. WhatsApp-ready. Never AI-generic.
          </p>
        </div>
      </section>

      {/* Trip Data Summary */}
      <section className="relative border-b-[3px] border-[var(--ink)] paper py-12 sm:py-16">
        <Halftone />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
          <StampTag tone="mustard">Your Trip Data</StampTag>
          <h2 className="poster-title mt-4 text-[clamp(1.5rem,4vw,3rem)]">
            WHAT WE'RE WORKING WITH
          </h2>

          {/* Stats bar */}
          <div className="mt-6 ticket p-5">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest opacity-70">
                  Days
                </div>
                <div className="font-[family-name:var(--font-display)] text-3xl">
                  {sampleTrip.length}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest opacity-70">
                  Photos
                </div>
                <div className="font-[family-name:var(--font-display)] text-3xl">
                  {totalPhotos}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest opacity-70">
                  Spent
                </div>
                <div className="font-[family-name:var(--font-display)] text-3xl">
                  ₹{totalSpent.toLocaleString("en-IN")}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest opacity-70">
                  Voice Notes
                </div>
                <div className="font-[family-name:var(--font-display)] text-3xl">
                  6
                </div>
              </div>
            </div>
          </div>

          {/* Day cards */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {sampleTrip.map((d) => (
              <div key={d.day} className="poster-card grain p-4">
                <div className="flex items-center justify-between">
                  <span className="font-[family-name:var(--font-display)] text-xl text-[var(--hotpink)]">
                    DAY {d.day}
                  </span>
                  <span className="font-[family-name:var(--font-display)] text-xl">
                    ₹{d.spent}
                  </span>
                </div>
                <div className="mt-1 font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest">
                  {d.city}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {d.highlights.map((h) => (
                    <span key={h} className="chip !text-[8px]">
                      {h}
                    </span>
                  ))}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  📷 {d.photos} photos
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-poster mt-8 w-full justify-center"
          >
            {generating
              ? "✨ Stitching your story…"
              : "✨ Generate My Trip Story"}
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
              {/* Postcard header */}
              <div className="flex items-center justify-between border-b-2 border-dashed border-[var(--ink)] pb-3">
                <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest text-[var(--hotpink)]">
                  Postcard
                </span>
                <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest text-muted-foreground">
                  YatraAI Story
                </span>
              </div>

              {/* Title */}
              <div className="mt-4 font-[family-name:var(--font-hand)] text-3xl leading-tight text-[var(--hotpink)]">
                {story.title}
              </div>

              {/* Story body with typing effect */}
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

              {/* Tags */}
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

              {/* Postcard stamp */}
              <div className="mt-6 flex items-end justify-between border-t-2 border-dashed border-[var(--ink)] pt-3">
                <div className="text-xs text-muted-foreground">
                  Generated by YatraAI · Not scraped, not generic, not corporate.
                </div>
                <div className="grid h-12 w-12 shrink-0 place-items-center border-2 border-[var(--hotpink)] text-lg font-bold text-[var(--hotpink)] rotate-[-8deg]">
                  ✈️
                </div>
              </div>
            </div>

            {/* Share buttons */}
            {!typing && (
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${story.title}\n\n${story.body.substring(0, 300)}...\n\n${story.tags.join(" ")}\n\nGenerated by YatraAI`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-poster"
                >
                  📱 Share on WhatsApp
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${story.title}\n\n${story.body}\n\n${story.tags.join(" ")}`,
                    );
                  }}
                  className="btn-ghost !text-[var(--cream)] !border-[var(--cream)]"
                >
                  📋 Copy Story
                </button>
                <button
                  onClick={handleGenerate}
                  className="btn-ghost !text-[var(--cream)] !border-[var(--cream)]"
                >
                  🔄 Regenerate
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Demo tag */}
      <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--cream)] py-8">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="stamp-card inline-block">
            <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest text-muted-foreground">
              🧪 Demo only — pre-written stories. Real version uses Gemma to generate unique
              stories from your actual photos, expenses, and voice notes. Each one reads like a
              personal postcard, never generic travel-blog copy.
            </span>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
