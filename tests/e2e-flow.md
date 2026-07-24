# YatraAI — End-to-End QA Checklist

> Run through all 12 steps after configuring `.env.local` and running the Supabase SQL migrations.
> Check each item with ✅ / ❌.

---

## Setup Verification

Before running tests, confirm:
```bash
curl http://localhost:3000/api/health
```
Expected response:
```json
{
  "status": "healthy",
  "services": {
    "supabase": "ok",
    "groq": "ok",
    "google": "not_configured"
  }
}
```

---

## Step 1 — Sign-Up with Real Email/OTP
1. Go to `/auth` → Sign Up tab
2. Enter a real email address + password
3. Click "Send Verification Code"
4. Check your email inbox — you should receive a 6-digit OTP from Supabase
5. Enter the OTP code → Verify & Register
6. **Expected:** Redirected to `/`, Nav shows user name
7. Refresh the page — session must persist (not logged out)
8. Verify: Supabase Dashboard → Authentication → Users shows new user

---

## Step 2 — Create Trip + Itinerary Saved to DB
1. Go to `/trip-generator`
2. Set Budget: ₹5,000, Days: 3, Origin: Delhi, Vibe: Hills, Mode: Group, Party: 2
3. Click "Generate Itinerary with Gemma"
4. **Expected:** Real Gemma response within ~5 seconds, day-by-day itinerary displayed
5. Verify: Supabase Dashboard → Table Editor → `trips` → new row created
6. Verify: `itinerary_days` → 3 rows for the trip

---

## Step 3 — Invite Code + Second Member Joins (Realtime Test)
1. After trip creation, note the displayed invite code (e.g. `YT-DEL-AB3F7`)
2. Open a **second browser tab** (incognito)
3. Sign in with a different email OR go to `/expense-tracker`
4. Paste the invite code in the "Join with code" input → Click Join
5. **Expected in original tab:** Member count updates live (Supabase Realtime)
6. Verify: `trip_members` table has 2 rows for the trip

---

## Step 4 — Expense Log via Photo (Gemma OCR)
1. Go to `/expense-tracker`
2. Click "📷 Snap receipt"
3. Select a photo of any receipt (can be a food bill, screenshot, etc.)
4. **Expected:** Gemma returns a draft with `title`, `amount`, `category` populated
5. Verify the draft, click "✓ Confirm & Log"
6. Verify: `expenses` table has a new row with `source: 'photo'`

---

## Step 5 — Expense Log via Voice
1. On `/expense-tracker`, click "🎤 Voice amount"
2. Say: "Paid 150 for fish thali" (in Chrome, en-IN)
3. **Expected:** Gemma parses and returns draft `{ title: "fish thali", amount: 150, category: "Food" }`
4. Confirm the expense
5. Verify: `expenses` table has new row with `source: 'voice'`

---

## Step 6 — Settlement Calculation Matches Manual Math
Given:
- Rahul (1.0x) and Amit (1.5x) in a 2-person fair split
- Rahul paid ₹250 for dinner
- Fair shares: Rahul = 250 × (1.0/2.5) = ₹100, Amit = 250 × (1.5/2.5) = ₹150
- Net: Rahul +₹150, Amit -₹150 → Amit owes Rahul ₹150

1. Add Amit (High tier) to the group
2. Log ₹250 dinner, paid by Rahul, split Fair, benefited: both
3. Check Settle-Up section
4. **Expected:** "Amit pays Rahul ₹150"

---

## Step 7 — RLS Cross-Trip Block (Security Test)
1. Create Trip A with User A, log expenses
2. Log in as User B (different email)
3. Try to directly fetch: `GET /api/expenses?trip_id=<trip_A_id>`
4. **Expected:** Empty array returned (not 403) — User B is not a member, RLS filters rows
5. In Supabase SQL Editor run:
   ```sql
   SET LOCAL request.jwt.claim.sub = '<user_b_id>';
   SELECT * FROM expenses WHERE trip_id = '<trip_A_id>';
   ```
   Expected: 0 rows

---

## Step 8 — Fare-Shield Check (Gemma Verdict)
1. Go to `/fare-shield`
2. Enter: From "Howrah Station" → To "Park Street", Quoted ₹450, Mode: auto
3. Click "Shield Me"
4. **Expected:** Gemma verdict with `fairFare`, `verdict`, `reasoning`, `counterOffer`, `counterOfferHindi`
5. Verify verdict makes sense (5km auto in Kolkata should be ~₹100-120, ₹450 should be "overcharged")

---

## Step 9 — Day-Detail View + Expenses + Settlement
1. After expenses are logged, call: `GET /api/trips/<id>/day?date=<today>`
2. **Expected:**
   ```json
   {
     "date": "2026-07-25",
     "expenses": [...],
     "total_spent": 450,
     "is_settled": false
   }
   ```
3. Mark settlement via `POST /api/trips/<id>/settle` body: `{ "from_user_name": "Amit", "to_user_name": "Rahul", "amount": 150, "mark_settled": false }`
4. Re-call `GET /api/trips/<id>/settle` — verify transactions include this

---

## Step 10 — Trip Story Generation (Gemma Narrative)
1. Log at least 3-4 expenses across 2 days
2. Go to `/trip-story`
3. Click "Generate My Postcard Story with Gemma"
4. **Expected:** Typewriter animation plays, 3-4 paragraphs of vivid narrative text + hashtags
5. Tags should be travel-relevant (not generic)
6. WhatsApp share link should open correctly

---

## Step 11 — Groq Rate-Limit → Google AI Studio Fallback
1. In `.env.local`, temporarily set `GROQ_API_KEY=INVALID_KEY`
2. Call `POST /api/gemma/trip` or any Gemma endpoint
3. **Expected:** After 3 Groq retry failures, auto-switches to Google AI Studio
4. If `GOOGLE_AI_STUDIO_KEY` is also not set: Returns friendly error `{ "error": "AI temporarily unavailable...", "fallback": true }`
5. Frontend shows error banner — no unhandled crash
6. Restore correct key in `.env.local`

---

## Step 12 — Graceful Offline/Error Handling
1. Temporarily stop the dev server while on `/expense-tracker`
2. Click "Generate" on any AI feature
3. **Expected:** Error banner shown: "Could not connect to AI service. Check your connection."
4. No white screen or React error boundary crash
5. Start server again — app recovers without full refresh

---

## Database Schema Verification (SQL Editor)

Run in Supabase SQL Editor to confirm all tables exist:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected tables: `expenses`, `invites`, `itinerary_days`, `profiles`, `settlements`, `trip_members`, `trips`

---

## Environment Checklist
```
✅ VITE_SUPABASE_URL=https://xxxx.supabase.co
✅ VITE_SUPABASE_ANON_KEY=eyJ...
✅ SUPABASE_SERVICE_ROLE_KEY=eyJ...
✅ GROQ_API_KEY=gsk_...
⬜ GOOGLE_AI_STUDIO_KEY=AIza... (optional fallback)
✅ AI_PROVIDER=groq
```
