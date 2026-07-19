import { useEffect, useMemo, useState } from "react";
import { format, differenceInDays, differenceInHours } from "date-fns";
import { toast } from "sonner";
import {
  Phone,
  Trash2,
  Zap,
  Camera,
  Facebook,
  Clock,
  AlertTriangle,
  Send,
  ChevronDown,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { SlideOver } from "@/components/ui/responsive-dialog";
import { StageBadge } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useProjects } from "@/hooks/use-projects";
import type { LeadNote } from "@/hooks/use-leads";
import { useProfiles } from "@/hooks/use-profiles";
import {
  useLead,
  useLeadAudit,
  updateLead,
  reassignLead,
  addNote,
  setLeadFacebook,
  setLeadPhoto,
  trashLead,
  reactivateLead,
} from "@/stores/leads-store";
import { queryClient } from "@/lib/query-client";
import {
  allowedStagesFor,
  extendCRF,
  extendReservation,
  lockUndoWindow,
  useActor,
} from "@/stores/pipeline-store";
import { useAppointments } from "@/hooks/use-appointments";
import { createAppointment } from "@/stores/schedule-store";
import { APPOINTMENT_TYPE_LABELS, isClientAppointment } from "@/lib/schedule-types";
import { todayKeyManila, manilaDateTimeToIso } from "@/lib/schedule-time";
import { pipelineNow } from "@/lib/pipeline-time";
import { useCurrentProfile } from "@/stores/auth-store";
import { isManagerish } from "@/hooks/use-role";
import { LEAD_SOURCE_LABELS, UNIT_TYPE_LABELS } from "@/lib/lead-sources";
import { compactPeso, exactPeso } from "@/lib/format-currency";
import { STAGE_LABELS, type Stage, ESCALATION_HOURS } from "@/lib/constants";
import { TrashConfirmModal } from "./trash-confirm-modal";
import { DuplicateBlockModal } from "./duplicate-block-modal";
import { StageTransitionModal } from "./stage-transition-modal";
import { UndoTransitionCard } from "./undo-transition-card";
import { BuyersPanel } from "./buyers-panel";
import { ReversionRequestModal } from "./reversion-request-modal";
import { EmptyState } from "@/components/ui/empty-state";
import type { LeadWithRelations } from "@/hooks/use-leads";

export function LeadDetailSlideOver({
  leadId,
  onClose,
}: {
  leadId: string | null;
  onClose: () => void;
}) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const open = leadId != null;

  // On mobile-first, we still use SlideOver — it hides below lg. Provide a fallback modal via ResponsiveDialog.
  if (!isDesktop && open) {
    // Render full-screen overlay via a simple wrapper
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[var(--color-background)]">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <h2 className="text-lg font-semibold">Lead Detail</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {leadId && <LeadDetailBody leadId={leadId} onClose={onClose} />}
        </div>
      </div>
    );
  }

  return (
    <SlideOver open={open} onOpenChange={(v) => !v && onClose()} title="Lead Detail">
      {leadId && <LeadDetailBody leadId={leadId} onClose={onClose} />}
    </SlideOver>
  );
}

function LeadDetailBody({ leadId, onClose }: { leadId: string; onClose: () => void }) {
  const lead = useLead(leadId);
  const audit = useLeadAudit(leadId);
  const profile = useCurrentProfile();
  const isManager = isManagerish(profile?.role ?? null);
  const { data: projects = [] } = useProjects();
  const { data: profiles = [] } = useProfiles();
  const projectsById = Object.fromEntries(projects.map((p) => [p.id, p.name]));
  const profilesById = Object.fromEntries(profiles.map((p) => [p.id, p]));
  const consultants = profiles.filter(
    (p) => p.role === "property_consultant" || p.role === "manager",
  );

  const actor = useActor();
  const [noteBody, setNoteBody] = useState("");
  const [noteInternal, setNoteInternal] = useState(false);
  const [fbUrl, setFbUrl] = useState(lead?.facebook_url ?? "");
  const [editingName, setEditingName] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);
  const [fbBlockOpen, setFbBlockOpen] = useState(false);
  const [transitionTo, setTransitionTo] = useState<Stage | null>(null);
  const [reversionOpen, setReversionOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);

  const [logFormOpen, setLogFormOpen] = useState(false);
  const [logType, setLogType] = useState<
    "client_tripping" | "online_presentation" | "actual_presentation"
  >("client_tripping");
  const [logDate, setLogDate] = useState(() => todayKeyManila());
  const [logStart, setLogStart] = useState("10:00");
  const [logEnd, setLogEnd] = useState("11:00");
  const [logNotes, setLogNotes] = useState("");
  const [isLogging, setIsLogging] = useState(false);

  const { data: appointments = [] } = useAppointments({ leadId });
  const engagements = useMemo(() => {
    return appointments.filter((a) => isClientAppointment(a.appointment_type));
  }, [appointments]);

  const handleLogEngagement = async () => {
    if (!profile || !lead) return;
    setIsLogging(true);
    try {
      const startsAt = manilaDateTimeToIso(logDate, logStart);
      const endsAt = manilaDateTimeToIso(logDate, logEnd);
      if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
        toast.error("End time must be after start time.");
        setIsLogging(false);
        return;
      }

      const title = `${APPOINTMENT_TYPE_LABELS[logType]} - ${lead.full_name}`;
      await createAppointment(profile.id, {
        appointment_type: logType,
        consultant_id: lead.assigned_to || profile.id,
        lead_id: leadId,
        project_id: lead.project_id || null,
        title,
        location: "",
        notes: logNotes,
        starts_at: startsAt,
        ends_at: endsAt,
      });

      toast.success("Engagement logged successfully");
      setLogFormOpen(false);
      setLogNotes("");
      setLogStart("10:00");
      setLogEnd("11:00");
    } catch (err: any) {
      toast.error(err.message || "Failed to log engagement");
    } finally {
      setIsLogging(false);
    }
  };

  // Lock undo window when this detail unmounts, but only if it had an active undo deadline.
  const hasUndo = !!lead?.undo_deadline;
  useEffect(() => {
    return () => {
      if (hasUndo) {
        lockUndoWindow(leadId);
      }
    };
  }, [leadId, hasUndo]);

  // Detect "exists but no access (foreign)" vs "truly not found" without a second hook call.
  // We do a non-reactive snapshot of the query cache — only used for the error state path.
  const trashed = lead?.deleted_at != null;
  if (!lead || trashed) {
    const cachedRaw = queryClient.getQueryData<LeadWithRelations | null>(["lead", leadId]);
    const state: "unknown" | "foreign" | "trashed" = trashed
      ? "trashed"
      : cachedRaw
        ? "foreign"
        : "unknown";
    const headline =
      state === "trashed"
        ? "This lead is in Trash"
        : state === "foreign"
          ? "You don't have access to this lead"
          : "Lead not found";
    const description =
      state === "trashed"
        ? "Restore it from the Trash filter on the Leads list to view details."
        : state === "foreign"
          ? "It may be assigned to another consultant. Ask your manager if you need access."
          : "The link may be outdated, or the lead has been permanently removed.";
    return (
      <EmptyState
        headline={headline}
        description={description}
        actionLabel="Back to Leads"
        onAction={onClose}
      />
    );
  }

  const notes = (lead.lead_notes ?? []).filter(
    (n: LeadNote) => !n.is_internal || isManager || lead.assigned_to === profile?.id,
  );
  const stageOptions: Stage[] = actor ? allowedStagesFor(actor.role, lead.stage as Stage) : [];
  const isFrozen = lead.reservation_status === "expired";
  const inDocOrClosed = lead.stage === "documentation" || lead.stage === "closed_sale";
  const canLogEngagement =
    !inDocOrClosed && lead.stage !== "cancelled" && lead.stage !== "archived";

  function handlePhoto(file: File | null) {
    if (!file) return;
    setLeadPhoto(leadId, file).catch((err) => {
      toast.error(err instanceof Error ? err.message : "Failed to upload photo.");
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Undo card (10-min window) */}
      <UndoTransitionCard leadId={leadId} />

      {/* Timers + frozen banner */}
      {(lead.stage === "crf" || lead.stage === "reserved" || isFrozen) && (
        <StageTimersBanner leadId={leadId} />
      )}

      {/* Header */}
      <div className="flex items-start gap-4">
        <label className="group relative flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary-hover)] shrink-0">
          {lead.profile_photo_url ? (
            <img src={lead.profile_photo_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xl font-bold select-none">
              {lead.full_name.charAt(0).toUpperCase()}
            </span>
          )}
          {/* Camera overlay — only visible on hover */}
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <Camera size={18} className="text-white" />
          </div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(e) => handlePhoto(e.target.files?.[0] ?? null)}
          />
        </label>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-xl font-semibold">{lead.full_name}</h3>
            <StageBadge stage={lead.stage as Stage} />
          </div>
          {lead.contact_number && (
            <a
              href={`tel:${lead.contact_number}`}
              className="mt-1 inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline"
            >
              <Phone size={14} /> {lead.contact_number}
            </a>
          )}
        </div>
      </div>

      {/* Attributes */}
      <section className="rounded-[var(--radius-md)] border border-[var(--color-border)]">
        <Row label="Full name">
          {editingName ? (
            <InlineEdit
              defaultValue={lead.full_name}
              onSave={(v) => {
                updateLead(leadId, { full_name: v });
                setEditingName(false);
              }}
              onCancel={() => setEditingName(false)}
            />
          ) : (
            <button className="text-left hover:underline" onClick={() => setEditingName(true)}>
              {lead.full_name}
            </button>
          )}
        </Row>
        <Row label="Phone">
          {editingPhone ? (
            <InlineEdit
              defaultValue={lead.contact_number}
              placeholder="0917 000 0000"
              onSave={(v) => {
                const res = updateLead(leadId, { contact_number: v });
                if ("block" in res) {
                  toast.error("This client is already registered in the system.");
                } else {
                  setEditingPhone(false);
                }
              }}
              onCancel={() => setEditingPhone(false)}
            />
          ) : (
            <button className="text-left hover:underline" onClick={() => setEditingPhone(true)}>
              {lead.contact_number || "—"}
            </button>
          )}
        </Row>
        <Row label="Stage">
          {stageOptions.length > 0 ? (
            <Select
              value={lead.stage}
              onValueChange={(v) => {
                if (v !== lead.stage) setTransitionTo(v as Stage);
              }}
            >
              <SelectTrigger className="w-[200px]" aria-label="Stage selector">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stageOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STAGE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <StageBadge stage={lead.stage as Stage} />
          )}
        </Row>
        <Row label="Project">{lead.project_id ? (projectsById[lead.project_id] ?? "—") : "—"}</Row>
        <Row label="Unit type">
          {(lead.unit_types as string[])
            .map((u) => UNIT_TYPE_LABELS[u as keyof typeof UNIT_TYPE_LABELS])
            .join(", ") || "—"}
        </Row>
        <Row label="Source">
          {LEAD_SOURCE_LABELS[lead.source as keyof typeof LEAD_SOURCE_LABELS]}
          {lead.source_other_description ? ` — ${lead.source_other_description}` : ""}
        </Row>
        <Row label="Date added">{format(new Date(lead.date_added), "PPP")}</Row>
        <Row label="Assigned to">
          {isManager ? (
            <Select
              value={lead.assigned_to || "__unassigned"}
              onValueChange={(v) => {
                reassignLead(leadId, v === "__unassigned" ? "" : v);
                toast.success("Lead reassigned");
              }}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__unassigned">Unassigned</SelectItem>
                {consultants.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            ((lead.assigned_to ? profilesById[lead.assigned_to]?.display_name : null) ??
            "Unassigned")
          )}
        </Row>
        {lead.sale_price != null && (
          <Row label="Sale price">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help font-medium">{compactPeso(lead.sale_price)}</span>
                </TooltipTrigger>
                <TooltipContent>{exactPeso(lead.sale_price)}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Row>
        )}
        <Row label="Facebook">
          <div className="flex w-full items-center gap-2">
            <Facebook size={14} className="text-[var(--color-text-secondary)]" />
            <Input
              value={fbUrl}
              onChange={(e) => setFbUrl(e.target.value)}
              placeholder="https://facebook.com/username"
              className="h-8"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                const res = setLeadFacebook(leadId, fbUrl || null);
                if ("block" in res) setFbBlockOpen(true);
                else toast.success("Facebook link saved");
              }}
            >
              Save
            </Button>
          </div>
        </Row>
      </section>

      {/* Buyers checklist (Documentation / Closed Sale) */}
      {inDocOrClosed && <BuyersPanel leadId={leadId} />}

      {/* Reversion request (consultant only, no undo available) */}
      {actor?.role === "property_consultant" &&
        !lead.undo_deadline &&
        lead.stage !== "cancelled" &&
        lead.stage !== "archived" &&
        lead.stage !== "new_lead" && (
          <div>
            <Button variant="secondary" size="sm" onClick={() => setReversionOpen(true)}>
              <Send size={14} /> Request Stage Reversion
            </Button>
          </div>
        )}

      {/* Engagement Logs */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
            Engagement Logs
          </h4>
          {canLogEngagement && (
            <Button size="sm" variant="outline" onClick={() => setLogFormOpen(!logFormOpen)}>
              {logFormOpen ? "Cancel" : "Log Engagement"}
            </Button>
          )}
        </div>

        {canLogEngagement && logFormOpen && (
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3">
            <div>
              <Label className="text-xs font-semibold">Engagement Type</Label>
              <Select value={logType} onValueChange={(v) => setLogType(v as any)}>
                <SelectTrigger className="mt-1 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client_tripping">Client Tripping</SelectItem>
                  <SelectItem value="online_presentation">Online Presentation</SelectItem>
                  <SelectItem value="actual_presentation">Actual Presentation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold">Date</Label>
                <Input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="mt-1 h-8 text-sm bg-[var(--color-background)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div>
                  <Label className="text-xs font-semibold">Start</Label>
                  <Input
                    type="time"
                    value={logStart}
                    onChange={(e) => setLogStart(e.target.value)}
                    className="mt-1 h-8 text-sm bg-[var(--color-background)]"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">End</Label>
                  <Input
                    type="time"
                    value={logEnd}
                    onChange={(e) => setLogEnd(e.target.value)}
                    className="mt-1 h-8 text-sm bg-[var(--color-background)]"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Notes</Label>
              <Textarea
                placeholder="Log notes about the session..."
                value={logNotes}
                onChange={(e) => setLogNotes(e.target.value.slice(0, 1000))}
                className="mt-1 bg-[var(--color-background)] text-sm"
                rows={2}
              />
            </div>

            <div className="flex justify-end">
              <Button size="sm" onClick={handleLogEngagement} disabled={isLogging}>
                {isLogging ? "Logging..." : "Save Log"}
              </Button>
            </div>
          </div>
        )}

        {/* Engagement History List */}
        <ul className="flex flex-col gap-2">
          {engagements.map((e: any) => (
            <li
              key={e.id}
              className="rounded-[var(--radius-sm)] border border-[var(--color-border)] p-3 space-y-1 bg-[var(--color-background)]"
            >
              <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                <span className="font-semibold text-[var(--color-primary-hover)]">
                  {APPOINTMENT_TYPE_LABELS[e.appointment_type] || e.appointment_type}
                </span>
                <span>{format(new Date(e.starts_at), "MMM d, yyyy · HH:mm")}</span>
              </div>
              {e.location && (
                <div className="text-xs text-[var(--color-text-secondary)]">
                  📍 <span className="font-medium">{e.location}</span>
                </div>
              )}
              {e.notes && (
                <p className="text-sm text-[var(--color-text)] mt-1 whitespace-pre-wrap">
                  {e.notes}
                </p>
              )}
              <div className="text-[10px] text-[var(--color-text-secondary)] text-right">
                Logged by {profilesById[e.consultant_id]?.display_name || "Unknown"}
              </div>
            </li>
          ))}
          {engagements.length === 0 && (
            <li className="text-xs text-[var(--color-text-secondary)]">
              No engagement logs recorded yet.
            </li>
          )}
        </ul>
      </section>

      {/* Notes */}
      <section>
        <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
          Notes
        </h4>
        <Textarea
          value={noteBody}
          onChange={(e) => setNoteBody(e.target.value.slice(0, 1000))}
          placeholder="Add a note (max 1000 chars)"
          rows={2}
        />
        <div className="mt-2 flex items-center justify-between">
          {isManager ? (
            <label className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <input
                type="checkbox"
                checked={noteInternal}
                onChange={(e) => setNoteInternal(e.target.checked)}
              />
              Internal (manager) note
            </label>
          ) : (
            <span />
          )}
          <Button
            size="sm"
            disabled={!noteBody.trim()}
            onClick={() => {
              addNote(leadId, noteBody, noteInternal);
              setNoteBody("");
              setNoteInternal(false);
            }}
          >
            Add note
          </Button>
        </div>
        <ul className="mt-3 flex flex-col gap-2">
          {notes.map((n: LeadNote) => (
            <li
              key={n.id}
              className="rounded-[var(--radius-sm)] border border-[var(--color-border)] p-3"
            >
              <div className="mb-1 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                <span className="font-medium">
                  {profilesById[n.author_id]?.display_name ?? "Unknown"}
                </span>
                <span>·</span>
                <span>{format(new Date(n.created_at), "MMM d, HH:mm")}</span>
                {n.is_internal && (
                  <span className="rounded bg-[var(--color-chip-warning-bg)] px-1.5 py-0.5 text-[10px] text-[var(--color-chip-warning-fg)]">
                    🔒 Internal
                  </span>
                )}
              </div>
              <p className="text-sm">{n.body}</p>
            </li>
          ))}
          {notes.length === 0 && (
            <li className="text-xs text-[var(--color-text-secondary)]">No notes yet.</li>
          )}
        </ul>
      </section>

      {/* Activity — collapsed by default */}
      <section>
        <button
          type="button"
          onClick={() => setActivityOpen((o) => !o)}
          className="flex w-full items-center justify-between text-sm font-semibold uppercase tracking-wide text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
        >
          <span>Activity</span>
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${activityOpen ? "rotate-180" : ""}`}
          />
        </button>
        {activityOpen && (
          <ul className="mt-2 flex flex-col gap-1 text-xs text-[var(--color-text-secondary)]">
            {audit.slice(0, 30).map((a) => (
              <li key={a.id}>
                <span className="text-[var(--color-text)]">{a.summary}</span>
                {" — "}
                {(a.actor_id ? profilesById[a.actor_id]?.display_name : undefined) ?? "System"} ·{" "}
                {format(new Date(a.created_at), "MMM d, HH:mm")}
              </li>
            ))}
            {audit.length === 0 && <li>No activity yet.</li>}
          </ul>
        )}
      </section>

      {/* Manager actions */}
      <section className="flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-4">
        {(lead.stage === "cancelled" || lead.stage === "archived") && (
          <Button
            variant={isManager ? "default" : "outline"}
            onClick={() => {
              reactivateLead(leadId);
              toast.success("Lead reactivated");
            }}
          >
            <Zap size={16} /> {isManager ? "Reactivate (Manager Override)" : "Reactivate"}
          </Button>
        )}
        {isManager && !lead.deleted_at && (
          <Button variant="destructive" onClick={() => setTrashOpen(true)}>
            <Trash2 size={16} /> Move to Trash
          </Button>
        )}
      </section>

      {lead.closed_sale_rejection_reason && (
        <div className="rounded-[var(--radius-sm)] border border-[var(--color-error)] bg-[var(--color-error-bg)] p-3 text-sm text-[var(--color-error)]">
          <div className="font-medium">Closed sale rejected by manager:</div>
          <div className="mt-1">{lead.closed_sale_rejection_reason}</div>
        </div>
      )}

      <TrashConfirmModal
        open={trashOpen}
        onOpenChange={setTrashOpen}
        onConfirm={() => {
          trashLead(leadId);
          setTrashOpen(false);
          toast.success("Lead moved to trash");
          onClose();
        }}
      />
      <DuplicateBlockModal
        open={fbBlockOpen}
        onOpenChange={setFbBlockOpen}
        onBackToLeads={() => setFbBlockOpen(false)}
      />
      <StageTransitionModal
        open={transitionTo != null}
        onOpenChange={(v) => !v && setTransitionTo(null)}
        leadId={leadId}
        toStage={transitionTo}
      />
      <ReversionRequestModal open={reversionOpen} onOpenChange={setReversionOpen} leadId={leadId} />
    </div>
  );
}

function StageTimersBanner({ leadId }: { leadId: string }) {
  const lead = useLead(leadId);
  const actor = useActor();
  const isMgr = isManagerish(actor?.role ?? null);
  if (!lead || !actor) return null;
  const nowMs = pipelineNow();

  if (lead.stage === "crf" && lead.crf_expires_at) {
    const days = differenceInDays(new Date(lead.crf_expires_at).getTime(), nowMs);
    const warn = days < 3;
    return (
      <div
        className={
          "flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border px-4 py-3 " +
          (warn
            ? "border-[var(--color-warning)] bg-[color-mix(in_oklab,var(--color-warning)_10%,transparent)] text-[var(--color-warning)]"
            : "border-[var(--color-border)] bg-[var(--color-surface)]")
        }
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <Clock size={14} /> CRF expires in {Math.max(0, days)} day{days === 1 ? "" : "s"}
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={async () => {
            const reason = window.prompt("Reason for extending CRF (min 5 chars):");
            if (!reason) return;
            try {
              const r = await extendCRF(leadId, reason, actor);
              if (!r.ok) toast.error(r.error ?? "Failed");
              else
                toast.success(
                  r.pending ? "Extension request sent to manager" : "CRF extended 30 days",
                );
            } catch (err: any) {
              toast.error(err.message || "Failed");
            }
          }}
        >
          Extend +30d
        </Button>
      </div>
    );
  }

  if (lead.stage === "reserved" && lead.reservation_expires_at) {
    if (lead.reservation_status === "expired") {
      return (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--color-warning)] bg-[color-mix(in_oklab,var(--color-warning)_10%,transparent)] px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-warning)]">
            <AlertTriangle size={14} /> Reservation Expired — lead frozen
          </div>
          {isMgr && (
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                try {
                  const r = await extendReservation(leadId, actor);
                  if (r.ok) toast.success("Reservation reactivated (+24h)");
                  else toast.error(r.error ?? "Failed");
                } catch (err: any) {
                  toast.error(err.message || "Failed");
                }
              }}
            >
              Reactivate (+24h)
            </Button>
          )}
        </div>
      );
    }
    const hours = Math.max(
      0,
      differenceInHours(new Date(lead.reservation_expires_at).getTime(), nowMs),
    );
    const critical = hours < ESCALATION_HOURS;
    return (
      <div
        className={
          "flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border px-4 py-3 " +
          (critical
            ? "border-[var(--color-error)] bg-[var(--color-error-bg)] text-[var(--color-error)]"
            : "border-[var(--color-border)] bg-[var(--color-surface)]")
        }
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <Clock size={14} /> Reservation expires in {hours}h
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={async () => {
            try {
              const r = await extendReservation(leadId, actor);
              if (r.ok) toast.success("Reservation extended (+24h)");
              else toast.error(r.error ?? "Failed");
            } catch (err: any) {
              toast.error(err.message || "Failed");
            }
          }}
        >
          Extend +24h
        </Button>
      </div>
    );
  }
  return null;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] px-4 py-3 last:border-0">
      <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
        {label}
      </span>
      <div className="text-sm text-[var(--color-text)]">{children}</div>
    </div>
  );
}

function InlineEdit({
  defaultValue,
  onSave,
  onCancel,
  placeholder,
}: {
  defaultValue: string;
  onSave: (v: string) => void;
  onCancel: () => void;
  placeholder?: string;
}) {
  const [v, setV] = useState(defaultValue);
  return (
    <div className="flex items-center gap-2">
      <Input
        value={v}
        onChange={(e) => setV(e.target.value)}
        className="h-8 w-[220px]"
        placeholder={placeholder}
      />
      <Button size="sm" onClick={() => onSave(v)}>
        Save
      </Button>
      <Button size="sm" variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}

// Explicit unused import guard for Label
void Label;
