/**
 * Offline queue + optimistic-lock conflict store.
 * Backed by Supabase offline_outbox table.
 */
import { create } from "zustand";
import { db } from "@/lib/supabase";
import { queryClient } from "@/lib/query-client";
import type { Database } from "@/types/supabase";

export type Lead = Database["public"]["Tables"]["leads"]["Row"];

const QUEUE_KEY = "tenacious.offline.queue.v1";
const CONFLICTS_KEY = "tenacious.offline.conflicts.v1";
const FORCED_OFFLINE_KEY = "tenacious.offline.forced.v1";

export type QueuedAction =
  | { kind: "update"; patch: Partial<Lead> }
  | { kind: "note"; body: string; isInternal: boolean; noteId: string };

export interface QueueItem {
  id: string;
  leadId: string;
  actorId: string;
  action: QueuedAction;
  baseVersion: number;
  appliedVersion: number;
  queuedAt: string;
}

export interface ConflictRecord {
  id: string;
  leadId: string;
  actorId: string;
  queuedAt: string;
  detectedAt: string;
  yourAction: QueuedAction;
  baseVersion: number;
  yourVersion: number;
  serverVersion: number;
  baselineSnapshot: Record<string, any>;
  serverSnapshot: Record<string, any>;
  resolved: boolean;
  resolution?: "force" | "merge" | "discard";
}

interface OfflineQueueState {
  queue: QueueItem[];
  conflicts: ConflictRecord[];
  forcedOffline: boolean;
  hydrate: () => void;
  isEffectivelyOffline: () => boolean;
  setForcedOffline: (v: boolean) => void;
  enqueue: (item: Omit<QueueItem, "id" | "queuedAt">) => void;
  replay: (userId: string) => Promise<{ synced: number; conflicts: number }>;
  addConflict: (c: Omit<ConflictRecord, "id" | "detectedAt" | "resolved">) => ConflictRecord;
  resolveConflict: (
    id: string,
    resolution: "force" | "merge" | "discard",
    patch?: Partial<Lead>,
  ) => Promise<void>;
  dismissConflict: (id: string) => void;
  pendingCountForLead: (leadId: string) => number;
  conflictForLead: (leadId: string) => ConflictRecord | undefined;
}

function readLS<T>(key: string, def: T): T {
  if (typeof window === "undefined") return def;
  const raw = window.localStorage.getItem(key);
  if (!raw) return def;
  try {
    return JSON.parse(raw);
  } catch {
    return def;
  }
}

function writeLS(key: string, val: any) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(key, JSON.stringify(val));
  }
}

function nid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export const useOfflineQueue = create<OfflineQueueState>((set, get) => ({
  queue: [],
  conflicts: [],
  forcedOffline: false,

  hydrate: () => {
    set({
      queue: readLS<QueueItem[]>(QUEUE_KEY, []),
      conflicts: readLS<ConflictRecord[]>(CONFLICTS_KEY, []),
      forcedOffline: readLS<boolean>(FORCED_OFFLINE_KEY, false),
    });
  },

  isEffectivelyOffline: () => {
    if (get().forcedOffline) return true;
    if (typeof navigator === "undefined") return false;
    return !navigator.onLine;
  },

  setForcedOffline: (v) => {
    writeLS(FORCED_OFFLINE_KEY, v);
    set({ forcedOffline: v });
  },

  enqueue: (item) => {
    const q = [...get().queue, { ...item, id: nid("q"), queuedAt: new Date().toISOString() }];
    writeLS(QUEUE_KEY, q);
    set({ queue: q });
  },

  replay: async (userId: string) => {
    const { queue } = get();

    // 1. Push local queue items to Supabase offline_outbox
    if (queue.length > 0) {
      for (const item of queue) {
        const payload =
          item.action.kind === "update"
            ? item.action.patch
            : {
                body: item.action.body,
                isInternal: item.action.isInternal,
                noteId: item.action.noteId,
              };

        const { error } = await db.from("offline_outbox").insert({
          user_id: item.actorId,
          lead_id: item.leadId,
          action_kind: item.action.kind,
          payload: payload as any,
          base_version: item.baseVersion,
          queued_at: item.queuedAt,
          conflict: false,
        });

        if (error) {
          console.error("Failed to push queued item to outbox:", error);
          return { synced: 0, conflicts: 0 };
        }
      }
      writeLS(QUEUE_KEY, []);
      set({ queue: [] });
    }

    // 2. Fetch all pending outbox rows from Supabase
    const { data: pending, error } = await db
      .from("offline_outbox")
      .select("*")
      .eq("user_id", userId)
      .is("synced_at", null)
      .order("queued_at", { ascending: true });

    if (error) {
      console.error("Failed to fetch pending outbox:", error);
      return { synced: 0, conflicts: 0 };
    }

    let syncedCount = 0;
    let conflictCount = 0;

    for (const item of pending || []) {
      // Fetch current lead to verify version
      const { data: lead, error: leadErr } = await db
        .from("leads")
        .select("version")
        .eq("id", item.lead_id)
        .maybeSingle();

      if (leadErr || !lead) {
        console.error(`Failed to fetch lead ${item.lead_id} during replay:`, leadErr);
        continue;
      }

      if (lead.version !== item.base_version) {
        conflictCount++;

        // Fetch full lead for serverSnapshot
        const { data: fullLead } = await db
          .from("leads")
          .select("*")
          .eq("id", item.lead_id)
          .maybeSingle();

        let yourAction: QueuedAction;
        if (item.action_kind === "note") {
          const p = item.payload as any;
          yourAction = { kind: "note", body: p.body, isInternal: p.isInternal, noteId: p.noteId };
        } else {
          yourAction = { kind: "update", patch: item.payload as Partial<Lead> };
        }

        get().addConflict({
          leadId: item.lead_id,
          actorId: item.user_id,
          queuedAt: item.queued_at,
          yourAction,
          baseVersion: item.base_version,
          yourVersion: item.base_version + 1,
          serverVersion: lead.version,
          baselineSnapshot: {},
          serverSnapshot: fullLead || {},
        });

        await db
          .from("offline_outbox")
          .update({ conflict: true, synced_at: new Date().toISOString() })
          .eq("id", item.id);
      } else {
        let applyErr = null;
        if (item.action_kind === "update") {
          const { error: updErr } = await db
            .from("leads")
            .update({ ...(item.payload as any), version: lead.version + 1 })
            .eq("id", item.lead_id);
          applyErr = updErr;
        } else if (item.action_kind === "note") {
          const p = item.payload as any;
          const { error: noteErr } = await db.from("lead_notes").insert({
            id: p.noteId,
            lead_id: item.lead_id,
            body: p.body,
            is_internal: p.isInternal,
            author_id: item.user_id,
            created_at: item.queued_at,
          });
          applyErr = noteErr;
        }

        if (applyErr) {
          console.error(`Failed to apply mutation for lead ${item.lead_id}:`, applyErr);
        } else {
          syncedCount++;
        }

        await db
          .from("offline_outbox")
          .update({ synced_at: new Date().toISOString(), conflict: false })
          .eq("id", item.id);
      }
    }

    if (syncedCount > 0) {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    }

    return { synced: syncedCount, conflicts: conflictCount };
  },

  addConflict: (c) => {
    const rec: ConflictRecord = {
      ...c,
      id: nid("cf"),
      detectedAt: new Date().toISOString(),
      resolved: false,
    };
    const next = [...get().conflicts, rec];
    writeLS(CONFLICTS_KEY, next);
    set({ conflicts: next });
    return rec;
  },

  resolveConflict: async (id, resolution, patch) => {
    const conflict = get().conflicts.find((c) => c.id === id);
    if (!conflict) return;

    if (resolution === "force" || resolution === "merge") {
      if (conflict.yourAction.kind === "update" && patch) {
        const { data: lead } = await db
          .from("leads")
          .select("version")
          .eq("id", conflict.leadId)
          .maybeSingle();

        const nextVersion = lead ? lead.version + 1 : conflict.serverVersion + 1;

        await db
          .from("leads")
          .update({
            ...patch,
            version: nextVersion,
          })
          .eq("id", conflict.leadId);
      } else if (conflict.yourAction.kind === "note") {
        const act = conflict.yourAction;
        await db.from("lead_notes").insert({
          id: act.noteId,
          lead_id: conflict.leadId,
          body: act.body,
          is_internal: act.isInternal,
          author_id: conflict.actorId,
          created_at: conflict.queuedAt,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead", conflict.leadId] });
    }

    const next = get().conflicts.map((c) =>
      c.id === id ? { ...c, resolved: true, resolution } : c,
    );
    writeLS(CONFLICTS_KEY, next);
    set({ conflicts: next });
  },

  dismissConflict: (id) => {
    const next = get().conflicts.filter((c) => c.id !== id);
    writeLS(CONFLICTS_KEY, next);
    set({ conflicts: next });
  },

  pendingCountForLead: (leadId) => get().queue.filter((q) => q.leadId === leadId).length,

  conflictForLead: (leadId) => get().conflicts.find((c) => c.leadId === leadId && !c.resolved),
}));

export async function simulateForeignEdit(leadId: string): Promise<boolean> {
  const { data: lead } = await db
    .from("leads")
    .select("version, full_name")
    .eq("id", leadId)
    .maybeSingle();

  if (!lead) return false;

  const { error } = await db
    .from("leads")
    .update({
      version: lead.version + 1,
      full_name: `${lead.full_name} (Foreign Edit)`,
    })
    .eq("id", leadId);

  if (error) {
    console.error("Failed to simulate foreign edit:", error);
    return false;
  }
  queryClient.invalidateQueries({ queryKey: ["leads"] });
  queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
  return true;
}
