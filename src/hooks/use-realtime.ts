/**
 * Reusable Supabase Realtime subscription hook.
 *
 * Listens for INSERT events on a Postgres table via the
 * `postgres_changes` listener. Creates the channel on mount
 * and removes it on unmount — callers never manage lifecycle.
 *
 * @param table    - Supabase table name (e.g. "notifications")
 * @param filter   - Optional PostgREST row filter (e.g. "user_id=eq.abc123").
 *                   When omitted, all INSERTs on the table are received.
 * @param onInsert - Callback fired with the new record payload on every INSERT.
 * @param enabled  - When false the subscription is not created (e.g. no userId yet).
 */
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

type RealtimePayload = {
  new: Record<string, unknown>;
  old: Record<string, unknown>;
  eventType: "INSERT" | "UPDATE" | "DELETE";
};

export function useRealtimeTable(
  table: string,
  filter: string | undefined,
  onInsert: (payload: RealtimePayload) => void,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return;

    // Channel names must be unique per subscription; encode filter into name.
    const channelName = filter ? `rt:${table}:${filter}` : `rt:${table}:all`;

    const channel = supabase
      .channel(channelName)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        {
          event: "INSERT",
          schema: "public",
          table,
          ...(filter ? { filter } : {}),
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => onInsert(payload as RealtimePayload),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // onInsert is intentionally excluded — callers should memoize if needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filter, enabled]);
}

/**
 * Like useRealtimeTable but fires on INSERT, UPDATE and DELETE. Use for
 * tables where row edits matter (e.g. daily_agenda_items check-offs).
 */
export function useRealtimeTableAllEvents(
  table: string,
  filter: string | undefined,
  onChange: (payload: RealtimePayload) => void,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return;

    const channelName = filter ? `rt*:${table}:${filter}` : `rt*:${table}:all`;

    const channel = supabase
      .channel(channelName)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        {
          event: "*",
          schema: "public",
          table,
          ...(filter ? { filter } : {}),
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => onChange(payload as RealtimePayload),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // onChange is intentionally excluded — callers should memoize if needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filter, enabled]);
}
