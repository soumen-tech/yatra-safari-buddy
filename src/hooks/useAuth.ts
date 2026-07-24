/**
 * useAuth — Supabase auth state hook
 * Replaces all localStorage.yatra_user reads app-wide.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Session, User } from "@/lib/supabase";

export interface YatraUser {
  id: string;
  email: string;
  name: string;
  avatar: string; // single uppercase char
}

function toYatraUser(user: User): YatraUser {
  const raw = user.user_metadata as {
    display_name?: string;
    full_name?: string;
  };
  const name =
    raw?.display_name ||
    raw?.full_name ||
    user.email?.split("@")[0] ||
    "Traveler";
  return {
    id: user.id,
    email: user.email ?? "",
    name,
    avatar: name.charAt(0).toUpperCase(),
  };
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<YatraUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ? toYatraUser(session.user) : null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ? toYatraUser(session.user) : null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { session, user, loading, signOut, isLoggedIn: !!session };
}
