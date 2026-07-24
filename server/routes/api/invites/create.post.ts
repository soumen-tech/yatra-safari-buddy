/**
 * POST /api/invites/create
 */
import { defineEventHandler, readBody, getRequestURL, setResponseStatus } from "h3";
import { supabaseServer } from "~/lib/supabase-server";

function generateCode(origin?: string): string {
  const prefix = origin
    ? origin.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "") || "YT"
    : "YT";
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const random = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `YT-${prefix}-${random}`;
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event) as {
    trip_id: string;
    created_by: string;
    origin?: string;
  };

  if (!body.trip_id || !body.created_by) {
    setResponseStatus(event, 400);
    return { error: "trip_id and created_by are required" };
  }

  const code = generateCode(body.origin);

  const { data, error } = await supabaseServer
    .from("invites")
    .insert({
      trip_id: body.trip_id,
      code,
      created_by: body.created_by,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      max_uses: 20,
    })
    .select()
    .single();

  if (error) {
    setResponseStatus(event, 500);
    return { error: error.message };
  }

  const url = getRequestURL(event);
  const inviteLink = `${url.origin}/join?code=${code}`;

  return {
    code: (data as { code: string }).code,
    expires_at: (data as { expires_at: string }).expires_at,
    link: inviteLink,
  };
});
