import { useState } from "react";
import { Link as LinkIcon, Plus, Pencil, Trash2, ExternalLink, ClipboardCopy } from "lucide-react";
import { PanelCard } from "../PanelCard";
import { useAssistantStore } from "@/stores/assistant-store";
import { Button } from "@/components/ui/tenacious-button";
import { toast } from "sonner";

const CATEGORIES = ["Marketing", "News", "Promos", "Updates", "Forms", "Tools", "Other"];

export function LinksLibraryAdminPanel() {
  const links = useAssistantStore((s) => s.links);
  const addLink = useAssistantStore((s) => s.addLink);
  const updateLink = useAssistantStore((s) => s.updateLink);
  const deleteLink = useAssistantStore((s) => s.deleteLink);
  const [form, setForm] = useState({ label: "", url: "", category: "Marketing" });
  const [editingId, setEditingId] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.label || !/^https?:\/\//.test(form.url)) {
      toast.error("Provide a label and a valid URL (http/https).");
      return;
    }
    if (editingId) {
      updateLink(editingId, form);
      setEditingId(null);
    } else {
      addLink(form);
    }
    setForm({ label: "", url: "", category: "Marketing" });
    toast.success("Saved");
  };

  return (
    <PanelCard
      icon={<LinkIcon size={16} className="text-[var(--color-primary)]" />}
      title="Links Library (Admin)"
    >
      <form onSubmit={submit} className="mb-4 grid gap-2 sm:grid-cols-[1fr_1fr_140px_auto]">
        <input
          className="rounded-md border border-[var(--color-border-muted)] px-3 py-2 text-sm"
          placeholder="Label (≤200 chars)"
          maxLength={200}
          value={form.label}
          onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
        />
        <input
          className="rounded-md border border-[var(--color-border-muted)] px-3 py-2 text-sm"
          placeholder="https://…"
          value={form.url}
          onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
        />
        <select
          className="rounded-md border border-[var(--color-border-muted)] px-3 py-2 text-sm"
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm">
          <Plus size={12} /> {editingId ? "Update" : "Add"}
        </Button>
      </form>

      <ul className="space-y-1">
        {links.map((l) => (
          <li
            key={l.id}
            className="flex items-center gap-2 rounded-md border border-[var(--color-border-subtle)] px-2 py-2 text-sm"
          >
            <span className="flex-1 truncate">{l.label}</span>
            <span className="rounded bg-[var(--color-surface-muted)] px-1.5 py-0.5 text-[10px] uppercase text-[var(--color-text-soft)]">
              {l.category}
            </span>
            <a
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
            >
              <ExternalLink size={14} />
            </a>
            <button
              onClick={() =>
                navigator.clipboard.writeText(l.url).then(() => toast.success("Copied"))
              }
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
            >
              <ClipboardCopy size={14} />
            </button>
            <button
              onClick={() => {
                setEditingId(l.id);
                setForm({ label: l.label, url: l.url, category: l.category });
              }}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => {
                if (confirm(`Delete "${l.label}"?`)) deleteLink(l.id);
              }}
              className="text-[var(--color-text-subtle)] hover:text-[var(--color-danger-solid)]"
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
    </PanelCard>
  );
}
