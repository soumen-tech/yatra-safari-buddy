/**
 * Supabase browser client — used on the frontend.
 * Initialized from VITE_ env vars (safe to expose in browser).
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || supabaseUrl.includes("YOUR_PROJECT_REF")) {
  console.warn(
    "[YatraAI] Supabase URL not configured. Add VITE_SUPABASE_URL to .env.local",
  );
}

export const supabase = createClient(supabaseUrl || "https://placeholder.supabase.co", supabaseAnonKey || "placeholder", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type { Session, User } from "@supabase/supabase-js";
