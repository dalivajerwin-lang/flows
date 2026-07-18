import { useState } from "react";
import { Inbox, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { PanelCard } from "../PanelCard";
import { db as supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/tenacious-button";
import { Textarea } from "@/components/ui/textarea";
import { StageBadge } from "@/components/ui/status-chip";
import { approveReversion, denyReversion, useActor } from "@/stores/pipeline-store";

function useReversionRequests() {
  return useQuery({
    queryKey: ["stage_reversion_requests", "pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stage_reversion_requests")
        .select("*, leads(full_name), profiles(display_name)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    refetchInterval: 30_000,
  });
}

export function ReversionInboxPanel() {
  const { data: pending = [] } = useReversionRequests();
  const actor = useActor();

  return (
    <PanelCard
      icon={<Inbox size={16} className="text-[var(--color-primary)]" />}
      title="Stage Reversion Request Inbox"
      badge={
        pending.length > 0 ? (
          <span className="rounded-full bg-[var(--color-danger-solid)] px-2 text-xs font-semibold text-white">
            {pending.length}
          </span>
        ) : null
      }
    >
      {pending.length === 0 ? (
        <p className="text-sm text-[var(--color-text-secondary)]">
          No pending reversion requests. All stage transitions are locked and confirmed.
        </p>
      ) : (
        <ul className="space-y-3">
          {pending.map((r: any) => (
            <Row key={r.id} req={r} actor={actor!} />
          ))}
        </ul>
      )}
    </PanelCard>
  );
}

function Row({
  req,
  actor,
}: {
  req: any;
  actor: { id: string; role: "manager" | "superadmin" | "property_consultant" };
}) {
  const [mode, setMode] = useState<null | "approve" | "deny">(null);
  const [text, setText] = useState("");
  const leadName = req.leads?.full_name ?? "—";
  const agentName = req.profiles?.display_name ?? "?";

  return (
    <li className="rounded-md border border-[var(--color-border-muted)] p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{leadName}</span>
            <StageBadge stage={req.from_stage} />
            <span className="text-xs text-[var(--color-text-subtle)]">→</span>
            <StageBadge stage={req.to_stage} />
          </div>
          <div className="mt-1 text-xs text-[var(--color-text-secondary)]">
            {agentName} · {format(new Date(req.created_at), "MMM d HH:mm")}
          </div>
          <div className="mt-1">{req.reason}</div>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="success" onClick={() => setMode("approve")}>
            <CheckCircle2 size={12} /> Approve
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setMode("deny")}>
            <XCircle size={12} /> Deny
          </Button>
        </div>
      </div>
      {mode && (
        <div className="mt-3 space-y-2">
          <Textarea
            rows={2}
            placeholder={
              mode === "approve" ? "Manager correction reason (min 5 chars)" : "Denial reason"
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={async () => {
                try {
                  const r = await (mode === "approve"
                    ? approveReversion(req.id, text, actor)
                    : denyReversion(req.id, text, actor));
                  if (r.ok) {
                    toast.success(mode === "approve" ? "Reversion approved" : "Reversion denied");
                    setMode(null);
                    setText("");
                  } else toast.error(r.error ?? "Failed");
                } catch (err: any) {
                  toast.error(err.message || "Failed to resolve reversion request");
                }
              }}
            >
              Confirm
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setMode(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
