/**
 * Supabase server-side admin client (service role).
 * Used exclusively in Nitro server routes (server/).
 * NEVER imported in browser/client code.
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env["VITE_SUPABASE_URL"] ?? "";
const serviceRoleKey =
  process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "";

export const supabaseServer = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  serviceRoleKey || "placeholder-service-role",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
