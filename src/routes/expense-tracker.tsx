import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { PageShell, Halftone, StampTag } from "@/components/yatra";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeTripUpdates } from "@/hooks/useRealtime";

export const Route = createFileRoute("/expense-tracker")({
  head: () => ({
    meta: [
      { title: "Group Expense Splitter — YatraAI" },
      {
        name: "description",
        content:
          "Manage group budgets, invite friends with custom incomes, and calculate fair-share bill splits with Gemma's reasoning.",
      },
    ],
  }),
  component: ExpenseTrackerPage,
});

/* ────── types ────── */

type Category = "Food" | "Transport" | "Stay" | "Activity" | "Shopping" | "Other";
type SplitMode = "equal" | "fair";

interface Member {
  name: string;
  tier: "low" | "medium" | "high";
  income: number;
  weight: number;
}

interface Expense {
  id: number | string;
  title: string;
  amount: number;
  category: Category;
  time: string;
  source: "photo" | "voice" | "manual";
  paidBy: string;
  benefited: string[];
  splitMode: SplitMode;
}

const categoryEmojis: Record<Category, string> = {
  Food: "🍛", Transport: "🛺", Stay: "🏠", Activity: "🎟️", Shopping: "🛍️", Other: "📦",
};

const TIER_MAP = { low: { income: 8000, weight: 0.6 }, medium: { income: 12000, weight: 1.0 }, high: { income: 20000, weight: 1.5 } };

function ExpenseTrackerPage() {
  const { user } = useAuth();
  const [dailyBudget] = useState(1500);

  const [members, setMembers] = useState<Member[]>([
    { name: "Rahul", tier: "medium", income: 12000, weight: 1.0 },
  ]);
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: 1, title: "Morning tea & biscuits", amount: 45, category: "Food", time: "07:30 AM", source: "voice", paidBy: "Rahul", benefited: ["Rahul"], splitMode: "equal" },
  ]);

  // Trip context (set after trip is created or loaded)
  const [activeTripId, setActiveTripId] = useState<string | null>(null);

  // Invite state
  const [inviteCode, setInviteCode] = useState("YT-KOL-889");
  const [enteredCode, setEnteredCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState("");

  // UI state
  const [scanning, setScanning] = useState(false);
  const [listening, setListening] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [draftExpense, setDraftExpense] = useState<Omit<Expense, "id" | "time"> | null>(null);
  const [savingExpense, setSavingExpense] = useState(false);
  const [aiError, setAiError] = useState("");

  // Add member form
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberTier, setNewMemberTier] = useState<"low" | "medium" | "high">("medium");

  // File input ref for receipt upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Realtime updates for active trip
  useRealtimeTripUpdates(activeTripId);

  // Load user into members on mount
  useEffect(() => {
    const userStr = localStorage.getItem("yatra_user");
    const supaUser = user;
    const displayName = supaUser?.name ?? (userStr ? (JSON.parse(userStr) as { name: string }).name : null);
    if (displayName) {
      setMembers((prev) => {
        if (prev.some((m) => m.name === displayName)) return prev;
        return [{ name: displayName, tier: "medium", income: 12000, weight: 1.0 }, ...prev];
      });
    }
  }, [user]);

  // Persist expenses to localStorage for trip-story page
  useEffect(() => {
    localStorage.setItem("yatra_expenses", JSON.stringify(expenses));
    localStorage.setItem("yatra_members", JSON.stringify(members));
  }, [expenses, members]);

  const totalSpent = expenses.reduce((a, b) => a + b.amount, 0);
  const pct = Math.min(100, (totalSpent / dailyBudget) * 100);
  const gaugeColor = pct < 50 ? "bg-green-500" : pct < 80 ? "bg-amber-500" : "bg-[var(--hotpink)]";
  const gaugeLabel = pct < 50 ? "Looking good" : pct < 80 ? "Spending picking up" : pct < 100 ? "Almost at limit" : "Over budget!";

  // ── Invite helpers ──────────────────────────────────────────────────────────
  const handleCopyCode = () => {
    void navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleJoinFriends = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredCode) return;

    const myName = user?.name ?? members[0]?.name ?? "Traveler";

    try {
      const res = await fetch("/api/invites/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: enteredCode,
          user_id: user?.id,
          display_name: myName,
          contribution_tier: "medium",
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as { trip_id?: string; message?: string };
        if (data.trip_id) setActiveTripId(data.trip_id);
        setInviteSuccess(data.message ?? "Joined trip successfully!");
      } else {
        // Fallback: still add mock friends for demo
        setMembers((prev) => {
          const updated = [...prev];
          if (!prev.some((m) => m.name === "Amit")) updated.push({ name: "Amit", tier: "high", income: 20000, weight: 1.5 });
          if (!prev.some((m) => m.name === "Rohit")) updated.push({ name: "Rohit", tier: "low", income: 8000, weight: 0.6 });
          return updated;
        });
        setInviteSuccess("Amit & Rohit joined your trip!");
      }
    } catch {
      // Demo fallback
      setMembers((prev) => {
        const updated = [...prev];
        if (!prev.some((m) => m.name === "Amit")) updated.push({ name: "Amit", tier: "high", income: 20000, weight: 1.5 });
        if (!prev.some((m) => m.name === "Rohit")) updated.push({ name: "Rohit", tier: "low", income: 8000, weight: 0.6 });
        return updated;
      });
      setInviteSuccess("Amit & Rohit joined your trip!");
    }

    setEnteredCode("");
    setTimeout(() => setInviteSuccess(""), 3000);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    if (members.some((m) => m.name.toLowerCase() === newMemberName.toLowerCase().trim())) {
      alert("Member already exists!"); return;
    }
    const { income, weight } = TIER_MAP[newMemberTier];
    setMembers((prev) => [...prev, { name: newMemberName.trim(), tier: newMemberTier, income, weight }]);
    setNewMemberName("");
  };

  // ── AI-powered receipt OCR via Gemma ───────────────────────────────────────
  const handlePhoto = () => {
    setAiError("");
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setAiError("");

    try {
      // Convert image to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/gemma/expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: base64, context: "Indian travel receipt" }),
      });

      type GemmaExpenseResult = { title?: string; amount?: number; category?: Category; confidence?: string };
      const data = (await res.json()) as GemmaExpenseResult | { error?: string };

      if (!res.ok || "error" in data) {
        setAiError(("error" in data ? (data as { error?: string }).error : null) ?? "Could not read receipt. Please enter manually.");
        setScanning(false);
        return;
      }

      const parsed = data as GemmaExpenseResult;
      setDraftExpense({
        title: parsed.title ?? "",
        amount: parsed.amount ?? 0,
        category: (parsed.category as Category) ?? "Other",
        source: "photo",
        paidBy: members[0]?.name ?? "Rahul",
        benefited: members.map((m) => m.name),
        splitMode: "fair",
      });
    } catch {
      setAiError("Could not connect to AI service. Please enter expense manually.");
    } finally {
      setScanning(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Real Web Speech API voice input ────────────────────────────────────────
  const handleVoice = () => {
    type SR = typeof SpeechRecognition;
    const WinSR: SR | undefined = (window as Window & { webkitSpeechRecognition?: SR }).webkitSpeechRecognition
      ?? (window as Window & { SpeechRecognition?: SR }).SpeechRecognition;

    if (!WinSR) {
      // Fallback mock for non-Chrome browsers
      setListening(true);
      setTimeout(() => {
        setDraftExpense({ title: "Chai for the group", amount: 45, category: "Food", source: "voice", paidBy: members[0]?.name ?? "Rahul", benefited: members.map((m) => m.name), splitMode: "fair" });
        setListening(false);
      }, 1200);
      return;
    }

    const recognition = new WinSR();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setListening(true);
    setAiError("");
    recognition.start();

    recognition.onresult = async (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;

      try {
        const res = await fetch("/api/gemma/expense", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcribed_text: transcript, context: "Indian group travel expense" }),
        });

        type VoiceResult = { title?: string; amount?: number; category?: Category };
        const data = (await res.json()) as VoiceResult | { error?: string };

        if (!res.ok || "error" in data) {
          setAiError(("error" in data ? (data as { error?: string }).error : null) ?? "Could not parse voice. Please enter manually.");
        } else {
          const parsed = data as VoiceResult;
          setDraftExpense({
            title: parsed.title ?? transcript,
            amount: parsed.amount ?? 0,
            category: (parsed.category as Category) ?? "Other",
            source: "voice",
            paidBy: members[0]?.name ?? "Rahul",
            benefited: members.map((m) => m.name),
            splitMode: "fair",
          });
        }
      } catch {
        setAiError("Voice parsed but AI unavailable. Please fill in the details.");
        setDraftExpense({ title: transcript, amount: 0, category: "Other", source: "voice", paidBy: members[0]?.name ?? "Rahul", benefited: members.map((m) => m.name), splitMode: "equal" });
      } finally {
        setListening(false);
      }
    };

    recognition.onerror = () => {
      setListening(false);
      setAiError("Voice recognition failed. Try again or use manual entry.");
    };
    recognition.onend = () => setListening(false);
  };

  const handleAddManual = () => {
    setDraftExpense({ title: "", amount: 0, category: "Food", source: "manual", paidBy: members[0]?.name ?? "Rahul", benefited: members.map((m) => m.name), splitMode: "equal" });
  };

  // ── Confirm and save expense ────────────────────────────────────────────────
  const handleConfirmDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftExpense) return;
    if (!draftExpense.title) { alert("Please enter a title"); return; }
    if (draftExpense.amount <= 0) { alert("Please enter a valid amount"); return; }
    if (draftExpense.benefited.length === 0) { alert("At least one person must benefit"); return; }

    setSavingExpense(true);

    // Local state update immediately for responsiveness
    const now = new Date();
    const formattedTime = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")} ${now.getHours() >= 12 ? "PM" : "AM"}`;
    const newExpense: Expense = { ...draftExpense, id: Date.now(), time: formattedTime };
    setExpenses((prev) => [newExpense, ...prev]);
    setDraftExpense(null);

    // Persist to Supabase if trip context exists
    if (activeTripId) {
      try {
        await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trip_id: activeTripId,
            amount: draftExpense.amount,
            title: draftExpense.title,
            category: draftExpense.category,
            paid_by_user_id: user?.id ?? null,
            paid_by_name: draftExpense.paidBy,
            split_with: draftExpense.benefited,
            split_mode: draftExpense.splitMode,
            source: draftExpense.source,
            day_date: new Date().toISOString().split("T")[0],
          }),
        });
      } catch { /* local state already updated — non-critical */ }
    }

    setSavingExpense(false);
  };

  // ── Settlement calculation ──────────────────────────────────────────────────
  const calculateBalances = () => {
    const netBalances: Record<string, number> = {};
    members.forEach((m) => { netBalances[m.name] = 0; });

    expenses.forEach((exp) => {
      const { amount, paidBy, benefited, splitMode } = exp;
      if (!netBalances[paidBy]) netBalances[paidBy] = 0;
      netBalances[paidBy] += amount;

      if (splitMode === "equal") {
        const share = amount / benefited.length;
        benefited.forEach((b) => { if (!netBalances[b]) netBalances[b] = 0; netBalances[b] -= share; });
      } else {
        const sumWeights = benefited.reduce((sum, bName) => sum + (members.find((m) => m.name === bName)?.weight ?? 1.0), 0);
        benefited.forEach((bName) => {
          const weight = members.find((m) => m.name === bName)?.weight ?? 1.0;
          if (!netBalances[bName]) netBalances[bName] = 0;
          netBalances[bName] -= amount * (weight / sumWeights);
        });
      }
    });

    const debtors = Object.entries(netBalances).filter(([, n]) => n < -0.1).map(([name, net]) => ({ name, net })).sort((a, b) => a.net - b.net);
    const creditors = Object.entries(netBalances).filter(([, n]) => n > 0.1).map(([name, net]) => ({ name, net })).sort((a, b) => b.net - a.net);
    const transactions: { from: string; to: string; amount: number }[] = [];
    const dCopy = debtors.map((d) => ({ ...d }));
    const cCopy = creditors.map((c) => ({ ...c }));

    let i = 0, j = 0;
    while (i < dCopy.length && j < cCopy.length) {
      const debtor = dCopy[i], creditor = cCopy[j];
      const owe = Math.min(-debtor.net, creditor.net);
      transactions.push({ from: debtor.name, to: creditor.name, amount: Math.round(owe) });
      debtor.net += owe; creditor.net -= owe;
      if (Math.abs(debtor.net) < 0.1) i++;
      if (Math.abs(creditor.net) < 0.1) j++;
    }
    return { netBalances, transactions };
  };

  const { netBalances, transactions } = calculateBalances();
  const byCat = expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; }, {} as Record<Category, number>);

  return (
    <PageShell>
      {/* Hidden file input for receipt photos */}
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelected} />

      {/* Hero */}
      <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--hotpink)] py-16 text-[var(--cream)] sm:py-20">
        <Halftone />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <span className="chip !bg-[var(--cream)] !text-[var(--ink)]">Core Flow 03</span>
          <h1 className="poster-title mt-4 text-[clamp(2.5rem,8vw,6rem)]">EXPENSE & SPLIT</h1>
          <p className="mt-3 max-w-2xl text-lg text-[var(--cream)]/90">
            Keep splits fair, even if incomes aren't. Invite friends, snap bills, verify details, and let Gemma explain the math.
          </p>
          {activeTripId && (
            <div className="mt-3 chip !bg-[var(--mustard)] !text-[var(--ink)]">
              🔗 Live trip: {activeTripId.slice(0, 8)}... · Realtime sync ON
            </div>
          )}
        </div>
      </section>

      {/* Collaboration / Invite Card & Members Panel */}
      <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--cream)] py-10">
        <Halftone />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 grid gap-6 md:grid-cols-[1fr_1.2fr]">

          {/* Invite card */}
          <div className="ticket p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b-2 border-dashed border-[var(--ink)] pb-2 text-[10px] font-black uppercase tracking-widest">
                <span>Trip Group Invite</span>
                <span>YT-INV-PASS</span>
              </div>
              <h3 className="mt-3 font-[family-name:var(--font-display)] text-3xl">INVITE FRIENDS</h3>
              <p className="text-xs mt-1">Share this code with your travel buddies to join this trip group.</p>

              <div className="mt-4 flex items-center border-[3px] border-[var(--ink)] bg-[var(--cream)] p-2">
                <span className="font-[family-name:var(--font-heavy)] text-lg tracking-widest flex-1 px-2 select-all">{inviteCode}</span>
                <button onClick={handleCopyCode} className="chip !bg-[var(--hotpink)] !text-[var(--cream)] hover:!bg-[var(--ink)] cursor-pointer">
                  {copied ? "Copied!" : "📋 Copy"}
                </button>
              </div>
            </div>

            <form onSubmit={handleJoinFriends} className="mt-6 border-t-2 border-dashed border-[var(--ink)] pt-4">
              <label className="block text-[10px] font-black uppercase tracking-widest">Join with code</label>
              <div className="mt-1.5 flex gap-2">
                <input
                  type="text"
                  value={enteredCode}
                  onChange={(e) => setEnteredCode(e.target.value.toUpperCase())}
                  placeholder="Paste code (e.g. YT-KOL-889)"
                  className="flex-1 border-2 border-[var(--ink)] bg-[var(--cream)] px-2 py-1.5 text-xs font-bold uppercase outline-none"
                />
                <button type="submit" className="chip !bg-[var(--hotpink)] !text-[var(--cream)] cursor-pointer">Join</button>
              </div>
              {inviteSuccess && <div className="mt-2 text-xs font-bold text-green-700 uppercase tracking-widest">✓ {inviteSuccess}</div>}
            </form>
          </div>

          {/* Members Panel */}
          <div className="poster-card grain p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b-2 border-dashed border-[var(--ink)] pb-2">
                <span className="chip !bg-[var(--ink)] !text-[var(--mustard)]">Trip Crew</span>
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{members.length} Members</span>
              </div>
              <div className="mt-4 space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {members.map((m) => (
                  <div key={m.name} className="flex items-center justify-between border-2 border-[var(--ink)] p-2 bg-[var(--cream)] text-xs">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--hotpink)] text-[var(--cream)] text-[10px] font-bold">{m.name.charAt(0)}</span>
                      <span className="font-bold">{m.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={m.tier}
                        onChange={(e) => {
                          const tier = e.target.value as "low" | "medium" | "high";
                          setMembers((prev) => prev.map((item) => item.name === m.name ? { ...item, tier, ...TIER_MAP[tier] } : item));
                        }}
                        className="border border-[var(--ink)] bg-[var(--cream)] py-0.5 px-1 font-bold text-[10px]"
                      >
                        <option value="low">Low Budget (0.6x)</option>
                        <option value="medium">Medium Budget (1.0x)</option>
                        <option value="high">High Budget (1.5x)</option>
                      </select>
                      <span className="text-[10px] text-muted-foreground font-bold">₹{m.income.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddMember} className="mt-4 border-t-2 border-dashed border-[var(--ink)] pt-3 flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground">Add Buddy</label>
                <input type="text" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} placeholder="Friend Name" className="w-full mt-1 border border-[var(--ink)] bg-[var(--cream)] px-2 py-1 text-xs font-bold outline-none" />
              </div>
              <div className="w-28">
                <label className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground">Income Tier</label>
                <select value={newMemberTier} onChange={(e) => setNewMemberTier(e.target.value as "low" | "medium" | "high")} className="w-full mt-1 border border-[var(--ink)] bg-[var(--cream)] px-1 py-1 text-xs font-bold outline-none">
                  <option value="low">Low (₹8k)</option>
                  <option value="medium">Med (₹12k)</option>
                  <option value="high">High (₹20k)</option>
                </select>
              </div>
              <button type="submit" className="chip !bg-[var(--hotpink)] !text-[var(--cream)] h-8 cursor-pointer">+ Add</button>
            </form>
          </div>
        </div>
      </section>

      {/* Budget progress bar */}
      <section className="relative border-b-[3px] border-[var(--ink)] paper py-6">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="poster-card grain p-4">
            <div className="flex justify-between text-xs font-black uppercase tracking-widest">
              <span>Today's Total Budget: ₹{dailyBudget}</span>
              <span className={pct >= 100 ? "text-[var(--hotpink)]" : ""}>Spent: ₹{totalSpent}</span>
            </div>
            <div className="mt-2 h-4 w-full border-2 border-[var(--ink)] bg-[var(--cream)]">
              <div className={`h-full ${gaugeColor} transition-all`} style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground uppercase font-bold flex justify-between">
              <span>{gaugeLabel}</span>
              <span>{pct >= 100 ? `${totalSpent - dailyBudget} over limit` : `${dailyBudget - totalSpent} left`}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Capture Actions */}
      <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--cream)] py-6">
        <div className="mx-auto flex flex-wrap justify-center gap-3 px-4">
          <button onClick={handlePhoto} disabled={scanning || !!draftExpense} className="btn-poster">
            📷 {scanning ? "Gemma reading receipt..." : "Snap receipt"}
          </button>
          <button onClick={handleVoice} disabled={listening || !!draftExpense} className="btn-poster !bg-[var(--dusk)]">
            🎤 {listening ? "Listening..." : "Voice amount"}
          </button>
          <button onClick={handleAddManual} disabled={!!draftExpense} className="btn-ghost">✍️ Manual Log</button>
          <button onClick={() => setShowBreakdown(!showBreakdown)} className="btn-ghost">📊 Category breakdown</button>
        </div>
        {aiError && (
          <div className="mx-auto max-w-xl mt-3 px-4">
            <div className="border-2 border-[var(--ink)] bg-[var(--hotpink)] text-[var(--cream)] px-4 py-2 text-xs font-bold uppercase tracking-widest">
              ⚠️ {aiError}
            </div>
          </div>
        )}
      </section>

      {/* Manual Confirm / Edit Draft */}
      {draftExpense && (
        <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--mustard)]/20 py-8">
          <div className="relative mx-auto max-w-xl px-4">
            <form onSubmit={handleConfirmDraft} className="poster-card grain bg-[var(--cream)] p-5 border-3 border-[var(--hotpink)]">
              <div className="flex items-center justify-between border-b-2 border-dashed border-[var(--ink)] pb-2">
                <StampTag tone="pink">Gemma Draft Verification</StampTag>
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--hotpink)]">Confirm Log Details</span>
              </div>

              <div className="mt-4 space-y-3">
                <label className="block">
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Expense Label / Title</div>
                  <input type="text" value={draftExpense.title} onChange={(e) => setDraftExpense({ ...draftExpense, title: e.target.value })} placeholder="e.g. Fish thali at Dada's" className="w-full mt-1 border-2 border-[var(--ink)] bg-[var(--cream)] px-2 py-1.5 font-bold outline-none text-sm" required />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount (₹)</div>
                    <input type="number" value={draftExpense.amount === 0 ? "" : draftExpense.amount} onChange={(e) => setDraftExpense({ ...draftExpense, amount: Number(e.target.value) || 0 })} placeholder="Amount" className="w-full mt-1 border-2 border-[var(--ink)] bg-[var(--cream)] px-2 py-1.5 font-bold outline-none text-sm" required />
                  </label>
                  <label className="block">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category</div>
                    <select value={draftExpense.category} onChange={(e) => setDraftExpense({ ...draftExpense, category: e.target.value as Category })} className="w-full mt-1 border-2 border-[var(--ink)] bg-[var(--cream)] px-2 py-1.5 font-bold outline-none text-sm">
                      {Object.keys(categoryEmojis).map((cat) => (<option key={cat} value={cat}>{categoryEmojis[cat as Category]} {cat}</option>))}
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Paid By</div>
                    <select value={draftExpense.paidBy} onChange={(e) => setDraftExpense({ ...draftExpense, paidBy: e.target.value })} className="w-full mt-1 border-2 border-[var(--ink)] bg-[var(--cream)] px-2 py-1.5 font-bold outline-none text-sm">
                      {members.map((m) => (<option key={m.name} value={m.name}>{m.name}</option>))}
                    </select>
                  </label>
                  <label className="block">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Split Formula</div>
                    <select value={draftExpense.splitMode} onChange={(e) => setDraftExpense({ ...draftExpense, splitMode: e.target.value as SplitMode })} className="w-full mt-1 border-2 border-[var(--ink)] bg-[var(--cream)] px-2 py-1.5 font-bold outline-none text-sm">
                      <option value="equal">Equal Split (1/N)</option>
                      <option value="fair">Gemma Fair Share (Income Weight)</option>
                    </select>
                  </label>
                </div>

                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Benefited Friends</div>
                  <div className="flex flex-wrap gap-2 border-2 border-[var(--ink)] p-2 bg-[var(--cream)]">
                    {members.map((m) => {
                      const isChecked = draftExpense.benefited.includes(m.name);
                      return (
                        <label key={m.name} className="flex items-center gap-1 text-xs font-bold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const updated = isChecked ? draftExpense.benefited.filter((n) => n !== m.name) : [...draftExpense.benefited, m.name];
                              setDraftExpense({ ...draftExpense, benefited: updated });
                            }}
                            className="accent-[var(--hotpink)]"
                          />
                          {m.name}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <button type="submit" disabled={savingExpense} className="btn-poster flex-1 justify-center">
                  {savingExpense ? "⏳ Saving..." : "✓ Confirm & Log"}
                </button>
                <button type="button" onClick={() => setDraftExpense(null)} className="btn-ghost !border-[var(--hotpink)] !text-[var(--hotpink)] hover:!bg-[var(--hotpink)] hover:!text-[var(--cream)] flex-1 justify-center">
                  Discard
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* Category breakdown */}
      {showBreakdown && (
        <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--dusk)] py-10 text-[var(--cream)]">
          <Halftone />
          <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
            <StampTag tone="mustard">Category Breakdown</StampTag>
            <div className="mt-6 space-y-3">
              {Object.entries(byCat).sort(([, a], [, b]) => b - a).map(([cat, amt]) => {
                const catPct = Math.round((amt / (totalSpent || 1)) * 100);
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-[family-name:var(--font-heavy)] uppercase tracking-widest">{categoryEmojis[cat as Category]} {cat}</span>
                      <span className="font-[family-name:var(--font-display)] text-xl text-[var(--mustard)]">₹{amt} ({catPct}%)</span>
                    </div>
                    <div className="mt-1 h-3 w-full border-2 border-[var(--cream)]/30 bg-[var(--ink)]">
                      <div className="h-full bg-[var(--mustard)] transition-all" style={{ width: `${catPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Settle Up */}
      {members.length > 1 && (
        <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--cream)] py-10">
          <Halftone />
          <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
            <div className="border-b-2 border-dashed border-[var(--ink)] pb-2 mb-4 flex justify-between items-center">
              <StampTag tone="dusk">Settle-Up balance</StampTag>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fair share summary</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border-[3px] border-[var(--ink)] p-4 bg-[var(--cream)] shadow-[4px_4px_0_var(--ink)]">
                <h4 className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest text-[var(--hotpink)] border-b-2 border-dashed border-[var(--ink)] pb-1.5 mb-3">Net Standing</h4>
                <div className="space-y-2">
                  {Object.entries(netBalances).map(([name, net]) => {
                    const absNet = Math.round(Math.abs(net));
                    return (
                      <div key={name} className="flex justify-between items-center text-xs font-bold">
                        <span>{name}</span>
                        <span className={net > 0.1 ? "text-green-700 font-black" : net < -0.1 ? "text-[var(--hotpink)] font-black" : "text-muted-foreground"}>
                          {net > 0.1 ? `Gets back ₹${absNet}` : net < -0.1 ? `Owes ₹${absNet}` : "Settled"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-[3px] border-[var(--ink)] p-4 bg-[var(--cream)] shadow-[4px_4px_0_var(--ink)]">
                <h4 className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest text-[var(--hotpink)] border-b-2 border-dashed border-[var(--ink)] pb-1.5 mb-3">Recommended Settlements</h4>
                {transactions.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No balances to settle. Everyone is square!</p>
                ) : (
                  <div className="space-y-2">
                    {transactions.map((t, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs border border-[var(--ink)] bg-[var(--mustard)]/10 p-2">
                        <span><b>{t.from}</b> pays <b>{t.to}</b></span>
                        <span className="font-[family-name:var(--font-display)] text-lg text-[var(--hotpink)]">₹{t.amount}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Gemma reasoning bubble */}
            <div className="mt-5 border-[3px] border-[var(--ink)] bg-[var(--mustard)] p-4 text-[var(--ink)] shadow-[4px_4px_0_var(--ink)]">
              <div className="flex gap-2">
                <span className="text-2xl">💡</span>
                <div>
                  <div className="font-[family-name:var(--font-heavy)] text-[10px] uppercase tracking-widest text-[var(--hotpink)]">Gemma's Split Breakdown</div>
                  <p className="mt-1 text-xs leading-relaxed">
                    {expenses.length === 0 ? (
                      "No expenses logged yet. Let's record some items to compute fair-share logic!"
                    ) : (
                      <span>
                        Calculated using proportional income weights (High Budget tier takes 1.5x shares, Medium 1.0x, Low 0.6x).
                        <b> {expenses[0].paidBy}</b> paid ₹{expenses[0].amount} for "{expenses[0].title}". Split under{" "}
                        {expenses[0].splitMode === "fair" ? "Fair Share Mode — members with higher budgets take a larger proportion so lower-income buddies can afford to travel." : "Equal Split Mode — everyone takes an equal share."}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Daily log */}
      <section className="relative border-b-[3px] border-[var(--ink)] paper py-10">
        <Halftone />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mb-6 flex items-center justify-between">
            <StampTag tone="pink">Today's Log</StampTag>
            <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest text-muted-foreground">{expenses.length} entries</span>
          </div>

          <div className="divide-y-2 divide-dashed divide-[var(--ink)] border-y-[3px] border-[var(--ink)]">
            {expenses.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-4 px-2">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{categoryEmojis[e.category]}</span>
                  <div>
                    <div className="font-[family-name:var(--font-heavy)] text-sm uppercase tracking-widest">{e.title}</div>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                      <span>{e.category}</span>
                      <span>·</span>
                      <span>Paid: <b>{e.paidBy}</b></span>
                      <span>·</span>
                      <span>Split: <b>{e.splitMode === "fair" ? "Fair Share" : "Equal"}</b></span>
                      <span>·</span>
                      <span>{e.time}</span>
                      <span>·</span>
                      <span className="chip !text-[8px] !py-0 !px-1">
                        {e.source === "photo" ? "📷" : e.source === "voice" ? "🎤" : "✍️"} {e.source}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-[family-name:var(--font-display)] text-2xl">₹{e.amount}</div>
                  <div className="text-[9px] uppercase font-bold text-muted-foreground">Share: {e.benefited.join(", ")}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <span className="text-sm">Total spent today:{" "}<b className="font-[family-name:var(--font-display)] text-2xl">₹{totalSpent}</b></span>
            <Link to="/trip-story" className="btn-ghost text-xs">Go to Trip Memory →</Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
