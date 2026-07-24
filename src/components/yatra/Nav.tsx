import { Link } from "@tanstack/react-router";
import { useState } from "react";

export function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-[var(--ink)] bg-[var(--cream)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm border-[3px] border-[var(--ink)] bg-[var(--hotpink)] font-[family-name:var(--font-heavy)] text-[var(--mustard)] shadow-[3px_3px_0_var(--ink)]">
            Y
          </span>
          <span className="font-[family-name:var(--font-heavy)] text-lg tracking-widest">
            YATRA<span className="text-[var(--hotpink)]">AI</span>
          </span>
        </Link>

        <nav className="hidden gap-6 text-sm font-bold uppercase tracking-widest md:flex">
          <Link to="/cities" className="hover:text-[var(--hotpink)]">
            Cities
          </Link>
          <Link to="/features" className="hover:text-[var(--hotpink)]">
            Features
          </Link>
          <Link to="/trip-generator" className="hover:text-[var(--hotpink)]">
            Plan a Trip
          </Link>
          <Link to="/fare-shield" className="hover:text-[var(--hotpink)]">
            Fare-Shield
          </Link>
        </nav>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="grid h-9 w-9 place-items-center border-[3px] border-[var(--ink)] bg-[var(--mustard)] font-[family-name:var(--font-heavy)] text-sm shadow-[3px_3px_0_var(--ink)] md:hidden"
          aria-label="Toggle menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        <Link to="/trip-generator" className="btn-poster hidden !py-2 !px-4 text-xs md:inline-flex">
          Plan a Trip
        </Link>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="border-t-2 border-dashed border-[var(--ink)] bg-[var(--cream)] px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3 text-sm font-bold uppercase tracking-widest">
            <Link to="/cities" onClick={() => setMenuOpen(false)} className="hover:text-[var(--hotpink)]">
              Cities
            </Link>
            <Link to="/features" onClick={() => setMenuOpen(false)} className="hover:text-[var(--hotpink)]">
              Features
            </Link>
            <Link to="/trip-generator" onClick={() => setMenuOpen(false)} className="hover:text-[var(--hotpink)]">
              Plan a Trip
            </Link>
            <Link to="/fare-shield" onClick={() => setMenuOpen(false)} className="hover:text-[var(--hotpink)]">
              Fare-Shield
            </Link>
            <Link to="/expense-tracker" onClick={() => setMenuOpen(false)} className="hover:text-[var(--hotpink)]">
              Expenses
            </Link>
            <Link to="/trip-story" onClick={() => setMenuOpen(false)} className="hover:text-[var(--hotpink)]">
              Trip Story
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
