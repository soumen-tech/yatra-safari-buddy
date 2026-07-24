import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageShell, Halftone, StampTag } from "@/components/yatra";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In / Sign Up — YatraAI" },
      {
        name: "description",
        content: "Sign in or register for your YatraAI travel co-pilot.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Check if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate({ to: "/" });
    });
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Please enter your email.");
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        if (!name) {
          setError("Please enter your name.");
          setLoading(false);
          return;
        }

        if (!otpSent) {
          // Send OTP via Supabase
          const { error: signUpErr } = await supabase.auth.signUp({
            email,
            password: password || crypto.randomUUID(), // Supabase requires a password
            options: {
              data: { display_name: name },
              emailRedirectTo: window.location.origin,
            },
          });

          if (signUpErr) {
            // If user already exists, try OTP sign-in instead
            if (signUpErr.message.includes("already registered")) {
              const { error: otpErr } = await supabase.auth.signInWithOtp({ email });
              if (otpErr) {
                setError(otpErr.message);
                setLoading(false);
                return;
              }
            } else {
              setError(signUpErr.message);
              setLoading(false);
              return;
            }
          }

          setOtpSent(true);
          setSuccess("Verification code sent! Check your email.");
          setLoading(false);
          return;
        }

        // Verify OTP
        const { data, error: verifyErr } = await supabase.auth.verifyOtp({
          email,
          token: otp,
          type: "signup",
        });

        if (verifyErr) {
          // Try email OTP type if signup type fails
          const { data: data2, error: verifyErr2 } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: "email",
          });
          if (verifyErr2) {
            setError("Invalid verification code. Please check your email and try again.");
            setLoading(false);
            return;
          }
          if (data2.session) {
            setSuccess("Account verified! Redirecting...");
            setTimeout(() => navigate({ to: "/" }), 1000);
            return;
          }
        }

        if (data.session) {
          setSuccess("Account created successfully!");
          setTimeout(() => navigate({ to: "/" }), 1000);
        }
      } else {
        // Sign In with email + password
        const { data, error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInErr) {
          // Offer OTP as alternative
          if (signInErr.message.includes("Invalid login credentials")) {
            setError("Wrong password. Try using 'Send Magic Link' or check your password.");
          } else {
            setError(signInErr.message);
          }
          setLoading(false);
          return;
        }

        if (data.session) {
          setSuccess("Logged in successfully!");
          window.dispatchEvent(new Event("storage")); // Notify nav component
          setTimeout(() => navigate({ to: "/" }), 800);
        }
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error("[Auth]", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setError("Please enter your email first.");
      return;
    }
    setLoading(true);
    const { error: magicErr } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (magicErr) {
      setError(magicErr.message);
    } else {
      setSuccess("Magic link sent! Check your email and click the link to sign in.");
    }
  };

  return (
    <PageShell>
      <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--mustard)] py-16 text-[var(--ink)] sm:py-20">
        <Halftone />
        <div className="relative mx-auto max-w-md px-4 sm:px-6">
          <div className="text-center">
            <StampTag tone="dusk">Secure Gate</StampTag>
            <h1 className="poster-title mt-4 text-[clamp(2.5rem,8vw,5rem)]">
              {isSignUp ? "SIGN UP" : "SIGN IN"}
            </h1>
            <p className="mt-2 text-sm font-bold uppercase tracking-widest text-[var(--ink)]/80">
              Join 1,000+ budget travelers on the road.
            </p>
          </div>
        </div>
      </section>

      <section className="relative border-b-[3px] border-[var(--ink)] paper py-12">
        <Halftone />
        <div className="relative mx-auto max-w-md px-4">
          <div className="poster-card grain bg-[var(--cream)] p-6 sm:p-8">
            <div className="flex border-b-3 border-[var(--ink)] mb-6">
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setError(""); setSuccess(""); setOtpSent(false); }}
                className={`flex-1 py-3 text-center font-[family-name:var(--font-heavy)] text-sm uppercase tracking-widest transition-colors ${
                  !isSignUp
                    ? "bg-[var(--hotpink)] text-[var(--cream)] border-r-3 border-[var(--ink)]"
                    : "hover:bg-[var(--mustard)]/20"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setError(""); setSuccess(""); setOtpSent(false); }}
                className={`flex-1 py-3 text-center font-[family-name:var(--font-heavy)] text-sm uppercase tracking-widest transition-colors ${
                  isSignUp
                    ? "bg-[var(--hotpink)] text-[var(--cream)] border-l-3 border-[var(--ink)]"
                    : "hover:bg-[var(--mustard)]/20"
                }`}
              >
                Sign Up
              </button>
            </div>

            {error && (
              <div className="mb-4 border-2 border-[var(--ink)] bg-[var(--hotpink)] text-[var(--cream)] px-4 py-2 font-bold text-xs uppercase tracking-widest">
                ⚠️ {error}
              </div>
            )}

            {success && (
              <div className="mb-4 border-2 border-[var(--ink)] bg-green-600 text-white px-4 py-2 font-bold text-xs uppercase tracking-widest">
                ✓ {success}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {isSignUp && (
                <label className="block">
                  <div className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">
                    Your Name
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Rahul Kumar"
                    className="w-full border-2 border-[var(--ink)] bg-[var(--cream)] px-3 py-2 font-bold outline-none focus:ring-2 focus:ring-[var(--hotpink)]"
                    required={isSignUp && !otpSent}
                  />
                </label>
              )}

              <label className="block">
                <div className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">
                  Email Address
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul@yatra.in"
                  className="w-full border-2 border-[var(--ink)] bg-[var(--cream)] px-3 py-2 font-bold outline-none focus:ring-2 focus:ring-[var(--hotpink)]"
                  required
                />
              </label>

              {isSignUp ? (
                otpSent ? (
                  <label className="block animate-fade-in">
                    <div className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">
                      Enter OTP (Sent to Email)
                    </div>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="6-digit code"
                      maxLength={6}
                      className="w-full border-2 border-[var(--ink)] bg-[var(--cream)] px-3 py-2 font-bold outline-none focus:ring-2 focus:ring-[var(--hotpink)] text-center tracking-[0.5em] text-lg"
                      required
                    />
                    <div className="text-[10px] text-muted-foreground mt-1 uppercase">
                      Check your inbox for the 6-digit code from Supabase.
                    </div>
                  </label>
                ) : (
                  <label className="block">
                    <div className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">
                      Password
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
                      className="w-full border-2 border-[var(--ink)] bg-[var(--cream)] px-3 py-2 font-bold outline-none focus:ring-2 focus:ring-[var(--hotpink)]"
                      minLength={6}
                    />
                  </label>
                )
              ) : (
                <label className="block">
                  <div className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">
                    Password
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border-2 border-[var(--ink)] bg-[var(--cream)] px-3 py-2 font-bold outline-none focus:ring-2 focus:ring-[var(--hotpink)]"
                    required
                  />
                </label>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-poster w-full justify-center mt-6"
              >
                {loading ? (
                  <span>⏳ Processing...</span>
                ) : isSignUp ? (
                  otpSent ? (
                    "Verify & Register"
                  ) : (
                    "Send Verification Code"
                  )
                ) : (
                  "Let's Go →"
                )}
              </button>
            </form>

            {!isSignUp && (
              <button
                onClick={handleMagicLink}
                disabled={loading}
                className="mt-3 w-full text-center text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-[var(--hotpink)] transition-colors"
              >
                ✉️ Sign in with magic link instead
              </button>
            )}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
