import 'server-only';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseCatalogue } from './catalogue';
import { searchNorm } from './normalize';
import type { PickerItem } from './picker';

/** Catalogue for pickers, read from the seed CSV at build time (static pages, no database needed). */
export function pickerItems(locale: 'lt' | 'ru'): PickerItem[] {
  const { rows } = parseCatalogue(readFileSync(join(process.cwd(), 'data/seed/ingredients_lt.csv'), 'utf8'));
  return rows
    .map((r) => ({
      slug: r.slug,
      name: locale === 'ru' ? r.name_ru : r.name_lt,
      // both languages are searchable: people type the word they know
      terms: [...new Set([r.name_lt, r.name_ru, ...r.synonyms_lt, ...r.synonyms_ru].map(searchNorm))],
    }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}
