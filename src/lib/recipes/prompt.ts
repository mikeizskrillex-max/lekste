import { z } from 'zod';
import type { MEALS } from './schema';
import { CUISINES, DIFFICULTY, EQUIPMENT, SEASONS } from './schema';

/** Bump when the prompt changes; stored in recipes.source as "ai:<version>". */
export const PROMPT_VERSION = 'recipes-v1';

/**
 * What the model returns. It proposes text, ingredients (catalogue slugs only) and grams; nutrition, allergens,
 * diets and prices are never taken from it — the code computes them (SPEC §9).
 */
export const aiRecipe = z.object({
  title_lt: z.string(),
  title_ru: z.string(),
  description_lt: z.string(),
  description_ru: z.string(),
  steps: z.array(z.object({ lt: z.string(), ru: z.string() })),
  servings: z.number().int(),
  time_active_min: z.number().int(),
  time_total_min: z.number().int(),
  difficulty: z.enum(DIFFICULTY),
  equipment: z.array(z.enum(EQUIPMENT)),
  cuisine: z.enum(CUISINES),
  season: z.array(z.enum(SEASONS)),
  kid_friendly: z.boolean(),
  ingredients: z.array(z.object({ slug: z.string(), grams: z.number() })),
});
export const aiBatch = z.object({ recipes: z.array(aiRecipe) });
export type AiRecipe = z.infer<typeof aiRecipe>;

export type WantedDiet = 'vegetarian' | 'vegan' | 'pescatarian' | 'no_pork' | null;

export const SYSTEM_PROMPT = `You write original home-cooking recipes for Lėkštė, a meal planner for families in Lithuania.
Rules:
- Use ONLY ingredients from the list you are given, by their slug. Never invent an ingredient. Water is free and not listed.
- Grams are for the whole recipe (all servings), realistic for a home kitchen. Salt at most 3 g per serving, oil at most 25 g per serving.
- Every listed ingredient (except salt and black pepper) must be named in the Lithuanian steps; do not name anything that is not listed.
- Ordinary Lithuanian and East European home food first (košės, sriubos, troškiniai, balandėliai, cepelinai, šaltibarščiai, kugelis, blynai, varškėčiai), then simple international dishes. No restaurant techniques, no exotic products.
- Lithuanian text is the original: natural, simple, friendly, imperative steps ("Supjaustykite…"). Russian is a faithful translation.
- No health or medical claims, no words like "draudžiama", "dietinis stebuklas", no before/after promises.
- Do not state calories, nutrients, allergens or prices — they are computed by the app.
- Each recipe must be clearly different from the others in the batch and from the titles listed as already existing.`;

export function userPrompt(opts: {
  count: number;
  meal: (typeof MEALS)[number];
  diet: WantedDiet;
  ingredients: readonly { slug: string; name: string; unit: string }[];
  existingTitles: readonly string[];
  maxMinutes?: number;
  budget?: boolean;
}): string {
  const diet = {
    vegetarian: 'vegetarian (no meat, no fish, no seafood)',
    vegan: 'vegan (no animal products at all, no honey, no butter, no eggs, no dairy)',
    pescatarian: 'pescatarian (fish allowed, no meat)',
    no_pork: 'without pork',
  };
  return [
    `Write ${opts.count} ${opts.meal} recipes.`,
    opts.diet ? `Diet: ${diet[opts.diet]}.` : 'Diet: any.',
    opts.maxMinutes ? `Total time at most ${opts.maxMinutes} minutes.` : '',
    opts.budget ? 'Keep them cheap: everyday staples, few ingredients.' : '',
    'Servings: 2–4 (breakfast and snack: 1–2).',
    '',
    'Allowed ingredients (slug — Lithuanian name — unit):',
    ...opts.ingredients.map((i) => `${i.slug} — ${i.name} — ${i.unit}`),
    '',
    opts.existingTitles.length ? `Already existing (do not repeat): ${opts.existingTitles.join('; ')}` : '',
  ]
    .filter((l) => l !== '')
    .join('\n');
}
