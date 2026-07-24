/**
 * useTrip — All TanStack Query hooks for trip data
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ─── Types ───────────────────────────────────────────────────────────────────
export interface Trip {
  id: string;
  owner_id: string;
  title: string | null;
  origin: string | null;
  vibe: string | null;
  days: number;
  budget_mode: "person" | "group";
  total_budget: number;
  party_size: number;
  created_at: string;
}

export interface TripMember {
  id: string;
  trip_id: string;
  user_id: string | null;
  display_name: string;
  contribution_tier: "low" | "medium" | "high";
  income_weight: number;
  joined_via_invite: boolean;
}

export interface Expense {
  id: string;
  trip_id: string;
  amount: number;
  title: string;
  category: string;
  paid_by_user_id: string | null;
  paid_by_name: string;
  split_with: string[];
  split_mode: "equal" | "fair";
  source: "photo" | "voice" | "manual";
  day_date: string;
  photo_url: string | null;
  created_at: string;
}

export interface SettleResult {
  netBalances: Record<string, number>;
  transactions: { from: string; to: string; amount: number }[];
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────
async function fetchTrips(): Promise<Trip[]> {
  const res = await fetch("/api/trips");
  if (!res.ok) throw new Error("Failed to fetch trips");
  return res.json() as Promise<Trip[]>;
}

async function fetchTrip(tripId: string): Promise<{ trip: Trip; members: TripMember[]; itinerary: unknown[] }> {
  const res = await fetch(`/api/trips/${tripId}`);
  if (!res.ok) throw new Error("Failed to fetch trip");
  return res.json() as Promise<{ trip: Trip; members: TripMember[]; itinerary: unknown[] }>;
}

async function fetchExpenses(tripId: string): Promise<Expense[]> {
  const res = await fetch(`/api/expenses?trip_id=${tripId}`);
  if (!res.ok) throw new Error("Failed to fetch expenses");
  return res.json() as Promise<Expense[]>;
}

async function fetchSettlement(tripId: string): Promise<SettleResult> {
  const res = await fetch(`/api/trips/${tripId}/settle`);
  if (!res.ok) throw new Error("Failed to compute settlement");
  return res.json() as Promise<SettleResult>;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────
export function useTrips() {
  return useQuery({
    queryKey: ["trips"],
    queryFn: fetchTrips,
    staleTime: 30_000,
  });
}

export function useTrip(tripId: string | null) {
  return useQuery({
    queryKey: ["trip", tripId],
    queryFn: () => fetchTrip(tripId!),
    enabled: !!tripId,
    staleTime: 30_000,
  });
}

export function useExpenses(tripId: string | null) {
  return useQuery({
    queryKey: ["expenses", tripId],
    queryFn: () => fetchExpenses(tripId!),
    enabled: !!tripId,
    staleTime: 10_000,
  });
}

export function useSettlement(tripId: string | null) {
  return useQuery({
    queryKey: ["settle", tripId],
    queryFn: () => fetchSettlement(tripId!),
    enabled: !!tripId,
    staleTime: 10_000,
  });
}

export function useLogExpense(tripId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (expense: Omit<Expense, "id" | "created_at">) => {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expense),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? "Failed to log expense");
      }
      return res.json();
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["expenses", tripId] });
      void qc.invalidateQueries({ queryKey: ["settle", tripId] });
    },
  });
}

export function useCreateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      budget: number;
      days: number;
      origin: string;
      vibe: string;
      budget_mode: "person" | "group";
      party_size: number;
    }) => {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? "Failed to create trip");
      }
      return res.json() as Promise<{ trip_id: string; invite_code: string; itinerary: unknown[] }>;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}
