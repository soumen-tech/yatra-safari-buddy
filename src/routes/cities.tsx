import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell, Halftone, StampTag } from "@/components/yatra";
import { cities, vibes, type Vibe } from "@/data/city-data";
import { cityImages } from "@/data/city-images";

export const Route = createFileRoute("/cities")(
  {
    head: () => ({
      meta: [
        { title: "Cities — YATRA" },
        {
          name: "description",
          content:
            "14 cities across India — popular spots, hidden gems, and realistic budgets. Built by locals, not scraped from a wiki.",
        },
      ],
    }),
    component: CitiesPage,
  },
);

function CitiesPage() {
  const [activeVibe, setActiveVibe] = useState<Vibe | "all">("all");

  const filtered =
    activeVibe === "all"
      ? cities
      : cities.filter((c) => c.vibe.includes(activeVibe));

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--dusk)] py-16 text-[var(--cream)] sm:py-24">
        <Halftone />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <StampTag tone="mustard">The Gallery</StampTag>
          <h1 className="poster-title-lg mt-4 text-[clamp(3rem,9vw,7rem)]">
            CITIES
          </h1>
          <p className="mt-3 max-w-xl text-lg text-[var(--cream)]/85">
            Every city YATRA knows becomes a poster. Local vehicles, local
            landmarks, local prices — built by locals, not scraped from a wiki.
          </p>

          {/* Vibe filter */}
          <div className="mt-8 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveVibe("all")}
              className={`chip ${activeVibe === "all" ? "!bg-[var(--hotpink)] !text-[var(--cream)]" : ""}`}
            >
              All ({cities.length})
            </button>
            {vibes.map((v) => (
              <button
                key={v}
                onClick={() => setActiveVibe(v)}
                className={`chip capitalize ${activeVibe === v ? "!bg-[var(--hotpink)] !text-[var(--cream)]" : ""}`}
              >
                {v} ({cities.filter((c) => c.vibe.includes(v)).length})
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* City Grid */}
      <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--dusk)] py-12 sm:py-16">
        <Halftone />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-6 flex items-center justify-between">
            <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-[0.3em] text-[var(--mustard)]">
              {filtered.length} / {cities.length} cities
            </span>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <Link
                key={c.slug}
                to="/city/$slug"
                params={{ slug: c.slug }}
                className="poster-card grain group block"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img
                    src={cityImages[c.imgKey]}
                    alt={`${c.name} retro poster`}
                    width={1024}
                    height={1280}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)]/60 via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <div className="poster-title text-[clamp(2.2rem,5vw,3.6rem)]">
                      {c.name}
                    </div>
                    <div className="mt-1 flex items-center gap-2 font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest text-[var(--mustard)]">
                      <span>{c.tag}</span>
                      <span className="text-[var(--hotpink)]">·</span>
                      <span>{c.year}</span>
                    </div>
                  </div>
                </div>

                {/* Card footer */}
                <div className="border-t-[3px] border-[var(--ink)] bg-[var(--cream)] p-3 text-[var(--ink)]">
                  <p className="text-sm">{c.note}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {c.vibe.map((v) => (
                        <span
                          key={v}
                          className="chip !text-[9px] !py-0.5 !px-1.5 capitalize"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                    <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest text-[var(--hotpink)]">
                      Explore →
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    From {c.budget.perDay}/day
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative border-b-[3px] border-[var(--ink)] paper py-16 sm:py-20">
        <Halftone />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <StampTag tone="pink">Ready?</StampTag>
          <h2 className="poster-title mt-4 text-[clamp(2rem,6vw,4rem)]">
            PICK A CITY. SET A BUDGET.
          </h2>
          <p className="mt-3 text-lg">
            YATRA builds the trip around your wallet, not the other way round.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/trip-generator" className="btn-poster">
              Plan a Trip
            </Link>
            <Link to="/fare-shield" className="btn-ghost">
              Check a Fare
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
