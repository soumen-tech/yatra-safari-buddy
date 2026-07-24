-- ═══════════════════════════════════════════════════════════════════════════
-- YatraAI — Initial Schema Migration
-- Run this in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PROFILES (extends auth.users)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  avatar_char  char(1),
  created_at   timestamptz default now()
);

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_char)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    upper(left(coalesce(new.raw_user_meta_data->>'display_name', new.email), 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. TRIPS
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.trips (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid references auth.users(id) on delete cascade not null,
  title        text,
  origin       text,
  vibe         text check (vibe in ('hills','beach','city','spiritual')),
  days         int  not null default 3,
  budget_mode  text check (budget_mode in ('person','group')) default 'person',
  total_budget int  not null default 5000,
  party_size   int  default 1,
  created_at   timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. TRIP MEMBERS
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.trip_members (
  id                  uuid primary key default gen_random_uuid(),
  trip_id             uuid references public.trips(id) on delete cascade not null,
  user_id             uuid references auth.users(id) on delete cascade,
  display_name        text not null,
  contribution_tier   text check (contribution_tier in ('low','medium','high')) default 'medium',
  income_weight       numeric default 1.0,
  joined_via_invite   boolean default false,
  joined_at           timestamptz default now(),
  unique(trip_id, user_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. INVITES
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.invites (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid references public.trips(id) on delete cascade not null,
  code        text unique not null,
  created_by  uuid references auth.users(id) on delete cascade not null,
  expires_at  timestamptz default (now() + interval '7 days'),
  max_uses    int default 20,
  use_count   int default 0,
  created_at  timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. EXPENSES
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.expenses (
  id              uuid primary key default gen_random_uuid(),
  trip_id         uuid references public.trips(id) on delete cascade not null,
  amount          numeric not null,
  title           text not null,
  category        text check (category in ('Food','Transport','Stay','Activity','Shopping','Other')) default 'Other',
  paid_by_user_id uuid references auth.users(id),
  paid_by_name    text not null,
  split_with      text[]  default '{}',
  split_mode      text check (split_mode in ('equal','fair')) default 'equal',
  source          text check (source in ('photo','voice','manual')) default 'manual',
  day_date        date default current_date,
  photo_url       text,
  created_at      timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. ITINERARY DAYS (Gemma-generated)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.itinerary_days (
  id              uuid primary key default gen_random_uuid(),
  trip_id         uuid references public.trips(id) on delete cascade not null,
  day_number      int not null,
  city            text,
  activities      text[] default '{}',
  stay            text,
  stay_note       text,
  food            text,
  transport       text,
  cost            int,
  reasoning_text  text,
  culture_snapshot text,
  cheaper_lodging  jsonb default '[]',
  hidden_gems      jsonb default '[]',
  created_at       timestamptz default now(),
  unique(trip_id, day_number)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. SETTLEMENTS
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.settlements (
  id             uuid primary key default gen_random_uuid(),
  trip_id        uuid references public.trips(id) on delete cascade not null,
  from_user_name text not null,
  to_user_name   text not null,
  amount         numeric not null,
  settled        boolean default false,
  settled_at     timestamptz,
  created_at     timestamptz default now()
);
