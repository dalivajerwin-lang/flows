import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useHealthSnapshot, type HealthSnapshot } from "@/hooks/use-admin";
import { useAuditLog, type AuditEntry } from "@/hooks/use-audit-log";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  AlertTriangle,
  ArchiveX,
  Inbox,
  Lock,
  LockOpen,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  UserCog,
  Users,
  UserX,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Console — Tenacious CRM" }] }),
  component: AdminDashboard,
});

interface StatusCard {
  key: keyof HealthSnapshot | "registration";
  label: string;
  icon: LucideIcon;
  value: (h: HealthSnapshot) => number | string;
  /** true = something needs attention */
  wrong: (h: HealthSnapshot) => boolean;
  to: string;
  hint: string;
}

const CARDS: StatusCard[] = [
  {
    key: "critical_events_24h",
    label: "Critical events (24h)",
    icon: ShieldAlert,
    value: (h) => h.critical_events_24h,
    wrong: (h) => h.critical_events_24h > 0,
    to: "/admin/audit",
    hint: "Force-stage changes, deletions, and other critical audit entries.",
  },
  {
    key: "failed_logins_24h",
    label: "Failed logins (24h)",
    icon: AlertTriangle,
    value: (h) => h.failed_logins_24h,
    wrong: (h) => h.failed_logins_24h >= 10,
    to: "/admin/audit",
    hint: "Wrong passwords and unknown agent numbers.",
  },
  {
    key: "stuck_reversions",
    label: "Stuck approvals",
    icon: Inbox,
    value: (h) => h.stuck_reversions + h.stuck_crf_extensions,
    wrong: (h) => h.stuck_reversions + h.stuck_crf_extensions > 0,
    to: "/admin/tools",
    hint: "Reversion or CRF requests pending for more than 2 days.",
  },
  {
    key: "orphaned_leads",
    label: "Orphaned leads",
    icon: ArchiveX,
    value: (h) => h.orphaned_leads,
    wrong: (h) => h.orphaned_leads > 0,
    to: "/admin/tools",
    hint: "Open leads assigned to nobody or to a deactivated account.",
  },
  {
    key: "stale_users",
    label: "Stale users (7d)",
    icon: UserX,
    value: (h) => h.stale_users,
    wrong: (h) => h.stale_users > 0,
    to: "/admin/users",
    hint: "Active accounts that haven't signed in for a week.",
  },
  {
    key: "registration",
    label: "Registration",
    icon: Lock,
    value: (h) => (h.registration_locked ? "Locked" : "Open"),
    wrong: (h) => !h.registration_locked,
    to: "/settings",
    hint: "Open means anyone with an invite link can register.",
  },
];

function AdminDashboard() {
  const { data: health, isLoading } = useHealthSnapshot();
  const feedFilters = useMemo(() => ({}), []);
  const { data: auditData } = useAuditLog(feedFilters);
  const feed: AuditEntry[] = (auditData?.pages[0] ?? []).slice(0, 15);

  const anythingWrong = health ? CARDS.some((c) => c.wrong(health)) : false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-[var(--color-text)]">
          <ShieldCheck className="h-6 w-6 text-[var(--color-primary)]" />
          Admin Console
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {isLoading
            ? "Checking system health..."
            : anythingWrong
              ? "Some items need your attention."
              : "All clear — nothing needs your attention right now."}
        </p>
      </div>

      {/* Status strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {CARDS.map((card) => {
          const Icon = card.key === "registration" && health && !health.registration_locked ? LockOpen : card.icon;
          const wrong = health ? card.wrong(health) : false;
          return (
            <Link
              key={card.key}
              to={card.to}
              title={card.hint}
              className={`rounded-[var(--radius-lg)] border p-4 shadow-sm transition-colors hover:border-[var(--color-primary)] ${
                wrong
                  ? "border-[var(--color-warning-soft-border)] bg-[var(--color-warning-soft-bg)]"
                  : "border-[var(--color-border)] bg-[var(--color-background)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon
                  className={`h-4 w-4 ${wrong ? "text-[var(--color-warning-soft-fg-icon)]" : "text-[var(--color-text-secondary)]"}`}
                />
                {wrong && <span className="h-2 w-2 rounded-full bg-amber-500" />}
              </div>
              <div className="mt-2 text-2xl font-bold text-[var(--color-text)]">
                {health ? card.value(health) : "—"}
              </div>
              <div className="text-xs text-[var(--color-text-secondary)]">{card.label}</div>
            </Link>
          );
        })}
      </div>

      {/* Team pulse + quick actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2 font-semibold text-[var(--color-text)]">
            <Activity className="h-4 w-4 text-[var(--color-primary)]" /> Team pulse
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-secondary)]">Active users today</dt>
              <dd className="font-semibold">{health?.active_users_today ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-secondary)]">Leads touched today</dt>
              <dd className="font-semibold">{health?.leads_touched_today ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-secondary)]">Leads in trash</dt>
              <dd className="font-semibold">{health?.deleted_leads ?? "—"}</dd>
            </div>
          </dl>
          <div className="mt-4 grid gap-2">
            <QuickLink to="/admin/users" icon={UserCog} label="User administration" />
            <QuickLink to="/admin/audit" icon={ScrollText} label="Audit log" />
            <QuickLink to="/admin/tools" icon={Wrench} label="Intervention tools" />
            <QuickLink to="/team" icon={Users} label="Team management" />
          </div>
        </div>

        {/* Live activity feed */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] p-5 shadow-sm lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-semibold text-[var(--color-text)]">Latest activity</div>
            <Link
              to="/admin/audit"
              className="text-sm text-[var(--color-primary)] hover:underline"
            >
              View all →
            </Link>
          </div>
          {feed.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--color-text-secondary)]">
              No recorded activity yet.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {feed.map((e) => (
                <li key={e.id} className="flex items-start gap-3 py-2 text-sm">
                  <Badge
                    className={
                      e.severity === "critical"
                        ? "bg-[var(--color-chip-critical-bg)] text-[var(--color-chip-critical-fg)]"
                        : e.severity === "warning"
                          ? "bg-[var(--color-chip-warning-bg)] text-[var(--color-chip-warning-fg)]"
                          : "bg-[var(--color-chip-inactive-bg)] text-[var(--color-chip-inactive-fg)]"
                    }
                  >
                    {e.severity}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <span className="font-medium">{e.actor?.display_name ?? "system"}</span>{" "}
                    <span className="text-[var(--color-text-secondary)]">{e.summary}</span>
                  </div>
                  <span className="whitespace-nowrap text-xs text-[var(--color-text-secondary)]">
                    {new Date(e.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickLink({ to, icon: Icon, label }: { to: string; icon: LucideIcon; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
