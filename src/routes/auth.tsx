import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageShell, Halftone, StampTag } from "@/components/yatra";

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
    const user = localStorage.getItem("yatra_user");
    if (user) {
      navigate({ to: "/" });
    }
  }, [navigate]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Please enter your email.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      if (isSignUp) {
        if (!name) {
          setError("Please enter your name.");
          setLoading(false);
          return;
        }
        if (!otpSent) {
          setOtpSent(true);
          setSuccess("OTP sent to your email!");
          setLoading(false);
          return;
        }
        if (otp !== "1234") {
          setError("Invalid OTP. Hint: Use 1234 for testing.");
          setLoading(false);
          return;
        }

        // Success Sign Up
        const userObj = { name, email, avatar: name.charAt(0).toUpperCase() };
        localStorage.setItem("yatra_user", JSON.stringify(userObj));
        window.dispatchEvent(new Event("storage")); // Notify nav component
        setSuccess("Account created successfully!");
        setTimeout(() => {
          navigate({ to: "/" });
        }, 1000);
      } else {
        // Sign In
        if (password !== "password" && password !== "123456") {
          setError("Invalid password. Hint: Use 'password' for testing.");
          setLoading(false);
          return;
        }

        // Success Sign In
        const generatedName = email.split("@")[0];
        const formattedName = generatedName.charAt(0).toUpperCase() + generatedName.slice(1);
        const userObj = { name: formattedName, email, avatar: formattedName.charAt(0).toUpperCase() };
        localStorage.setItem("yatra_user", JSON.stringify(userObj));
        window.dispatchEvent(new Event("storage")); // Notify nav component
        setSuccess("Logged in successfully!");
        setTimeout(() => {
          navigate({ to: "/" });
        }, 1000);
      }
      setLoading(false);
    }, 1000);
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
                onClick={() => {
                  setIsSignUp(false);
                  setError("");
                  setSuccess("");
                }}
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
                onClick={() => {
                  setIsSignUp(true);
                  setError("");
                  setSuccess("");
                }}
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
                    required={isSignUp}
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
                      placeholder="Enter 1234"
                      maxLength={4}
                      className="w-full border-2 border-[var(--ink)] bg-[var(--cream)] px-3 py-2 font-bold outline-none focus:ring-2 focus:ring-[var(--hotpink)] text-center tracking-[0.5em] text-lg"
                      required
                    />
                    <div className="text-[10px] text-muted-foreground mt-1 uppercase">
                      Hint: Use 1234 for testing.
                    </div>
                  </label>
                ) : null
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
                  <div className="text-[10px] text-muted-foreground mt-1 uppercase">
                    Hint: Use 'password' for testing.
                  </div>
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
          </div>
        </div>
      </section>
    </PageShell>
  );
}
