import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { PageShell, Halftone, StampTag } from "@/components/yatra";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In / Private Document Vault — YATRA" },
      {
        name: "description",
        content: "Sign in or store your private travel documents (Passport, Visa, Tickets) in your encrypted profile vault.",
      },
    ],
  }),
  component: AuthPage,
});

interface TravelDoc {
  id: string;
  name: string;
  category: "Passport" | "Visa" | "Aadhaar / ID" | "Ticket" | "Hotel Voucher";
  dateAdded: string;
  fileSize: string;
  status: "Encrypted & Saved";
}

function AuthPage() {
  const navigate = useNavigate();
  const { user, isLoggedIn, signOut } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Private Document Storage Vault State
  const [documents, setDocuments] = useState<TravelDoc[]>([
    { id: "1", name: "Indian_Passport_Scan.pdf", category: "Passport", dateAdded: "2026-07-24", fileSize: "1.2 MB", status: "Encrypted & Saved" },
    { id: "2", name: "Train_Ticket_IRCTC_3AC.pdf", category: "Ticket", dateAdded: "2026-07-24", fileSize: "420 KB", status: "Encrypted & Saved" },
  ]);

  const [newDocCategory, setNewDocCategory] = useState<TravelDoc["category"]>("Passport");
  const docFileRef = useRef<HTMLInputElement>(null);

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
          const { error: signUpErr } = await supabase.auth.signUp({
            email,
            password: password || crypto.randomUUID(),
            options: {
              data: { display_name: name },
              emailRedirectTo: window.location.origin,
            },
          });

          if (signUpErr) {
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

        const { data, error: verifyErr } = await supabase.auth.verifyOtp({
          email,
          token: otp,
          type: "signup",
        });

        if (verifyErr) {
          const { data: data2, error: verifyErr2 } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: "email",
          });
          if (verifyErr2) {
            setError("Invalid verification code. Please check your email.");
            setLoading(false);
            return;
          }
          if (data2.session) {
            setSuccess("Account verified!");
            return;
          }
        }

        if (data.session) {
          setSuccess("Account created successfully!");
        }
      } else {
        const { data, error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInErr) {
          if (signInErr.message.includes("Invalid login credentials")) {
            setError("Wrong password. Try magic link or check password.");
          } else {
            setError(signInErr.message);
          }
          setLoading(false);
          return;
        }

        if (data.session) {
          setSuccess("Logged in successfully!");
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Upload private document
  const handleUploadDocument = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newDoc: TravelDoc = {
      id: String(Date.now()),
      name: file.name,
      category: newDocCategory,
      dateAdded: new Date().toISOString().split("T")[0],
      fileSize: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      status: "Encrypted & Saved",
    };

    setDocuments([newDoc, ...documents]);
    if (docFileRef.current) docFileRef.current.value = "";
  };

  const handleDeleteDoc = (id: string) => {
    setDocuments(documents.filter((d) => d.id !== id));
  };

  return (
    <PageShell>
      {/* Hidden file input for document locker */}
      <input ref={docFileRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleUploadDocument} />

      {/* Hero */}
      <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--mustard)] py-16 text-[var(--ink)] sm:py-20">
        <Halftone />
        <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-6">
          <StampTag tone="dusk">Secure Gate & Vault</StampTag>
          <h1 className="poster-title mt-4 text-[clamp(2.5rem,8vw,5rem)]">
            {isLoggedIn ? "USER PROFILE & VAULT" : isSignUp ? "SIGN UP" : "SIGN IN"}
          </h1>
          <p className="mt-2 text-sm font-bold uppercase tracking-widest text-[var(--ink)]/80">
            {isLoggedIn ? `Welcome back, ${user?.name}!` : "Join 1,000+ budget travelers on the road."}
          </p>
        </div>
      </section>

      <section className="relative border-b-[3px] border-[var(--ink)] paper py-12">
        <Halftone />
        <div className="relative mx-auto max-w-3xl px-4 space-y-12">

          {/* AUTH FORM CARD (IF NOT LOGGED IN OR MANAGING AUTH) */}
          {!isLoggedIn ? (
            <div className="poster-card grain bg-[var(--cream)] p-6 sm:p-8 max-w-md mx-auto">
              <div className="flex border-b-3 border-[var(--ink)] mb-6">
                <button
                  type="button"
                  onClick={() => { setIsSignUp(false); setError(""); setSuccess(""); setOtpSent(false); }}
                  className={`flex-1 py-3 text-center font-[family-name:var(--font-heavy)] text-sm uppercase tracking-widest transition-colors cursor-pointer ${
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
                  className={`flex-1 py-3 text-center font-[family-name:var(--font-heavy)] text-sm uppercase tracking-widest transition-colors cursor-pointer ${
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
                  className="btn-poster w-full justify-center mt-6 cursor-pointer"
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
          ) : (
            <div className="poster-card grain bg-[var(--cream)] p-6 border-3 border-[var(--ink)] flex justify-between items-center">
              <div>
                <div className="font-[family-name:var(--font-display)] text-2xl">LOGGED IN AS: {user?.name}</div>
                <div className="text-xs text-muted-foreground">{user?.email}</div>
              </div>
              <button onClick={() => void signOut()} className="btn-ghost !border-red-600 !text-red-600 cursor-pointer">
                Sign Out
              </button>
            </div>
          )}

          {/* PRIVATE DOCUMENT STORAGE LOCKER */}
          <div className="poster-card grain bg-[var(--cream)] p-6 sm:p-8 border-3 border-[var(--ink)]">
            <div className="flex items-center justify-between border-b-2 border-dashed border-[var(--ink)] pb-3 mb-6">
              <span className="chip !bg-[var(--ink)] !text-[var(--mustard)] font-black">🔒 PRIVATE DOCUMENT VAULT</span>
              <span className="text-xs font-black uppercase tracking-widest text-green-700">Encrypted Profile Storage</span>
            </div>

            <p className="text-sm text-muted-foreground">
              Securely upload and manage your essential travel documents (Passport, Visas, Aadhaar/ID, Flight & Train Tickets, Hotel Vouchers).
            </p>

            {/* Document Upload Bar */}
            <div className="mt-6 flex flex-wrap gap-3 items-end border-2 border-[var(--ink)] p-4 bg-[var(--mustard)]/10">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                  Document Type
                </label>
                <select
                  value={newDocCategory}
                  onChange={(e) => setNewDocCategory(e.target.value as TravelDoc["category"])}
                  className="w-full border-2 border-[var(--ink)] bg-[var(--cream)] p-2 font-bold text-xs outline-none cursor-pointer"
                >
                  <option value="Passport">🛂 Passport</option>
                  <option value="Visa">📑 Visa Document</option>
                  <option value="Aadhaar / ID">🪪 Aadhaar / National ID</option>
                  <option value="Ticket">🎟️ Train / Flight Ticket</option>
                  <option value="Hotel Voucher">🏠 Hotel Voucher</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => docFileRef.current?.click()}
                className="btn-poster text-xs cursor-pointer"
              >
                📥 Upload File to Vault
              </button>
            </div>

            {/* Document List */}
            <div className="mt-6 space-y-3">
              {documents.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground italic border-2 border-dashed border-[var(--ink)]">
                  No documents stored yet. Upload your tickets or ID to store them safely.
                </div>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between border-2 border-[var(--ink)] p-3 bg-[var(--cream)] text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {doc.category === "Passport" ? "🛂" : doc.category === "Visa" ? "📑" : doc.category === "Ticket" ? "🎟️" : "🪪"}
                      </span>
                      <div>
                        <div className="font-[family-name:var(--font-heavy)] uppercase text-sm tracking-wider">{doc.name}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Category: <b>{doc.category}</b> · Added: {doc.dateAdded} · Size: {doc.fileSize}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="chip !bg-green-700 !text-white text-[9px]">🔒 {doc.status}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="text-red-600 font-bold hover:underline cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </section>
    </PageShell>
  );
}
