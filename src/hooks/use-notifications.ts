/**
 * Notifications React Query hooks.
 * Communicate directly with Supabase table `notifications`.
 */
import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/supabase";
import { useRealtimeTable } from "@/hooks/use-realtime";
import { layersFor, sendPush } from "@/lib/notify";
import type { Database } from "@/types/supabase";

export type AppNotification = Database["public"]["Tables"]["notifications"]["Row"];

/** Blueprint: initial load caps at the 20 most recent unread + 30 read ("Show older"). */
const UNREAD_LIMIT = 20;
const READ_LIMIT = 30;

export function useNotifications(userId: string | null) {
  return useQuery<AppNotification[]>({
    queryKey: ["notifications", userId],
    enabled: !!userId,
    queryFn: async () => {
      // Blueprint load strategy: most recent 20 unread + most recent 30 read.
      const [unreadRes, readRes] = await Promise.all([
        db
          .from("notifications")
          .select("*")
          .eq("user_id", userId)
          .eq("is_read", false)
          .order("created_at", { ascending: false })
          .limit(UNREAD_LIMIT),
        db
          .from("notifications")
          .select("*")
          .eq("user_id", userId)
          .eq("is_read", true)
          .order("created_at", { ascending: false })
          .limit(READ_LIMIT),
      ]);
      if (unreadRes.error) throw new Error(unreadRes.error.message);
      if (readRes.error) throw new Error(readRes.error.message);
      return [...(unreadRes.data as AppNotification[]), ...(readRes.data as AppNotification[])];
    },
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isRead = true }: { id: string; isRead?: boolean }) => {
      const { data, error } = await db
        .from("notifications")
        .update({ is_read: isRead })
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as AppNotification;
    },
    onSuccess: (data) => {
      if (data) {
        qc.invalidateQueries({ queryKey: ["notifications", data.user_id] });
      }
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await db
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);
      if (error) throw new Error(error.message);
      return userId;
    },
    onSuccess: (userId) => {
      qc.invalidateQueries({ queryKey: ["notifications", userId] });
    },
  });
}

export function useAddNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<AppNotification, "id" | "created_at" | "is_read">) => {
      const { data, error } = await db
        .from("notifications")
        .insert({ ...payload, is_read: false })
        .select()
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as AppNotification;
    },
    onSuccess: (data) => {
      if (data) {
        qc.invalidateQueries({ queryKey: ["notifications", data.user_id] });
      }
    },
  });
}

/**
 * Subscribes to realtime INSERT events on `notifications` for the given
 * user and invalidates the React Query cache on arrival. Also fires
 * Layer 3 (push) for rows whose Priority Matrix push flag is set —
 * sendPush() itself no-ops unless permission is granted and the tab is
 * hidden, so the toast layer never double-fires. Mount this once in
 * AppShell so the badge, list, toast, and push all update live.
 */
export function useRealtimeNotifications(userId: string | null) {
  const qc = useQueryClient();
  const onInsert = useCallback(
    (payload: { new: Record<string, unknown> }) => {
      qc.invalidateQueries({ queryKey: ["notifications", userId] });
      const n = payload.new as AppNotification | undefined;
      if (n && n.user_id === userId && layersFor(n).push) {
        sendPush(n);
      }
    },
    [qc, userId],
  );

  useRealtimeTable(
    "notifications",
    userId ? `user_id=eq.${userId}` : undefined,
    onInsert,
    !!userId,
  );
}
