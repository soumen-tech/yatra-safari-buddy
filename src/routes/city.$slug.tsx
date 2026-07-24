import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, Halftone, StampTag } from "@/components/yatra";
import { getCityBySlug } from "@/data/city-data";
import { cityImages } from "@/data/city-images";

export const Route = createFileRoute("/city/$slug")({
  head: ({ params }) => {
    const city = getCityBySlug(params.slug);
    return {
      meta: [
        { title: city ? `${city.name} — YATRA` : "City — YATRA" },
        {
          name: "description",
          content: city
            ? `${city.tagline} Explore ${city.name} on a budget with YATRA.`
            : "Explore an Indian city with YATRA.",
        },
      ],
    };
  },
  component: CityDetailPage,
});

function CityDetailPage() {
  const { slug } = Route.useParams();
  const city = getCityBySlug(slug);

  if (!city) {
    return (
      <PageShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <h1 className="poster-title text-5xl">CITY NOT FOUND</h1>
            <p className="mt-3 text-muted-foreground">
              We haven't mapped this one yet.
            </p>
            <Link to="/cities" className="btn-poster mt-6 inline-flex">
              Back to Cities
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  const popular = city.spots.filter((s) => s.type === "popular");
  const hidden = city.spots.filter((s) => s.type === "hidden");

  return (
    <PageShell>
      {/* Poster Hero */}
      <section className="relative overflow-hidden border-b-[3px] border-[var(--ink)]">
        <img
          src={cityImages[city.imgKey]}
          alt={`${city.name} retro poster`}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--dusk)]/50 via-transparent to-[var(--ink)]/80" />
        <Halftone />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-32 md:py-40">
          <Link
            to="/cities"
            className="chip !bg-[var(--cream)] !text-[var(--ink)] mb-4 inline-flex"
          >
            ← All Cities
          </Link>
          <h1 className="poster-title-lg text-[clamp(4rem,12vw,10rem)]">
            {city.name}
          </h1>
          <div className="mt-2 flex items-center gap-3 font-[family-name:var(--font-heavy)] text-sm uppercase tracking-widest text-[var(--mustard)]">
            <span>{city.tag}</span>
            <span className="text-[var(--hotpink)]">·</span>
            <span>{city.year}</span>
            <span className="text-[var(--hotpink)]">·</span>
            <span>{city.region}</span>
          </div>
          <p className="mt-4 max-w-lg text-lg font-bold text-[var(--cream)]">
            {city.note}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {city.vibe.map((v) => (
              <StampTag key={v} tone="pink">
                {v}
              </StampTag>
            ))}
          </div>
        </div>
      </section>

      {/* Budget Strip */}
      <section className="marquee-band border-b-[3px] border-[var(--ink)] py-4">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-6 px-4 text-sm sm:gap-10 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="opacity-70">Stay</span>
            <span className="font-[family-name:var(--font-display)] text-xl">
              {city.budget.stay}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="opacity-70">Food</span>
            <span className="font-[family-name:var(--font-display)] text-xl">
              {city.budget.food}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="opacity-70">Transport</span>
            <span className="font-[family-name:var(--font-display)] text-xl">
              {city.budget.transport}
            </span>
          </div>
          <div className="flex items-center gap-2 border-l-2 border-[var(--mustard)]/40 pl-6">
            <span className="opacity-70">Budget</span>
            <span className="font-[family-name:var(--font-display)] text-2xl text-[var(--mustard)]">
              {city.budget.perDay}/day
            </span>
          </div>
        </div>
      </section>

      {/* Popular Spots */}
      <section className="relative border-b-[3px] border-[var(--ink)] paper py-16 sm:py-20">
        <Halftone />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <StampTag tone="mustard">Tourist Spots</StampTag>
          <h2 className="poster-title mt-4 text-[clamp(2rem,5vw,4rem)]">
            THE POSTCARD HITS
          </h2>
          <p className="mt-2 max-w-xl text-muted-foreground">
            The places everyone goes — and they're right to. Here's how to do
            them on a budget.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map((spot, i) => (
              <div key={spot.name} className="poster-card grain p-5">
                <div className="flex items-center justify-between">
                  <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest text-[var(--hotpink)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {spot.cost && <StampTag tone="mustard">{spot.cost}</StampTag>}
                </div>
                <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl leading-tight">
                  {spot.name}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {spot.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hidden Gems */}
      <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--dusk)] py-16 text-[var(--cream)] sm:py-20">
        <Halftone />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <StampTag tone="pink">Local Knowledge</StampTag>
          <h2 className="poster-title mt-4 text-[clamp(2rem,5vw,4rem)]">
            HIDDEN GEMS
          </h2>
          <p className="mt-2 max-w-xl text-[var(--cream)]/80">
            The cheap dhaba, the homestay that isn't on Booking.com, the
            viewpoint the locals keep to themselves. This isn't scraped from
            Google — it reads like a friend's WhatsApp forward.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {hidden.map((spot, i) => (
              <div key={spot.name} className="poster-card grain p-5 bg-[var(--ink)] text-[var(--cream)]">
                <div className="flex items-center justify-between">
                  <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest text-[var(--mustard)]">
                    ★ {String(i + 1).padStart(2, "0")}
                  </span>
                  {spot.cost && <StampTag tone="mustard">{spot.cost}</StampTag>}
                </div>
                <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl leading-tight text-[var(--mustard)]">
                  {spot.name}
                </h3>
                <p className="mt-2 text-sm text-[var(--cream)]/80">
                  {spot.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plan CTA */}
      <section className="relative border-b-[3px] border-[var(--ink)] stripes-y py-16 sm:py-20">
        <div className="absolute inset-0 bg-[var(--cream)]/85" />
        <Halftone />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="poster-title text-[clamp(2rem,6vw,4rem)]">
            PLAN YOUR {city.name} TRIP
          </h2>
          <p className="mt-3 text-lg">
            From {city.budget.perDay}/day. YATRA builds a day-by-day itinerary
            around your budget.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/trip-generator" className="btn-poster">
              Build My Itinerary
            </Link>
            <Link to="/fare-shield" className="btn-ghost">
              Check Local Fares
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
