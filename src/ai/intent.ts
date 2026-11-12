import * as z from 'zod/v4';

/**
 * The only thing an AI provider is allowed to produce: a structured intent.
 * Prices, nutrition and allergen checks are always computed by our own code
 * from the database, so a model can never invent a price or a calorie value.
 */
export const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export const MODES = ['any', 'cheaper', 'protein', 'vegetarian'] as const;
export const DIETS = ['any', 'vegetarian', 'vegan', 'pescatarian', 'no_pork', 'no_beef', 'low_carb'] as const;
export const EXCL = ['fish', 'pork', 'mushrooms', 'dairy', 'gluten'] as const;
export const STORES = ['maxima', 'barbora', 'rimi', 'lidl', 'iki'] as const;
export const ACTIONS = [
  'replace_meal', 'regenerate_day', 'set_targets', 'set_budget', 'set_household', 'set_diet', 'exclude', 'set_stores', 'set_meals_per_day', 'set_cooking_time',
] as const;

export const ActionSchema = z.object({
  type: z.enum(ACTIONS),
  /** 0 = Monday … 6 = Sunday; null = whole week / not applicable */
  day: z.number().int().min(0).max(6).nullable(),
  meal: z.enum(MEALS).nullable(),
  mode: z.enum(MODES).nullable(),
  kcal: z.number().nullable(),
  protein: z.number().nullable(),
  /** relative protein change, e.g. 1.2 = +20 % */
  proteinFactor: z.number().nullable(),
  budget: z.number().nullable(),
  household: z.number().int().nullable(),
  diet: z.enum(DIETS).nullable(),
  exclusion: z.enum(EXCL).nullable(),
  stores: z.array(z.enum(STORES)).nullable(),
  value: z.number().nullable(),
});

export const IntentSchema = z.object({
  actions: z.array(ActionSchema),
  /** short, friendly confirmation in the user's language; must not contain prices or nutrition numbers */
  reply: z.string().nullable(),
});

export type Action = z.infer<typeof ActionSchema>;
export type Intent = z.infer<typeof IntentSchema>;

export const blankAction = (type: Action['type']): Action => ({
  type, day: null, meal: null, mode: null, kcal: null, protein: null, proteinFactor: null, budget: null, household: null, diet: null, exclusion: null, stores: null, value: null,
});

/** Non-health context that may be sent to an external provider. */
export interface AssistantContext { lang: 'lt' | 'ru'; today: number; mealsPerDay: number; household: number; dietType: string; stores: string[] }
