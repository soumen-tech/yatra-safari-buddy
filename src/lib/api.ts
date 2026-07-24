/**
 * YatraAI — Unified Frontend API Client & React Query Hooks
 * Production-ready API service layer connecting UI components with Nitro / Express backend.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";

/* ────── Generic Fetcher ────── */
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const session = (await supabase.auth.getSession()).data.session;
  const token = session?.access_token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error((data as { error?: string }).error || "API Request Failed");
  }

  return data as T;
}

/* ────── API Interfaces ────── */
export interface TripPayload {
  budget: number;
  days: number;
  origin: string;
  vibe: string;
  budget_mode: "person" | "group";
  party_size: number;
  title?: string;
}

export interface FarePayload {
  from: string;
  to: string;
  quoted_fare: number;
  mode: string;
}

export interface TranslatePayload {
  text: string;
  target_language: "hindi" | "bengali" | "tamil" | "marathi";
  user_id?: string;
}

export interface SafetyPayload {
  query: string;
  city?: string;
  time_of_day?: string;
}

/* ────── React Query Hooks ────── */

// 1. Health Check
export function useHealthCheck() {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => fetchApi<{ status: string; services: Record<string, string> }>("/api/health"),
    staleTime: 30000,
  });
}

// 2. Trips Hooks
export function useUserTrips() {
  return useQuery({
    queryKey: ["trips"],
    queryFn: () => fetchApi<unknown[]>("/api/trips"),
  });
}

export function useTripDetail(tripId: string | null) {
  return useQuery({
    queryKey: ["trip", tripId],
    queryFn: () => fetchApi<unknown>(`/api/trips/${tripId}`),
    enabled: !!tripId,
  });
}

export function useCreateTripMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TripPayload) => fetchApi<{ trip_id: string; invite_code: string }>("/api/trips", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}

// 3. Gemma AI Hooks
export function useGemmaTripMutation() {
  return useMutation({
    mutationFn: (payload: TripPayload) => fetchApi<unknown[]>("/api/gemma/trip", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  });
}

export function useFareShieldMutation() {
  return useMutation({
    mutationFn: (payload: FarePayload) => fetchApi<{ fairFare: number; verdict: string; reasoning: string; counterOffer: string; counterOfferHindi: string }>("/api/gemma/fare", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  });
}

export function useTranslatorMutation() {
  return useMutation({
    mutationFn: (payload: TranslatePayload) => fetchApi<{ sourceText: string; translatedText: string; pronunciation: string; bargainingSuggestion: string }>("/api/gemma/translate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  });
}

export function useSafetyCheckMutation() {
  return useMutation({
    mutationFn: (payload: SafetyPayload) => fetchApi<{ safetyLevel: string; advice: string; safeRefuges: string[]; scamWarning: string }>("/api/gemma/safety", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  });
}

// 4. Invite Hooks
export function useRedeemInviteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { code: string; display_name: string; contribution_tier?: string }) =>
      fetchApi<{ success: boolean; trip_id: string; message: string }>("/api/invites/redeem", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}
