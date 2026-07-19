import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuditLog, auditEntriesToCsv, type AuditEntry } from "@/hooks/use-audit-log";
import { useAllProfiles } from "@/hooks/use-profiles";
import { Button } from "@/components/ui/tenacious-button";
import { TenaciousInput } from "@/components/ui/form-controls";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, ChevronRight, Download, Search, ScrollText } from "lucide-react";

export const Route = createFileRoute("/admin/audit")({
  head: () => ({ meta: [{ title: "Audit Log — Tenacious CRM" }] }),
  component: AuditLogPage,
});

const TYPE_FAMILIES = [
  { value: "", label: "All types" },
  { value: "auth.", label: "Auth" },
  { value: "user.", label: "Users" },
  { value: "lead", label: "Leads" },
  { value: "settings.", label: "Settings" },
  { value: "reversion", label: "Reversions" },
  { value: "crf", label: "CRF" },
];

const SEVERITY_STYLES: Record<string, string> = {
  info: "bg-[var(--color-chip-inactive-bg)] text-[var(--color-chip-inactive-fg)]",
  warning: "bg-[var(--color-chip-warning-bg)] text-[var(--color-chip-warning-fg)]",
  critical: "bg-[var(--color-chip-critical-bg)] text-[var(--color-chip-critical-fg)]",
};

function AuditLogPage() {
  const [typePrefix, setTypePrefix] = useState("");
  const [actorId, setActorId] = useState("");
  const [severity, setSeverity] = useState<"" | "info" | "warning" | "critical">("");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: profiles = [] } = useAllProfiles();
  const filters = useMemo(
    () => ({
      typePrefix: typePrefix || undefined,
      actorId: actorId || undefined,
      severity: severity || undefined,
      search: search || undefined,
      from: from || undefined,
      to: to || undefined,
    }),
    [typePrefix, actorId, severity, search, from, to],
  );
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useAuditLog(filters);
  const entries: AuditEntry[] = useMemo(() => data?.pages.flat() ?? [], [data]);

  const exportCsv = () => {
    if (!entries.length) {
      toast.info("Nothing to export for the current filters.");
      return;
    }
    const blob = new Blob([auditEntriesToCsv(entries)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectClass =
    "h-10 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-[var(--color-text)]">
            <ScrollText className="h-6 w-6 text-[var(--color-primary)]" />
            Audit Log
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Every security-relevant action, newest first. Only you can see the full log.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={exportCsv}
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-secondary)]" />
          <TenaciousInput
            placeholder="Search summaries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={typePrefix}
          onChange={(e) => setTypePrefix(e.target.value)}
          className={selectClass}
        >
          {TYPE_FAMILIES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <select value={actorId} onChange={(e) => setActorId(e.target.value)} className={selectClass}>
          <option value="">All actors</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.display_name}
            </option>
          ))}
        </select>
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value as typeof severity)}
          className={selectClass}
        >
          <option value="">All severities</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className={selectClass}
          aria-label="From date"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className={selectClass}
          aria-label="To date"
        />
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-[var(--color-text-secondary)]">
          Loading audit log...
        </div>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Time</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Summary</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-sm text-[var(--color-text-secondary)]"
                  >
                    No audit entries match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((e) => {
                  const expanded = expandedId === e.id;
                  return (
                    <Fragment key={e.id}>
                      <TableRow
                        className="cursor-pointer"
                        onClick={() => setExpandedId(expanded ? null : e.id)}
                      >
                        <TableCell className="text-[var(--color-text-secondary)]">
                          {expanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-[var(--color-text-secondary)]">
                          {new Date(e.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {e.actor ? (
                            <button
                              type="button"
                              className="font-medium text-[var(--color-primary)] hover:underline"
                              onClick={(ev) => {
                                ev.stopPropagation();
                                setActorId(e.actor_id ?? "");
                              }}
                            >
                              {e.actor.display_name}
                            </button>
                          ) : (
                            <span className="text-[var(--color-text-secondary)]">system</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {e.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={SEVERITY_STYLES[e.severity] ?? SEVERITY_STYLES.info}>
                            {e.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-md truncate text-sm">{e.summary}</TableCell>
                      </TableRow>
                      {expanded && (
                        <TableRow>
                          <TableCell colSpan={6} className="bg-[var(--color-surface)]">
                            <pre className="max-h-64 overflow-auto whitespace-pre-wrap p-2 font-mono text-xs text-[var(--color-text-secondary)]">
                              {JSON.stringify(
                                { lead_id: e.lead_id, meta: e.meta ?? {} },
                                null,
                                2,
                              )}
                            </pre>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
          {hasNextPage && (
            <div className="border-t border-[var(--color-border)] p-3 text-center">
              <Button
                variant="secondary"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Loading..." : "Load more"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
