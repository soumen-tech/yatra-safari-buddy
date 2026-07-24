/**
 * GET /api/auth/me — Return current user profile
 */
import { defineEventHandler, getHeader, setResponseStatus } from "h3";
import { supabaseServer } from "~/lib/supabase-server";

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, "authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");

  if (!token) {
    setResponseStatus(event, 401);
    return { error: "Unauthorized" };
  }

  const { data: { user }, error } = await supabaseServer.auth.getUser(token);

  if (error || !user) {
    setResponseStatus(event, 401);
    return { error: "Invalid token" };
  }

  const { data: profile } = await supabaseServer
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return {
    user,
    profile: profile ?? {
      id: user.id,
      display_name: user.email?.split("@")[0],
      avatar_char: user.email?.charAt(0).toUpperCase(),
    },
  };
});
