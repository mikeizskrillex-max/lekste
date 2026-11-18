import { parseCsv } from '@/lib/csv';
import { ingredientCsvRow, type IngredientCsvRow } from './schema';

export interface CatalogueProblem {
  line: number;
  slug: string;
  message: string;
}

/** Parse and validate the ingredient CSV. Every problem is reported with its line number; nothing is guessed. */
export function parseCatalogue(text: string): { rows: IngredientCsvRow[]; problems: CatalogueProblem[] } {
  const rows: IngredientCsvRow[] = [];
  const problems: CatalogueProblem[] = [];
  const seen = new Set<string>();
  const termOwner = new Map<string, string>();

  parseCsv(text).forEach((raw, i) => {
    const line = i + 2;
    const slug = raw.slug ?? '?';
    const parsed = ingredientCsvRow.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        problems.push({ line, slug, message: `${issue.path.join('.') || 'row'}: ${issue.message}` });
      }
      return;
    }
    const row = parsed.data;
    if (seen.has(row.slug)) problems.push({ line, slug, message: 'duplicate slug' });
    seen.add(row.slug);
    // The Lithuanian name must point to one ingredient only, or search becomes ambiguous.
    const key = row.name_lt.toLowerCase();
    const owner = termOwner.get(key);
    if (owner && owner !== row.slug) problems.push({ line, slug, message: `name_lt also used by ${owner}` });
    termOwner.set(key, row.slug);
    rows.push(row);
  });
  return { rows, problems };
}
