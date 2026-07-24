-- ═══════════════════════════════════════════════════════════════════════════
-- YatraAI — Migration 004: Extended Schema & Security
-- Tables: expense_categories, trip_photos, translator_history, ai_logs
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. EXPENSE CATEGORIES TABLE
create table if not exists public.expense_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text unique not null,
  icon        text not null,
  description text,
  created_at  timestamptz default now()
);

-- Seed standard categories
insert into public.expense_categories (name, icon, description)
values
  ('Food', '🍛', 'Dhabas, chai stalls, street food, restaurant dining'),
  ('Transport', '🛺', 'Autos, cabs, sleeper trains, metro, buses'),
  ('Stay', '🏠', 'Hostels, homestays, guesthouses, hotels'),
  ('Activity', '🎟️', 'Museum tickets, boat rides, entry passes'),
  ('Shopping', '🛍️', 'Local handicrafts, souvenirs, books, snacks'),
  ('Other', '📦', 'Miscellaneous expenses')
on conflict (name) do nothing;

-- 2. TRIP PHOTOS TABLE (Group Memory)
create table if not exists public.trip_photos (
  id            uuid primary key default gen_random_uuid(),
  trip_id       uuid references public.trips(id) on delete cascade not null,
  uploaded_by   uuid references auth.users(id),
  photo_url     text not null,
  caption       text,
  day_number    int default 1,
  created_at    timestamptz default now()
);

-- 3. TRANSLATOR HISTORY TABLE
create table if not exists public.translator_history (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid references auth.users(id) on delete cascade,
  source_text            text not null,
  target_language        text not null check (target_language in ('hindi','bengali','tamil','marathi')),
  translated_text        text not null,
  pronunciation          text,
  bargaining_suggestion  text,
  created_at             timestamptz default now()
);

-- 4. AI LOGS TABLE (Gemma Reasoning & Fallback Telemetry)
create table if not exists public.ai_logs (
  id             uuid primary key default gen_random_uuid(),
  feature        text not null, -- 'trip_gen', 'fare_shield', 'expense_ocr', 'translator', 'safety', 'story'
  provider_used  text not null check (provider_used in ('groq','google')),
  prompt_tokens  int,
  response_time  int, -- in milliseconds
  status         text not null check (status in ('success','fallback','error')),
  error_message  text,
  created_at     timestamptz default now()
);

-- Enable RLS on new tables
alter table public.expense_categories enable row level security;
alter table public.trip_photos enable row level security;
alter table public.translator_history enable row level security;
alter table public.ai_logs enable row level security;

-- Policies
create policy "Anyone can read expense categories"
  on public.expense_categories for select using (true);

create policy "Trip members can view trip photos"
  on public.trip_photos for select
  using (
    exists (
      select 1 from public.trip_members
      where trip_members.trip_id = trip_photos.trip_id
      and trip_members.user_id = auth.uid()
    )
    or exists (
      select 1 from public.trips
      where trips.id = trip_photos.trip_id
      and trips.owner_id = auth.uid()
    )
  );

create policy "Trip members can upload photos"
  on public.trip_photos for insert
  with check (
    exists (
      select 1 from public.trip_members
      where trip_members.trip_id = trip_photos.trip_id
      and trip_members.user_id = auth.uid()
    )
    or exists (
      select 1 from public.trips
      where trips.id = trip_photos.trip_id
      and trips.owner_id = auth.uid()
    )
  );

create policy "Users can view own translator history"
  on public.translator_history for select
  using (user_id = auth.uid());

create policy "Users can insert own translator history"
  on public.translator_history for insert
  with check (user_id = auth.uid() or user_id is null);

create policy "Admins/Service role can view AI logs"
  on public.ai_logs for select
  using (true);
