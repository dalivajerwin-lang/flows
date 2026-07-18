/**
 * Longest-match, case-insensitive scanner. Returns segments for rendering.
 * Each segment is either plain text or an entity chip anchor with id + type.
 */
export interface EntityRef {
  id: string;
  name: string;
  type: "lead" | "agent";
}

export type Segment =
  | { kind: "text"; text: string }
  | { kind: "chip"; text: string; type: "lead" | "agent"; id: string };

export function scanEntities(text: string, refs: EntityRef[]): Segment[] {
  // Sort refs by name length desc for longest-match-first.
  const sorted = [...refs].sort((a, b) => b.name.length - a.name.length);
  const lower = text.toLowerCase();
  type Match = { start: number; end: number; ref: EntityRef };
  const matches: Match[] = [];
  const used: boolean[] = new Array(text.length).fill(false);
  for (const ref of sorted) {
    if (!ref.name.trim()) continue;
    const needle = ref.name.toLowerCase();
    let from = 0;
    while (from <= lower.length - needle.length) {
      const idx = lower.indexOf(needle, from);
      if (idx === -1) break;
      // Word boundary check
      const before = idx === 0 ? " " : lower[idx - 1];
      const after = idx + needle.length >= lower.length ? " " : lower[idx + needle.length];
      const isBoundary = /[^a-z0-9]/i.test(before) && /[^a-z0-9]/i.test(after);
      const overlap = used.slice(idx, idx + needle.length).some(Boolean);
      if (isBoundary && !overlap) {
        matches.push({ start: idx, end: idx + needle.length, ref });
        for (let i = idx; i < idx + needle.length; i++) used[i] = true;
      }
      from = idx + needle.length;
    }
  }
  matches.sort((a, b) => a.start - b.start);
  const segs: Segment[] = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.start > cursor) segs.push({ kind: "text", text: text.slice(cursor, m.start) });
    segs.push({ kind: "chip", text: text.slice(m.start, m.end), type: m.ref.type, id: m.ref.id });
    cursor = m.end;
  }
  if (cursor < text.length) segs.push({ kind: "text", text: text.slice(cursor) });
  return segs;
}
