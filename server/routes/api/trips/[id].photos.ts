/**
 * GET  /api/trips/:id/photos — List trip photos
 * POST /api/trips/:id/photos — Upload & record new photo
 */
import { defineEventHandler, getRouterParam, readBody, setResponseStatus } from "h3";
import { supabaseServer } from "~/lib/supabase-server";

export default defineEventHandler(async (event) => {
  const tripId = getRouterParam(event, "id");

  if (!tripId) {
    setResponseStatus(event, 400);
    return { error: "id is required" };
  }

  if (event.method === "GET") {
    const { data, error } = await supabaseServer
      .from("trip_photos")
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
      photo_url: string;
      caption?: string;
      day_number?: number;
      uploaded_by?: string;
    };

    if (!body.photo_url) {
      setResponseStatus(event, 400);
      return { error: "photo_url is required" };
    }

    const { data, error } = await supabaseServer
      .from("trip_photos")
      .insert({
        trip_id: tripId,
        photo_url: body.photo_url,
        caption: body.caption ?? null,
        day_number: body.day_number ?? 1,
        uploaded_by: body.uploaded_by ?? null,
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
