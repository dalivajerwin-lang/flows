import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useOfflineQueue } from "@/stores/offline-queue-store";
import { useLeads } from "@/hooks/use-leads";
import { useCurrentProfile } from "@/stores/auth-store";
import { ConflictResolutionModal } from "./conflict-resolution-modal";

/**
 * Floating red badge listing unresolved conflicts assigned to me. Clicking a
 * conflict opens the resolution modal.
 */
export function ConflictInbox() {
  const profile = useCurrentProfile();
  const conflicts = useOfflineQueue((s) => s.conflicts);
  const { data: leads = [] } = useLeads();
  const [openId, setOpenId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const mine = conflicts.filter(
    (c) => !c.resolved && (c.actorId === profile?.id || profile?.role !== "property_consultant"),
  );
  if (mine.length === 0 && !openId) return null;

  const active = openId ? conflicts.find((c) => c.id === openId) : null;

  return (
    <>
      {mine.length > 0 && (
        <div className="fixed left-4 top-16 z-30 sm:top-20">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-2 rounded-full bg-[var(--color-error)] px-3 py-1.5 text-xs font-semibold text-white shadow-[var(--shadow-md)]"
          >
            <AlertTriangle size={14} />
            {mine.length} conflict{mine.length === 1 ? "" : "s"}
          </button>
          {expanded && (
            <div className="mt-2 w-72 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-2 shadow-[var(--shadow-md)]">
              {mine.map((c) => {
                const lead = leads.find((l) => l.id === c.leadId);
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setOpenId(c.id);
                      setExpanded(false);
                    }}
                    className="block w-full rounded-[var(--radius-sm)] p-2 text-left text-sm hover:bg-[var(--color-surface)]"
                  >
                    <div className="font-medium">{lead?.full_name ?? "Unknown lead"}</div>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      {c.yourAction.kind === "note" ? "Note conflict" : `Field conflict`}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
      {active && <ConflictResolutionModal conflict={active} onClose={() => setOpenId(null)} />}
    </>
  );
}
