/**
 * GET  /api/expenses?trip_id=  — list expenses
 * POST /api/expenses           — create expense
 */
import { defineEventHandler, getQuery, readBody, setResponseStatus } from "h3";
import { supabaseServer } from "~/lib/supabase-server";

export default defineEventHandler(async (event) => {
  if (event.method === "GET") {
    const query = getQuery(event);
    const tripId = query.trip_id as string | undefined;

    if (!tripId) {
      setResponseStatus(event, 400);
      return { error: "trip_id is required" };
    }

    const { data, error } = await supabaseServer
      .from("expenses")
      .select("*")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: false });

    if (error) {
      setResponseStatus(event, 500);
      return { error: error.message };
    }

    return data ?? [];
  }

  if (event.method === "POST") {
    const body = await readBody(event) as {
      trip_id: string;
      amount: number;
      title: string;
      category?: string;
      paid_by_user_id?: string;
      paid_by_name: string;
      split_with?: string[];
      split_mode?: "equal" | "fair";
      source?: "photo" | "voice" | "manual";
      day_date?: string;
      photo_url?: string;
    };

    if (!body.trip_id || !body.amount || !body.title || !body.paid_by_name) {
      setResponseStatus(event, 400);
      return { error: "trip_id, amount, title, paid_by_name are required" };
    }

    if (body.amount <= 0) {
      setResponseStatus(event, 400);
      return { error: "Amount must be greater than 0" };
    }

    const { data, error } = await supabaseServer
      .from("expenses")
      .insert({
        trip_id: body.trip_id,
        amount: body.amount,
        title: body.title,
        category: body.category ?? "Other",
        paid_by_user_id: body.paid_by_user_id ?? null,
        paid_by_name: body.paid_by_name,
        split_with: body.split_with ?? [],
        split_mode: body.split_mode ?? "equal",
        source: body.source ?? "manual",
        day_date: body.day_date ?? new Date().toISOString().split("T")[0],
        photo_url: body.photo_url ?? null,
      })
      .select()
      .single();

    if (error) {
      setResponseStatus(event, 500);
      return { error: error.message };
    }

    setResponseStatus(event, 201);
    return data;
  }

  setResponseStatus(event, 405);
  return { error: "Method not allowed" };
});
