import { z } from 'zod';
import { ALLERGENS } from '@/lib/allergens';
import { ORIGINS } from './diet';

/** Ingredient categories. Same list as the CHECK constraint in 0002_ingredients.sql. */
export const CATEGORIES = [
  'vegetables',
  'herbs',
  'fruit',
  'dried_fruit',
  'frozen',
  'canned',
  'grains',
  'legumes',
  'bakery',
  'meat',
  'fish',
  'dairy',
  'eggs',
  'oils',
  'nuts_seeds',
  'seasoning',
  'spices',
  'condiments',
  'baking',
] as const;
export type Category = (typeof CATEGORIES)[number];

export const UNITS = ['g', 'ml', 'pcs'] as const;

/** "a;b; c" → ["a", "b", "c"] */
const splitList = z.string().transform((s) =>
  s
    .split(';')
    .map((x) => x.trim())
    .filter(Boolean),
);
const termList = splitList.pipe(z.array(z.string().min(2).max(80)));

const optionalNumber = z
  .string()
  .transform((s) => (s.trim() === '' ? null : Number(s.replace(',', '.'))))
  .pipe(z.number().positive().nullable());

/** One row of data/seed/ingredients_lt.csv. */
export const ingredientCsvRow = z
  .object({
    slug: z.string().regex(/^[a-z][a-z0-9_]{1,40}$/),
    name_lt: z.string().trim().min(2).max(80),
    name_ru: z.string().trim().min(2).max(80),
    category: z.enum(CATEGORIES),
    origin: z.enum(ORIGINS),
    unit: z.enum(UNITS),
    piece_g: optionalNumber,
    density_g_ml: optionalNumber.refine((d) => d === null || d < 3, 'density must be under 3 g/ml'),
    allergens: splitList.pipe(z.array(z.enum(ALLERGENS))),
    composition_varies: z.enum(['yes', 'no']).transform((v) => v === 'yes'),
    usda_fdc_id: z.string().regex(/^\d{4,7}$/),
    usda_description: z.string().min(3),
    synonyms_lt: termList,
    synonyms_ru: termList,
  })
  .superRefine((row, ctx) => {
    if (row.unit === 'pcs' && row.piece_g === null) {
      ctx.addIssue({ code: 'custom', message: 'unit "pcs" needs piece_g' });
    }
    if (row.unit === 'ml' && row.density_g_ml === null) {
      ctx.addIssue({ code: 'custom', message: 'unit "ml" needs density_g_ml' });
    }
    if (row.allergens.includes('lactose') && !row.allergens.includes('milk')) {
      ctx.addIssue({ code: 'custom', message: 'lactose without milk' });
    }
  });
export type IngredientCsvRow = z.output<typeof ingredientCsvRow>;

/** Nutrition per 100 g from one source. */
export const nutrition100g = z.object({
  kcal: z.number().min(0).max(900),
  protein: z.number().min(0).max(100),
  fat: z.number().min(0).max(100),
  carbs: z.number().min(0).max(100),
  fiber: z.number().min(0).max(100).nullable(),
});
export type Nutrition100g = z.infer<typeof nutrition100g>;

/** data/seed/usda_sr_legacy.json — the subset of USDA SR Legacy used by the catalogue. */
export const usdaSubset = z.object({
  source: z.string(),
  licence: z.string(),
  foods: z.record(z.string().regex(/^\d+$/), nutrition100g.extend({ description: z.string() })),
});
export type UsdaSubset = z.infer<typeof usdaSubset>;

/**
 * Energy check: kcal should match 4·protein + 9·fat + 4·(carbs − fiber) + 2·fiber within max(15 kcal, 15 %).
 * Catches swapped columns and typos in labels. Returns the estimate and whether it fits.
 */
export function energyCheck(n: Nutrition100g): { estimate: number; ok: boolean } {
  const fiber = n.fiber ?? 0;
  const estimate = 4 * n.protein + 9 * n.fat + 4 * Math.max(n.carbs - fiber, 0) + 2 * fiber;
  return { estimate, ok: Math.abs(estimate - n.kcal) <= Math.max(15, 0.15 * n.kcal) };
}

/**
 * USDA rows whose energy legitimately differs from the 4/9/4 estimate. Each has a reason; anything else
 * that fails the check is an error.
 */
export const ENERGY_CHECK_EXEMPT: Record<string, string> = {
  vinegar: 'USDA counts energy from acetic acid, which has no macro column',
  apple_vinegar: 'USDA counts energy from acetic acid, which has no macro column',
  cocoa: 'USDA uses cocoa-specific Atwater factors (low protein and fat availability)',
  baking_powder: 'carbohydrate by difference is mostly mineral salts, which give no energy',
};

/** Protein + fat + carbs cannot exceed 100 g per 100 g (small rounding allowed). */
export function macrosFit(n: Nutrition100g): boolean {
  return n.protein + n.fat + n.carbs <= 101;
}
