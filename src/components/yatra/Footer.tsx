import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="bg-[var(--cream)] py-10 text-sm">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 sm:flex-row sm:items-center sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center border-[3px] border-[var(--ink)] bg-[var(--hotpink)] font-[family-name:var(--font-heavy)] text-[var(--mustard)] shadow-[3px_3px_0_var(--ink)]">
            Y
          </span>
          <div>
            <div className="font-[family-name:var(--font-heavy)] tracking-widest">
              YATRAAI
            </div>
            <div className="text-xs text-muted-foreground">
              Made in India, for India. Powered by Gemma.
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-6 font-[family-name:var(--font-heavy)] uppercase tracking-widest text-xs">
          <Link to="/cities">Cities</Link>
          <Link to="/features">Features</Link>
          <Link to="/trip-generator">Plan a Trip</Link>
          <Link to="/fare-shield">Fare-Shield</Link>
          <Link to="/expense-tracker">Expenses</Link>
          <Link to="/trip-story">Trip Story</Link>
        </div>
      </div>
      <div className="mx-auto mt-6 max-w-7xl border-t-2 border-dashed border-[var(--ink)] px-4 pt-4 sm:px-6">
        <p className="text-xs text-muted-foreground">
          © 2025 YatraAI. Every rupee counts. Every traveler matters.
        </p>
      </div>
    </footer>
  );
}
