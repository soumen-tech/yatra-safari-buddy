/**
 * GET /api/trips/:id — full trip detail
 */
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import { supabaseServer } from "~/lib/supabase-server";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    setResponseStatus(event, 400);
    return { error: "id is required" };
  }

  const [tripRes, membersRes, itineraryRes, inviteRes] = await Promise.all([
    supabaseServer.from("trips").select("*").eq("id", id).single(),
    supabaseServer.from("trip_members").select("*").eq("trip_id", id).order("joined_at"),
    supabaseServer.from("itinerary_days").select("*").eq("trip_id", id).order("day_number"),
    supabaseServer.from("invites").select("code,expires_at,use_count").eq("trip_id", id).limit(1).single(),
  ]);

  if (tripRes.error || !tripRes.data) {
    setResponseStatus(event, 404);
    return { error: "Trip not found" };
  }

  return {
    trip: tripRes.data,
    members: membersRes.data ?? [],
    itinerary: itineraryRes.data ?? [],
    invite: inviteRes.data ?? null,
  };
});
