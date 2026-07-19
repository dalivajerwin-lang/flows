import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Phone, Copy, ExternalLink, Mail } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/tenacious-button";
import { useLeads } from "@/hooks/use-leads";
import { useLeadsUI } from "@/stores/leads-store";
import { compactPeso } from "@/lib/format-currency";
import type { Database } from "@/types/supabase";
import type { Stage } from "@/lib/constants";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const ACTIVE_STAGES: Stage[] = ["new_lead", "crf", "reserved", "documentation"];

/**
 * Read-only consultant profile preview for managers — opened by tapping the
 * avatar/name on the Team roster. Quick stats + contact, with a jump to the
 * consultant's filtered lead list.
 */
export function ConsultantProfileDialog({
  profile,
  onOpenChange,
}: {
  profile: Profile | null;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const { data: leads = [] } = useLeads();

  const stats = useMemo(() => {
    if (!profile) return null;
    const mine = leads.filter((l) => l.assigned_to === profile.id && !l.deleted_at);
    const active = mine.filter((l) => ACTIVE_STAGES.includes(l.stage as Stage));
    const monthKey = new Date().toISOString().slice(0, 7);
    const closedThisMonth = mine.filter(
      (l) =>
        l.stage === "closed_sale" &&
        l.closed_sale_status === "verified" &&
        (l.closed_sale_verified_at ?? "").slice(0, 7) === monthKey,
    );
    return {
      activeLeads: active.length,
      closedCount: closedThisMonth.length,
      closedValue: closedThisMonth.reduce((s, l) => s + (l.sale_price ?? 0), 0),
    };
  }, [leads, profile]);

  if (!profile) return null;

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast(`${label} copied to clipboard`);
    } catch {
      toast.error("Could not copy — check clipboard permissions.");
    }
  };

  return (
    <Dialog open={!!profile} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="sr-only">{profile.display_name}</DialogTitle>
        </DialogHeader>

        {/* Identity */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-primary-light)] text-2xl font-bold text-[var(--color-primary)]">
            {profile.profile_photo_url ? (
              <img
                src={profile.profile_photo_url}
                alt={profile.display_name}
                className="h-full w-full object-cover"
              />
            ) : (
              profile.display_name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <div className="text-lg font-bold text-[var(--color-text)]">
              {profile.display_name}
            </div>
            <div className="text-xs text-[var(--color-text-secondary)]">
              Agent #{profile.agent_number}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {profile.role.replace("_", " ")}
            </Badge>
            <Badge
              className={
                profile.is_active
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                  : "bg-[var(--color-error)] hover:brightness-95 text-white"
              }
            >
              {profile.is_active ? "Active" : "Deactivated"}
            </Badge>
          </div>
        </div>

        {/* Quick stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2">
              <div className="text-lg font-bold text-[var(--color-text)]">
                {stats.activeLeads}
              </div>
              <div className="text-[10px] text-[var(--color-text-secondary)]">Active Leads</div>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2">
              <div className="text-lg font-bold text-[var(--color-text)]">
                {stats.closedCount}
              </div>
              <div className="text-[10px] text-[var(--color-text-secondary)]">
                Closed (Month)
              </div>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2">
              <div className="text-lg font-bold text-[var(--color-text)]">
                {compactPeso(stats.closedValue)}
              </div>
              <div className="text-[10px] text-[var(--color-text-secondary)]">Verified Value</div>
            </div>
          </div>
        )}

        {/* Contact */}
        <div className="space-y-1.5 text-sm">
          {profile.phone && (
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                <Phone size={14} /> {profile.phone}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => copy(profile.phone, "Phone number")}
                  aria-label="Copy phone number"
                  className="rounded-md border border-[var(--color-border)] p-1.5 hover:bg-[var(--color-surface)]"
                >
                  <Copy size={13} />
                </button>
                <a
                  href={`tel:${profile.phone}`}
                  aria-label={`Call ${profile.display_name}`}
                  className="rounded-md border border-[var(--color-border)] p-1.5 hover:bg-[var(--color-surface)]"
                >
                  <Phone size={13} />
                </a>
              </div>
            </div>
          )}
          {profile.email && (
            <div className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2 text-[var(--color-text-secondary)]">
                <Mail size={14} className="shrink-0" />
                <span className="truncate">{profile.email}</span>
              </span>
              <button
                type="button"
                onClick={() => copy(profile.email, "Email")}
                aria-label="Copy email"
                className="rounded-md border border-[var(--color-border)] p-1.5 hover:bg-[var(--color-surface)]"
              >
                <Copy size={13} />
              </button>
            </div>
          )}
          <div className="text-xs text-[var(--color-text-secondary)]">
            Last active:{" "}
            {profile.last_login_at ? new Date(profile.last_login_at).toLocaleString() : "Never"}
          </div>
        </div>

        {/* Actions */}
        {profile.role === "property_consultant" && (
          <Button
            className="w-full"
            onClick={() => {
              onOpenChange(false);
              useLeadsUI.getState().setConsultantFilter(profile.id);
              navigate({ to: "/leads" });
            }}
          >
            <ExternalLink className="mr-2 h-4 w-4" /> View Their Leads
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
