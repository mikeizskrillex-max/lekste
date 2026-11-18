import { z } from 'zod';

/**
 * data/availability.json — a dated snapshot of which ingredients are in both stores, written after each weekly
 * check. CI checks recipes against it (owner decision 2026-11-18); the live database decides what menus use.
 */
export const STORE_REASONS = ['ok', 'anomaly', 'out_of_stock', 'stale_price', 'only_doubtful', 'no_product'] as const;

export const availabilitySnapshot = z.object({
  checkedAt: z.iso.datetime().nullable(),
  bothStores: z.array(z.string().regex(/^[a-z][a-z0-9_]{1,40}$/)),
  missing: z.record(z.string(), z.object({ barbora: z.enum(STORE_REASONS), rimi: z.enum(STORE_REASONS) })),
});
export type AvailabilitySnapshot = z.infer<typeof availabilitySnapshot>;

export interface RecipeRef {
  slug: string;
  ingredients: readonly string[];
}

/** Recipes that use an ingredient not available in both stores (by the snapshot). */
export function unavailableRecipes(
  recipes: readonly RecipeRef[],
  snap: AvailabilitySnapshot,
): { recipe: string; ingredient: string }[] {
  const ok = new Set(snap.bothStores);
  return recipes.flatMap((r) =>
    r.ingredients.filter((i) => !ok.has(i)).map((ingredient) => ({ recipe: r.slug, ingredient })),
  );
}
