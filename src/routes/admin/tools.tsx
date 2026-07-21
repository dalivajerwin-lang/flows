import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/stores/auth-store";
import { useAllProfiles } from "@/hooks/use-profiles";
import {
  useAdminExportBackup,
  useAdminForceStage,
  useAdminPurgeTrash,
  useAdminReassignLeads,
  useAdminRestoreLead,
} from "@/hooks/use-admin";
import { useDeletedLeads, useLeadsAssignedTo, usePendingApprovals } from "@/hooks/use-admin-tools";
import { approveReversion, denyReversion } from "@/stores/pipeline-store";
import { STAGES, STAGE_LABELS, type Stage } from "@/lib/constants";
import { Button } from "@/components/ui/tenacious-button";
import { Field, TenaciousInput } from "@/components/ui/form-controls";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArchiveRestore, ArrowRightLeft, DatabaseBackup, Inbox, Trash2, Wrench } from "lucide-react";

export const Route = createFileRoute("/admin/tools")({
  head: () => ({ meta: [{ title: "Intervention Tools — Tenacious CRM" }] }),
  component: AdminToolsPage,
});

const selectClass =
  "h-10 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]";

function AdminToolsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-[var(--color-text)]">
          <Wrench className="h-6 w-6 text-[var(--color-primary)]" />
          Intervention Tools
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Superadmin escape hatches. Every action is written to the{" "}
          <Link to="/admin/audit" className="text-[var(--color-primary)] hover:underline">
            audit log
          </Link>{" "}
          with your name on it.
        </p>
      </div>

      <Tabs defaultValue="reassign" className="w-full">
        <TabsList className="grid w-full max-w-[720px] grid-cols-5">
          <TabsTrigger value="reassign">Reassign</TabsTrigger>
          <TabsTrigger value="stage">Force Stage</TabsTrigger>
          <TabsTrigger value="trash">Deleted Leads</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>

        <TabsContent value="reassign" className="mt-4">
          <ReassignPanel />
        </TabsContent>
        <TabsContent value="stage" className="mt-4">
          <ForceStagePanel />
        </TabsContent>
        <TabsContent value="trash" className="mt-4">
          <DeletedLeadsPanel />
        </TabsContent>
        <TabsContent value="approvals" className="mt-4">
          <ApprovalsPanel />
        </TabsContent>
        <TabsContent value="backup" className="mt-4">
          <BackupPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Bulk lead reassignment ──────────────────────────────────────────────

function ReassignPanel() {
  const { data: profiles = [] } = useAllProfiles();
  const [fromUser, setFromUser] = useState("");
  const [toUser, setToUser] = useState("");
  const { data: fromLeads = [] } = useLeadsAssignedTo(fromUser || null);
  const reassign = useAdminReassignLeads();

  const activeTargets = profiles.filter((p) => p.is_active && p.role !== "superadmin");

  const handleReassign = async () => {
    try {
      const moved = await reassign.mutateAsync({ fromUser, toUser });
      toast.success(`${moved} lead(s) reassigned.`);
      setFromUser("");
      setToUser("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reassignment failed.");
    }
  };

  return (
    <div className="max-w-2xl space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] p-6 shadow-sm">
      <div className="flex items-center gap-2 font-semibold text-[var(--color-text)]">
        <ArrowRightLeft className="h-5 w-5 text-[var(--color-primary)]" />
        Bulk lead reassignment
      </div>
      <p className="text-sm text-[var(--color-text-secondary)]">
        Move every open lead from one user to another — for when a consultant leaves or is
        deactivated and their pipeline must not sit orphaned.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="From">
          <select
            value={fromUser}
            onChange={(e) => setFromUser(e.target.value)}
            className={selectClass}
          >
            <option value="">Select user...</option>
            {profiles
              .filter((p) => p.role !== "superadmin")
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name} {p.is_active ? "" : "(deactivated)"}
                </option>
              ))}
          </select>
        </Field>
        <Field label="To">
          <select
            value={toUser}
            onChange={(e) => setToUser(e.target.value)}
            className={selectClass}
          >
            <option value="">Select active user...</option>
            {activeTargets
              .filter((p) => p.id !== fromUser)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name}
                </option>
              ))}
          </select>
        </Field>
      </div>
      {fromUser && (
        <p className="text-sm text-[var(--color-text-secondary)]">
          {fromLeads.length} open lead(s) will be moved.
        </p>
      )}
      <Button
        disabled={
          !fromUser ||
          !toUser ||
          fromUser === toUser ||
          reassign.isPending ||
          fromLeads.length === 0
        }
        onClick={handleReassign}
      >
        {reassign.isPending ? "Reassigning..." : `Reassign ${fromLeads.length || ""} lead(s)`}
      </Button>
    </div>
  );
}

// ── Force stage transition ──────────────────────────────────────────────

function ForceStagePanel() {
  const { data: profiles = [] } = useAllProfiles();
  const [ownerId, setOwnerId] = useState("");
  const { data: leads = [] } = useLeadsAssignedTo(ownerId || null);
  const [leadId, setLeadId] = useState("");
  const [toStage, setToStage] = useState<Stage | "">("");
  const [reason, setReason] = useState("");
  const forceStage = useAdminForceStage();

  const selectedLead = leads.find((l) => l.id === leadId);

  const handleForce = async () => {
    if (!leadId || !toStage) return;
    try {
      await forceStage.mutateAsync({ leadId, toStage, reason });
      toast.success(`Stage forced to ${STAGE_LABELS[toStage as Stage]}.`);
      setLeadId("");
      setToStage("");
      setReason("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Force stage failed.");
    }
  };

  return (
    <div className="max-w-2xl space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] p-6 shadow-sm">
      <div className="font-semibold text-[var(--color-text)]">Force a stage transition</div>
      <p className="text-sm text-[var(--color-text-secondary)]">
        Bypasses the normal reversion workflow and its validations. Use only when the pipeline state
        machine itself is what's stuck. A reason is required and lands in the audit log as{" "}
        <span className="font-mono text-xs">critical</span>.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Lead owner">
          <select
            value={ownerId}
            onChange={(e) => {
              setOwnerId(e.target.value);
              setLeadId("");
            }}
            className={selectClass}
          >
            <option value="">Select user...</option>
            {profiles
              .filter((p) => p.role !== "superadmin")
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Lead">
          <select
            value={leadId}
            onChange={(e) => setLeadId(e.target.value)}
            className={selectClass}
            disabled={!ownerId}
          >
            <option value="">Select lead...</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.full_name} ({STAGE_LABELS[l.stage as Stage] ?? l.stage})
              </option>
            ))}
          </select>
        </Field>
        <Field label="New stage">
          <select
            value={toStage}
            onChange={(e) => setToStage(e.target.value as Stage)}
            className={selectClass}
          >
            <option value="">Select stage...</option>
            {STAGES.filter((s) => s !== selectedLead?.stage).map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Reason (required)">
          <TenaciousInput
            placeholder="Why is this being forced?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
      </div>
      <Button
        variant="destructive"
        disabled={!leadId || !toStage || !reason.trim() || forceStage.isPending}
        onClick={handleForce}
      >
        {forceStage.isPending ? "Forcing..." : "Force stage change"}
      </Button>
    </div>
  );
}

// ── Deleted leads ───────────────────────────────────────────────────────

function DeletedLeadsPanel() {
  const { data: deleted = [], isLoading } = useDeletedLeads();
  const restore = useAdminRestoreLead();
  const purge = useAdminPurgeTrash();
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [purgeConfirm, setPurgeConfirm] = useState("");

  const closePurge = () => {
    setPurgeOpen(false);
    setPurgeConfirm("");
  };

  const handlePurge = async () => {
    try {
      const count = await purge.mutateAsync();
      toast.success(`Trash emptied — ${count} lead(s) permanently deleted.`);
      closePurge();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to empty trash.");
    }
  };

  return (
    <div className="space-y-4">
      {deleted.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="destructive"
            size="sm"
            disabled={purge.isPending}
            onClick={() => setPurgeOpen(true)}
          >
            <Trash2 className="mr-1 h-4 w-4" /> Empty trash ({deleted.length})
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Deleted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-sm text-[var(--color-text-secondary)]"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : deleted.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-sm text-[var(--color-text-secondary)]"
                >
                  Trash is empty.
                </TableCell>
              </TableRow>
            ) : (
              deleted.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-semibold">{l.full_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{STAGE_LABELS[l.stage as Stage] ?? l.stage}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-[var(--color-text-secondary)]">
                    {l.deleted_at ? new Date(l.deleted_at).toLocaleString() : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={restore.isPending}
                      onClick={async () => {
                        try {
                          await restore.mutateAsync(l.id);
                          toast.success(`${l.full_name} restored.`);
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Restore failed.");
                        }
                      }}
                    >
                      <ArchiveRestore className="mr-1 h-4 w-4" /> Restore
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={purgeOpen} onOpenChange={(open) => !open && closePurge()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permanently delete {deleted.length} trashed lead(s)?</DialogTitle>
            <DialogDescription>
              This erases every lead in the trash along with its notes and stage history. There is
              no restore after this. Type <span className="font-mono font-bold">DELETE</span> to
              confirm.
            </DialogDescription>
          </DialogHeader>
          <TenaciousInput
            placeholder="Type DELETE"
            value={purgeConfirm}
            onChange={(e) => setPurgeConfirm(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closePurge}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={purgeConfirm !== "DELETE" || purge.isPending}
              onClick={handlePurge}
            >
              {purge.isPending ? "Deleting..." : "Delete all forever"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Backup ──────────────────────────────────────────────────────────────

function BackupPanel() {
  const exportBackup = useAdminExportBackup();

  const handleExport = async () => {
    try {
      const { leads, profiles } = await exportBackup.mutateAsync();
      toast.success(`Backup downloaded — ${leads} lead(s), ${profiles} profile(s).`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Backup export failed.");
    }
  };

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
          <DatabaseBackup className="h-5 w-5" />
        </span>
        <div>
          <div className="font-semibold text-[var(--color-text)]">Full data backup</div>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Downloads every table — leads, notes, buyers, profiles, projects, appointments,
            approvals, broadcasts, agendas, goals, settings, tokens, and the complete audit trail —
            as one timestamped JSON file. Includes trashed leads. The download itself is written to
            the audit log.
          </p>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            The file contains client contact details — store it somewhere private, not a shared
            drive.
          </p>
          <Button className="mt-4" disabled={exportBackup.isPending} onClick={handleExport}>
            {exportBackup.isPending ? "Preparing backup..." : "Download backup"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Stuck approvals ─────────────────────────────────────────────────────

function ApprovalsPanel() {
  const me = useAuth((s) => s.profile);
  const { data, isLoading, refetch } = usePendingApprovals();
  const [busyId, setBusyId] = useState<string | null>(null);

  const resolveReversion = async (id: string, approve: boolean) => {
    if (!me) return;
    setBusyId(id);
    const res = approve
      ? await approveReversion(id, "Resolved by superadmin", { id: me.id, role: me.role })
      : await denyReversion(id, "Denied by superadmin", { id: me.id, role: me.role });
    setBusyId(null);
    if (res.ok) {
      toast.success(approve ? "Reversion approved." : "Reversion denied.");
      refetch();
    } else {
      toast.error(res.error || "Failed to resolve request.");
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center text-sm text-[var(--color-text-secondary)]">Loading...</div>
    );
  }

  const reversions = data?.reversions ?? [];
  const extensions = data?.extensions ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] p-6 shadow-sm">
        <div className="mb-3 flex items-center gap-2 font-semibold text-[var(--color-text)]">
          <Inbox className="h-5 w-5 text-[var(--color-primary)]" />
          Pending stage reversions ({reversions.length})
        </div>
        {reversions.length === 0 ? (
          <p className="text-sm text-[var(--color-text-secondary)]">Nothing waiting.</p>
        ) : (
          <div className="space-y-3">
            {reversions.map((r) => (
              <div
                key={r.id}
                className="flex flex-col gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="text-sm font-semibold">
                    {r.lead?.full_name ?? "Unknown lead"}{" "}
                    <span className="font-normal text-[var(--color-text-secondary)]">
                      — {r.agent?.display_name ?? "unknown"} asks{" "}
                      {STAGE_LABELS[r.from_stage as Stage] ?? r.from_stage} →{" "}
                      {STAGE_LABELS[r.to_stage as Stage] ?? r.to_stage}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)]">
                    “{r.reason}” · waiting since {new Date(r.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="success"
                    disabled={busyId === r.id}
                    onClick={() => resolveReversion(r.id, true)}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={busyId === r.id}
                    onClick={() => resolveReversion(r.id, false)}
                  >
                    Deny
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] p-6 shadow-sm">
        <div className="mb-3 font-semibold text-[var(--color-text)]">
          Pending CRF extensions ({extensions.length})
        </div>
        {extensions.length === 0 ? (
          <p className="text-sm text-[var(--color-text-secondary)]">Nothing waiting.</p>
        ) : (
          <div className="space-y-2">
            {extensions.map((e) => (
              <div
                key={e.id}
                className="rounded-[var(--radius-sm)] border border-[var(--color-border)] p-3 text-sm"
              >
                <span className="font-semibold">{e.lead?.full_name ?? "Unknown lead"}</span>{" "}
                <span className="text-[var(--color-text-secondary)]">
                  — requested by {e.actor?.display_name ?? "unknown"} on{" "}
                  {new Date(e.requested_at).toLocaleDateString()}: “{e.reason}”. Resolve from the
                  manager console (Assistant → CRF inbox).
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
