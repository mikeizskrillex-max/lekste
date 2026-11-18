import { readFileSync } from 'node:fs';
import { parseCatalogue } from '@/lib/ingredients/catalogue';
import { usdaSubset } from '@/lib/ingredients/schema';
import type { IngredientInfo } from './facts';

/**
 * The ingredient catalogue from the seed files (CSV + USDA), for scripts and CI. The live database may have label
 * averages instead of USDA values (ingredient_facts); this is the reproducible baseline.
 */
export function seedCatalogue(root = '.'): {
  info: Map<string, IngredientInfo>;
  names: Map<string, string[]>;
  units: Map<string, string>;
} {
  const { rows } = parseCatalogue(readFileSync(`${root}/data/seed/ingredients_lt.csv`, 'utf8'));
  const usda = usdaSubset.parse(JSON.parse(readFileSync(`${root}/data/seed/usda_sr_legacy.json`, 'utf8')));
  const info = new Map<string, IngredientInfo>();
  const names = new Map<string, string[]>();
  const units = new Map<string, string>();
  for (const r of rows) {
    const f = r.usda_fdc_id ? usda.foods[r.usda_fdc_id] : undefined;
    info.set(r.slug, {
      slug: r.slug,
      nameLt: r.name_lt,
      origin: r.origin,
      allergens: r.allergens,
      compositionVaries: r.composition_varies,
      tags: r.tags,
      category: r.category,
      kcal: f?.kcal ?? null,
      protein: f?.protein ?? null,
      fat: f?.fat ?? null,
      carbs: f?.carbs ?? null,
    });
    names.set(r.slug, [r.name_lt, ...r.synonyms_lt]);
    units.set(r.slug, r.unit === 'pcs' && r.piece_g ? `g (1 vnt. ≈ ${r.piece_g} g)` : 'g');
  }
  return { info, names, units };
}
