/**
 * POST /api/auth/logout — Sign out session
 */
import { defineEventHandler, getHeader, setResponseStatus } from "h3";
import { supabaseServer } from "~/lib/supabase-server";

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, "authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");

  if (token) {
    await supabaseServer.auth.admin.signOut(token);
  }

  return { message: "Signed out successfully" };
});
