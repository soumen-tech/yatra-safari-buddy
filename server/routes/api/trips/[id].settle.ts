/**
 * GET  /api/trips/:id/settle — compute settlement
 * POST /api/trips/:id/settle — mark settled
 */
import { defineEventHandler, getRouterParam, readBody, setResponseStatus } from "h3";
import { supabaseServer } from "~/lib/supabase-server";

interface Member { display_name: string; income_weight: number }
interface Expense { amount: number; paid_by_name: string; split_with: string[]; split_mode: string }

function computeSettlement(members: Member[], expenses: Expense[]) {
  const net: Record<string, number> = {};
  members.forEach((m) => { net[m.display_name] = 0; });

  expenses.forEach(({ amount, paid_by_name, split_with, split_mode }) => {
    const beneficiaries = split_with.length > 0 ? split_with : members.map((m) => m.display_name);
    if (!net[paid_by_name]) net[paid_by_name] = 0;
    net[paid_by_name] += amount;

    if (split_mode === "equal") {
      const share = amount / beneficiaries.length;
      beneficiaries.forEach((b) => { if (!net[b]) net[b] = 0; net[b] -= share; });
    } else {
      const totalWeight = beneficiaries.reduce((s, b) => s + (members.find((m) => m.display_name === b)?.income_weight ?? 1.0), 0);
      beneficiaries.forEach((b) => {
        const w = members.find((m) => m.display_name === b)?.income_weight ?? 1.0;
        if (!net[b]) net[b] = 0;
        net[b] -= amount * (w / totalWeight);
      });
    }
  });

  const debtors = Object.entries(net).filter(([, n]) => n < -0.1).map(([name, n]) => ({ name, n })).sort((a, b) => a.n - b.n);
  const creditors = Object.entries(net).filter(([, n]) => n > 0.1).map(([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n);
  const transactions: { from: string; to: string; amount: number }[] = [];
  const d = debtors.map((x) => ({ ...x }));
  const c = creditors.map((x) => ({ ...x }));
  let i = 0, j = 0;
  while (i < d.length && j < c.length) {
    const owe = Math.min(-d[i].n, c[j].n);
    transactions.push({ from: d[i].name, to: c[j].name, amount: Math.round(owe) });
    d[i].n += owe; c[j].n -= owe;
    if (Math.abs(d[i].n) < 0.1) i++;
    if (Math.abs(c[j].n) < 0.1) j++;
  }

  return {
    netBalances: Object.fromEntries(Object.entries(net).map(([k, v]) => [k, Math.round(v)])),
    transactions,
  };
}

export default defineEventHandler(async (event) => {
  const tripId = getRouterParam(event, "id");

  if (!tripId) {
    setResponseStatus(event, 400);
    return { error: "id is required" };
  }

  if (event.method === "GET") {
    const [membersRes, expensesRes] = await Promise.all([
      supabaseServer.from("trip_members").select("display_name,income_weight").eq("trip_id", tripId),
      supabaseServer.from("expenses").select("amount,paid_by_name,split_with,split_mode").eq("trip_id", tripId),
    ]);

    const members = (membersRes.data ?? []) as Member[];
    const expenses = (expensesRes.data ?? []) as Expense[];

    if (members.length === 0) return { netBalances: {}, transactions: [] };

    return computeSettlement(members, expenses);
  }

  if (event.method === "POST") {
    const body = await readBody(event) as {
      from_user_name: string;
      to_user_name: string;
      amount: number;
      mark_settled?: boolean;
    };

    if (body.mark_settled) {
      await supabaseServer
        .from("settlements")
        .update({ settled: true, settled_at: new Date().toISOString() })
        .eq("trip_id", tripId)
        .eq("from_user_name", body.from_user_name)
        .eq("to_user_name", body.to_user_name);
    } else {
      await supabaseServer.from("settlements").insert({
        trip_id: tripId,
        from_user_name: body.from_user_name,
        to_user_name: body.to_user_name,
        amount: body.amount,
        settled: false,
      });
    }

    return { success: true };
  }

  setResponseStatus(event, 405);
  return { error: "Method not allowed" };
});
