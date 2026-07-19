import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Phone,
  FileText,
  Calendar,
  X,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { differenceInDays, differenceInHours, format } from "date-fns";
import { toast } from "sonner";
import type { Lead } from "@/stores/leads-store";
import { useProfiles } from "@/hooks/use-profiles";
import { useCurrentProfile } from "@/stores/auth-store";
import { isManagerish } from "@/hooks/use-role";
import { useVisibleLeads, addNote } from "@/stores/leads-store";
import {
  usePipelineUI,
  isStagnant,
  isUrgent,
  sweepExpiries,
  allowedStagesFor,
  useActor,
} from "@/stores/pipeline-store";
import { useTicker } from "@/stores/ticker-store";
import { pipelineNow } from "@/lib/pipeline-time";
import { STAGE_LABELS, type Stage } from "@/lib/constants";
import { useMediaQuery } from "@/hooks/use-media-query";
import { StageBadge } from "@/components/ui/status-chip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LeadDetailSlideOver } from "@/components/leads/lead-detail-slideover";
import { StageTransitionModal } from "@/components/leads/stage-transition-modal";
import { cn } from "@/lib/utils";
import { weekDays, todayKeyManila, manilaDateTimeToIso } from "@/lib/schedule-time";

import { RouteErrorBoundary, RouteNotFoundBoundary } from "@/lib/route-boundaries";
import { requireAuth } from "@/lib/route-guards";
import { ErrorState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

const searchSchema = z.object({ lead: z.string().optional() });

export const Route = createFileRoute("/workflow")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: "Workflow — Tenacious CRM" }] }),
  validateSearch: searchSchema,
  component: WorkflowPage,
  errorComponent: RouteErrorBoundary,
  notFoundComponent: RouteNotFoundBoundary,
});

const BOARD_STAGES: Stage[] = ["new_lead", "crf", "reserved", "documentation", "closed_sale"];

function WorkflowPage() {
  const profile = useCurrentProfile();
  const isManager = isManagerish(profile?.role ?? null);
  const search = useSearch({ from: "/workflow" });
  const navigate = useNavigate();
  const {
    leads,
    isLoading: leadsLoading,
    isError: leadsError,
    refetch: refetchLeads,
  } = useVisibleLeads();
  const ui = usePipelineUI();
  const { data: profiles = [] } = useProfiles();
  const consultants = profiles.filter((p) => p.role === "property_consultant");
  const startTicker = useTicker((s) => s.start);
  useTicker((s) => s.now); // subscribe
  useEffect(() => startTicker(), [startTicker]);
  useEffect(() => {
    sweepExpiries();
  }, []);

  const isMobile = !useMediaQuery("(min-width: 640px)");
  const [activeCol, setActiveCol] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const nowMs = pipelineNow();
    const cutoff =
      ui.boardFilter === "week"
        ? new Date(manilaDateTimeToIso(weekDays(todayKeyManila())[0], "00:00")).getTime()
        : ui.boardFilter === "month"
          ? nowMs - 30 * 86400_000
          : 0;
    return leads.filter((l) => {
      if (l.deleted_at) return false;
      if (!ui.showArchivedInBoard && (l.stage === "cancelled" || l.stage === "archived"))
        return false;
      if (cutoff && new Date(l.created_at).getTime() < cutoff) return false;
      if (isManager && ui.boardConsultantFilter && l.assigned_to !== ui.boardConsultantFilter)
        return false;
      return true;
    });
  }, [leads, ui, isManager]);

  const grouped = useMemo(() => {
    const map: Record<Stage, Lead[]> = {
      new_lead: [],
      crf: [],
      reserved: [],
      documentation: [],
      closed_sale: [],
      cancelled: [],
      archived: [],
    };
    for (const l of filtered) map[l.stage as Stage]?.push(l);
    for (const k of Object.keys(map) as Stage[]) {
      map[k].sort((a, b) => (a.stage_changed_at < b.stage_changed_at ? -1 : 1));
    }
    return map;
  }, [filtered]);

  const openLead = (id: string) => navigate({ to: "/workflow", search: { lead: id } });
  const closeLead = () => navigate({ to: "/workflow", search: {} });

  const onScrollerScroll = () => {
    const el = scrollerRef.current;
    if (!el || !isMobile) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== activeCol) setActiveCol(idx);
  };

  const scrollToCol = (idx: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * el.clientWidth, behavior: "smooth" });
    setActiveCol(idx);
  };

  return (
    <div>
      <div className="mb-4 hidden items-center justify-between gap-3 sm:flex">
        <h1 className="text-[22px] font-semibold sm:text-3xl">Workflow</h1>
      </div>

      {/* Filters */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {(["week", "month", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => ui.setBoardFilter(f)}
            className={cn(
              "rounded-[var(--radius-pill)] border px-3 py-1 text-xs",
              ui.boardFilter === f
                ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary-hover)]"
                : "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-secondary)]",
            )}
          >
            {f === "week" ? "This Week" : f === "month" ? "Monthly" : "All Time"}
          </button>
        ))}
        {isManager && (
          <select
            value={ui.boardConsultantFilter}
            onChange={(e) => ui.setBoardConsultantFilter(e.target.value)}
            className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1 text-xs"
          >
            <option value="">All consultants</option>
            {consultants.map((c) => (
              <option key={c.id} value={c.id}>
                {c.display_name}
              </option>
            ))}
          </select>
        )}
        <label className="ml-auto flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
          <input
            type="checkbox"
            checked={ui.showArchivedInBoard}
            onChange={(e) => ui.setShowArchivedInBoard(e.target.checked)}
          />
          Show Cancelled / Archived
        </label>
      </div>

      {/* Mobile prev/next */}
      {isMobile && (
        <div className="mb-2 flex items-center justify-between">
          <button
            className="rounded-[var(--radius-sm)] p-2 hover:bg-[var(--color-surface)] disabled:opacity-30"
            onClick={() => scrollToCol(Math.max(0, activeCol - 1))}
            disabled={activeCol === 0}
            aria-label="Previous stage"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-sm font-medium">{STAGE_LABELS[BOARD_STAGES[activeCol]]}</div>
          <button
            className="rounded-[var(--radius-sm)] p-2 hover:bg-[var(--color-surface)] disabled:opacity-30"
            onClick={() => scrollToCol(Math.min(BOARD_STAGES.length - 1, activeCol + 1))}
            disabled={activeCol === BOARD_STAGES.length - 1}
            aria-label="Next stage"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Board */}
      {leadsError ? (
        <ErrorState
          message="Pipeline couldn't load. Check your connection."
          onRetry={refetchLeads}
        />
      ) : leadsLoading ? (
        <div className="flex gap-3 overflow-x-hidden pb-2">
          {BOARD_STAGES.map((stage) => (
            <Skeleton key={stage} className="h-64 w-full min-w-[220px]" />
          ))}
        </div>
      ) : (
        <div
          ref={scrollerRef}
          onScroll={onScrollerScroll}
          className={cn(
            "flex gap-3 overflow-x-auto pb-2",
            isMobile ? "snap-x snap-mandatory scroll-smooth" : "",
            "2xl:grid 2xl:grid-cols-5 2xl:gap-4 2xl:overflow-x-visible",
          )}
          data-testid="workflow-board"
        >
          {BOARD_STAGES.map((stage) => (
            <Column
              key={stage}
              stage={stage}
              leads={grouped[stage] ?? []}
              isMobile={isMobile}
              onOpen={openLead}
            />
          ))}
        </div>
      )}

      {/* Pagination dots (mobile only) */}
      {isMobile && (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {BOARD_STAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToCol(i)}
              aria-label={`Go to column ${i + 1}`}
              className={cn(
                "h-2 w-2 rounded-full transition-tenacious",
                i === activeCol ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]",
              )}
            />
          ))}
        </div>
      )}

      <LeadDetailSlideOver leadId={search.lead ?? null} onClose={closeLead} />
    </div>
  );
}

function Column({
  stage,
  leads,
  isMobile,
  onOpen,
}: {
  stage: Stage;
  leads: Lead[];
  isMobile: boolean;
  onOpen: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]",
        isMobile ? "w-full snap-center" : "w-[260px] min-w-[220px]",
        "xl:w-auto",
      )}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-[var(--radius-md)] border-b border-[var(--color-border)] bg-[var(--color-background)]/95 px-3 py-2 backdrop-blur">
        <span className="text-sm font-semibold">{STAGE_LABELS[stage]}</span>
        <span className="rounded-[var(--radius-pill)] bg-[var(--color-surface)] px-2 py-0.5 text-xs text-[var(--color-text-secondary)]">
          {leads.length}
        </span>
      </div>
      <ul className="flex flex-1 flex-col gap-2 p-2">
        {leads.map((l) => (
          <li key={l.id}>
            <BoardCard lead={l} onOpen={onOpen} />
          </li>
        ))}
        {leads.length === 0 && (
          <li className="py-6 text-center text-xs text-[var(--color-text-secondary)]">No leads</li>
        )}
      </ul>
    </div>
  );
}

function BoardCard({ lead, onOpen }: { lead: Lead; onOpen: (id: string) => void }) {
  const { data: profiles = [] } = useProfiles();
  const consultantName =
    profiles.find((p) => p.id === lead.assigned_to)?.display_name ?? "Unassigned";
  const buyers = (lead as any).lead_buyers || [];
  const totalDocs = buyers.length * 4;
  const checkedDocs = buyers.reduce(
    (s: number, b: any) => s + Object.values(b.docs || {}).filter(Boolean).length,
    0,
  );
  const stagnant = isStagnant(lead);
  const urgent = isUrgent(lead);
  const enteredAt = new Date(lead.stage_changed_at).getTime();
  const daysInStage = Math.max(0, differenceInDays(pipelineNow(), enteredAt));
  const dotClass = urgent
    ? "bg-[var(--color-error)]"
    : stagnant
      ? "bg-[var(--color-warning)]"
      : "bg-[var(--color-success)]";

  let timerText = "";
  if (lead.stage === "crf" && lead.crf_expires_at) {
    const days = Math.max(
      0,
      differenceInDays(new Date(lead.crf_expires_at).getTime(), pipelineNow()),
    );
    timerText = `⚠️ CRF expires in ${days}d`;
  }
  if (lead.stage === "reserved" && lead.reservation_expires_at) {
    if (lead.reservation_status === "expired") {
      timerText = "⏰ Expired (frozen)";
    } else {
      const hours = Math.max(
        0,
        differenceInHours(new Date(lead.reservation_expires_at).getTime(), pipelineNow()),
      );
      timerText = `⏰ Res. expires in ${hours}h`;
    }
  }
  // Removed duplicate days display for Documentation stage
  if (lead.stage === "closed_sale" && lead.closed_sale_status === "pending_verification") {
    timerText = "Pending verification";
  }

  // Long-press context menu state
  const [ctxOpen, setCtxOpen] = useState(false);
  const longPressHandlers = useLongPress(
    () => setCtxOpen(true),
    () => onOpen(lead.id),
  );

  return (
    <>
      <button
        {...longPressHandlers}
        className={cn(
          "w-full rounded-[var(--radius-md)] border bg-[var(--color-background)] p-3 text-left transition-tenacious hover:shadow-[var(--shadow-sm)] select-none",
          "touch-manipulation",
          urgent && "border-[var(--color-error)]",
          !urgent &&
            stagnant &&
            "border-l-4 border-l-[var(--color-warning)] border-[var(--color-border)]",
          !urgent && !stagnant && "border-[var(--color-border)]",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-start gap-2.5">
            <Avatar className="h-10 w-10 border border-[var(--color-border)] bg-[var(--color-primary-light)]">
              {lead.profile_photo_url && (
                <AvatarImage src={lead.profile_photo_url} alt="" className="object-cover" />
              )}
              <AvatarFallback className="bg-[var(--color-primary-light)] text-sm font-semibold text-[var(--color-primary)]">
                {leadInitials(lead.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", dotClass)} />
                <div className="truncate text-[16px] font-semibold text-[var(--color-text)]">
                  {lead.full_name}
                </div>
              </div>
              <div className="mt-1 truncate text-xs text-[var(--color-text-secondary)]">
                {consultantName} · {daysInStage}d in {STAGE_LABELS[lead.stage as Stage]}
              </div>
            </div>
          </div>
          <StageBadge stage={lead.stage as Stage} />
        </div>
        {timerText && (
          <div
            className={cn(
              "mt-2 text-xs",
              urgent
                ? "text-[var(--color-error)] font-medium"
                : "text-[var(--color-text-secondary)]",
            )}
          >
            {timerText}
          </div>
        )}
        {lead.stage === "documentation" && buyers.length > 0 && (
          <div className="mt-1 text-xs text-[var(--color-text-secondary)]">
            👥 {buyers.length} Buyers | {checkedDocs}/{totalDocs} Docs Checked
          </div>
        )}
        {lead.stage === "closed_sale" && lead.closed_sale_status === "verified" && (
          <div className="mt-1 text-xs text-[var(--color-success)]">
            ✓ Verified{" "}
            {lead.closed_sale_verified_at
              ? format(new Date(lead.closed_sale_verified_at), "MMM d")
              : ""}
          </div>
        )}
      </button>

      {ctxOpen && (
        <LeadContextMenu
          lead={lead}
          onClose={() => setCtxOpen(false)}
          onOpenDetail={() => {
            setCtxOpen(false);
            onOpen(lead.id);
          }}
        />
      )}
    </>
  );
}

// ─── Long-Press Hook ──────────────────────────────────────────────────────────
// Returns pointer event handlers. Calls onLongPress after 500ms of hold;
// normal clicks still flow through onClick. Cancels on movement > 12px.
function leadInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function useLongPress(onLongPress: () => void, onClick: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);
  const didCancel = useRef(false);
  const startPos = useRef<{ x: number; y: number } | null>(null);

  const start = useCallback(
    (x: number, y: number) => {
      didLongPress.current = false;
      didCancel.current = false;
      startPos.current = { x, y };
      timerRef.current = setTimeout(() => {
        didLongPress.current = true;
        // Haptic feedback on supported devices
        if ("vibrate" in navigator) navigator.vibrate(40);
        onLongPress();
      }, 500);
    },
    [onLongPress],
  );

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const end = useCallback(() => {
    cancel();
    startPos.current = null;
  }, [cancel]);

  const move = useCallback(
    (x: number, y: number) => {
      if (!startPos.current) return;
      const dx = Math.abs(x - startPos.current.x);
      const dy = Math.abs(y - startPos.current.y);
      if (dx > 12 || dy > 12) {
        didCancel.current = true;
        cancel();
      }
    },
    [cancel],
  );

  return {
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      start(e.clientX, e.clientY);
    },
    onPointerMove: (e: PointerEvent<HTMLButtonElement>) => move(e.clientX, e.clientY),
    onPointerUp: end,
    onPointerCancel: cancel,
    onPointerLeave: cancel,
    onClick: (e: MouseEvent<HTMLButtonElement>) => {
      if (didLongPress.current || didCancel.current) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      onClick();
    },
    onContextMenu: (e: MouseEvent) => e.preventDefault(),
  };
}

// ─── Lead Context Menu (Bottom Sheet) ────────────────────────────────────────
type CtxView = "main" | "note" | "stage";

function LeadContextMenu({
  lead,
  onClose,
  onOpenDetail,
}: {
  lead: Lead;
  onClose: () => void;
  onOpenDetail: () => void;
}) {
  const [view, setView] = useState<CtxView>("main");
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [transitionTo, setTransitionTo] = useState<Stage | null>(null);
  const actor = useActor();

  const stageOptions: Stage[] = actor
    ? allowedStagesFor(actor.role, lead.stage as Stage).filter((s) => s !== lead.stage)
    : [];

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    setSavingNote(true);
    const res = await addNote(lead.id, noteText.trim(), false);
    setSavingNote(false);
    if (res.ok) {
      toast.success("Note saved");
      onClose();
    } else {
      toast.error(res.error ?? "Failed to save note");
    }
  };

  const handleCall = () => {
    if (lead.contact_number) {
      window.location.href = `tel:${lead.contact_number}`;
      addNote(lead.id, "📞 Called client from Workflow board", false);
    } else {
      toast.error("No phone number on file");
    }
    onClose();
  };

  // Close on back-button / swipe (Escape key)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      {/* Scrim */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-[var(--color-overlay)] backdrop-blur-[2px]",
          transitionTo && "hidden",
        )}
        onClick={onClose}
        aria-hidden
      />

      {/* Bottom Sheet */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl bg-[var(--color-background)] shadow-2xl animate-in slide-in-from-bottom-4 duration-200",
          transitionTo && "hidden",
        )}
      >
        {/* Handle */}
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-[var(--color-border)]" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex flex-col">
            <span className="text-base font-bold text-[var(--color-text)] leading-tight">
              {lead.full_name}
            </span>
            <span className="text-xs text-[var(--color-text-secondary)]">
              {STAGE_LABELS[lead.stage as Stage]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <StageBadge stage={lead.stage as Stage} />
            <button
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border-muted)] text-[var(--color-text-soft)] hover:bg-[var(--color-surface)] transition-all"
              aria-label="Close"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="h-px bg-[var(--color-border-subtle)] mx-4" />

        {/* ── Main Actions ── */}
        {view === "main" && (
          <div className="flex flex-col gap-1 px-3 py-3 pb-8">
            <CtxAction
              icon={<ArrowRight size={17} />}
              label="Open Lead Detail"
              onClick={onOpenDetail}
              accent
            />
            <CtxAction
              icon={<Phone size={17} />}
              label={lead.contact_number ? `Call ${lead.contact_number}` : "Call Client"}
              onClick={handleCall}
            />
            <CtxAction
              icon={<FileText size={17} />}
              label="Add a Note"
              onClick={() => setView("note")}
            />
            {stageOptions.length > 0 && (
              <CtxAction
                icon={<ChevronUp size={17} />}
                label="Move Stage"
                onClick={() => setView("stage")}
              />
            )}
          </div>
        )}

        {/* ── Add Note ── */}
        {view === "note" && (
          <div className="flex flex-col gap-3 px-4 py-3 pb-8">
            <button
              onClick={() => setView("main")}
              className="self-start text-xs text-[var(--color-primary)] font-medium flex items-center gap-1"
            >
              ← Back
            </button>
            <textarea
              className="w-full min-h-[100px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
              placeholder="Type a note…"
              autoFocus
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <button
              onClick={handleSaveNote}
              disabled={!noteText.trim() || savingNote}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[var(--color-primary-foreground)] disabled:opacity-50 transition-all active:scale-95"
            >
              {savingNote ? <Loader2 size={15} className="animate-spin" /> : null}
              Save Note
            </button>
          </div>
        )}

        {/* ── Move Stage ── */}
        {view === "stage" && (
          <div className="flex flex-col gap-1 px-3 py-3 pb-8">
            <button
              onClick={() => setView("main")}
              className="self-start mb-1 text-xs text-[var(--color-primary)] font-medium flex items-center gap-1 px-2"
            >
              ← Back
            </button>
            {stageOptions.map((s) => (
              <CtxAction
                key={s}
                icon={<ArrowRight size={17} />}
                label={`Move to ${STAGE_LABELS[s]}`}
                onClick={() => {
                  setTransitionTo(s);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Transition modal triggered from stage view */}
      {transitionTo && (
        <StageTransitionModal
          open={transitionTo !== null}
          leadId={lead.id}
          toStage={transitionTo}
          onOpenChange={(open) => {
            if (!open) {
              setTransitionTo(null);
              onClose();
            }
          }}
          onSuccess={onClose}
        />
      )}
    </>
  );
}

function CtxAction({
  icon,
  label,
  onClick,
  accent = false,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-left transition-all active:scale-[0.98] hover:bg-[var(--color-surface-subtle)]",
        accent
          ? "text-[var(--color-primary)] hover:bg-[var(--color-primary-light)]"
          : "text-[var(--color-text)]",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          accent
            ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]"
            : "bg-[var(--color-surface)] text-[var(--color-text-soft)]",
        )}
      >
        {icon}
      </span>
      {label}
    </button>
  );
}
