/**
 * GET  /api/trips — list user's trips
 * POST /api/trips — create trip + first member + invite code
 */
import { defineEventHandler, readBody, getHeader, setResponseStatus } from "h3";
import { supabaseServer } from "~/lib/supabase-server";

function generateInviteCode(origin?: string): string {
  const prefix = origin
    ? origin.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "") || "YT"
    : "YT";
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const random = Array.from({ length: 5 }, () =>
    chars[Math.floor(Math.random() * chars.length)],
  ).join("");
  return `YT-${prefix}-${random}`;
}

export default defineEventHandler(async (event) => {
  if (event.method === "GET") {
    const authHeader = getHeader(event, "authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      setResponseStatus(event, 401);
      return { error: "Unauthorized" };
    }

    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);
    if (authError || !user) {
      setResponseStatus(event, 401);
      return { error: "Invalid token" };
    }

    const { data: memberTrips } = await supabaseServer
      .from("trip_members")
      .select("trip_id")
      .eq("user_id", user.id);

    const memberTripIds = (memberTrips ?? []).map((m) => m.trip_id as string);

    const orFilter = memberTripIds.length > 0
      ? `owner_id.eq.${user.id},id.in.(${memberTripIds.join(",")})`
      : `owner_id.eq.${user.id}`;

    const { data, error } = await supabaseServer
      .from("trips")
      .select("*")
      .or(orFilter)
      .order("created_at", { ascending: false });

    if (error) {
      setResponseStatus(event, 500);
      return { error: error.message };
    }

    return data ?? [];
  }

  if (event.method === "POST") {
    const authHeader = getHeader(event, "authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");

    const body = await readBody(event) as {
      budget: number;
      days: number;
      origin: string;
      vibe: string;
      budget_mode: "person" | "group";
      party_size: number;
      title?: string;
    };

    let ownerId: string | null = null;
    let ownerName = "Traveler";

    if (token) {
      const { data: { user } } = await supabaseServer.auth.getUser(token);
      if (user) {
        ownerId = user.id;
        const { data: profile } = await supabaseServer
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .single();
        ownerName = (profile?.display_name as string) ?? ownerName;
      }
    }

    const effectiveOwnerId = ownerId ?? crypto.randomUUID();

    const { data: trip, error: tripError } = await supabaseServer
      .from("trips")
      .insert({
        owner_id: effectiveOwnerId,
        title: body.title ?? `${body.vibe} trip from ${body.origin}`,
        origin: body.origin,
        vibe: body.vibe,
        days: body.days,
        budget_mode: body.budget_mode,
        total_budget: body.budget,
        party_size: body.party_size,
      })
      .select()
      .single();

    if (tripError || !trip) {
      setResponseStatus(event, 500);
      return { error: tripError?.message ?? "Failed to create trip" };
    }

    if (ownerId) {
      await supabaseServer.from("trip_members").insert({
        trip_id: trip.id,
        user_id: ownerId,
        display_name: ownerName,
        contribution_tier: "medium",
        income_weight: 1.0,
        joined_via_invite: false,
      });
    }

    const code = generateInviteCode(body.origin);
    const { data: invite } = await supabaseServer
      .from("invites")
      .insert({ trip_id: trip.id, code, created_by: effectiveOwnerId })
      .select()
      .single();

    setResponseStatus(event, 201);
    return {
      trip_id: trip.id,
      trip,
      invite_code: (invite as { code?: string } | null)?.code ?? code,
      invite_expires_at: (invite as { expires_at?: string } | null)?.expires_at,
    };
  }

  setResponseStatus(event, 405);
  return { error: "Method not allowed" };
});
