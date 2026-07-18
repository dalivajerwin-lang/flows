/** Simple contains + prefix scoring. Returns matches sorted best-first. */
export function fuzzyFind<T>(
  items: T[],
  query: string,
  getText: (item: T) => string,
  limit = 8,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored: Array<{ item: T; score: number }> = [];
  for (const item of items) {
    const t = getText(item).toLowerCase();
    const idx = t.indexOf(q);
    if (idx === -1) continue;
    const score = (idx === 0 ? 1000 : 500) - idx + (t === q ? 100 : 0);
    scored.push({ item, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.item);
}
