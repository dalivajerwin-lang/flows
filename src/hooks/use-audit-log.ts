import { useInfiniteQuery } from "@tanstack/react-query";
import { db } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

export type AuditEntry = Database["public"]["Tables"]["audit_trail"]["Row"] & {
  actor: { display_name: string; role: string } | null;
};

export interface AuditLogFilters {
  /** Matches type prefix, e.g. "user." or exact type. */
  typePrefix?: string;
  actorId?: string;
  severity?: "info" | "warning" | "critical";
  search?: string;
  from?: string; // ISO date
  to?: string; // ISO date
}

export const AUDIT_PAGE_SIZE = 50;

/**
 * Infinite, filterable audit log (superadmin sees everything; RLS trims
 * security-sensitive families for managers). Cursor = created_at of the
 * last row, which the (created_at desc) index serves directly.
 */
export function useAuditLog(filters: AuditLogFilters) {
  return useInfiniteQuery({
    queryKey: ["audit_trail", "admin", filters],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      let q = db
        .from("audit_trail")
        .select("*, actor:profiles!audit_trail_actor_id_fkey(display_name, role)")
        .order("created_at", { ascending: false })
        .limit(AUDIT_PAGE_SIZE);

      if (pageParam) q = q.lt("created_at", pageParam);
      if (filters.typePrefix) q = q.like("type", `${filters.typePrefix}%`);
      if (filters.actorId) q = q.eq("actor_id", filters.actorId);
      if (filters.severity) q = q.eq("severity", filters.severity);
      if (filters.search) q = q.ilike("summary", `%${filters.search}%`);
      if (filters.from) q = q.gte("created_at", filters.from);
      if (filters.to) q = q.lte("created_at", `${filters.to}T23:59:59.999Z`);

      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return data as unknown as AuditEntry[];
    },
    getNextPageParam: (lastPage) =>
      lastPage.length === AUDIT_PAGE_SIZE ? lastPage[lastPage.length - 1].created_at : null,
  });
}

export function auditEntriesToCsv(entries: AuditEntry[]): string {
  const esc = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const header = ["created_at", "actor", "role", "type", "severity", "summary", "lead_id", "meta"];
  const rows = entries.map((e) =>
    [
      e.created_at,
      e.actor?.display_name ?? "system",
      e.actor?.role ?? "",
      e.type,
      e.severity,
      e.summary,
      e.lead_id ?? "",
      e.meta ? JSON.stringify(e.meta) : "",
    ]
      .map(esc)
      .join(","),
  );
  return [header.join(","), ...rows].join("\n");
}
