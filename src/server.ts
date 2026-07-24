import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { createApp, createRouter, toWebHandler } from "h3";

// Import backend API handlers
import apiHealth from "../server/routes/api/health";
import apiAuthLogin from "../server/routes/api/auth/login.post";
import apiAuthLogout from "../server/routes/api/auth/logout.post";
import apiAuthMe from "../server/routes/api/auth/me.get";
import apiAuthResetPassword from "../server/routes/api/auth/reset-password.post";
import apiAuthSignup from "../server/routes/api/auth/signup.post";
import apiExpensesIndex from "../server/routes/api/expenses/index";
import apiExpensesDelete from "../server/routes/api/expenses/[id].delete";
import apiGemmaExpense from "../server/routes/api/gemma/expense.post";
import apiGemmaFare from "../server/routes/api/gemma/fare.post";
import apiGemmaHiddenGems from "../server/routes/api/gemma/hidden-gems.post";
import apiGemmaSafety from "../server/routes/api/gemma/safety.post";
import apiGemmaSpontaneous from "../server/routes/api/gemma/spontaneous.post";
import apiGemmaStory from "../server/routes/api/gemma/story.post";
import apiGemmaTranslate from "../server/routes/api/gemma/translate.post";
import apiGemmaTrip from "../server/routes/api/gemma/trip.post";
import apiInvitesCreate from "../server/routes/api/invites/create.post";
import apiInvitesRedeem from "../server/routes/api/invites/redeem.post";
import apiTripsIndex from "../server/routes/api/trips/index";
import apiTripsDay from "../server/routes/api/trips/[id].day";
import apiTripsPhotos from "../server/routes/api/trips/[id].photos";
import apiTripsSettle from "../server/routes/api/trips/[id].settle";
import apiTripsId from "../server/routes/api/trips/[id]";

// Set up h3 router for API endpoints
const app = createApp();
const router = createRouter();

router.all("/api/health", apiHealth);
router.all("/api/auth/login", apiAuthLogin);
router.all("/api/auth/logout", apiAuthLogout);
router.all("/api/auth/me", apiAuthMe);
router.all("/api/auth/reset-password", apiAuthResetPassword);
router.all("/api/auth/signup", apiAuthSignup);
router.all("/api/expenses", apiExpensesIndex);
router.delete("/api/expenses/:id", apiExpensesDelete);
router.all("/api/gemma/expense", apiGemmaExpense);
router.all("/api/gemma/fare", apiGemmaFare);
router.all("/api/gemma/hidden-gems", apiGemmaHiddenGems);
router.all("/api/gemma/safety", apiGemmaSafety);
router.all("/api/gemma/spontaneous", apiGemmaSpontaneous);
router.all("/api/gemma/story", apiGemmaStory);
router.all("/api/gemma/translate", apiGemmaTranslate);
router.all("/api/gemma/trip", apiGemmaTrip);
router.all("/api/invites/create", apiInvitesCreate);
router.all("/api/invites/redeem", apiInvitesRedeem);
router.all("/api/trips", apiTripsIndex);
router.all("/api/trips/:id/day", apiTripsDay);
router.all("/api/trips/:id/photos", apiTripsPhotos);
router.all("/api/trips/:id/settle", apiTripsSettle);
router.all("/api/trips/:id", apiTripsId);

app.use(router);
const apiWebHandler = toWebHandler(app);

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);
    
    // Intercept API routes and delegate to the h3 router
    if (url.pathname.startsWith("/api/")) {
      try {
        return await apiWebHandler(request);
      } catch (error) {
        console.error("API error:", error);
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal Server Error" }), {
          status: 500,
          headers: { "content-type": "application/json" },
        });
      }
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
