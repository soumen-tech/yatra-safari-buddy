/**
 * GET /api/health — service health check
 */
import { defineEventHandler } from "h3";

export default defineEventHandler(async () => {
  const results: Record<string, string> = {};

  // Check Supabase
  try {
    const url = process.env["VITE_SUPABASE_URL"] ?? "";
    if (!url || url.includes("placeholder") || url.includes("YOUR_PROJECT")) {
      results.supabase = "not_configured";
    } else {
      const res = await fetch(`${url}/rest/v1/`, {
        headers: { apikey: process.env["VITE_SUPABASE_ANON_KEY"] ?? "" },
      });
      results.supabase = res.ok || res.status === 404 ? "ok" : `error_${res.status}`;
    }
  } catch {
    results.supabase = "unreachable";
  }

  // Check Groq
  try {
    const groqKey = process.env["GROQ_API_KEY"] ?? "";
    if (!groqKey || groqKey.includes("YOUR_GROQ")) {
      results.groq = "not_configured";
    } else {
      const res = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { Authorization: `Bearer ${groqKey}` },
      });
      results.groq = res.ok ? "ok" : `error_${res.status}`;
    }
  } catch {
    results.groq = "unreachable";
  }

  // Check Google AI Studio
  try {
    const googleKey = process.env["GOOGLE_AI_STUDIO_KEY"] ?? "";
    if (!googleKey || googleKey.includes("YOUR_GOOGLE")) {
      results.google = "not_configured";
    } else {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${googleKey}`,
      );
      results.google = res.ok ? "ok" : `error_${res.status}`;
    }
  } catch {
    results.google = "unreachable";
  }

  const allOk = Object.values(results).every(
    (v) => v === "ok" || v === "not_configured",
  );

  return {
    status: allOk ? "healthy" : "degraded",
    services: results,
    timestamp: new Date().toISOString(),
    ai_provider: process.env["AI_PROVIDER"] ?? "groq",
  };
});
