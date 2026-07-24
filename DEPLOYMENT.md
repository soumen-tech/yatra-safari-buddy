# YatraAI — Full Stack Backend & Deployment Guide

> Production-ready backend configuration using **Supabase Free Tier** + **Groq Gemma AI** (with Google AI Studio Fallback).

---

## 🏗️ Tech Stack Summary

- **Frontend:** React + TypeScript + Vite + Tailwind CSS + TanStack Router & Query
- **Backend Runtime:** Cloudflare Workers / Nitro SSR Engine + Express Node.js Server
- **Database & Storage:** Supabase Postgres + Row Level Security (RLS) + Storage Buckets
- **Realtime Sync:** Supabase Realtime Channels
- **AI Core:** Gemma 2 9B (Groq) primary + Gemma 3 4B (Google AI Studio) fallback

---

## 🔑 Environment Variables (`.env.local`)

Create a `.env.local` file in your root folder:

```env
# 1. Supabase Credentials (from Supabase Dashboard → Settings → API)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key

# 2. Gemma AI Engine (Groq Free Tier as Primary)
GROQ_API_KEY=gsk_...your-groq-api-key

# 3. Google AI Studio (Free Tier as Fallback for Rate-Limit Failover)
GOOGLE_AI_STUDIO_KEY=AIza...your-google-ai-studio-key

# 4. Active Provider Preference
AI_PROVIDER=groq
```

---

## 🗄️ Database Setup (Supabase SQL Editor)

Run the migration files in sequence under your Supabase Dashboard → **SQL Editor**:

1. [`supabase/migrations/001_initial_schema.sql`](file:///c:/Users/DELL/OneDrive/Desktop/TRAVEL/supabase/migrations/001_initial_schema.sql)
2. [`supabase/migrations/002_rls_policies.sql`](file:///c:/Users/DELL/OneDrive/Desktop/TRAVEL/supabase/migrations/002_rls_policies.sql)
3. [`supabase/migrations/003_storage.sql`](file:///c:/Users/DELL/OneDrive/Desktop/TRAVEL/supabase/migrations/003_storage.sql)
4. [`supabase/migrations/004_full_schema_extensions.sql`](file:///c:/Users/DELL/OneDrive/Desktop/TRAVEL/supabase/migrations/004_full_schema_extensions.sql)

---

## 📡 Backend API Endpoints Reference

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/signup` — Register with email & password / send verification OTP
- `POST /api/auth/login` — Sign in with email & password
- `POST /api/auth/logout` — Invalidate user token
- `POST /api/auth/reset-password` — Send magic reset link
- `GET /api/auth/me` — Fetch currently authenticated user profile

### 🧠 Gemma AI Core (`/api/gemma`)
- `POST /api/gemma/trip` — Generate full budget-first day-by-day itinerary
- `POST /api/gemma/fare` — Fare-Shield price estimation & scam warning
- `POST /api/gemma/expense` — Multimodal receipt OCR & voice expense parser
- `POST /api/gemma/spontaneous` — Impulse same-day micro-plan
- `POST /api/gemma/story` — Postcard trip memory generator
- `POST /api/gemma/translate` — Street dialect translation & bargaining coach
- `POST /api/gemma/safety` — Grounded night walk & scam safety advisor

### 🗺️ Trips & Invites (`/api/trips`, `/api/invites`)
- `GET /api/trips` — List user's trips
- `POST /api/trips` — Create new trip & auto-generate invite code
- `GET /api/trips/:id` — Get trip details, members & itinerary
- `GET /api/trips/:id/day?date=YYYY-MM-DD` — Day detail with expenses & settlement
- `POST /api/invites/create` — Generate shareable invite link
- `POST /api/invites/redeem` — Join trip group via 5-character code

### 💰 Expenses & Group Splitter (`/api/expenses`, `/api/trips/:id/settle`)
- `GET /api/expenses?trip_id=...` — List trip expenses
- `POST /api/expenses` — Log confirmed expense
- `DELETE /api/expenses/:id` — Remove expense
- `GET /api/trips/:id/settle` — Compute greedy debt simplification matrix
- `POST /api/trips/:id/settle` — Mark member debt as settled

---

## 🚀 Local Development & Production Run

### Local Dev Server
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Health Verification
Call the health check endpoint to verify all free-tier services:
```bash
curl http://localhost:3000/api/health
```
