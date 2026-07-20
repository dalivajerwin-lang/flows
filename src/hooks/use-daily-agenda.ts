/**
 * Daily Agenda Planner hooks.
 *
 * Items live in `daily_agenda_items` (migration 021). RLS: owners read/write
 * their own items; managers/superadmin read everyone's (view only).
 * "Planned" = >=1 item for the day; "done" = every item checked. Derived
 * client-side via agendaStatusFor — never stored.
 */
import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/supabase";
import { queryClient } from "@/lib/query-client";
import { useAuth, type Profile } from "@/stores/auth-store";
import { useProfiles } from "@/hooks/use-profiles";
import { useAssistantStore } from "@/stores/assistant-store";
import { useRealtimeTableAllEvents } from "@/hooks/use-realtime";
import { todayKeyManila } from "@/lib/schedule-time";
import type { Database } from "@/types/supabase";

export type AgendaItem = Database["public"]["Tables"]["daily_agenda_items"]["Row"];

export type AgendaStatus = "not_planned" | "in_progress" | "done";

export function agendaStatusFor(items: AgendaItem[]): AgendaStatus {
  if (items.length === 0) return "not_planned";
  return items.every((i) => i.done) ? "done" : "in_progress";
}

// ─── Consultant: own agenda ──────────────────────────────────────────────────

export function useMyAgenda(date: string = todayKeyManila()) {
  const userId = useAuth((s) => s.userId);
  return useQuery<AgendaItem[]>({
    queryKey: ["daily_agenda", "mine", userId, date],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await db
        .from("daily_agenda_items")
        .select("*")
        .eq("user_id", userId)
        .eq("agenda_date", date)
        .order("position")
        .order("created_at");
      if (error) throw new Error(error.message);
      return data as AgendaItem[];
    },
  });
}

// ─── Manager: whole team for one day ─────────────────────────────────────────

/** All items for a date across the team (RLS grants managers full read). */
export function useTeamAgendas(date: string = todayKeyManila(), enabled = true) {
  return useQuery<AgendaItem[]>({
    queryKey: ["daily_agenda", "team", date],
    enabled,
    queryFn: async () => {
      const { data, error } = await db
        .from("daily_agenda_items")
        .select("*")
        .eq("agenda_date", date)
        .order("position")
        .order("created_at");
      if (error) throw new Error(error.message);
      return data as AgendaItem[];
    },
  });
}

export function groupAgendaByUser(items: AgendaItem[]): Record<string, AgendaItem[]> {
  const byUser: Record<string, AgendaItem[]> = {};
  for (const item of items) {
    (byUser[item.user_id] ??= []).push(item);
  }
  return byUser;
}

export interface TeamAgendaRow {
  consultant: Profile;
  items: AgendaItem[];
  status: AgendaStatus;
  doneCount: number;
}

const STATUS_ORDER: Record<AgendaStatus, number> = { not_planned: 0, in_progress: 1, done: 2 };

/**
 * Manager overview: one row per active consultant (roster minus superadmin),
 * sorted worst-first (not planned → in progress → done) so problems surface.
 */
export function useTeamAgendaOverview(date: string = todayKeyManila()) {
  const { data: items = [], isLoading: itemsLoading } = useTeamAgendas(date);
  const { data: profiles = [], isLoading: profilesLoading } = useProfiles();

  const rows = useMemo<TeamAgendaRow[]>(() => {
    const byUser = groupAgendaByUser(items);
    return profiles
      .filter((p) => p.role === "property_consultant" && p.is_active)
      .map((consultant) => {
        const own = byUser[consultant.id] ?? [];
        return {
          consultant,
          items: own,
          status: agendaStatusFor(own),
          doneCount: own.filter((i) => i.done).length,
        };
      })
      .sort(
        (a, b) =>
          STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
          a.consultant.display_name.localeCompare(b.consultant.display_name),
      );
  }, [items, profiles]);

  return { rows, isLoading: itemsLoading || profilesLoading };
}

// ─── Mutations (owner only, enforced by RLS) ─────────────────────────────────

async function invalidateAgenda() {
  queryClient.invalidateQueries({ queryKey: ["daily_agenda"] });
}

export async function addAgendaItem(
  userId: string,
  text: string,
  date: string = todayKeyManila(),
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await db.from("daily_agenda_items").insert({
    user_id: userId,
    agenda_date: date,
    text: text.trim(),
    position: Date.now() % 1_000_000_000,
  });
  if (error) return { ok: false, error: error.message };
  await invalidateAgenda();
  return { ok: true };
}

export async function toggleAgendaItem(
  item: AgendaItem,
): Promise<{ ok: boolean; error?: string }> {
  const done = !item.done;
  const { error } = await db
    .from("daily_agenda_items")
    .update({
      done,
      done_at: done ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", item.id);
  if (error) return { ok: false, error: error.message };
  await invalidateAgenda();
  return { ok: true };
}

export async function removeAgendaItem(id: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await db.from("daily_agenda_items").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  await invalidateAgenda();
  return { ok: true };
}

// ─── Realtime ────────────────────────────────────────────────────────────────

/**
 * Invalidates agenda queries on any change to daily_agenda_items.
 * Mount once (AppShell) — covers the manager screen and cross-device sync.
 */
export function useRealtimeAgenda(enabled = true) {
  const qc = useQueryClient();
  const onChange = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["daily_agenda"] });
  }, [qc]);
  useRealtimeTableAllEvents("daily_agenda_items", undefined, onChange, enabled);
}

// ─── Legacy migration ────────────────────────────────────────────────────────

/**
 * One-time, best-effort: move not-done localStorage todos (assistant-store)
 * into today's DB agenda, then clear the local list. Safe to call on every
 * sign-in — no-ops once the local list is empty.
 */
export async function migrateLegacyTodos(userId: string): Promise<void> {
  const { todos } = useAssistantStore.getState();
  const legacy = todos[userId] ?? [];
  if (legacy.length === 0) return;
  try {
    const pending = legacy.filter((t) => !t.done);
    if (pending.length > 0) {
      const date = todayKeyManila();
      const { error } = await db.from("daily_agenda_items").insert(
        pending.map((t, i) => ({
          user_id: userId,
          agenda_date: date,
          text: t.text.slice(0, 500),
          position: i,
        })),
      );
      if (error) return; // keep local todos so a later session can retry
    }
    useAssistantStore.setState((s) => ({ todos: { ...s.todos, [userId]: [] } }));
    await invalidateAgenda();
  } catch {
    // best-effort — never block sign-in
  }
}
