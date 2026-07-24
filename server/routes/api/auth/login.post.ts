/**
 * POST /api/auth/login — Login with email + password via Supabase Auth
 */
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { supabaseServer } from "~/lib/supabase-server";

export default defineEventHandler(async (event) => {
  const body = await readBody(event) as {
    email: string;
    password: string;
  };

  const { email, password } = body;

  if (!email || !password) {
    setResponseStatus(event, 400);
    return { error: "Email and password are required" };
  }

  const { data, error } = await supabaseServer.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    setResponseStatus(event, 401);
    return { error: error.message };
  }

  return {
    user: data.user,
    session: data.session,
    access_token: data.session?.access_token,
    refresh_token: data.session?.refresh_token,
  };
});
