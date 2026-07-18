import { useMemo, useState } from "react";
import { Link as LinkIcon, ExternalLink, ClipboardCopy, Search } from "lucide-react";
import { PanelCard } from "../PanelCard";
import { useAssistantStore, type LinkItem } from "@/stores/assistant-store";
import { toast } from "sonner";

const CATEGORY_ORDER = ["Marketing", "News", "Promos", "Updates", "Forms", "Tools", "Other"];

export function LinksLibraryPanel() {
  const links = useAssistantStore((s) => s.links);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return links.filter(
      (l) => !query || l.label.toLowerCase().includes(query) || l.url.toLowerCase().includes(query),
    );
  }, [links, q]);

  const grouped = useMemo(() => {
    const map: Record<string, LinkItem[]> = {};
    for (const l of filtered) {
      const cat = CATEGORY_ORDER.includes(l.category) ? l.category : "Other";
      (map[cat] ??= []).push(l);
    }
    for (const cat of Object.keys(map)) map[cat].sort((a, b) => a.label.localeCompare(b.label));
    return map;
  }, [filtered]);

  const copy = (url: string) => {
    navigator.clipboard.writeText(url).then(() => toast.success("Copied to clipboard"));
  };

  return (
    <PanelCard
      icon={<LinkIcon size={16} className="text-[var(--color-primary)]" />}
      title="Links Library"
    >
      <div className="mb-3 flex items-center gap-2 rounded-md border border-[var(--color-border-muted)] px-2">
        <Search size={14} className="text-[var(--color-text-subtle)]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search links…"
          className="w-full bg-transparent py-2 text-sm outline-none"
        />
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-[var(--color-text-secondary)]">
          No resources yet. Check back soon!
        </p>
      ) : (
        <div className="space-y-3">
          {CATEGORY_ORDER.filter((c) => grouped[c]?.length).map((cat) => (
            <div key={cat}>
              <div className="mb-1 text-xs font-semibold uppercase text-[var(--color-text-secondary)]">
                {cat}
              </div>
              <ul className="space-y-1">
                {grouped[cat].map((l) => (
                  <li
                    key={l.id}
                    className="flex items-center gap-2 rounded-md border border-[var(--color-border-subtle)] px-2 py-2 text-sm"
                  >
                    <span className="flex-1 truncate">{l.label}</span>
                    <span className="rounded bg-[var(--color-surface-muted)] px-1.5 py-0.5 text-[10px] uppercase text-[var(--color-text-soft)]">
                      {cat}
                    </span>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-[var(--color-border-muted)] px-2 text-xs hover:bg-[var(--color-surface-subtle)]"
                    >
                      <ExternalLink size={12} /> Open
                    </a>
                    <button
                      onClick={() => copy(l.url)}
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-[var(--color-border-muted)] px-2 text-xs hover:bg-[var(--color-surface-subtle)]"
                    >
                      <ClipboardCopy size={12} /> Copy
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </PanelCard>
  );
}
