/**
 * Supabase server-side client — uses service role key.
 * NEVER import this in browser/client components.
 * Only use in TanStack Start API routes (server-only).
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env["VITE_SUPABASE_URL"] ?? import.meta.env?.VITE_SUPABASE_URL ?? "";
const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? import.meta.env?.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const supabaseServer = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  serviceRoleKey || "placeholder",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
