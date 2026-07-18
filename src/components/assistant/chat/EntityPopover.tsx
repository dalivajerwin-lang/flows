import { useEffect, useRef, useState } from "react";
import { X, ExternalLink, Phone } from "lucide-react";
import { StageBadge } from "@/components/ui/status-chip";
import { cn } from "@/lib/utils";
import { useCurrentProfile } from "@/stores/auth-store";
import { isManagerish } from "@/hooks/use-role";
import { useLeadsUI, useVisibleLeads } from "@/stores/leads-store";
import { useNavigate } from "@tanstack/react-router";
import { getAssistantVisibleLeads } from "@/lib/assistant/lead-search";
import { useProfiles } from "@/hooks/use-profiles";
import { useProjects } from "@/hooks/use-projects";
import type { Stage } from "@/lib/constants";

interface Props {
  type: "lead" | "agent";
  id: string;
  anchorRect: DOMRect;
  onDismiss: () => void;
}

export function EntityPopover({ type, id, anchorRect, onDismiss }: Props) {
  const profile = useCurrentProfile();
  const isManager = isManagerish(profile?.role ?? null);
  const navigate = useNavigate();
  const { leads: realLeads } = useVisibleLeads();
  const { data: profiles = [] } = useProfiles();
  const { data: projects = [] } = useProjects();
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; below: boolean } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const h = el.offsetHeight;
    const w = el.offsetWidth;
    const isNarrow = window.innerWidth < 400;
    if (isNarrow) {
      setPos({ top: window.innerHeight - h - 16, left: 16, below: true });
      return;
    }
    const canAbove = anchorRect.top - h - 8 > 16;
    const top = canAbove ? anchorRect.top - h - 8 : anchorRect.bottom + 8;
    let left = anchorRect.left + anchorRect.width / 2 - w / 2;
    left = Math.max(16, Math.min(left, window.innerWidth - w - 16));
    setPos({ top, left, below: !canAbove });
  }, [anchorRect]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onDismiss();
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [onDismiss]);

  const authorizedLeads = getAssistantVisibleLeads({ leads: realLeads, profile });
  const lead = type === "lead" ? authorizedLeads.find((l) => l.id === id) : null;
  const agent = type === "agent" ? profiles.find((p) => p.id === id) : null;

  const missing = (type === "lead" && !lead) || (type === "agent" && !agent);

  return (
    <div
      ref={ref}
      className={cn(
        "fixed z-50 w-72 rounded-[var(--radius-md)] border border-white/60 bg-white/95 p-3 shadow-lg backdrop-blur-md",
        "animate-[popIn_150ms_ease-out]",
      )}
      style={pos ? { top: pos.top, left: pos.left } : { top: -9999, left: -9999 }}
    >
      <button
        onClick={onDismiss}
        className="absolute right-2 top-2 text-[var(--color-text-subtle)] hover:text-[var(--color-text-soft)]"
        aria-label="Close"
      >
        <X size={14} />
      </button>
      {missing ? (
        <div className="space-y-2">
          <p className="text-sm text-[var(--color-text-soft)]">
            This record is no longer available.
          </p>
          <button
            onClick={onDismiss}
            className="rounded-md border border-[var(--color-border-muted)] px-3 py-1 text-xs"
          >
            Dismiss
          </button>
        </div>
      ) : lead ? (
        <div className="space-y-2 text-sm">
          <div className="font-semibold">{lead.full_name}</div>
          <div className="flex flex-wrap items-center gap-2">
            <StageBadge stage={lead.stage as Stage} />
            <span className="text-xs text-[var(--color-text-secondary)]">
              {projects.find((p) => p.id === lead.project_id)?.name ?? "—"}
            </span>
          </div>
          <div className="text-xs text-[var(--color-text-secondary)]">
            📞 {maskPhone(lead.contact_number)}
          </div>
          <div className="text-xs text-[var(--color-text-secondary)]">
            Last activity: {new Date(lead.last_activity_at).toLocaleDateString()}
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              onClick={() => {
                onDismiss();
                navigate({ to: "/leads", search: { lead: lead.id } as any });
              }}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-[var(--color-border-muted)] px-2 py-1.5 text-xs font-medium hover:bg-[var(--color-surface-subtle)]"
            >
              <ExternalLink size={12} /> Open Lead
            </button>
            <a
              href={`tel:${lead.contact_number}`}
              aria-label={`Call ${lead.full_name}`}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-[var(--color-primary-hover)] px-2 py-1.5 text-xs font-medium text-white hover:brightness-110"
            >
              <Phone size={12} /> Call
            </a>
            {lead.facebook_url && (
              <a
                href={lead.facebook_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1 rounded-md border border-[var(--color-border-muted)] px-2 py-1.5 text-xs font-medium hover:bg-[var(--color-surface-subtle)]"
              >
                💬 Message
              </a>
            )}
          </div>
        </div>
      ) : agent ? (
        <div className="space-y-2 text-sm">
          <div className="font-semibold">{agent.display_name}</div>
          <div className="text-xs text-[var(--color-text-secondary)]">
            Agent #{agent.agent_number}
          </div>
          <div className="text-xs">
            Active leads:{" "}
            {realLeads.filter((l) => l.assigned_to === agent.id && !l.deleted_at).length}
          </div>
          <div className="text-xs">
            Closed sales:{" "}
            {
              realLeads.filter(
                (l) =>
                  l.assigned_to === agent.id &&
                  l.stage === "closed_sale" &&
                  l.closed_sale_status === "verified",
              ).length
            }
          </div>
          {isManager && (
            <div className="text-xs text-[var(--color-text-secondary)]">
              Last login:{" "}
              {agent.last_login_at ? new Date(agent.last_login_at).toLocaleString() : "never"}
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <a
              href="/team"
              className="flex-1 rounded-md border border-[var(--color-border-muted)] px-2 py-1.5 text-center text-xs hover:bg-[var(--color-surface-subtle)]"
            >
              📂 View Profile
            </a>
            {isManager && (
              <button
                onClick={() => {
                  onDismiss();
                  useLeadsUI.getState().setConsultantFilter(agent.id);
                  navigate({ to: "/leads" });
                }}
                className="flex-1 rounded-md bg-[var(--color-primary-hover)] px-2 py-1.5 text-center text-xs text-white hover:brightness-110"
              >
                📊 Their Leads
              </button>
            )}
          </div>
        </div>
      ) : null}
      <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.95) } to { opacity:1; transform:scale(1) } }`}</style>
    </div>
  );
}

function maskPhone(p: string) {
  if (p.length <= 4) return p;
  return `${p.slice(0, p.length - 4).replace(/\d/g, "•")}${p.slice(-4)}`;
}
