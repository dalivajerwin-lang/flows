import { useMemo, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import { useLead, type Lead } from "@/hooks/use-leads";
import { useCurrentProfile } from "@/stores/auth-store";
import { useOfflineQueue, type ConflictRecord } from "@/stores/offline-queue-store";

interface Props {
  conflict: ConflictRecord;
  onClose: () => void;
}

export function ConflictResolutionModal({ conflict, onClose }: Props) {
  const profile = useCurrentProfile();
  const { data: realLead } = useLead(conflict.leadId);
  const lead = realLead || (conflict.serverSnapshot as Lead);
  const resolve = useOfflineQueue((s) => s.resolveConflict);

  const changedFields = useMemo(() => {
    if (conflict.yourAction.kind === "note") return [];
    return Object.keys(conflict.yourAction.patch);
  }, [conflict]);

  const [mergePick, setMergePick] = useState<Record<string, "yours" | "server">>(() =>
    Object.fromEntries(changedFields.map((f) => [f, "yours" as const])),
  );

  const isNote = conflict.yourAction.kind === "note";
  const canForceOverwrite = profile?.role === "manager" || profile?.role === "superadmin";

  if (!lead) {
    onClose();
    return null;
  }

  const forceOverwrite = async () => {
    const action = conflict.yourAction;
    if (action.kind === "note") {
      await resolve(conflict.id, "force");
    } else {
      await resolve(conflict.id, "force", action.patch);
    }
    toast.success("Overwrite applied.");
    onClose();
  };

  const discardLocal = async () => {
    await resolve(conflict.id, "discard");
    toast("Local changes discarded.");
    onClose();
  };

  const commitMerge = async () => {
    if (isNote) {
      await resolve(conflict.id, "merge");
      toast.success("Merge committed.");
      onClose();
      return;
    }
    const action = conflict.yourAction;
    if (action.kind !== "update") return;
    const merged: Partial<Lead> = {};
    for (const key of changedFields) {
      const source = mergePick[key] === "server" ? conflict.serverSnapshot : action.patch;
      (merged as Record<string, unknown>)[key] = (source as Record<string, unknown>)[key];
    }
    await resolve(conflict.id, "merge", merged);
    toast.success("Merge committed.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[640px] rounded-[var(--radius-lg)] bg-white p-5 shadow-[var(--shadow-lg)]">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-error)]/10 text-[var(--color-error)]">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Conflict on {lead.full_name}</h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Your offline change (v{conflict.yourVersion}) is behind the current version (v
                {conflict.serverVersion}).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 hover:bg-[var(--color-surface)]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 max-h-[50vh] space-y-3 overflow-y-auto pr-1">
          {isNote ? (
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
              <div className="mb-1 text-xs font-semibold uppercase text-[var(--color-text-secondary)]">
                Your offline note
              </div>
              <div className="whitespace-pre-wrap text-sm">
                {conflict.yourAction.kind === "note" ? conflict.yourAction.body : ""}
              </div>
            </div>
          ) : (
            changedFields.map((key) => (
              <div
                key={key}
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3"
              >
                <div className="mb-2 text-xs font-semibold uppercase text-[var(--color-text-secondary)]">
                  {key.replace(/_/g, " ")}
                </div>
                <label className="mb-1 flex cursor-pointer items-start gap-2 rounded-[var(--radius-sm)] p-2 hover:bg-[var(--color-surface)]">
                  <input
                    type="radio"
                    name={`merge-${key}`}
                    checked={mergePick[key] === "yours"}
                    onChange={() => setMergePick((m) => ({ ...m, [key]: "yours" }))}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-medium text-[var(--color-text-secondary)]">
                      Your (offline) value
                    </div>
                    <div className="truncate text-sm">
                      {formatVal(
                        conflict.yourAction.kind === "update"
                          ? (conflict.yourAction.patch as Record<string, unknown>)[key]
                          : undefined,
                      )}
                    </div>
                  </div>
                </label>
                <label className="flex cursor-pointer items-start gap-2 rounded-[var(--radius-sm)] p-2 hover:bg-[var(--color-surface)]">
                  <input
                    type="radio"
                    name={`merge-${key}`}
                    checked={mergePick[key] === "server"}
                    onChange={() => setMergePick((m) => ({ ...m, [key]: "server" }))}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-medium text-[var(--color-text-secondary)]">
                      Current server value
                    </div>
                    <div className="truncate text-sm">
                      {formatVal((conflict.serverSnapshot as Record<string, unknown>)[key])}
                    </div>
                  </div>
                </label>
              </div>
            ))
          )}
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            onClick={discardLocal}
            className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium hover:bg-[var(--color-surface)]"
          >
            Discard Local Changes
          </button>
          {!isNote && (
            <button
              onClick={commitMerge}
              className="rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]"
            >
              Commit Merge
            </button>
          )}
          {canForceOverwrite && (
            <button
              onClick={forceOverwrite}
              className="rounded-[var(--radius-sm)] bg-[var(--color-error)] px-3 py-2 text-sm font-semibold text-white hover:brightness-110"
            >
              Force Overwrite
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function formatVal(v: unknown): string {
  if (v == null || v === "") return "—";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}
