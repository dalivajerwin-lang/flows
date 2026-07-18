import { useMemo } from "react";
import { useAuth } from "@/stores/auth-store";
import {
  useBroadcasts,
  useMyAcknowledgments,
  useAcknowledgeBroadcast,
} from "@/hooks/use-broadcasts";
import { useProfiles } from "@/hooks/use-profiles";
import { Button } from "@/components/ui/button";

/**
 * Full-screen mandatory acknowledgment overlay for broadcasts. Shows the
 * oldest unacknowledged broadcast for the current user. Blocks all
 * navigation/interaction beneath it. Multiple broadcasts are handled
 * sequentially — after ack, the next one is rendered.
 */
export function BroadcastOverlay() {
  const userId = useAuth((s) => s.userId);
  const { data: broadcasts = [] } = useBroadcasts();
  const { data: myAcks = [] } = useMyAcknowledgments(userId);
  const acknowledgeMutation = useAcknowledgeBroadcast();
  const { data: profiles = [] } = useProfiles();

  const pending = useMemo(() => {
    if (!userId) return null;
    const me = profiles.find((p) => p.id === userId);
    // Consultants must acknowledge; managers do not block on their own sends.
    if (!me || me.role !== "property_consultant") return null;
    const sorted = [...broadcasts].sort((a, b) => a.created_at.localeCompare(b.created_at));
    return sorted.find((b) => !myAcks.includes(b.id)) ?? null;
  }, [broadcasts, myAcks, userId, profiles]);

  if (!pending) return null;

  const sender = profiles.find((p) => p.id === pending.sender_id);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="Broadcast acknowledgment required"
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-[var(--color-warning-solid)] p-6 text-white"
    >
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <span className="text-4xl">📢</span>
          <div>
            <div className="text-sm uppercase tracking-wider opacity-80">Broadcast Message</div>
            <div className="text-xs opacity-70">
              From {sender?.display_name ?? "Manager"} •{" "}
              {new Date(pending.created_at).toLocaleString()}
            </div>
          </div>
        </div>

        <p className="whitespace-pre-wrap text-xl leading-relaxed">{pending.message}</p>

        {pending.image_url && (
          <img
            src={pending.image_url}
            alt="Broadcast attachment"
            className="max-h-[40vh] w-full rounded-lg border border-white/30 object-contain"
          />
        )}

        {pending.link_url && (
          <a
            href={pending.link_url}
            target="_blank"
            rel="noreferrer"
            className="inline-block break-all underline underline-offset-4 hover:opacity-80"
          >
            {pending.link_url}
          </a>
        )}

        {pending.file_url && (
          <a
            href={pending.file_url}
            download={pending.file_name || "download"}
            className="inline-flex items-center gap-2 rounded-md border border-white/40 px-3 py-2 text-sm hover:bg-white/10"
          >
            📎 {pending.file_name || "Attachment"} (
            {Math.round(Number(pending.file_size || 0) / 1024)} KB)
          </a>
        )}

        <div className="pt-4">
          <Button
            size="lg"
            className="w-full bg-white text-[var(--color-warning-soft-fg)] hover:bg-white/90"
            onClick={() => acknowledgeMutation.mutate({ broadcastId: pending.id, userId: userId! })}
          >
            👍 I Acknowledge
          </Button>
        </div>
      </div>
    </div>
  );
}
