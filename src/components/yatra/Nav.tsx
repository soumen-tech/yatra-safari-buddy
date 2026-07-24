import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export function Nav() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    setDropdownOpen(false);
    setMenuOpen(false);
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-[var(--ink)] bg-[var(--cream)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm border-[3px] border-[var(--ink)] bg-[var(--hotpink)] font-[family-name:var(--font-heavy)] text-[var(--mustard)] shadow-[3px_3px_0_var(--ink)]">
            Y
          </span>
          <span className="font-[family-name:var(--font-heavy)] text-xl tracking-widest text-[var(--ink)]">
            YATRA
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
          <Link to="/spontaneous" className="hover:text-[var(--hotpink)]">
            Got Cash?
          </Link>
          <Link to="/fare-shield" className="hover:text-[var(--hotpink)]">
            Fare-Shield
          </Link>
        </nav>

        {/* User Auth section & mobile menu */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="relative hidden md:block">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 border-[3px] border-[var(--ink)] bg-[var(--mustard)] px-3 py-1.5 font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest shadow-[3px_3px_0_var(--ink)] cursor-pointer"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--hotpink)] text-[var(--cream)] text-[10px]">
                  {user.avatar}
                </span>
                {user.name}
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 border-[3px] border-[var(--ink)] bg-[var(--cream)] p-2 shadow-[4px_4px_0_var(--ink)] z-50">
                  <div className="px-2 py-1 text-xs text-muted-foreground border-b-2 border-dashed border-[var(--ink)] mb-2 font-bold break-all">
                    {user.email}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-2 py-1.5 font-[family-name:var(--font-heavy)] text-xs text-[var(--hotpink)] uppercase tracking-widest hover:bg-[var(--mustard)]/20 cursor-pointer"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/auth"
              className="btn-poster hidden !py-1.5 !px-3 text-xs md:inline-flex"
            >
              Sign In
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="grid h-9 w-9 place-items-center border-[3px] border-[var(--ink)] bg-[var(--mustard)] font-[family-name:var(--font-heavy)] text-sm shadow-[3px_3px_0_var(--ink)] md:hidden cursor-pointer"
            aria-label="Toggle menu"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
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
            <Link to="/spontaneous" onClick={() => setMenuOpen(false)} className="hover:text-[var(--hotpink)]">
              Got Cash?
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
            {user ? (
              <div className="border-t-2 border-dashed border-[var(--ink)] pt-3 mt-1 flex flex-col gap-2">
                <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest break-all">
                  Logged in as: {user.name} ({user.email})
                </div>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    handleLogout();
                  }}
                  className="text-left font-[family-name:var(--font-heavy)] text-xs text-[var(--hotpink)] uppercase tracking-widest cursor-pointer"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                onClick={() => setMenuOpen(false)}
                className="font-[family-name:var(--font-heavy)] text-xs text-[var(--hotpink)] uppercase tracking-widest border-t-2 border-dashed border-[var(--ink)] pt-3 mt-1"
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
