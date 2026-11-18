import { searchNorm } from './normalize';

/** A light ingredient entry for client-side pickers (one language, normalised search terms). */
export interface PickerItem {
  slug: string;
  name: string;
  terms: string[];
}

/**
 * Client-side search over the catalogue (~160 items): prefix and substring matches on names and synonyms,
 * without diacritics. Typo tolerance lives in the database search (pg_trgm); this is for instant chips.
 */
export function pickerSearch(items: readonly PickerItem[], query: string, limit = 8): PickerItem[] {
  const q = searchNorm(query);
  if (q.length < 2) return [];
  const scored: { item: PickerItem; score: number }[] = [];
  for (const item of items) {
    let best = 0;
    for (const t of item.terms) {
      if (t.startsWith(q)) best = Math.max(best, 3);
      else if (t.split(' ').some((w) => w.startsWith(q))) best = Math.max(best, 2);
      else if (t.includes(q)) best = Math.max(best, 1);
    }
    if (best) scored.push({ item, score: best });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
    .slice(0, limit)
    .map((s) => s.item);
}
