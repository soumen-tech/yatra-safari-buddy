/**
 * GET /api/trips/:id/day?date=YYYY-MM-DD — day-detail view
 */
import { defineEventHandler, getRouterParam, getQuery, setResponseStatus } from "h3";
import { supabaseServer } from "~/lib/supabase-server";

export default defineEventHandler(async (event) => {
  const tripId = getRouterParam(event, "id");
  const query = getQuery(event);
  const date = (query.date as string | undefined) ?? new Date().toISOString().split("T")[0];

  if (!tripId) {
    setResponseStatus(event, 400);
    return { error: "id is required" };
  }

  const [expensesRes, settlementsRes] = await Promise.all([
    supabaseServer.from("expenses").select("*").eq("trip_id", tripId).eq("day_date", date).order("created_at"),
    supabaseServer.from("settlements").select("*").eq("trip_id", tripId),
  ]);

  const expenses = expensesRes.data ?? [];
  const settlements = settlementsRes.data ?? [];
  const totalSpent = (expenses as { amount: number }[]).reduce((s, e) => s + e.amount, 0);
  const hasUnsettled = (settlements as { settled: boolean }[]).some((s) => !s.settled);
  const photoUrls = (expenses as { photo_url: string | null }[]).filter((e) => e.photo_url).map((e) => e.photo_url);

  return {
    date,
    trip_id: tripId,
    expenses,
    photo_urls: photoUrls,
    total_spent: totalSpent,
    is_settled: !hasUnsettled,
    settlements,
  };
});
