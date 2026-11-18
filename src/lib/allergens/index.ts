/**
 * Allergen rules (SPEC §9). This is a hard filter in code: AI, dish swaps, "Kita savaitė" and the demo
 * all go through `isAllowed` / `recipeIsAllowed`, and nothing can override it.
 *
 * Strict mode (owner decision 2026-11-18): when an ingredient's composition depends on the product
 * (bread, sausages, sauces, cereals with possible traces…), it counts as "unknown" for anyone who has
 * any allergy, and unknown is never allowed. A product with a verified label can lift that later (phase 4).
 */

/** The 14 EU allergens (Regulation 1169/2011, Annex II) plus lactose. */
export const ALLERGENS = [
  'gluten',
  'crustaceans',
  'eggs',
  'fish',
  'peanuts',
  'soy',
  'milk',
  'nuts',
  'celery',
  'mustard',
  'sesame',
  'sulphites',
  'lupin',
  'molluscs',
  'lactose',
] as const;

export type Allergen = (typeof ALLERGENS)[number];

export function isAllergen(value: string): value is Allergen {
  return (ALLERGENS as readonly string[]).includes(value);
}

export interface AllergenFacts {
  /** Allergens the ingredient contains by nature or typically. */
  allergens: readonly Allergen[];
  /** True when the exact composition depends on the product bought (additives, traces). */
  compositionVaries: boolean;
}

export type AllergenVerdict = 'ok' | 'contains' | 'unknown';

/** What one ingredient means for a person with these allergies. */
export function allergenVerdict(item: AllergenFacts, avoid: readonly Allergen[]): AllergenVerdict {
  if (avoid.length === 0) return 'ok';
  if (item.allergens.some((a) => avoid.includes(a))) return 'contains';
  // Unknown composition → "no" for anyone with an allergy (SPEC §9: «неизвестный состав → нельзя»).
  if (item.compositionVaries) return 'unknown';
  return 'ok';
}

export function isAllowed(item: AllergenFacts, avoid: readonly Allergen[]): boolean {
  return allergenVerdict(item, avoid) === 'ok';
}

/** Allergens of a recipe = union of its ingredients' allergens. */
export function recipeAllergens(items: readonly AllergenFacts[]): Allergen[] {
  const set = new Set<Allergen>();
  for (const item of items) for (const a of item.allergens) set.add(a);
  return ALLERGENS.filter((a) => set.has(a));
}

/** A recipe is allowed only if every ingredient is allowed. An empty ingredient list is not a recipe. */
export function recipeIsAllowed(items: readonly AllergenFacts[], avoid: readonly Allergen[]): boolean {
  if (items.length === 0) return false;
  return items.every((item) => isAllowed(item, avoid));
}
