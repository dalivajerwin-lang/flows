import { useState } from "react";
import { toast } from "sonner";
import { Copy, Check, Share2, Plus } from "lucide-react";
import { useAuth } from "@/stores/auth-store";
import { useCreateRegistrationToken } from "@/hooks/use-registration-tokens";
import { Button } from "@/components/ui/tenacious-button";
import { Field, TenaciousInput } from "@/components/ui/form-controls";
import { initials } from "@/lib/format";
import { useOnboarding } from "@/stores/onboarding-store";
import { announceBadge } from "./onboarding-bits";
import { cn } from "@/lib/utils";

/**
 * Invite your team — M4, the manager activation moment. Reuses the real
 * registration-token flow from team.tsx; each generated invite renders as a
 * team card sliding into a growing row (§5 M4). Share sheet on mobile since
 * invites travel over Viber/Messenger in this team's workflow.
 *
 * Only managers reach this step (superadmin skips onboarding), and managers
 * can only invite property consultants — creating managers is a
 * superadmin-only power, enforced by RLS on registration_tokens.
 */
interface Invite {
  name: string;
  link: string;
}

export function StepInviteTeam({ onInvitesChanged }: { onInvitesChanged: (n: number) => void }) {
  const currentProfile = useAuth((s) => s.profile);
  const createTokenMutation = useCreateRegistrationToken();
  const awardBadge = useOnboarding((s) => s.awardBadge);

  const [invites, setInvites] = useState<Invite[]>([]);
  const [name, setName] = useState("");
  const [agentNumber, setAgentNumber] = useState("");
  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentProfile || !name.trim() || !agentNumber.trim()) return;
    try {
      const result = await createTokenMutation.mutateAsync({
        intended_display_name: name.trim(),
        intended_agent_number: agentNumber.trim(),
        intended_role: "property_consultant",
        created_by: currentProfile.id,
      });
      const link = `${window.location.origin}/register?token=${result.token}`;
      const next = [...invites, { name: name.trim(), link }];
      setInvites(next);
      onInvitesChanged(next.length);
      // First invite triggers Squad Assembled + milestone toast (§5 M4).
      if (next.length === 1 && awardBadge("squad_assembled")) announceBadge("squad_assembled");
      // "Invite another" resets the mini-form inline.
      setName("");
      setAgentNumber("");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate invite link.");
    }
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-md)] sm:p-6">
      <h2 className="text-center text-[22px] font-bold text-[var(--color-text)] sm:text-2xl">
        Invite your team
      </h2>
      <p className="mt-1 text-center text-sm text-[var(--color-text-secondary)]">
        Each invite is a real one-time registration link — send it over Viber or Messenger.
      </p>

      {/* The team row that visibly builds itself (§5 M4 / §9.4). */}
      <div className="mt-5 -mx-2 overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-3 pb-1">
          {invites.length === 0 && (
            <div className="flex w-32 shrink-0 flex-col items-center gap-2 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-4 opacity-60">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--color-surface)] text-sm font-bold text-[var(--color-text-placeholder)]">
                ?
              </span>
              <span className="text-center text-xs text-[var(--color-text-secondary)]">
                Your first consultant
              </span>
            </div>
          )}
          {invites.map((inv, i) => (
            <TeamInviteCard key={i} invite={inv} canShare={canShare} />
          ))}
        </div>
      </div>
      {invites.length > 0 && (
        <p className="mt-1 text-sm font-semibold text-[var(--color-success)]">
          {invites.length} invite{invites.length === 1 ? "" : "s"} ready to send.
        </p>
      )}

      {/* Inline mini-form — the real registration-token flow. */}
      <form
        onSubmit={handleSubmit}
        className="mt-5 space-y-3 border-t border-[var(--color-border)] pt-5"
      >
        <Field label="Display Name" htmlFor="onb-invite-name" required>
          <TenaciousInput
            id="onb-invite-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. John Doe"
            required
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Agent Number" htmlFor="onb-invite-agent" required>
            <TenaciousInput
              id="onb-invite-agent"
              value={agentNumber}
              onChange={(e) => setAgentNumber(e.target.value)}
              placeholder="e.g. 2004"
              required
            />
          </Field>
          <Field label="Role" htmlFor="onb-invite-role">
            <TenaciousInput id="onb-invite-role" value="Property Consultant" disabled readOnly />
          </Field>
        </div>
        <Button
          type="submit"
          variant="secondary"
          fullWidth
          disabled={createTokenMutation.isPending}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          {createTokenMutation.isPending
            ? "Generating…"
            : invites.length > 0
              ? "Invite another"
              : "Generate invite link"}
        </Button>
      </form>
    </div>
  );
}

function TeamInviteCard({ invite, canShare }: { invite: Invite; canShare: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(invite.link);
      // Copy-button morph: "Copied ✓", reverts after 1.5s (§6.2).
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy — check clipboard permissions.");
    }
  }

  async function share() {
    try {
      await navigator.share({
        title: "Join Team Tenacious",
        text: `${invite.name}, here's your registration link for Tenacious CRM:`,
        url: invite.link,
      });
    } catch {
      /* user dismissed the sheet */
    }
  }

  return (
    <div className="onb-card-settle flex w-32 shrink-0 flex-col items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-sm)]">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--color-primary-light)] text-sm font-bold text-[var(--color-primary-hover)]">
        {initials(invite.name)}
      </span>
      <span className="w-full truncate text-center text-xs font-semibold text-[var(--color-text)]">
        {invite.name}
      </span>
      <span className="text-[10px] capitalize text-[var(--color-text-secondary)]">
        property consultant
      </span>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={copy}
          className={cn(
            "inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1 text-[11px] font-semibold transition-tenacious active:scale-[0.95]",
            copied
              ? "bg-[var(--color-success-soft-bg)] text-[var(--color-success-soft-fg)]"
              : "bg-[var(--color-primary-light)] text-[var(--color-primary-hover)]",
          )}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied ✓" : "Copy"}
        </button>
        {canShare && (
          <button
            type="button"
            onClick={share}
            aria-label={`Share invite link for ${invite.name}`}
            className="inline-flex items-center rounded-[var(--radius-sm)] bg-[var(--color-surface)] px-2 py-1 text-[var(--color-text-secondary)] transition-tenacious active:scale-[0.95]"
          >
            <Share2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
