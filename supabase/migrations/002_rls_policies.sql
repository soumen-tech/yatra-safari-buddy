-- ═══════════════════════════════════════════════════════════════════════════
-- YatraAI — Row Level Security (RLS) Policies
-- Run AFTER 001_initial_schema.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- Helper: check if the calling user is a member of a trip
create or replace function public.is_trip_member(trip_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.trip_members
    where trip_members.trip_id = $1
      and trip_members.user_id = auth.uid()
  );
$$;

-- Helper: check if the calling user owns a trip
create or replace function public.is_trip_owner(trip_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.trips
    where trips.id = $1
      and trips.owner_id = auth.uid()
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIPS
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.trips enable row level security;

create policy "trips_select_member"
  on public.trips for select
  using (owner_id = auth.uid() or public.is_trip_member(id));

create policy "trips_insert_owner"
  on public.trips for insert
  with check (owner_id = auth.uid());

create policy "trips_update_owner"
  on public.trips for update
  using (owner_id = auth.uid());

create policy "trips_delete_owner"
  on public.trips for delete
  using (owner_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIP MEMBERS
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.trip_members enable row level security;

create policy "trip_members_select_member"
  on public.trip_members for select
  using (public.is_trip_member(trip_id) or public.is_trip_owner(trip_id));

create policy "trip_members_insert_owner_or_self"
  on public.trip_members for insert
  with check (public.is_trip_owner(trip_id) or user_id = auth.uid());

create policy "trip_members_update_owner"
  on public.trip_members for update
  using (public.is_trip_owner(trip_id));

create policy "trip_members_delete_owner"
  on public.trip_members for delete
  using (public.is_trip_owner(trip_id) or user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- INVITES
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.invites enable row level security;

-- Anyone can read invites (needed for code redemption before auth)
-- In production you'd scope this more tightly with a JWT claim
create policy "invites_select_all"
  on public.invites for select
  using (true);

create policy "invites_insert_owner"
  on public.invites for insert
  with check (public.is_trip_owner(trip_id));

create policy "invites_update_owner"
  on public.invites for update
  using (public.is_trip_owner(trip_id));

create policy "invites_delete_owner"
  on public.invites for delete
  using (public.is_trip_owner(trip_id));

-- ─────────────────────────────────────────────────────────────────────────────
-- EXPENSES
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.expenses enable row level security;

create policy "expenses_select_member"
  on public.expenses for select
  using (public.is_trip_member(trip_id) or public.is_trip_owner(trip_id));

create policy "expenses_insert_member"
  on public.expenses for insert
  with check (public.is_trip_member(trip_id) or public.is_trip_owner(trip_id));

create policy "expenses_update_member"
  on public.expenses for update
  using (paid_by_user_id = auth.uid() or public.is_trip_owner(trip_id));

create policy "expenses_delete_member"
  on public.expenses for delete
  using (paid_by_user_id = auth.uid() or public.is_trip_owner(trip_id));

-- ─────────────────────────────────────────────────────────────────────────────
-- ITINERARY DAYS
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.itinerary_days enable row level security;

create policy "itinerary_select_member"
  on public.itinerary_days for select
  using (public.is_trip_member(trip_id) or public.is_trip_owner(trip_id));

create policy "itinerary_insert_owner"
  on public.itinerary_days for insert
  with check (public.is_trip_owner(trip_id));

create policy "itinerary_update_owner"
  on public.itinerary_days for update
  using (public.is_trip_owner(trip_id));

create policy "itinerary_delete_owner"
  on public.itinerary_days for delete
  using (public.is_trip_owner(trip_id));

-- ─────────────────────────────────────────────────────────────────────────────
-- SETTLEMENTS
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.settlements enable row level security;

create policy "settlements_select_member"
  on public.settlements for select
  using (public.is_trip_member(trip_id) or public.is_trip_owner(trip_id));

create policy "settlements_insert_member"
  on public.settlements for insert
  with check (public.is_trip_member(trip_id) or public.is_trip_owner(trip_id));

create policy "settlements_update_member"
  on public.settlements for update
  using (public.is_trip_member(trip_id) or public.is_trip_owner(trip_id));
