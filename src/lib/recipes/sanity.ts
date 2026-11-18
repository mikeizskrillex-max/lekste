import { searchNorm } from '@/lib/ingredients/normalize';
import { recipeFacts, type IngredientInfo } from './facts';
import type { Recipe } from './schema';

/**
 * Automatic recipe check (SPEC §8.3). A recipe that fails any rule is rejected with reasons; one that passes becomes
 * auto_checked. Limits are per serving unless said otherwise. TODO: проверить диетологом.
 */
export const PER_SERVING_MAX_G: Readonly<Record<string, number>> = {
  salt: 3,
  sugar: 40,
  honey: 40,
  sunflower_oil: 25,
  olive_oil: 25,
  rapeseed_oil: 25,
  butter: 30,
  mayonnaise: 40,
  soy_sauce: 30,
  vinegar: 20,
  apple_vinegar: 20,
  lasiniai: 40,
  bacon: 80,
  cream: 120,
};
const SPICE_MAX_G = 5; // any spice per serving
const ANY_MAX_G = 600; // any single ingredient per serving
export const SERVING_G = { min: 80, max: 900 } as const;
export const KCAL_RANGE: Readonly<Record<Recipe['meal'], readonly [number, number]>> = {
  breakfast: [200, 800],
  lunch: [300, 1000],
  dinner: [300, 1000],
  snack: [60, 450],
};
/** Ingredients that steps often do not name (seasoning added "to taste"). */
const SILENT = new Set(['salt', 'black_pepper']);

export type RejectReason =
  | `unknown_ingredient:${string}`
  | `no_nutrition:${string}`
  | `too_much:${string}`
  | `serving_weight:${number}`
  | `kcal_out_of_range:${number}`
  | `not_in_steps:${string}`
  | `unlisted_in_steps:${string}`
  | `diet_mismatch:${string}`
  | `duplicate:${string}`;

const stem = (word: string) =>
  word.length > 6 ? word.slice(0, word.length - 2) : word.slice(0, Math.max(4, word.length - 1));

/** Stems a step text must contain to "mention" the ingredient: any word of its Lithuanian names. */
export function mentionStems(names: readonly string[]): string[] {
  return [
    ...new Set(
      names.flatMap((n) =>
        searchNorm(n)
          .split(' ')
          .filter((w) => w.length >= 4)
          .map(stem),
      ),
    ),
  ];
}

export interface CheckContext {
  catalogue: ReadonlyMap<string, IngredientInfo>;
  /** Lithuanian names + synonyms per ingredient */
  names: ReadonlyMap<string, readonly string[]>;
  /** recipes already accepted (for duplicates) */
  existing: readonly Pick<Recipe, 'slug' | 'title' | 'ingredients'>[];
  /** the diet the recipe was generated for, if any */
  wantedDiet?: 'vegetarian' | 'vegan' | 'pescatarian' | 'no_pork' | null;
}

function trigrams(s: string): Set<string> {
  const t = `  ${searchNorm(s)} `;
  const out = new Set<string>();
  for (let i = 0; i < t.length - 2; i++) out.add(t.slice(i, i + 3));
  return out;
}
function jaccard<T>(a: Set<T>, b: Set<T>): number {
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter || 1);
}

export function isDuplicate(
  r: Pick<Recipe, 'title' | 'ingredients'>,
  other: Pick<Recipe, 'title' | 'ingredients'>,
): boolean {
  if (searchNorm(r.title.lt) === searchNorm(other.title.lt)) return true;
  const ing = jaccard(new Set(r.ingredients.map((i) => i.slug)), new Set(other.ingredients.map((i) => i.slug)));
  return ing >= 0.8 && jaccard(trigrams(r.title.lt), trigrams(other.title.lt)) >= 0.45;
}

export function checkRecipe(r: Recipe, ctx: CheckContext): RejectReason[] {
  const reasons: RejectReason[] = [];
  const facts = recipeFacts(r, ctx.catalogue);
  for (const s of facts.unknownIngredients) reasons.push(`unknown_ingredient:${s}`);
  for (const s of facts.missingNutrition) reasons.push(`no_nutrition:${s}`);

  for (const { slug, grams } of r.ingredients) {
    const per = grams / r.servings;
    const info = ctx.catalogue.get(slug);
    const max = PER_SERVING_MAX_G[slug] ?? (info?.category === 'spices' ? SPICE_MAX_G : ANY_MAX_G);
    if (per > max) reasons.push(`too_much:${slug}`);
  }
  const g = facts.perServing.grams;
  if (g < SERVING_G.min || g > SERVING_G.max) reasons.push(`serving_weight:${g}`);
  const [lo, hi] = KCAL_RANGE[r.meal];
  if (!facts.missingNutrition.length && (facts.perServing.kcal < lo || facts.perServing.kcal > hi)) {
    reasons.push(`kcal_out_of_range:${facts.perServing.kcal}`);
  }

  const steps = searchNorm(r.steps.map((s) => s.lt).join(' '));
  const words = steps.split(/[^a-z0-9]+/);
  const has = (stems: readonly string[]) => stems.some((st) => words.some((w) => w.startsWith(st)));
  const listed = new Set(r.ingredients.map((i) => i.slug));
  for (const slug of listed) {
    if (SILENT.has(slug)) continue;
    const stems = mentionStems(ctx.names.get(slug) ?? []);
    if (stems.length && !has(stems)) reasons.push(`not_in_steps:${slug}`);
  }
  // an ingredient named in the steps but missing from the list (by its full first name word)
  const listedWords = new Set(
    [...listed].flatMap((s) => (ctx.names.get(s) ?? []).flatMap((n) => searchNorm(n).split(' '))),
  );
  for (const [slug, names] of ctx.names) {
    if (listed.has(slug) || SILENT.has(slug)) continue;
    const head = searchNorm(names[0] ?? '').split(' ')[0] ?? '';
    if (head.length >= 6 && words.includes(head) && !listedWords.has(head)) reasons.push(`unlisted_in_steps:${slug}`);
  }

  if (ctx.wantedDiet && !facts.diets.includes(ctx.wantedDiet)) reasons.push(`diet_mismatch:${ctx.wantedDiet}`);
  const dup = ctx.existing.find((o) => o.slug !== r.slug && isDuplicate(r, o));
  if (dup) reasons.push(`duplicate:${dup.slug}`);
  return reasons;
}
