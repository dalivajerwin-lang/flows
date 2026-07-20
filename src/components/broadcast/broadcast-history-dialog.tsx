import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBroadcasts, useAllAcknowledgments } from "@/hooks/use-broadcasts";
import { useProfiles } from "@/hooks/use-profiles";

/**
 * Manager-only. Lists sent broadcasts with a per-consultant read receipt
 * checklist. Read-only — no editing or deleting per spec §7.
 */
export function BroadcastHistoryDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: broadcasts = [] } = useBroadcasts();
  const { data: acks = [] } = useAllAcknowledgments();
  const { data: profiles = [] } = useProfiles();

  const consultants = useMemo(
    () => profiles.filter((p) => p.role === "property_consultant"),
    [profiles],
  );
  const sorted = useMemo(
    () => [...broadcasts].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [broadcasts],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Broadcast History</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-2">
          {sorted.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No broadcasts sent yet.
            </p>
          )}
          <div className="space-y-6">
            {sorted.map((b) => {
              // Only consultants who existed when the broadcast went out are
              // expected to acknowledge (migration 018 hides it from later
              // hires) — don't count new accounts as unread forever.
              const audience = consultants.filter((c) => c.created_at <= b.created_at);
              const acked = audience.map((c) => {
                const ack = acks.find((a) => a.broadcast_id === b.id && a.user_id === c.id);
                return { c, ack };
              });
              const ackedCount = acked.filter((r) => r.ack).length;
              return (
                <div key={b.id} className="rounded-lg border p-4">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(b.created_at).toLocaleString()}
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm">{b.message}</p>
                    </div>
                    <Badge variant={ackedCount === audience.length ? "default" : "secondary"}>
                      {ackedCount}/{audience.length}
                    </Badge>
                  </div>
                  <div className="mt-3 overflow-hidden rounded-md border text-xs">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-3 py-1.5 text-left">Consultant</th>
                          <th className="px-3 py-1.5 text-left">Acknowledged</th>
                          <th className="px-3 py-1.5 text-left">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {acked.map(({ c, ack }) => (
                          <tr key={c.id} className="border-t">
                            <td className="px-3 py-1.5">{c.display_name}</td>
                            <td className="px-3 py-1.5">{ack ? "Yes" : "No"}</td>
                            <td className="px-3 py-1.5 text-muted-foreground">
                              {ack ? new Date(ack.acknowledged_at).toLocaleString() : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
