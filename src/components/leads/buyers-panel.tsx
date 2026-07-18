import { useState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useLead } from "@/stores/leads-store";
import type { LeadBuyer } from "@/hooks/use-leads";
import { addBuyer, removeBuyer, toggleBuyerDoc, useActor } from "@/stores/pipeline-store";
import { Button } from "@/components/ui/tenacious-button";
import { TenaciousInput } from "@/components/ui/form-controls";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DOC_LABELS: Record<string, string> = {
  valid_id: "Valid ID",
  valid_id_selfie: "Valid ID w/ Selfie",
  tin: "Proof of TIN",
  account: "Proof of Account",
};

export function BuyersPanel({ leadId }: { leadId: string }) {
  const actor = useActor();
  const lead = useLead(leadId);
  const buyers: LeadBuyer[] = (lead?.lead_buyers ?? []) as LeadBuyer[];
  const [name, setName] = useState("");
  const [kind, setKind] = useState<LeadBuyer["kind"]>("co_buyer");

  if (!actor) return null;

  const totalDocs = buyers.length * 4;
  const checkedDocs = buyers.reduce(
    (sum, b) => sum + Object.values((b.docs as any) || {}).filter(Boolean).length,
    0,
  );

  return (
    <section>
      <h4 className="mb-2 flex items-center justify-between text-sm font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
        <span>Buyers &amp; Documents</span>
        <span className="text-xs">
          👥 {buyers.length} Buyers | {checkedDocs}/{totalDocs} Docs Checked
        </span>
      </h4>
      <ul className="flex flex-col gap-2">
        {buyers.map((b) => (
          <li
            key={b.id}
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{b.name}</div>
                <div className="text-xs text-[var(--color-text-secondary)]">
                  {b.kind === "primary"
                    ? "Primary Buyer"
                    : b.kind === "co_buyer"
                      ? "Co-Buyer"
                      : "Co-Owner"}
                </div>
              </div>
              {b.kind !== "primary" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBuyer(b.id, actor.id)}
                  aria-label="Remove buyer"
                >
                  <Trash2 size={14} />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(Object.keys(DOC_LABELS) as string[]).map((doc) => (
                <label key={doc} className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={!!(b.docs as any)?.[doc]}
                    onChange={(e) => toggleBuyerDoc(b.id, doc, e.target.checked, actor.id)}
                  />
                  {DOC_LABELS[doc as keyof typeof DOC_LABELS]}
                </label>
              ))}
            </div>
          </li>
        ))}
        {buyers.length === 0 && (
          <li className="text-xs text-[var(--color-text-secondary)]">No buyers yet.</li>
        )}
      </ul>
      <div className="mt-3 flex items-end gap-2">
        <div className="flex-1">
          <TenaciousInput
            placeholder="Buyer name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <Select value={kind} onValueChange={(v) => setKind(v as LeadBuyer["kind"])}>
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="co_buyer">Co-Buyer</SelectItem>
            <SelectItem value="co_owner">Co-Owner</SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          onClick={() => {
            if (!name.trim()) {
              toast.error("Buyer name required");
              return;
            }
            addBuyer(leadId, name, kind, actor.id);
            setName("");
          }}
        >
          <UserPlus size={14} /> Add
        </Button>
      </div>
    </section>
  );
}
