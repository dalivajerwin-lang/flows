import { useMemo, useState } from "react";
import { toast } from "sonner";
import { UserPlus, Sparkles } from "lucide-react";
import { AddLeadDialog } from "@/components/leads/add-lead-dialog";
import { LeadListCards } from "@/components/leads/lead-list-cards";
import { useLeads } from "@/hooks/use-leads";
import { useCurrentProfile } from "@/stores/auth-store";
import { createLead } from "@/stores/leads-store";
import { queryClient } from "@/lib/query-client";
import { useOnboarding } from "@/stores/onboarding-store";
import { announceBadge } from "./onboarding-bits";

/**
 * Add your first client — C4, the activation moment. Two paths, no dead end:
 * (a) the real AddLeadDialog, unchanged; (b) a clearly-labeled practice lead.
 * After save the new lead renders as a real LeadListCards card with a one-time
 * teal shimmer sweep + First Client badge (§4 C4, §9.6).
 */
export function StepFirstLead({ onLeadAdded }: { onLeadAdded: () => void }) {
  const profile = useCurrentProfile();
  const awardBadge = useOnboarding((s) => s.awardBadge);
  const { data: leads = [], refetch } = useLeads(profile ? { assignedTo: profile.id } : undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creatingPractice, setCreatingPractice] = useState(false);
  const [newLeadId, setNewLeadId] = useState<string | null>(null);
  // Snapshot of lead ids before the dialog opens, to spot the one just added.
  const [beforeIds, setBeforeIds] = useState<Set<string> | null>(null);

  const newLead = useMemo(
    () => (newLeadId ? leads.find((l) => l.id === newLeadId) : undefined),
    [leads, newLeadId],
  );

  function celebrate(leadId: string) {
    setNewLeadId(leadId);
    if (awardBadge("first_blood")) announceBadge("first_blood");
    onLeadAdded();
  }

  async function handleDialogChange(open: boolean) {
    setDialogOpen(open);
    if (open) {
      setBeforeIds(new Set(leads.map((l) => l.id)));
      return;
    }
    // Dialog closed — see if a lead was created while it was open.
    const { data: fresh = [] } = await refetch();
    const added = fresh.find((l) => !beforeIds?.has(l.id));
    if (added) celebrate(added.id);
  }

  async function createPracticeLead() {
    if (!profile) return;
    setCreatingPractice(true);
    try {
      // Pseudo-unique practice number so the global phone-duplicate check
      // never collides across teammates doing the same onboarding step.
      const suffix = String(Date.now()).slice(-9);
      const res = await createLead({
        full_name: "Sample Client (practice)",
        contact_number: `+639${suffix}`,
        source: "other",
        source_other_description: "Onboarding practice lead",
        project_id: "",
        unit_types: [],
        date_added: new Date().toISOString(),
        assigned_to: profile.id,
      });
      if ("ok" in res && res.ok) {
        await queryClient.invalidateQueries({ queryKey: ["leads"] });
        await refetch();
        celebrate(res.leadId);
        toast("Practice lead created", {
          description: "Delete it from your Leads page whenever you're ready.",
        });
      } else {
        toast.error("Couldn't create the practice lead — try adding a real client instead.");
      }
    } catch (err: any) {
      toast.error(err.message || "Couldn't create the practice lead.");
    } finally {
      setCreatingPractice(false);
    }
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-md)] sm:p-6">
      <h2 className="text-center text-[22px] font-bold text-[var(--color-text)] sm:text-2xl">
        Add your first client
      </h2>
      <p className="mt-1 text-center text-sm text-[var(--color-text-secondary)]">
        This is a real lead in your real pipeline — no tutorial throwaways.
      </p>

      {newLead ? (
        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-[var(--color-text)]">
            This is how {newLead.full_name} appears in your pipeline:
          </p>
          <div className="onb-shimmer anim-rise relative overflow-hidden rounded-[var(--radius-md)]">
            <LeadListCards leads={[newLead]} onOpen={() => {}} />
          </div>
          <p className="mt-3 text-center text-xs text-[var(--color-text-secondary)]">
            Your pipeline is alive. Hit Continue when you're ready.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {/* Path (a) — visually dominant primary card. */}
          <button
            type="button"
            onClick={() => handleDialogChange(true)}
            className="w-full rounded-[var(--radius-md)] border-2 border-[var(--color-primary)] bg-[var(--color-primary-light)]/40 p-4 text-left transition-tenacious hover:bg-[var(--color-primary-light)] active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--color-primary)] text-white">
                <UserPlus className="h-5 w-5" />
              </span>
              <div>
                <div className="font-semibold text-[var(--color-text)]">Add a real client</div>
                <div className="text-xs text-[var(--color-text-secondary)]">
                  Someone you're already talking to — even just a name and number.
                </div>
              </div>
            </div>
          </button>

          {/* Path (b) — ghost-styled secondary card. No dead ends (§7). */}
          <button
            type="button"
            onClick={createPracticeLead}
            disabled={creatingPractice}
            className="w-full rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-4 text-left transition-tenacious hover:border-[var(--color-primary)] hover:bg-[var(--color-surface)] active:scale-[0.98] disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--color-surface)] text-[var(--color-text-secondary)]">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <div className="font-semibold text-[var(--color-text)]">
                  {creatingPractice ? "Creating…" : "I don't have one yet"}
                </div>
                <div className="text-xs text-[var(--color-text-secondary)]">
                  We'll add a practice lead labeled "Sample Client (practice)" — delete it later.
                </div>
              </div>
            </div>
          </button>
        </div>
      )}

      <AddLeadDialog open={dialogOpen} onOpenChange={handleDialogChange} />
    </div>
  );
}
