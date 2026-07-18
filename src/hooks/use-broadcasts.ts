/**
 * Broadcasts React Query hooks.
 * Communicate directly with Supabase tables `broadcasts` and `broadcast_acknowledgments`.
 */
import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/supabase";
import { useRealtimeTable } from "@/hooks/use-realtime";
import type { Database } from "@/types/supabase";

export type Broadcast = Database["public"]["Tables"]["broadcasts"]["Row"];
export type BroadcastAcknowledgment =
  Database["public"]["Tables"]["broadcast_acknowledgments"]["Row"];

export type BroadcastWithSender = Broadcast & {
  sender?: {
    display_name: string;
    profile_photo_url: string | null;
  };
};

export function useBroadcasts() {
  return useQuery<BroadcastWithSender[]>({
    queryKey: ["broadcasts"],
    queryFn: async () => {
      // Query broadcasts and join sender information from profiles
      const { data, error } = await db
        .from("broadcasts")
        .select(
          `
          *,
          sender:sender_id(display_name, profile_photo_url)
        `,
        )
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data as unknown as BroadcastWithSender[];
    },
  });
}

export function useAddBroadcast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<Broadcast, "id" | "created_at">) => {
      const { data, error } = await db.from("broadcasts").insert(payload).select().maybeSingle();
      if (error) throw new Error(error.message);
      return data as Broadcast;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["broadcasts"] });
    },
  });
}

export function useBroadcastAcknowledgments(broadcastId: string) {
  return useQuery<BroadcastAcknowledgment[]>({
    queryKey: ["broadcast_acknowledgments", broadcastId],
    enabled: !!broadcastId,
    queryFn: async () => {
      const { data, error } = await db
        .from("broadcast_acknowledgments")
        .select("*")
        .eq("broadcast_id", broadcastId);
      if (error) throw new Error(error.message);
      return data as BroadcastAcknowledgment[];
    },
  });
}

export function useAcknowledgeBroadcast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ broadcastId, userId }: { broadcastId: string; userId: string }) => {
      const { data, error } = await db
        .from("broadcast_acknowledgments")
        .insert({ broadcast_id: broadcastId, user_id: userId })
        .select()
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as BroadcastAcknowledgment;
    },
    onSuccess: (data) => {
      if (data) {
        qc.invalidateQueries({ queryKey: ["broadcast_acknowledgments", data.broadcast_id] });
        qc.invalidateQueries({ queryKey: ["my_acknowledgments"] });
        qc.invalidateQueries({ queryKey: ["all_acknowledgments"] });
      }
    },
  });
}

export function useMyAcknowledgments(userId: string | null) {
  return useQuery<string[]>({
    queryKey: ["my_acknowledgments", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await db
        .from("broadcast_acknowledgments")
        .select("broadcast_id")
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
      return (data || []).map((d: any) => d.broadcast_id as string);
    },
  });
}

export function useAllAcknowledgments() {
  return useQuery<BroadcastAcknowledgment[]>({
    queryKey: ["all_acknowledgments"],
    queryFn: async () => {
      const { data, error } = await db.from("broadcast_acknowledgments").select("*");
      if (error) throw new Error(error.message);
      return data as BroadcastAcknowledgment[];
    },
  });
}

/**
 * Subscribes to realtime INSERT events on `broadcasts` (all rows) and
 * invalidates the broadcasts query cache. Mount once in AppShell so
 * the BroadcastOverlay surfaces new broadcasts immediately.
 */
export function useRealtimeBroadcasts() {
  const qc = useQueryClient();
  const onInsert = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["broadcasts"] });
  }, [qc]);

  useRealtimeTable("broadcasts", undefined, onInsert);
}

/**
 * Subscribes to realtime INSERT events on `broadcast_acknowledgments`
 * filtered to the current user and invalidates `my_acknowledgments`.
 * When a user acknowledges on another device/tab the overlay dismisses.
 */
export function useRealtimeAcknowledgments(userId: string | null) {
  const qc = useQueryClient();
  const onInsert = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["my_acknowledgments", userId] });
  }, [qc, userId]);

  useRealtimeTable(
    "broadcast_acknowledgments",
    userId ? `user_id=eq.${userId}` : undefined,
    onInsert,
    !!userId,
  );
}
