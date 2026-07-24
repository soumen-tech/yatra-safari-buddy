/**
 * POST /api/invites/redeem
 */
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { supabaseServer } from "~/lib/supabase-server";

const TIER_WEIGHTS: Record<string, number> = { low: 0.6, medium: 1.0, high: 1.5 };

export default defineEventHandler(async (event) => {
  const body = await readBody(event) as {
    code: string;
    user_id?: string;
    display_name: string;
    contribution_tier?: "low" | "medium" | "high";
  };

  if (!body.code || !body.display_name) {
    setResponseStatus(event, 400);
    return { error: "code and display_name are required" };
  }

  const { data: invite, error: inviteError } = await supabaseServer
    .from("invites")
    .select("*")
    .eq("code", body.code.toUpperCase().trim())
    .single();

  if (inviteError || !invite) {
    setResponseStatus(event, 404);
    return { error: "Invalid invite code" };
  }

  const inv = invite as { expires_at: string; use_count: number; max_uses: number; trip_id: string; id: string };

  if (new Date(inv.expires_at) < new Date()) {
    setResponseStatus(event, 410);
    return { error: "This invite code has expired" };
  }

  if (inv.use_count >= inv.max_uses) {
    setResponseStatus(event, 410);
    return { error: "This invite code has reached its maximum uses" };
  }

  const tripId = inv.trip_id;

  if (body.user_id) {
    const { data: existing } = await supabaseServer
      .from("trip_members")
      .select("id")
      .eq("trip_id", tripId)
      .eq("user_id", body.user_id)
      .single();

    if (existing) {
      setResponseStatus(event, 409);
      return { error: "You are already a member of this trip", trip_id: tripId };
    }
  }

  const tier = body.contribution_tier ?? "medium";

  const { error: memberError } = await supabaseServer.from("trip_members").insert({
    trip_id: tripId,
    user_id: body.user_id ?? null,
    display_name: body.display_name,
    contribution_tier: tier,
    income_weight: TIER_WEIGHTS[tier] ?? 1.0,
    joined_via_invite: true,
  });

  if (memberError) {
    setResponseStatus(event, 500);
    return { error: memberError.message };
  }

  await supabaseServer
    .from("invites")
    .update({ use_count: inv.use_count + 1 })
    .eq("id", inv.id);

  const { data: trip } = await supabaseServer.from("trips").select("*").eq("id", tripId).single();

  return { success: true, trip_id: tripId, trip, message: "You have joined the trip!" };
});
