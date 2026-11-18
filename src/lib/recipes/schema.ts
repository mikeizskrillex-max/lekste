import { z } from 'zod';

/** Recipe as stored in data/recipes/*.json and in public.recipes. Nutrition, allergens, diets and price are
 * never stored here — they are computed from the ingredients (SPEC §8.2). */
export const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export const CUISINES = ['lithuanian', 'east_european', 'international'] as const;
export const SEASONS = ['all', 'winter', 'spring', 'summer', 'autumn'] as const;
export const EQUIPMENT = ['stove', 'oven', 'multicooker', 'blender', 'microwave', 'none'] as const;
export const DIFFICULTY = ['easy', 'medium', 'hard'] as const;
export const STATUSES = ['draft', 'auto_checked', 'reviewed', 'rejected'] as const;

const i18n = (max: number) =>
  z.object({ lt: z.string().trim().min(2).max(max), ru: z.string().trim().min(2).max(max) });
const slug = z.string().regex(/^[a-z0-9][a-z0-9-]{2,80}$/);

export const recipeIngredient = z.object({
  slug: z.string().regex(/^[a-z][a-z0-9_]{1,40}$/),
  /** grams for the whole recipe (all servings) */
  grams: z.number().positive().max(5000),
});

export const recipe = z
  .object({
    slug,
    title: i18n(120),
    description: i18n(400),
    steps: z.array(i18n(600)).min(2).max(12),
    servings: z.number().int().min(1).max(8),
    timeActiveMin: z.number().int().min(1).max(180),
    timeTotalMin: z.number().int().min(1).max(480),
    difficulty: z.enum(DIFFICULTY),
    equipment: z.array(z.enum(EQUIPMENT)).min(1),
    meal: z.enum(MEALS),
    cuisine: z.enum(CUISINES),
    season: z.array(z.enum(SEASONS)).min(1),
    kidFriendly: z.boolean(),
    ingredients: z.array(recipeIngredient).min(2).max(20),
    photo: z.string().nullable(),
    /** "ai:<prompt version>" or a licence note — never copied from other recipe sites */
    source: z.string().min(3).max(200),
    status: z.enum(STATUSES),
    /** sample for the manual check: every 10th auto-checked recipe + every flagged one */
    reviewSample: z.boolean(),
    rejectReasons: z.array(z.string()),
    createdAt: z.iso.datetime(),
  })
  .refine((r) => r.timeActiveMin <= r.timeTotalMin, 'active time longer than total time')
  .refine((r) => new Set(r.ingredients.map((i) => i.slug)).size === r.ingredients.length, 'ingredient listed twice');
export type Recipe = z.infer<typeof recipe>;

export const recipeFile = z.array(recipe);
