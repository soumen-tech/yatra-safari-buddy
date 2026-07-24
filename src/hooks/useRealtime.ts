/**
 * useRealtime — Supabase Realtime subscription for live group updates
 * Auto-unsubscribes when the component unmounts.
 */
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useRealtimeTripUpdates(tripId: string | null) {
  const qc = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!tripId) return;

    const channel = supabase
      .channel(`trip-${tripId}`)
      // New expense logged
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "expenses",
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          void qc.invalidateQueries({ queryKey: ["expenses", tripId] });
          void qc.invalidateQueries({ queryKey: ["settle", tripId] });
        },
      )
      // Expense deleted
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "expenses",
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          void qc.invalidateQueries({ queryKey: ["expenses", tripId] });
          void qc.invalidateQueries({ queryKey: ["settle", tripId] });
        },
      )
      // New member joined
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "trip_members",
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          void qc.invalidateQueries({ queryKey: ["trip", tripId] });
        },
      )
      // Settlement updated
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "settlements",
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          void qc.invalidateQueries({ queryKey: ["settle", tripId] });
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [tripId, qc]);
}
