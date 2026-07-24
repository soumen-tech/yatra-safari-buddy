import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageShell, Halftone, StampTag } from "@/components/yatra";

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

/* ────── types & initial data ────── */

type Category = "Food" | "Transport" | "Stay" | "Activity" | "Shopping" | "Other";

type SplitMode = "equal" | "fair";

interface Member {
  name: string;
  tier: "low" | "medium" | "high";
  income: number;
  weight: number;
}

interface Expense {
  id: number;
  title: string;
  amount: number;
  category: Category;
  time: string;
  source: "photo" | "voice" | "manual";
  paidBy: string;
  benefited: string[]; // member names
  splitMode: SplitMode;
}

const mockReceipts = [
  { title: "Fish thali — Dada's Dhaba", amount: 150, category: "Food" as Category },
  { title: "Auto — station to hostel", amount: 90, category: "Transport" as Category },
  { title: "Hostel rooms (2 nights)", amount: 1200, category: "Stay" as Category },
];

const mockVoiceExpenses = [
  { title: "Chai for the group", amount: 45, category: "Food" as Category },
  { title: "Shared auto to temple", amount: 60, category: "Transport" as Category },
  { title: "Fruit tray", amount: 30, category: "Food" as Category },
];

const categoryEmojis: Record<Category, string> = {
  Food: "🍛",
  Transport: "🛺",
  Stay: "🏠",
  Activity: "🎟️",
  Shopping: "🛍️",
  Other: "📦",
};

function ExpenseTrackerPage() {
  const [dailyBudget] = useState(1500);
  
  // Group members state
  const [members, setMembers] = useState<Member[]>([
    { name: "Rahul", tier: "medium", income: 12000, weight: 1.0 },
  ]);

  // Invite code states
  const [inviteCode, setInviteCode] = useState("YT-KOL-889");
  const [enteredCode, setEnteredCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState("");

  // Expense list state
  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: 1,
      title: "Morning tea & biscuits",
      amount: 45,
      category: "Food",
      time: "07:30 AM",
      source: "voice",
      paidBy: "Rahul",
      benefited: ["Rahul"],
      splitMode: "equal",
    },
  ]);

  // UI state
  const [scanning, setScanning] = useState(false);
  const [listening, setListening] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [draftExpense, setDraftExpense] = useState<Omit<Expense, "id" | "time"> | null>(null);
  
  // Add member modal/form states
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberTier, setNewMemberTier] = useState<"low" | "medium" | "high">("medium");

  const totalSpent = expenses.reduce((a, b) => a + b.amount, 0);
  const pct = Math.min(100, (totalSpent / dailyBudget) * 100);
  const gaugeColor =
    pct < 50 ? "bg-green-500" : pct < 80 ? "bg-amber-500" : "bg-[var(--hotpink)]";
  const gaugeLabel =
    pct < 50
      ? "Looking good"
      : pct < 80
        ? "Spending picking up"
        : pct < 100
          ? "Almost at limit"
          : "Over budget!";

  // Pre-load from localStorage user on load
  useEffect(() => {
    const userStr = localStorage.getItem("yatra_user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setMembers((prev) => {
          // Check if user is already there
          if (prev.some((m) => m.name === user.name)) return prev;
          return [{ name: user.name, tier: "medium", income: 12000, weight: 1.0 }, ...prev];
        });
      } catch (e) {}
    }
  }, []);

  // Save current state to localStorage to share with Trip Memory
  useEffect(() => {
    localStorage.setItem("yatra_expenses", JSON.stringify(expenses));
    localStorage.setItem("yatra_members", JSON.stringify(members));
  }, [expenses, members]);

  // Copy Invite Code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Process Invite Code
  const handleJoinFriends = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredCode) return;
    
    // Add mock friends Amit (high budget) & Rohit (low budget) to group
    setMembers((prev) => {
      const hasAmit = prev.some((m) => m.name === "Amit");
      const hasRohit = prev.some((m) => m.name === "Rohit");
      const updated = [...prev];
      if (!hasAmit) {
        updated.push({ name: "Amit", tier: "high", income: 20000, weight: 1.5 });
      }
      if (!hasRohit) {
        updated.push({ name: "Rohit", tier: "low", income: 8000, weight: 0.6 });
      }
      return updated;
    });

    setInviteSuccess("Amit & Rohit joined your trip!");
    setEnteredCode("");
    setTimeout(() => setInviteSuccess(""), 3000);
  };

  // Add Member manually
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    if (members.some((m) => m.name.toLowerCase() === newMemberName.toLowerCase().trim())) {
      alert("Member already exists!");
      return;
    }

    const incomeMap = { low: 8000, medium: 12000, high: 20000 };
    const weightMap = { low: 0.6, medium: 1.0, high: 1.5 };
    const newM: Member = {
      name: newMemberName.trim(),
      tier: newMemberTier,
      income: incomeMap[newMemberTier],
      weight: weightMap[newMemberTier],
    };

    setMembers((prev) => [...prev, newM]);
    setNewMemberName("");
  };

  // Trigger OCR Mock Flow
  const handlePhoto = () => {
    setScanning(true);
    setTimeout(() => {
      const r = mockReceipts[Math.floor(Math.random() * mockReceipts.length)];
      setDraftExpense({
        title: r.title,
        amount: r.amount,
        category: r.category,
        source: "photo",
        paidBy: members[0]?.name || "Rahul",
        benefited: members.map((m) => m.name),
        splitMode: "fair",
      });
      setScanning(false);
    }, 1000);
  };

  // Trigger Voice Mock Flow
  const handleVoice = () => {
    setListening(true);
    setTimeout(() => {
      const v = mockVoiceExpenses[Math.floor(Math.random() * mockVoiceExpenses.length)];
      setDraftExpense({
        title: v.title,
        amount: v.amount,
        category: v.category,
        source: "voice",
        paidBy: members[0]?.name || "Rahul",
        benefited: members.map((m) => m.name),
        splitMode: "fair",
      });
      setListening(false);
    }, 1000);
  };

  // Add Manual Draft
  const handleAddManual = () => {
    setDraftExpense({
      title: "",
      amount: 0,
      category: "Food",
      source: "manual",
      paidBy: members[0]?.name || "Rahul",
      benefited: members.map((m) => m.name),
      splitMode: "equal",
    });
  };

  // Save Draft Expense to Log
  const handleConfirmDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftExpense) return;
    if (!draftExpense.title) {
      alert("Please enter a title");
      return;
    }
    if (draftExpense.amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    if (draftExpense.benefited.length === 0) {
      alert("At least one person must benefit");
      return;
    }

    const now = new Date();
    const formattedTime = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")} ${now.getHours() >= 12 ? "PM" : "AM"}`;
    
    const newExpense: Expense = {
      ...draftExpense,
      id: expenses.length + 1,
      time: formattedTime,
    };

    setExpenses((prev) => [newExpense, ...prev]);
    setDraftExpense(null);
  };

  // Calculate Balances & Settle up
  const calculateBalances = () => {
    const netBalances: Record<string, number> = {};
    members.forEach((m) => {
      netBalances[m.name] = 0;
    });

    expenses.forEach((exp) => {
      const amount = exp.amount;
      const paidBy = exp.paidBy;
      const beneficiaries = exp.benefited;
      const splitMode = exp.splitMode;

      if (!netBalances[paidBy]) netBalances[paidBy] = 0;
      netBalances[paidBy] += amount;

      if (splitMode === "equal") {
        const share = amount / beneficiaries.length;
        beneficiaries.forEach((b) => {
          if (!netBalances[b]) netBalances[b] = 0;
          netBalances[b] -= share;
        });
      } else {
        // Fair Income-weighted split
        const sumWeights = beneficiaries.reduce((sum, bName) => {
          const m = members.find((mem) => mem.name === bName);
          return sum + (m?.weight ?? 1.0);
        }, 0);

        beneficiaries.forEach((bName) => {
          const m = members.find((mem) => mem.name === bName);
          const weight = m?.weight ?? 1.0;
          const share = amount * (weight / sumWeights);
          if (!netBalances[bName]) netBalances[bName] = 0;
          netBalances[bName] -= share;
        });
      }
    });

    // Settle-up algorithm (Greedy debt simplification)
    const debtors: { name: string; net: number }[] = [];
    const creditors: { name: string; net: number }[] = [];

    Object.entries(netBalances).forEach(([name, net]) => {
      if (net < -0.1) {
        debtors.push({ name, net });
      } else if (net > 0.1) {
        creditors.push({ name, net });
      }
    });

    // Sort debtors (most negative first) and creditors (most positive first)
    debtors.sort((a, b) => a.net - b.net);
    creditors.sort((a, b) => b.net - a.net);

    const transactions: { from: string; to: string; amount: number }[] = [];

    let i = 0;
    let j = 0;
    
    // Copy to prevent mutation during algorithm
    const dCopy = debtors.map((d) => ({ ...d }));
    const cCopy = creditors.map((c) => ({ ...c }));

    while (i < dCopy.length && j < cCopy.length) {
      const debtor = dCopy[i];
      const creditor = cCopy[j];
      const oweAmount = Math.min(-debtor.net, creditor.net);

      transactions.push({
        from: debtor.name,
        to: creditor.name,
        amount: Math.round(oweAmount),
      });

      debtor.net += oweAmount;
      creditor.net -= oweAmount;

      if (Math.abs(debtor.net) < 0.1) i++;
      if (Math.abs(creditor.net) < 0.1) j++;
    }

    return { netBalances, transactions };
  };

  const { netBalances, transactions } = calculateBalances();

  // Category breakdown
  const byCat = expenses.reduce(
    (acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    },
    {} as Record<Category, number>,
  );

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--hotpink)] py-16 text-[var(--cream)] sm:py-20">
        <Halftone />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <span className="chip !bg-[var(--cream)] !text-[var(--ink)]">
            Core Flow 03
          </span>
          <h1 className="poster-title mt-4 text-[clamp(2.5rem,8vw,6rem)]">
            EXPENSE & SPLIT
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-[var(--cream)]/90">
            Keep splits fair, even if incomes aren't. Invite friends, snap bills, verify details, and let Gemma explain the math.
          </p>
        </div>
      </section>

      {/* Collaboration / Invite Card & Members Panel */}
      <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--cream)] py-10">
        <Halftone />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 grid gap-6 md:grid-cols-[1fr_1.2fr]">
          
          {/* Invite card (Ticket style) */}
          <div className="ticket p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b-2 border-dashed border-[var(--ink)] pb-2 text-[10px] font-black uppercase tracking-widest">
                <span>Trip Group Invite</span>
                <span>YT-INV-PASS</span>
              </div>
              <h3 className="mt-3 font-[family-name:var(--font-display)] text-3xl">INVITE FRIENDS</h3>
              <p className="text-xs mt-1">Share this code with your travel buddies to join this trip group.</p>
              
              <div className="mt-4 flex items-center border-[3px] border-[var(--ink)] bg-[var(--cream)] p-2">
                <span className="font-[family-name:var(--font-heavy)] text-lg tracking-widest flex-1 px-2 select-all">
                  {inviteCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="chip !bg-[var(--hotpink)] !text-[var(--cream)] hover:!bg-[var(--ink)] cursor-pointer"
                >
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
                <button type="submit" className="chip !bg-[var(--hotpink)] !text-[var(--cream)] cursor-pointer">
                  Join
                </button>
              </div>
              {inviteSuccess && (
                <div className="mt-2 text-xs font-bold text-green-700 uppercase tracking-widest">
                  ✓ {inviteSuccess}
                </div>
              )}
            </form>
          </div>

          {/* Members Panel */}
          <div className="poster-card grain p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b-2 border-dashed border-[var(--ink)] pb-2">
                <span className="chip !bg-[var(--ink)] !text-[var(--mustard)]">Trip Crew</span>
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{members.length} Members</span>
              </div>

              {/* Members List */}
              <div className="mt-4 space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {members.map((m) => (
                  <div key={m.name} className="flex items-center justify-between border-2 border-[var(--ink)] p-2 bg-[var(--cream)] text-xs">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--hotpink)] text-[var(--cream)] text-[10px] font-bold">
                        {m.name.charAt(0)}
                      </span>
                      <span className="font-bold">{m.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={m.tier}
                        onChange={(e) => {
                          const tier = e.target.value as "low" | "medium" | "high";
                          const incomeMap = { low: 8000, medium: 12000, high: 20000 };
                          const weightMap = { low: 0.6, medium: 1.0, high: 1.5 };
                          setMembers((prev) =>
                            prev.map((item) =>
                              item.name === m.name
                                ? { ...item, tier, income: incomeMap[tier], weight: weightMap[tier] }
                                : item
                            )
                          );
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

            {/* Add Member manually */}
            <form onSubmit={handleAddMember} className="mt-4 border-t-2 border-dashed border-[var(--ink)] pt-3 flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground">Add Buddy</label>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Friend Name"
                  className="w-full mt-1 border border-[var(--ink)] bg-[var(--cream)] px-2 py-1 text-xs font-bold outline-none"
                />
              </div>
              <div className="w-28">
                <label className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground">Income Tier</label>
                <select
                  value={newMemberTier}
                  onChange={(e) => setNewMemberTier(e.target.value as any)}
                  className="w-full mt-1 border border-[var(--ink)] bg-[var(--cream)] px-1 py-1 text-xs font-bold outline-none"
                >
                  <option value="low">Low (₹8k)</option>
                  <option value="medium">Med (₹12k)</option>
                  <option value="high">High (₹20k)</option>
                </select>
              </div>
              <button type="submit" className="chip !bg-[var(--hotpink)] !text-[var(--cream)] h-8 cursor-pointer">
                + Add
              </button>
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
          <button onClick={handlePhoto} disabled={scanning || draftExpense !== null} className="btn-poster">
            📷 {scanning ? "Reading receipt..." : "Snap receipt"}
          </button>
          <button onClick={handleVoice} disabled={listening || draftExpense !== null} className="btn-poster !bg-[var(--dusk)]">
            🎤 {listening ? "Listening..." : "Voice amount"}
          </button>
          <button onClick={handleAddManual} disabled={draftExpense !== null} className="btn-ghost">
            ✍️ Manual Log
          </button>
          <button onClick={() => setShowBreakdown(!showBreakdown)} className="btn-ghost">
            📊 Category breakdown
          </button>
        </div>
      </section>

      {/* Manual Confirm / Edit Modal overlay */}
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
                  <input
                    type="text"
                    value={draftExpense.title}
                    onChange={(e) => setDraftExpense({ ...draftExpense, title: e.target.value })}
                    placeholder="e.g. Fish thali at Dada's"
                    className="w-full mt-1 border-2 border-[var(--ink)] bg-[var(--cream)] px-2 py-1.5 font-bold outline-none text-sm"
                    required
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount (₹)</div>
                    <input
                      type="number"
                      value={draftExpense.amount === 0 ? "" : draftExpense.amount}
                      onChange={(e) => setDraftExpense({ ...draftExpense, amount: Number(e.target.value) || 0 })}
                      placeholder="Amount"
                      className="w-full mt-1 border-2 border-[var(--ink)] bg-[var(--cream)] px-2 py-1.5 font-bold outline-none text-sm"
                      required
                    />
                  </label>

                  <label className="block">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category</div>
                    <select
                      value={draftExpense.category}
                      onChange={(e) => setDraftExpense({ ...draftExpense, category: e.target.value as Category })}
                      className="w-full mt-1 border-2 border-[var(--ink)] bg-[var(--cream)] px-2 py-1.5 font-bold outline-none text-sm"
                    >
                      {Object.keys(categoryEmojis).map((cat) => (
                        <option key={cat} value={cat}>
                          {categoryEmojis[cat as Category]} {cat}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Paid By</div>
                    <select
                      value={draftExpense.paidBy}
                      onChange={(e) => setDraftExpense({ ...draftExpense, paidBy: e.target.value })}
                      className="w-full mt-1 border-2 border-[var(--ink)] bg-[var(--cream)] px-2 py-1.5 font-bold outline-none text-sm"
                    >
                      {members.map((m) => (
                        <option key={m.name} value={m.name}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Split Formula</div>
                    <select
                      value={draftExpense.splitMode}
                      onChange={(e) => setDraftExpense({ ...draftExpense, splitMode: e.target.value as SplitMode })}
                      className="w-full mt-1 border-2 border-[var(--ink)] bg-[var(--cream)] px-2 py-1.5 font-bold outline-none text-sm"
                    >
                      <option value="equal">Equal Split (1/N)</option>
                      <option value="fair">Gemma Fair Share (Income Weight)</option>
                    </select>
                  </label>
                </div>

                {/* Beneficiaries checkboxes */}
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
                              const updated = isChecked
                                ? draftExpense.benefited.filter((n) => n !== m.name)
                                : [...draftExpense.benefited, m.name];
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
                <button type="submit" className="btn-poster flex-1 justify-center">
                  ✓ Confirm & Log
                </button>
                <button
                  type="button"
                  onClick={() => setDraftExpense(null)}
                  className="btn-ghost !border-[var(--hotpink)] !text-[var(--hotpink)] hover:!bg-[var(--hotpink)] hover:!text-[var(--cream)] flex-1 justify-center"
                >
                  Discard
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* Category breakdown display */}
      {showBreakdown && (
        <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--dusk)] py-10 text-[var(--cream)]">
          <Halftone />
          <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
            <StampTag tone="mustard">Category Breakdown</StampTag>
            <div className="mt-6 space-y-3">
              {Object.entries(byCat)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, amt]) => {
                  const catPct = Math.round((amt / (totalSpent || 1)) * 100);
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-[family-name:var(--font-heavy)] uppercase tracking-widest">
                          {categoryEmojis[cat as Category]} {cat}
                        </span>
                        <span className="font-[family-name:var(--font-display)] text-xl text-[var(--mustard)]">
                          ₹{amt} ({catPct}%)
                        </span>
                      </div>
                      <div className="mt-1 h-3 w-full border-2 border-[var(--cream)]/30 bg-[var(--ink)]">
                        <div
                          className="h-full bg-[var(--mustard)] transition-all"
                          style={{ width: `${catPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </section>
      )}

      {/* Settle Up Balance Summary */}
      {members.length > 1 && (
        <section className="relative border-b-[3px] border-[var(--ink)] bg-[var(--cream)] py-10">
          <Halftone />
          <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
            <div className="border-b-2 border-dashed border-[var(--ink)] pb-2 mb-4 flex justify-between items-center">
              <StampTag tone="dusk">Settle-Up balance</StampTag>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fair share summary</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Member Net Balances */}
              <div className="border-[3px] border-[var(--ink)] p-4 bg-[var(--cream)] shadow-[4px_4px_0_var(--ink)]">
                <h4 className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest text-[var(--hotpink)] border-b-2 border-dashed border-[var(--ink)] pb-1.5 mb-3">
                  Net Standing
                </h4>
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

              {/* Settle Up Statements */}
              <div className="border-[3px] border-[var(--ink)] p-4 bg-[var(--cream)] shadow-[4px_4px_0_var(--ink)]">
                <h4 className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest text-[var(--hotpink)] border-b-2 border-dashed border-[var(--ink)] pb-1.5 mb-3">
                  Recommended Settlements
                </h4>
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

            {/* Settle-up math logic and reasoning (Gemma bubble style) */}
            <div className="mt-5 border-[3px] border-[var(--ink)] bg-[var(--mustard)] p-4 text-[var(--ink)] shadow-[4px_4px_0_var(--ink)]">
              <div className="flex gap-2">
                <span className="text-2xl">💡</span>
                <div>
                  <div className="font-[family-name:var(--font-heavy)] text-[10px] uppercase tracking-widest text-[var(--hotpink)]">
                    Gemma's Split Breakdown
                  </div>
                  <p className="mt-1 text-xs leading-relaxed">
                    {expenses.length === 0 ? (
                      "No expenses logged yet. Let's record some items to compute fair-share logic!"
                    ) : (
                      <span>
                        Calculated using proportional income weights (High Budget tier takes 1.5x shares, Medium 1.0x, Low 0.6x).
                        For example: <b>{expenses[0].paidBy}</b> paid ₹{expenses[0].amount} for "{expenses[0].title}". Since it was split under {expenses[0].splitMode === "fair" ? "Fair Share Mode" : "Equal Split Mode"}, {
                          expenses[0].splitMode === "fair" ? (
                            "members with higher budgets take a larger proportion of the expense so lower-income buddies can afford to travel."
                          ) : (
                            "everyone takes an equal share of the cost."
                          )
                        }
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
            <span className="font-[family-name:var(--font-heavy)] text-xs uppercase tracking-widest text-muted-foreground">
              {expenses.length} entries
            </span>
          </div>

          <div className="divide-y-2 divide-dashed divide-[var(--ink)] border-y-[3px] border-[var(--ink)]">
            {expenses.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-4 px-2">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{categoryEmojis[e.category]}</span>
                  <div>
                    <div className="font-[family-name:var(--font-heavy)] text-sm uppercase tracking-widest">
                      {e.title}
                    </div>
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
                  <div className="text-[9px] uppercase font-bold text-muted-foreground">
                    Share: {e.benefited.join(", ")}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <span className="text-sm">
              Total spent today:{" "}
              <b className="font-[family-name:var(--font-display)] text-2xl">
                ₹{totalSpent}
              </b>
            </span>
            <Link to="/trip-story" className="btn-ghost text-xs">
              Go to Trip Memory →
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
