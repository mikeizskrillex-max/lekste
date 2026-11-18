import { searchNorm } from '@/lib/ingredients/normalize';
import type { AiRecipe } from './prompt';
import { recipe, type Recipe } from './schema';

/** URL slug from the Lithuanian title, unique against `taken`: "Grikių košė su grybais" → "grikiu-kose-su-grybais". */
export function recipeSlug(titleLt: string, taken: ReadonlySet<string>): string {
  const base =
    searchNorm(titleLt)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 70) || 'receptas';
  let s = base;
  for (let n = 2; taken.has(s); n++) s = `${base}-${n}`;
  return s;
}

/** Model output → stored recipe (validated). Grams are rounded; nothing numeric about nutrition is taken. */
export function fromAi(
  a: AiRecipe,
  meal: Recipe['meal'],
  source: string,
  taken: ReadonlySet<string>,
  now: Date,
): { ok: true; recipe: Recipe } | { ok: false; error: string } {
  const parsed = recipe.safeParse({
    slug: recipeSlug(a.title_lt, taken),
    title: { lt: a.title_lt, ru: a.title_ru },
    description: { lt: a.description_lt, ru: a.description_ru },
    steps: a.steps,
    servings: a.servings,
    timeActiveMin: a.time_active_min,
    timeTotalMin: a.time_total_min,
    difficulty: a.difficulty,
    equipment: [...new Set(a.equipment)],
    meal,
    cuisine: a.cuisine,
    season: [...new Set(a.season)],
    kidFriendly: a.kid_friendly,
    ingredients: a.ingredients.map((i) => ({ slug: i.slug.trim(), grams: Math.round(i.grams) })),
    photo: null,
    source,
    status: 'draft',
    reviewSample: false,
    rejectReasons: [],
    createdAt: now.toISOString(),
  });
  return parsed.success
    ? { ok: true, recipe: parsed.data }
    : { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') };
}
