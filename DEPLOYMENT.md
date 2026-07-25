# YatraAI — Full Stack Backend & Deployment Guide

> Production-ready backend using **Google AI Gemma 4** (primary) + **Groq Fallback** + **Supabase Free Tier**.

---

## 🏗️ Tech Stack Summary

- **Frontend:** React + TypeScript + Vite + Tailwind CSS + TanStack Router & Query
- **Backend Runtime:** Nitro SSR Engine (Cloudflare Workers / Node.js)
- **Database & Storage:** Supabase Postgres + Row Level Security + Storage Buckets
- **Realtime Sync:** Supabase Realtime Channels
- **AI Core (Primary):** Google AI Gemma 4 (`gemma-4-31b-it`) via official `@google/generative-ai` SDK
- **AI Fallback:** Groq free tier (`gemma2-9b-it`) for rate-limit failover (Gemma 4 fallback pending Groq availability)

---

## 🔑 Environment Variables (`.env.local`)

> ⚠️ `.env.local` is gitignored via `*.local` in `.gitignore`. **Never commit this file.**

Create a `.env.local` file in the project root:

```env
# ─────────────────────────────────────────────────────────────────────────────
# YatraAI — Local Environment Variables
# NEVER commit this file. It is listed in .gitignore.
# ─────────────────────────────────────────────────────────────────────────────

# 1. Supabase (from: supabase.com → Project → Settings → API)
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE

# 2. Google AI Gemma 4 (Primary) — aistudio.google.com → Get API key
AI_PROVIDER=google
GOOGLE_API_KEY=YOUR_GOOGLE_AI_API_KEY_HERE
GOOGLE_AI_STUDIO_KEY=YOUR_GOOGLE_AI_API_KEY_HERE

# 3. Groq (Fallback, optional) — console.groq.com → create API key
GROQ_API_KEY=YOUR_GROQ_API_KEY_HERE
```

---

## 🗄️ Database Setup (Supabase SQL Editor)

Run the migrations in sequence under **Supabase Dashboard → SQL Editor**:

1. `supabase/migrations/001_initial_schema.sql` — Profiles, Trips, Members, Invites, Expenses, Days, Settlements
2. `supabase/migrations/002_rls_policies.sql` — Row Level Security Policies
3. `supabase/migrations/003_storage.sql` — Storage Bucket for Receipts & Photos
4. `supabase/migrations/004_full_schema_extensions.sql` — Expense Categories, Trip Photos, Translator History, AI Logs

---

## 🚀 Local Development

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev
```

**Local dev server URL:** http://localhost:8080/

**Health check:** http://localhost:8080/api/health

---

## 📡 Backend API Endpoints

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register with email & password |
| POST | `/api/auth/login` | Sign in with email & password |
| POST | `/api/auth/logout` | Invalidate user session |
| POST | `/api/auth/reset-password` | Send magic reset link |
| GET | `/api/auth/me` | Fetch current user profile |

### 🧠 Google Gemma 4 AI Core (`/api/gemma`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/gemma/trip` | Budget-first day-by-day itinerary generator |
| POST | `/api/gemma/fare` | Fare-Shield price check & scam warning |
| POST | `/api/gemma/expense` | Multimodal receipt OCR & voice expense parser |
| POST | `/api/gemma/spontaneous` | Impulse same-day micro-plan |
| POST | `/api/gemma/story` | Postcard trip narrative generator |
| POST | `/api/gemma/translate` | Street dialect bargaining & translator |
| POST | `/api/gemma/safety` | Night walk & scam safety advisor |
| POST | `/api/gemma/hidden-gems` | Local budget spot recommendations |

### 🗺️ Trips & Invites
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trips` | List user's trips |
| POST | `/api/trips` | Create new trip & auto-generate invite code |
| GET | `/api/trips/:id` | Get trip details, members & itinerary |
| GET | `/api/trips/:id/settle` | Compute debt simplification matrix |
| POST | `/api/trips/:id/settle` | Mark member debt as settled |
| GET | `/api/trips/:id/day` | Day detail with expenses & settlement |
| GET | `/api/trips/:id/photos` | List trip photos |
| POST | `/api/trips/:id/photos` | Upload & record new photo |
| POST | `/api/invites/create` | Generate shareable invite code |
| POST | `/api/invites/redeem` | Join trip group via code |

### 💰 Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses?trip_id=...` | List trip expenses |
| POST | `/api/expenses` | Log confirmed expense |
| DELETE | `/api/expenses/:id` | Remove expense |

---

## 🌐 Production Deployment (GitHub + Lovable)

This project is connected to Lovable via the `soumen-tech/yatra-safari-buddy` GitHub repository.

**Deployment flow:**
1. Push to `main` branch on GitHub
2. Lovable auto-syncs and builds via Cloudflare Workers / Nitro
3. No force-push, no rebase of published commits (per AGENTS.md)

**Environment variables for production:**  
Set the same variables listed above in your Lovable / Cloudflare Worker secrets dashboard.

---

## 🧪 Health Verification

Once deployed, verify all services:

```bash
curl https://your-deployment.lovable.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "services": {
    "supabase": "ok",
    "groq": "ok",
    "google": "ok"
  },
  "ai_provider": "google"
}
```
