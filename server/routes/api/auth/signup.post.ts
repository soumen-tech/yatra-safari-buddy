/**
 * POST /api/auth/signup — Register user via Supabase Auth
 */
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { supabaseServer } from "~/lib/supabase-server";

export default defineEventHandler(async (event) => {
  const body = await readBody(event) as {
    email: string;
    password?: string;
    display_name?: string;
  };

  const { email, password, display_name } = body;

  if (!email) {
    setResponseStatus(event, 400);
    return { error: "Email is required" };
  }

  const { data, error } = await supabaseServer.auth.signUp({
    email,
    password: password || crypto.randomUUID(),
    options: {
      data: { display_name: display_name ?? email.split("@")[0] },
    },
  });

  if (error) {
    setResponseStatus(event, 400);
    return { error: error.message };
  }

  return {
    user: data.user,
    session: data.session,
    message: "Registration initiated. Verification code / magic link sent.",
  };
});
