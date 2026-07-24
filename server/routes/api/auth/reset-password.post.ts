/**
 * POST /api/auth/reset-password — Send password reset email
 */
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { supabaseServer } from "~/lib/supabase-server";

export default defineEventHandler(async (event) => {
  const body = await readBody(event) as { email: string };

  if (!body.email) {
    setResponseStatus(event, 400);
    return { error: "Email is required" };
  }

  const { error } = await supabaseServer.auth.resetPasswordForEmail(body.email);

  if (error) {
    setResponseStatus(event, 400);
    return { error: error.message };
  }

  return { message: "Password reset link sent to your email." };
});
