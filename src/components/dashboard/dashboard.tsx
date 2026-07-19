import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Phone,
  Timer,
  AlertTriangle,
  Clock,
  FileText,
  ArrowRight,
  Plus,
  Send,
  Calendar,
  Store,
  UsersRound,
  FileBarChart,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Pencil,
  Check,
  X,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Megaphone,
  Briefcase,
  BellRing,
  Home,
  KanbanSquare,
  Trophy,
  Calculator,
  BarChart3,
  Users,
  UserCircle2,
} from "lucide-react";
import { useCurrentProfile } from "@/stores/auth-store";
import {
  useDashboardData,
  useUpsertTeamGoal,
  useUpdatePersonalTarget,
} from "@/hooks/use-dashboard-data";
import { useLeadDialogs } from "@/stores/lead-dialogs-store";
import { useTicker } from "@/stores/ticker-store";
import {
  approveClosedSale,
  rejectClosedSale,
  extendCRF,
  extendReservation,
  resolveCrfExtension,
} from "@/stores/pipeline-store";
import { addNote } from "@/stores/leads-store";
import {
  selectSummaryCounts,
  selectStageCounts,
  selectPriorityItems,
  selectPendingSales,
  selectEscalatedExpirations,
  selectPendingCrfExtensions,
  selectRecentActivity,
  selectSourceBreakdown,
  selectVerifiedSalesValue,
  selectPendingSalesValue,
  selectTeamGoal,
  selectPersonalTarget,
  selectTeamOverview,
  type PriorityItem,
  type Scope,
  type Profile,
} from "@/lib/dashboard-selectors";
import { compactPeso, exactPeso } from "@/lib/format-currency";
import { STAGE_LABELS, type Stage } from "@/lib/constants";
import { formatCountdown, initials } from "@/lib/format";
import { StatusChip } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMediaQuery } from "@/hooks/use-media-query";
import { BroadcastComposer } from "@/components/broadcast/broadcast-composer";
import { SmartExportModal } from "@/components/reports/smart-export-modal";
import {
  SectionHeader,
  HeroCard,
  HeroStat,
  StatCard,
  ShortcutButton,
  PipelineBar,
  TimelineItem,
  type Trend,
} from "@/components/dashboard/dashboard-cards";
import {
  useQuickLinks,
  CONSULTANT_DEFAULT_SHORTCUTS,
  MANAGER_DEFAULT_SHORTCUTS,
} from "@/stores/quick-links-store";
import {
  ResumeOnboardingBanner,
  FirstDayChecklist,
  OnboardingRevealOverlay,
} from "@/components/onboarding/onboarding-dashboard-widgets";
import { PeriodPicker } from "@/components/reports/period-picker";
import { type Period, monthPeriod, prevPeriod, currentMonthKey } from "@/lib/reports/time-filter";
import { ConsultantProfileDialog } from "@/components/team/consultant-profile-dialog";

import { cn } from "@/lib/utils";

// ==== Helpers ====

function greeting(): string {
  const h = new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    hourCycle: "h23",
    timeZone: "Asia/Manila",
  }).format(new Date());
  const hh = parseInt(h, 10);
  if (hh < 12) return "Good morning";
  if (hh < 18) return "Good afternoon";
  return "Good evening";
}

function todayLabel(): string {
  return new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(new Date());
}

function relative(iso: string | null): string {
  if (!iso) return "Never logged in";
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function SectionCard({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-(--radius-md) border border-(--color-border) bg-white p-4 shadow-(--shadow-sm)",
        className,
      )}
    >
      <SectionHeader title={title} action={action} />
      {children}
    </div>
  );
}

/** Section wrapper with a staggered entrance (opacity/transform only, reduced-motion safe). */
function Rise({
  order,
  className,
  children,
}: {
  order: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn("anim-rise", className)}
      style={{ animationDelay: `${Math.min(order * 40, 240)}ms` }}
    >
      {children}
    </div>
  );
}

// ==== Dashboard ====

export default function Dashboard() {
  const profile = useCurrentProfile();
  const { db, isLoading } = useDashboardData();
  const navigate = useNavigate();
  const setAddOpen = useLeadDialogs((s) => s.setAddOpen);
  useTicker((s) => s.now); // subscribe for countdown re-render
  const isMobile = !useMediaQuery("(min-width: 1024px)");
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [period, setPeriod] = useState<Period>(() => monthPeriod());

  const visibleLeadsCount = useMemo(() => {
    if (!profile || !db?.leads) return 0;
    const isPC = profile.role === "property_consultant";
    return db.leads.filter((l) => !l.deleted_at && (!isPC || l.assigned_to === profile.id)).length;
  }, [db?.leads, profile?.id, profile?.role]);

  if (!profile) return null;

  if (isLoading) {
    return (
      <div className="text-center py-12 text-sm text-(--color-text-secondary)">
        Loading dashboard metrics...
      </div>
    );
  }

  const isManager = profile.role !== "property_consultant";
  const scope: Scope = isManager ? { kind: "team" } : { kind: "consultant", userId: profile.id };

  if (visibleLeadsCount === 0) {
    return (
      <div className="space-y-4">
        <OnboardingRevealOverlay />
        <DashboardHeader profile={profile} isManager={isManager} />
        <ResumeOnboardingBanner />
        <FirstDayChecklist />
        <SectionCard title="Getting started">
          <ol className="space-y-3 text-sm text-(--color-text-secondary)">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-(--color-primary-light) text-xs font-semibold text-(--color-primary-hover)">
                1
              </span>
              <span>Complete your profile so clients see your name and photo.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-(--color-primary-light) text-xs font-semibold text-(--color-primary-hover)">
                2
              </span>
              <span>Add your first lead using the ➕ button.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-(--color-primary-light) text-xs font-semibold text-(--color-primary-hover)">
                3
              </span>
              <span>Move a lead through the pipeline to see your dashboard come to life.</span>
            </li>
          </ol>
          <div className="mt-4">
            <Button
              onClick={() => {
                navigate({ to: "/leads", search: {} });
                setTimeout(() => setAddOpen(true), 50);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add your first lead
            </Button>
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <OnboardingRevealOverlay />
      <DashboardHeader profile={profile} isManager={isManager} />

      <ResumeOnboardingBanner />
      <FirstDayChecklist />

      {/* Global date filter — applies to every period-aware section below. */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-(--color-text-secondary)">
          Showing: {period.kind === "all" ? "All time" : period.label}
        </span>
        <PeriodPicker value={period} onChange={setPeriod} />
      </div>

      {isManager && (
        <Rise order={0}>
          <PendingActionsBlock />
        </Rise>
      )}

      <Rise order={1}>
        <HeroSummary scope={scope} isManager={isManager} userId={profile.id} period={period} />
      </Rise>

      <Rise order={2}>
        <QuickActions
          isManager={isManager}
          onBroadcast={() => setBroadcastOpen(true)}
          onExport={() => setExportOpen(true)}
        />
      </Rise>

      <Rise order={3}>
        <SummaryCards scope={scope} isManager={isManager} period={period} />
      </Rise>

      {/* Two-column band: Priority + Pipeline */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Rise order={4} className="lg:col-span-7">
          <PrioritySection scope={scope} isManager={isManager} />
        </Rise>
        <Rise order={5} className="lg:col-span-5">
          <MobileCollapsible title="Pipeline Overview" defaultOpen={!isMobile}>
            <WorkflowOverview scope={scope} period={period} />
          </MobileCollapsible>
        </Rise>
      </div>

      <Rise order={6}>
        <PerformanceMetrics scope={scope} period={period} />
      </Rise>

      {/* Two-column band: Activity + Insights */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Rise order={7} className="lg:col-span-7">
          <RecentActivity scope={scope} period={period} />
        </Rise>
        <Rise order={8} className="lg:col-span-5">
          <MobileCollapsible
            title={isManager ? "Team Goal & Insights" : "My Goal & Insights"}
            defaultOpen={!isMobile}
          >
            <QuickInsights
              scope={scope}
              isManager={isManager}
              userId={profile.id}
              period={period}
            />
          </MobileCollapsible>
        </Rise>
      </div>

      {isManager && (
        <Rise order={9}>
          <TeamOverviewTable />
        </Rise>
      )}

      {isManager && <BroadcastComposer open={broadcastOpen} onOpenChange={setBroadcastOpen} />}
      {isManager && <SmartExportModal open={exportOpen} onOpenChange={setExportOpen} db={db} />}
    </div>
  );
}

// ==== Header ====

/** Shared quick-action handlers used by the header and the Quick Actions tiles. */
function useQuickActionHandlers(profile: NonNullable<ReturnType<typeof useCurrentProfile>>) {
  const navigate = useNavigate();
  const setAddOpen = useLeadDialogs((s) => s.setAddOpen);
  const openAdd = () => {
    navigate({ to: "/leads", search: {} });
    setTimeout(() => setAddOpen(true), 50);
  };
  const copyCrf = async () => {
    if (!profile.crf_link) {
      toast("No CRF link on your profile", { description: "Add one in your profile." });
      navigate({ to: "/profile" });
      return;
    }
    try {
      await navigator.clipboard.writeText(profile.crf_link);
      toast("📋 CRF Link copied to clipboard!");
    } catch {
      toast.error("Could not copy — check clipboard permissions.");
    }
  };
  const openSellers = () => window.open("https://seller.dmcihomes.com/Login/Auth", "_blank");
  const openSchedule = () => navigate({ to: "/schedule" });
  const openReassign = () => navigate({ to: "/leads", search: {} });
  return { openAdd, copyCrf, openSellers, openSchedule, openReassign };
}

function DashboardHeader({
  profile,
  isManager,
}: {
  profile: NonNullable<ReturnType<typeof useCurrentProfile>>;
  isManager: boolean;
}) {
  const { openAdd } = useQuickActionHandlers(profile);
  const first = profile.display_name.split(" ")[0];

  return (
    <div className="sticky top-14 z-10 -mx-4 border-b border-(--color-border) bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold sm:text-2xl">
            {greeting()}, {first}!
          </h1>
          <p className="text-xs text-(--color-text-secondary) sm:text-sm">{todayLabel()}</p>
        </div>
        <Button size="sm" onClick={openAdd} className="hidden shrink-0 sm:inline-flex">
          <Plus className="mr-1.5 h-4 w-4" />
          {isManager ? "Add & Assign" : "Add New Lead"}
        </Button>
      </div>
    </div>
  );
}

// ==== Quick Links (customizable shortcut strip) ====

interface ShortcutDef {
  id: string;
  label: string;
  icon: React.ReactNode;
  managerOnly?: boolean;
  consultantOnly?: boolean;
}

const SHORTCUT_ICONS: Record<string, React.ReactNode> = {
  add: <Plus size={20} />,
  crf: <Send size={20} />,
  schedule: <Calendar size={20} />,
  sellers: <Store size={20} />,
  broadcast: <Megaphone size={20} />,
  reassign: <UsersRound size={20} />,
  export: <FileBarChart size={20} />,
  workflow: <KanbanSquare size={20} />,
  leaderboard: <Trophy size={20} />,
  projects: <Calculator size={20} />,
  reports: <BarChart3 size={20} />,
  team: <Users size={20} />,
  profile: <UserCircle2 size={20} />,
};

function shortcutCatalog(isManager: boolean): ShortcutDef[] {
  const all: ShortcutDef[] = [
    { id: "add", label: isManager ? "Add & Assign" : "Add Client", icon: SHORTCUT_ICONS.add },
    { id: "crf", label: "CRF Link", icon: SHORTCUT_ICONS.crf },
    { id: "schedule", label: "Schedule", icon: SHORTCUT_ICONS.schedule },
    { id: "sellers", label: "Sellers", icon: SHORTCUT_ICONS.sellers },
    { id: "broadcast", label: "Broadcast", icon: SHORTCUT_ICONS.broadcast, managerOnly: true },
    { id: "reassign", label: "Reassign", icon: SHORTCUT_ICONS.reassign, managerOnly: true },
    { id: "export", label: "Export", icon: SHORTCUT_ICONS.export, managerOnly: true },
    { id: "team", label: "Team", icon: SHORTCUT_ICONS.team, managerOnly: true },
    { id: "workflow", label: "Workflow", icon: SHORTCUT_ICONS.workflow },
    { id: "leaderboard", label: "Ranks", icon: SHORTCUT_ICONS.leaderboard },
    { id: "projects", label: "Projects", icon: SHORTCUT_ICONS.projects },
    { id: "reports", label: "Reports", icon: SHORTCUT_ICONS.reports },
    { id: "profile", label: "Profile", icon: SHORTCUT_ICONS.profile },
  ];
  return all.filter((s) => (isManager ? !s.consultantOnly : !s.managerOnly));
}

function QuickActions({
  isManager,
  onBroadcast,
  onExport,
}: {
  isManager: boolean;
  onBroadcast: () => void;
  onExport: () => void;
}) {
  const profile = useCurrentProfile();
  const navigate = useNavigate();
  const handlers = useQuickActionHandlers(profile!);
  const byUser = useQuickLinks((s) => s.byUser);
  const setShortcuts = useQuickLinks((s) => s.setShortcuts);
  const resetShortcuts = useQuickLinks((s) => s.reset);
  const [editOpen, setEditOpen] = useState(false);
  if (!profile) return null;

  const catalog = shortcutCatalog(isManager);
  const defaults = isManager ? MANAGER_DEFAULT_SHORTCUTS : CONSULTANT_DEFAULT_SHORTCUTS;
  const chosenIds = byUser[profile.id] ?? defaults;
  // Drop stale/unauthorized ids (e.g. saved as manager, now consultant).
  const chosen = chosenIds
    .map((id) => catalog.find((c) => c.id === id))
    .filter((c): c is ShortcutDef => !!c);

  const actionFor = (id: string): (() => void) => {
    switch (id) {
      case "add":
        return handlers.openAdd;
      case "crf":
        return handlers.copyCrf;
      case "schedule":
        return handlers.openSchedule;
      case "sellers":
        return handlers.openSellers;
      case "broadcast":
        return onBroadcast;
      case "reassign":
        return handlers.openReassign;
      case "export":
        return onExport;
      case "workflow":
        return () => navigate({ to: "/workflow" });
      case "leaderboard":
        return () => navigate({ to: "/leaderboard" });
      case "projects":
        return () => navigate({ to: "/projects" });
      case "reports":
        return () => navigate({ to: "/reports" });
      case "team":
        return () => navigate({ to: "/team" });
      case "profile":
        return () => navigate({ to: "/profile" });
      default:
        return () => {};
    }
  };

  return (
    <div>
      <SectionHeader
        title="Quick Links"
        className="mb-2"
        action={
          <button
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-1 text-xs font-medium text-(--color-primary) hover:underline"
          >
            <Pencil className="h-3 w-3" /> Edit
          </button>
        }
      />
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-3 pb-1">
          {chosen.map((s) => (
            <ShortcutButton key={s.id} icon={s.icon} label={s.label} onClick={actionFor(s.id)} />
          ))}
          <button
            onClick={() => setEditOpen(true)}
            className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center"
            aria-label="Customize shortcuts"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-(--radius-md) border border-dashed border-(--color-border) text-(--color-text-placeholder) transition-tenacious hover:border-(--color-primary) hover:text-(--color-primary)">
              <Plus size={18} />
            </span>
            <span className="text-[11px] font-medium text-(--color-text-placeholder)">Edit</span>
          </button>
        </div>
      </div>
      <EditShortcutsDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        catalog={catalog}
        chosenIds={chosen.map((c) => c.id)}
        onSave={(ids) => setShortcuts(profile.id, ids)}
        onReset={() => resetShortcuts(profile.id)}
      />
    </div>
  );
}

function EditShortcutsDialog({
  open,
  onOpenChange,
  catalog,
  chosenIds,
  onSave,
  onReset,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  catalog: ShortcutDef[];
  chosenIds: string[];
  onSave: (ids: string[]) => void;
  onReset: () => void;
}) {
  const [ids, setIds] = useState<string[]>(chosenIds);
  useEffect(() => {
    if (open) setIds(chosenIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggle = (id: string) =>
    setIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const move = (id: string, dir: -1 | 1) =>
    setIds((cur) => {
      const i = cur.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= cur.length) return cur;
      const next = [...cur];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-(--radius-lg)">
        <DialogHeader>
          <DialogTitle>Customize Quick Links</DialogTitle>
        </DialogHeader>
        <div className="max-h-[50dvh] space-y-1 overflow-y-auto">
          {/* Selected first, in display order, then the rest of the catalog */}
          {[
            ...ids
              .map((id) => catalog.find((c) => c.id === id))
              .filter((c): c is ShortcutDef => !!c),
            ...catalog.filter((c) => !ids.includes(c.id)),
          ].map((s) => {
            const selected = ids.includes(s.id);
            return (
              <div
                key={s.id}
                className={cn(
                  "flex items-center gap-2 rounded-(--radius-sm) border p-2",
                  selected
                    ? "border-(--color-primary) bg-(--color-primary-light)/40"
                    : "border-(--color-border)",
                )}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-(--radius-sm) bg-(--color-primary-light) text-(--color-primary-hover)">
                  {s.icon}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{s.label}</span>
                {selected && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => move(s.id, -1)}
                      aria-label={`Move ${s.label} earlier`}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => move(s.id, 1)}
                      aria-label={`Move ${s.label} later`}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant={selected ? "outline" : "default"}
                  className="h-7 px-2 text-xs"
                  onClick={() => toggle(s.id)}
                >
                  {selected ? "Remove" : "Add"}
                </Button>
              </div>
            );
          })}
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              onReset();
              onOpenChange(false);
            }}
          >
            Reset to default
          </Button>
          <Button
            disabled={ids.length === 0}
            onClick={() => {
              onSave(ids);
              onOpenChange(false);
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==== Hero Summary ====

function HeroSummary({
  scope,
  isManager,
  userId,
  period,
}: {
  scope: Scope;
  isManager: boolean;
  userId: string;
  period: Period;
}) {
  const { db } = useDashboardData();
  const navigate = useNavigate();
  const counts = selectStageCounts(db, scope);
  const activeLeads = counts.new_lead + counts.crf + counts.reserved + counts.documentation;
  const followUps = selectPriorityItems(db, scope, { includeUnassigned: isManager }).length;
  const pendingVerifications = isManager ? selectPendingSales(db).length : 0;
  const verified = selectVerifiedSalesValue(db, scope, period);
  const goal = isManager ? selectTeamGoal(db) : selectPersonalTarget(db, userId).amount;
  // Goals are monthly — only compare when the filter is on the current month.
  const isCurrentMonth = period.kind === "month" && period.monthKey === currentMonthKey();
  const showGoal = !!goal && isCurrentMonth;

  // Same pacing math as QuickInsights.
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const paceRatio = dayOfMonth / daysInMonth;
  const attained = showGoal && goal ? verified / goal : 0;
  const onTrack = attained >= paceRatio;

  const [animPct, setAnimPct] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimPct(Math.min(1, attained) * 100), 30);
    return () => clearTimeout(t);
  }, [attained]);

  const periodLabel = period.kind === "all" ? "all time" : period.label.toLowerCase();
  const insight = !showGoal
    ? goal
      ? `Verified sales — ${periodLabel}.`
      : isManager
        ? "Set a team goal to start tracking monthly pace."
        : "Ask your manager about a personal target — or keep those follow-ups moving."
    : attained >= 1
      ? "🎉 Goal reached — outstanding month!"
      : onTrack
        ? "You're on track — keep the momentum going."
        : followUps > 0
          ? `Behind pace — ${followUps} follow-up${followUps === 1 ? "" : "s"} could move the needle today.`
          : "Behind pace — a fresh push this week can close the gap.";

  return (
    <HeroCard>
      <div className="grid grid-cols-3 gap-3">
        <HeroStat
          icon={<Briefcase className="h-4 w-4" />}
          value={activeLeads}
          label={isManager ? "Team Active Leads" : "Active Leads"}
          onClick={() => navigate({ to: "/leads", search: {} })}
        />
        <HeroStat
          icon={<BellRing className="h-4 w-4" />}
          value={isManager ? pendingVerifications : followUps}
          label={isManager ? "Pending Verifications" : "Follow-ups Due"}
          tone={(isManager ? pendingVerifications : followUps) > 0 ? "critical" : "brand"}
        />
        <HeroStat
          icon={<Home className="h-4 w-4" />}
          value={counts.reserved}
          label="Reservations"
          onClick={() => navigate({ to: "/leads", search: { stage: "reserved" } })}
        />
      </div>

      <div className="mt-4 rounded-(--radius-md) bg-(--color-primary-light) p-3.5">
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <span className="font-semibold text-(--color-primary-hover)">
            {compactPeso(verified)}
          </span>
          <span className="text-xs font-medium text-(--color-primary-hover)">
            {showGoal && goal
              ? `of ${compactPeso(goal)} ${isManager ? "team goal" : "goal"}`
              : periodLabel}
          </span>
        </div>
        {showGoal ? (
          <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-white/70">
            <div
              className="h-full rounded-full bg-(--color-primary) transition-[width] duration-600 ease-out"
              style={{ width: `${animPct}%` }}
            />
          </div>
        ) : null}
        <p className="mt-2 text-xs text-(--color-primary-hover)">{insight}</p>
      </div>
    </HeroCard>
  );
}

// ==== Performance Metrics ====

function PerformanceMetrics({ scope, period }: { scope: Scope; period: Period }) {
  const { db } = useDashboardData();
  const navigate = useNavigate();
  const verified = selectVerifiedSalesValue(db, scope, period);
  const prev = prevPeriod(period);
  const prevVerified = prev ? selectVerifiedSalesValue(db, scope, prev) : 0;
  const pending = selectPendingSalesValue(db, scope);
  const counts = selectStageCounts(db, scope);
  const sources = selectSourceBreakdown(db, scope, period);
  const newInPeriod = sources.reduce((sum, s) => sum + s.count, 0);

  let salesTrend: Trend = null;
  if (prev && prevVerified > 0) {
    const delta = ((verified - prevVerified) / prevVerified) * 100;
    salesTrend = {
      dir: delta > 0.5 ? "up" : delta < -0.5 ? "down" : "flat",
      text: `${delta >= 0 ? "+" : ""}${Math.round(delta)}%`,
    };
  }

  const periodLabel = period.kind === "all" ? "All time" : period.label;

  return (
    <div>
      <SectionHeader title="Performance" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          value={compactPeso(verified)}
          label="Closed Value"
          context={
            prev && prevVerified > 0
              ? `${compactPeso(prevVerified)} ${prev.kind === "week" ? "last week" : "last month"}`
              : `${periodLabel}, verified`
          }
          trend={salesTrend}
        />
        <StatCard
          value={compactPeso(pending)}
          label="Pending Verification"
          context="Awaiting manager approval"
        />
        <StatCard
          value={counts.reserved}
          label="Reservations"
          context="Active 24-hour holds"
          onClick={() => navigate({ to: "/leads", search: { stage: "reserved" } })}
        />
        <StatCard
          value={newInPeriod}
          label="New Leads"
          context={`Added — ${periodLabel}`}
          onClick={() => navigate({ to: "/leads", search: { stage: "new_lead" } })}
        />
      </div>
    </div>
  );
}

// ==== Mobile Accordion Wrapper ====

function MobileCollapsible({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  if (isDesktop) {
    return <SectionCard title={title}>{children}</SectionCard>;
  }
  return (
    <div className="rounded-(--radius-md) border border-(--color-border) bg-white shadow-(--shadow-sm)">
      <Accordion type="single" collapsible defaultValue={defaultOpen ? "item" : undefined}>
        <AccordionItem value="item" className="border-b-0">
          <AccordionTrigger className="px-4 text-base font-semibold">{title}</AccordionTrigger>
          <AccordionContent className="px-4 pb-4">{children}</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

// ==== Summary Cards ====

function SummaryCards({
  scope,
  isManager,
  period,
}: {
  scope: Scope;
  isManager: boolean;
  period: Period;
}) {
  const { db } = useDashboardData();
  const counts = selectSummaryCounts(db, scope, period);
  const prefix = isManager ? "Team" : "My";
  const cards: Array<{ label: string; value: number; stage: Stage | "all" }> = [
    { label: `${prefix} Total Leads`, value: counts.total, stage: "all" },
    { label: `${prefix} New Leads`, value: counts.new_lead, stage: "new_lead" },
    { label: `${prefix} CRF`, value: counts.crf, stage: "crf" },
    { label: `${prefix} Reserved`, value: counts.reserved, stage: "reserved" },
    { label: `${prefix} Closed Sales`, value: counts.closed_sale, stage: "closed_sale" },
    { label: `${prefix} Cancelled`, value: counts.cancelled, stage: "cancelled" },
  ];
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((c) => (
        <button
          key={c.label}
          onClick={() =>
            navigate({
              to: "/leads",
              search: c.stage === "all" ? {} : { stage: c.stage },
            })
          }
          className="rounded-(--radius-md) border border-(--color-border) bg-white p-3.5 text-left shadow-(--shadow-sm) transition-tenacious hover:border-(--color-primary) active:scale-[0.98]"
        >
          <div className="text-xl font-semibold leading-tight text-(--color-text) tabular-nums">
            {c.value}
          </div>
          <div className="mt-1 text-xs font-medium text-(--color-text-secondary)">{c.label}</div>
        </button>
      ))}
    </div>
  );
}

// ==== Priority Section ====

function PrioritySection({ scope, isManager }: { scope: Scope; isManager: boolean }) {
  const { db } = useDashboardData();
  const items = selectPriorityItems(db, scope, { includeUnassigned: isManager });
  return (
    <SectionCard title="Priority — needs your attention">
      {items.length === 0 ? (
        <p className="py-4 text-center text-sm text-(--color-text-secondary)">
          Great job! None of your leads are currently stagnant or expiring.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 8).map((item) => (
            <PriorityCard key={item.id} item={item} isManager={isManager} />
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function PriorityCard({ item, isManager }: { item: PriorityItem; isManager: boolean }) {
  const navigate = useNavigate();
  const profile = useCurrentProfile();
  const { db } = useDashboardData();
  const openLead = () => navigate({ to: "/leads", search: { lead: item.lead.id } });

  const call = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await addNote(item.lead.id, "📞 Called client from Dashboard", false);
      toast("Call logged", { description: item.lead.full_name });
    } catch (err: any) {
      toast.error(err.message || "Failed to log call");
    }
    if (item.lead.contact_number) window.location.href = `tel:${item.lead.contact_number}`;
  };
  const extendRes = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!profile) return;
    try {
      const r = await extendReservation(item.lead.id, { id: profile.id, role: profile.role });
      if (r.ok)
        toast("Reservation extended", { description: `${item.lead.full_name} — +24 hours` });
      else toast.error(r.error ?? "Failed");
    } catch (err: any) {
      toast.error(err.message || "Failed to extend reservation");
    }
  };
  const extendCrfFn = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!profile) return;
    try {
      const r = await extendCRF(item.lead.id, "Extension requested from Dashboard", {
        id: profile.id,
        role: profile.role,
      });
      if (r.ok) {
        toast(r.pending ? "Extension requested" : "CRF extended 30 days", {
          description: item.lead.full_name,
        });
      } else toast.error(r.error ?? "Failed");
    } catch (err: any) {
      toast.error(err.message || "Failed to extend CRF");
    }
  };
  const assign = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast("Assign lead", { description: "Open the lead to assign a consultant." });
    openLead();
  };

  const ind = renderIndicator(item);

  return (
    <li>
      <button
        onClick={openLead}
        className="w-full rounded-(--radius-md) border border-(--color-border) p-3 text-left transition-tenacious hover:border-(--color-primary) hover:bg-(--color-surface)"
      >
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-full",
              KIND_CIRCLE[item.kind],
            )}
          >
            {ind.icon}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm font-medium text-(--color-text)">
              <span className="truncate">{item.lead.full_name}</span>
              {isManager && item.kind !== "unassigned" && (
                <StatusChip variant="inactive" className="py-0.5! text-[10px]!">
                  {assigneeName(item.lead.assigned_to ?? "", db.profiles)}
                </StatusChip>
              )}
            </div>
            <div className={cn("mt-0.5 text-xs font-medium", ind.color)}>{ind.text}</div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {item.kind === "stagnant" && (
              <Button size="sm" variant="ghost" onClick={call}>
                <Phone className="mr-1 h-3.5 w-3.5" />
                Call
              </Button>
            )}
            {item.kind === "reservation_expiring" && (
              <Button size="sm" variant="outline" onClick={extendRes}>
                <RefreshCw className="mr-1 h-3.5 w-3.5" />
                Request Extension
              </Button>
            )}
            {item.kind === "crf_expiring" && (
              <Button size="sm" variant="outline" onClick={extendCrfFn}>
                <RefreshCw className="mr-1 h-3.5 w-3.5" />
                Extend CRF
              </Button>
            )}
            {item.kind === "unassigned" && (
              <Button size="sm" onClick={assign}>
                Assign
              </Button>
            )}
            <ChevronRight className="h-4 w-4 text-(--color-text-placeholder)" aria-hidden />
          </div>
        </div>
      </button>
    </li>
  );
}

const KIND_CIRCLE: Record<PriorityItem["kind"], string> = {
  reservation_expiring: "bg-(--color-chip-critical-bg) text-(--color-chip-critical-fg)",
  crf_expiring: "bg-(--color-chip-warning-bg) text-(--color-chip-warning-fg)",
  stagnant: "bg-(--color-chip-inactive-bg) text-(--color-chip-inactive-fg)",
  unassigned: "bg-(--color-chip-warning-bg) text-(--color-chip-warning-fg)",
  awaiting_documentation: "bg-(--color-chip-info-bg) text-(--color-chip-info-fg)",
};

function assigneeName(id: string, profiles: Array<{ id: string; display_name: string }>): string {
  if (!id) return "Unassigned";
  return profiles.find((p) => p.id === id)?.display_name.split(" ")[0] ?? "Unknown";
}

function renderIndicator(item: PriorityItem): {
  icon: React.ReactNode;
  text: string;
  color: string;
} {
  if (item.kind === "reservation_expiring" && item.msRemaining != null) {
    return {
      icon: <Timer className="h-4 w-4" />,
      text:
        item.msRemaining > 0
          ? `Res. Expires in ${formatCountdown(item.msRemaining)}`
          : item.indicator,
      color: "text-(--color-error)",
    };
  }
  if (item.kind === "crf_expiring") {
    return {
      icon: <AlertTriangle className="h-4 w-4" />,
      text: item.indicator,
      color: "text-(--color-warning)",
    };
  }
  if (item.kind === "stagnant") {
    return {
      icon: <Clock className="h-4 w-4" />,
      text: item.indicator,
      color: "text-(--color-text-secondary)",
    };
  }
  if (item.kind === "unassigned") {
    return {
      icon: <AlertTriangle className="h-4 w-4" />,
      text: item.indicator,
      color: "text-(--color-warning)",
    };
  }
  return {
    icon: <FileText className="h-4 w-4" />,
    text: item.indicator,
    color: "text-(--color-text-secondary)",
  };
}

// ==== Reason Dialog (replaces window.prompt for reject/deny flows) ====

function ReasonDialog({
  open,
  title,
  label,
  defaultValue,
  minLength = 0,
  confirmLabel,
  onConfirm,
  onOpenChange,
}: {
  open: boolean;
  title: string;
  label: string;
  defaultValue: string;
  minLength?: number;
  confirmLabel: string;
  onConfirm: (reason: string) => void;
  onOpenChange: (v: boolean) => void;
}) {
  const [value, setValue] = useState(defaultValue);
  useEffect(() => {
    if (open) setValue(defaultValue);
  }, [open, defaultValue]);
  const tooShort = value.trim().length < minLength;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-(--radius-lg)">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div>
          <label className="mb-1 block text-xs font-medium text-(--color-text-secondary)">
            {label}
          </label>
          <Input value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
          {minLength > 0 && tooShort && (
            <p className="mt-1 text-xs text-(--color-text-secondary)">
              At least {minLength} characters.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={tooShort}
            onClick={() => {
              onConfirm(value.trim());
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==== Manager Pending Actions ====

function PendingActionsBlock() {
  const { db } = useDashboardData();
  const profile = useCurrentProfile();
  const sales = selectPendingSales(db);
  const escalated = selectEscalatedExpirations(db);
  const crfExt = selectPendingCrfExtensions(db);
  useTicker((s) => s.now);
  const [rejectSaleId, setRejectSaleId] = useState<string | null>(null);
  const [denyExtId, setDenyExtId] = useState<string | null>(null);

  if (sales.length === 0 && escalated.length === 0 && crfExt.length === 0) {
    return (
      <SectionCard title="Pending Actions">
        <p className="text-sm text-(--color-text-secondary)">No pending actions. All caught up.</p>
      </SectionCard>
    );
  }

  const approve = async (leadId: string) => {
    if (!profile) return;
    try {
      const r = await approveClosedSale(leadId, { id: profile.id, role: profile.role });
      if (r.ok) toast.success("Sale approved");
      else toast.error(r.error ?? "Failed");
    } catch (err: any) {
      toast.error(err.message || "Failed");
    }
  };
  const reject = async (leadId: string, reason: string) => {
    if (!profile) return;
    try {
      const r = await rejectClosedSale(leadId, reason, { id: profile.id, role: profile.role });
      if (r.ok) toast("Sale rejected — reverted to Documentation");
      else toast.error(r.error ?? "Failed");
    } catch (err: any) {
      toast.error(err.message || "Failed");
    }
  };
  const approveExt = async (id: string) => {
    if (!profile) return;
    try {
      const r = await resolveCrfExtension(id, true, { id: profile.id, role: profile.role });
      if (r.ok) toast.success("Extension approved");
      else toast.error(r.error ?? "Failed");
    } catch (err: any) {
      toast.error(err.message || "Failed");
    }
  };
  const denyExt = async (id: string, reason: string) => {
    if (!profile) return;
    try {
      const r = await resolveCrfExtension(
        id,
        false,
        { id: profile.id, role: profile.role },
        reason,
      );
      if (r.ok) toast("Extension denied");
      else toast.error(r.error ?? "Failed");
    } catch (err: any) {
      toast.error(err.message || "Failed");
    }
  };

  return (
    <SectionCard title="Pending Actions">
      <div className="space-y-4">
        {sales.length > 0 && (
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--color-text-secondary)">
              Closed Sales Pending Verification
            </div>
            <ul className="space-y-2">
              {sales.map(({ lead, agent }) => (
                <li
                  key={lead.id}
                  className="flex flex-wrap items-center gap-2 rounded-(--radius-md) border border-(--color-border) p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{lead.full_name}</div>
                    <div className="text-xs text-(--color-text-secondary)">
                      {agent?.display_name ?? "—"} • {compactPeso(lead.sale_price)}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" onClick={() => approve(lead.id)}>
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setRejectSaleId(lead.id)}>
                      <XCircle className="mr-1 h-3.5 w-3.5" />
                      Reject
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {escalated.length > 0 && (
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--color-text-secondary)">
              Escalated Expirations
            </div>
            <ul className="space-y-2">
              {escalated.map((lead) => {
                const ms = new Date(lead.reservation_expires_at!).getTime() - Date.now();
                return (
                  <li
                    key={lead.id}
                    className="flex flex-wrap items-center gap-2 rounded-(--radius-md) border border-(--color-border) p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{lead.full_name}</div>
                      <span className="mt-1 inline-flex items-center rounded-(--radius-pill) bg-(--color-error) px-2 py-0.5 text-[11px] font-semibold text-white">
                        🚨 ESCALATED Expiry: {formatCountdown(ms)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {crfExt.length > 0 && (
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--color-text-secondary)">
              Overdue CRF Extension Requests
            </div>
            <ul className="space-y-2">
              {crfExt.map((ext) => {
                const lead = db.leads.find((l) => l.id === ext.lead_id);
                return (
                  <li
                    key={ext.id}
                    className="flex flex-wrap items-center gap-2 rounded-(--radius-md) border border-(--color-border) p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">
                        {lead?.full_name ?? ext.lead_id}
                      </div>
                      <div className="text-xs text-(--color-text-secondary)">{ext.reason}</div>
                    </div>
                    <div className="flex gap-1.5">
                      <Button size="sm" onClick={() => approveExt(ext.id)}>
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setDenyExtId(ext.id)}>
                        Deny
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
      <ReasonDialog
        open={rejectSaleId != null}
        title="Reject Closed Sale"
        label="Correction reason"
        defaultValue=""
        minLength={5}
        confirmLabel="Reject Sale"
        onConfirm={(reason) => rejectSaleId && reject(rejectSaleId, reason)}
        onOpenChange={(v) => !v && setRejectSaleId(null)}
      />
      <ReasonDialog
        open={denyExtId != null}
        title="Deny CRF Extension"
        label="Deny reason"
        defaultValue="Insufficient justification"
        confirmLabel="Deny Extension"
        onConfirm={(reason) => denyExtId && denyExt(denyExtId, reason || "Denied")}
        onOpenChange={(v) => !v && setDenyExtId(null)}
      />
    </SectionCard>
  );
}

// ==== Pipeline Overview ====

const FUNNEL: Stage[] = ["new_lead", "crf", "reserved", "documentation", "closed_sale"];
// Solid chip foreground colors — dots and bar fills need saturated tones, not pale chip backgrounds.
const STAGE_COLOR: Record<Stage, string> = {
  new_lead: "var(--color-chip-info-fg)",
  crf: "var(--color-primary)",
  reserved: "var(--color-chip-violet-fg)",
  documentation: "var(--color-warning)",
  closed_sale: "var(--color-success)",
  cancelled: "var(--color-chip-inactive-fg)",
  archived: "var(--color-chip-inactive-fg)",
};

function WorkflowOverview({ scope, period }: { scope: Scope; period: Period }) {
  const { db } = useDashboardData();
  const counts = selectStageCounts(db, scope, period);
  const navigate = useNavigate();
  const max = Math.max(1, ...FUNNEL.map((s) => counts[s]));
  return (
    <div className="space-y-1.5">
      {FUNNEL.map((stage) => (
        <PipelineBar
          key={stage}
          label={STAGE_LABELS[stage]}
          dotColor={STAGE_COLOR[stage]}
          count={counts[stage]}
          pct={(counts[stage] / max) * 100}
          onClick={() => navigate({ to: "/leads", search: { stage } })}
        />
      ))}
      <div className="mt-2 border-t border-(--color-border) pt-1.5">
        <PipelineBar
          label={STAGE_LABELS.cancelled}
          dotColor={STAGE_COLOR.cancelled}
          count={counts.cancelled}
          pct={(counts.cancelled / max) * 100}
          onClick={() => navigate({ to: "/leads", search: { stage: "cancelled" } })}
        />
      </div>
    </div>
  );
}

// ==== Recent Activity ====

function RecentActivity({ scope, period }: { scope: Scope; period: Period }) {
  const { db } = useDashboardData();
  const items = selectRecentActivity(db, scope, 10, period);
  const navigate = useNavigate();
  return (
    <SectionCard title="Recent Activity">
      {items.length === 0 ? (
        <p className="py-3 text-sm text-(--color-text-secondary)">
          No milestone activity in this period.
        </p>
      ) : (
        <ul>
          {items.map(({ entry, lead }, i) => (
            <TimelineItem key={entry.id} isLast={i === items.length - 1}>
              <button
                onClick={() => lead && navigate({ to: "/leads", search: { lead: lead.id } })}
                className="-mt-0.5 flex w-full items-start gap-2 rounded-(--radius-sm) p-1.5 text-left transition-tenacious hover:bg-(--color-surface)"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-(--color-text)">
                    <span className="font-medium">{lead?.full_name ?? "Lead"}</span>
                    <span className="text-(--color-text-secondary)"> — {entry.summary}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-(--color-text-secondary)">
                    {relative(entry.created_at)}
                  </div>
                </div>
                <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-(--color-text-placeholder)" />
              </button>
            </TimelineItem>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

// ==== Quick Insights & Goal Progress ====

const SOURCE_LABELS: Record<string, string> = {
  social_media: "Social Media",
  walk_in: "Walk-in",
  flyers: "Flyers",
  ads: "Ads",
  referral: "Referral",
  personal_network: "Personal Network",
  other: "Other",
};

function QuickInsights({
  scope,
  isManager,
  userId,
  period,
}: {
  scope: Scope;
  isManager: boolean;
  userId: string;
  period: Period;
}) {
  const { db } = useDashboardData();
  const upsertTeamGoal = useUpsertTeamGoal();
  const sources = selectSourceBreakdown(db, scope, period);
  const verified = selectVerifiedSalesValue(db, scope);
  const pending = selectPendingSalesValue(db, scope);
  const goal = isManager ? selectTeamGoal(db) : selectPersonalTarget(db, userId).amount;
  const isAuto = !isManager && selectPersonalTarget(db, userId).auto;
  const setTeamGoal = (monthKey: string, v: number) =>
    upsertTeamGoal.mutate({ month: monthKey, amount: v });

  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const paceRatio = dayOfMonth / daysInMonth;
  const attained = goal ? verified / goal : 0;
  const pacing = attained >= paceRatio ? "on track" : "behind pace";

  const [animPct, setAnimPct] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimPct(Math.min(1, attained) * 100), 30);
    return () => clearTimeout(t);
  }, [attained]);

  const maxSrc = Math.max(1, ...sources.map((s) => s.count));

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--color-text-secondary)">
          Lead Source ({period.kind === "all" ? "all time" : period.label.toLowerCase()})
        </div>
        {sources.length === 0 ? (
          <p className="text-sm text-(--color-text-secondary)">No leads added in this period.</p>
        ) : (
          <ul className="space-y-1.5">
            {sources.map(({ source, count }) => (
              <li
                key={source}
                className="grid grid-cols-[100px_1fr_auto] items-center gap-2 text-xs"
              >
                <span className="truncate">{SOURCE_LABELS[source] ?? source}</span>
                <div className="h-2 overflow-hidden rounded-full bg-(--color-surface)">
                  <div
                    className="h-full rounded-full bg-(--color-primary)"
                    style={{ width: `${(count / maxSrc) * 100}%` }}
                  />
                </div>
                <span className="tabular-nums font-medium">{count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide text-(--color-text-secondary)">
            {isManager ? "Team Goal" : "Personal Goal"}
          </div>
          {isManager && (
            <InlineEditableAmount value={goal ?? 0} onSave={(v) => setTeamGoal(monthKey, v)} />
          )}
        </div>
        {goal ? (
          <>
            <TooltipProvider delayDuration={200}>
              <div className="flex items-baseline justify-between text-sm">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="font-semibold cursor-help">{compactPeso(verified)}</span>
                  </TooltipTrigger>
                  <TooltipContent>{exactPeso(verified)}</TooltipContent>
                </Tooltip>
                <span className="text-xs text-(--color-text-secondary)">
                  of {compactPeso(goal)} {isAuto && "(Auto)"}
                </span>
              </div>
            </TooltipProvider>
            <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-(--color-surface)">
              <div
                className="h-full rounded-full bg-(--color-primary) transition-[width] duration-600 ease-out"
                style={{ width: `${animPct}%` }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-(--color-text-secondary)">
              <span>
                Day {dayOfMonth} of {daysInMonth} — {pacing}
              </span>
              <span>Pending: {compactPeso(pending)}</span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-(--color-text-secondary)">No Goal Set</span>
            {isManager && (
              <InlineEditableAmount
                value={0}
                startLabel="Set Goal"
                onSave={(v) => {
                  if (v > 0) setTeamGoal(monthKey, v);
                }}
              />
            )}
          </div>
        )}
      </div>

      {isManager && <PersonalTargetEditor />}
    </div>
  );
}

function InlineEditableAmount({
  value,
  onSave,
  startLabel,
}: {
  value: number;
  onSave: (v: number) => void;
  startLabel?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(String(value));
  useEffect(() => {
    setV(String(value));
  }, [value]);
  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1 text-xs font-medium text-(--color-primary) hover:underline"
      >
        <Pencil className="h-3 w-3" />
        {startLabel ?? compactPeso(value)}
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        value={v}
        onChange={(e) => setV(e.target.value)}
        className="h-7 w-28 text-xs"
        autoFocus
      />
      <Button
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0"
        onClick={() => {
          const n = Number(v);
          if (n >= 0) {
            onSave(n);
            setEditing(false);
          }
        }}
      >
        <Check className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0"
        onClick={() => {
          setV(String(value));
          setEditing(false);
        }}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function PersonalTargetEditor() {
  const { db } = useDashboardData();
  const updateTarget = useUpdatePersonalTarget();
  const consultants = db.profiles.filter((p) => p.role === "property_consultant");
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--color-text-secondary)">
        Consultant Monthly Targets
      </div>
      <ul className="space-y-1.5">
        {consultants.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-2 text-xs">
            <span className={cn("truncate", !c.is_active && "text-(--color-text-secondary)")}>
              {!c.is_active && "[Inactive] "}
              {c.display_name}
            </span>
            <InlineEditableAmount
              value={c.personal_monthly_target ?? 0}
              onSave={(v) => updateTarget.mutate({ userId: c.id, amount: v })}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

// ==== Team Overview Table ====

function TeamOverviewTable() {
  const { db } = useDashboardData();
  const rows = selectTeamOverview(db);
  const navigate = useNavigate();
  const isMobile = !useMediaQuery("(min-width: 1024px)");
  const go = (id: string) => navigate({ to: "/leads", search: { assigned: id } });
  // Tapping the avatar previews the consultant's profile; the rest of the row
  // still jumps to their lead list.
  const [previewProfile, setPreviewProfile] = useState<Profile | null>(null);

  const avatarFor = (c: Profile) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setPreviewProfile(c);
      }}
      aria-label={`View ${c.display_name}'s profile`}
      className="grid h-7 w-7 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full bg-(--color-primary-light) text-xs font-semibold text-(--color-primary-hover) hover:ring-2 hover:ring-(--color-primary)"
    >
      {c.profile_photo_url ? (
        <img
          src={c.profile_photo_url}
          alt={c.display_name}
          className="h-full w-full object-cover"
        />
      ) : (
        initials(c.display_name)
      )}
    </button>
  );

  if (isMobile) {
    return (
      <SectionCard title="Consultants">
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.consultant.id}>
              {/* div+role, not button — the avatar inside is its own button */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => go(r.consultant.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    go(r.consultant.id);
                  }
                }}
                className="w-full cursor-pointer rounded-(--radius-md) border border-(--color-border) p-3 text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex min-w-0 items-center gap-2">
                    {avatarFor(r.consultant)}
                    <div className="font-medium text-sm truncate">
                      {!r.consultant.is_active && (
                        <StatusChip variant="inactive" className="mr-1 py-0! text-[10px]!">
                          Inactive
                        </StatusChip>
                      )}
                      {r.consultant.display_name}
                    </div>
                  </div>
                  <span className="text-xs text-(--color-text-secondary)">
                    {relative(r.lastLogin)}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-(--color-text-secondary)">
                  <span>
                    Active: <b>{r.activeLeads}</b>
                  </span>
                  <span>
                    Trippings: <b>{r.trippingsThisWeek}</b>
                  </span>
                  <span>
                    Presentations: <b>{r.presentationsThisWeek}</b>
                  </span>
                  <span>
                    Closed: <b>{r.closedCount}</b> · {compactPeso(r.closedValue)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <ConsultantProfileDialog
          profile={previewProfile}
          onOpenChange={(v) => !v && setPreviewProfile(null)}
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Consultants">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-(--color-border) text-left text-xs font-semibold uppercase tracking-wide text-(--color-text-secondary)">
              <th className="py-2 pr-3">Consultant</th>
              <th className="py-2 pr-3">Active Leads</th>
              <th className="py-2 pr-3">Trippings (Wk)</th>
              <th className="py-2 pr-3">Presentations (Wk)</th>
              <th className="py-2 pr-3">Closed Sales</th>
              <th className="py-2 pr-3">Closed Value</th>
              <th className="py-2 pr-3">Last Login</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.consultant.id}
                onClick={() => go(r.consultant.id)}
                className="cursor-pointer border-b border-(--color-border) last:border-0 hover:bg-(--color-surface)"
              >
                <td className="py-2 pr-3">
                  <div className="flex items-center gap-2">
                    {avatarFor(r.consultant)}
                    <span
                      className={cn(!r.consultant.is_active && "text-(--color-text-secondary)")}
                    >
                      {!r.consultant.is_active && "[Inactive] "}
                      {r.consultant.display_name}
                    </span>
                  </div>
                </td>
                <td className="py-2 pr-3">{r.activeLeads}</td>
                <td className="py-2 pr-3">{r.trippingsThisWeek}</td>
                <td className="py-2 pr-3">{r.presentationsThisWeek}</td>
                <td className="py-2 pr-3">{r.closedCount}</td>
                <td className="py-2 pr-3">
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">{compactPeso(r.closedValue)}</span>
                      </TooltipTrigger>
                      <TooltipContent>{exactPeso(r.closedValue)}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </td>
                <td className="py-2 pr-3 text-(--color-text-secondary)">{relative(r.lastLogin)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConsultantProfileDialog
        profile={previewProfile}
        onOpenChange={(v) => !v && setPreviewProfile(null)}
      />
    </SectionCard>
  );
}
