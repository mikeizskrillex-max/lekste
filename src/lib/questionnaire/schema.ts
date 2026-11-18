import { z } from 'zod';
import { ALLERGENS } from '@/lib/allergens';

/** Questionnaire answers. The same schemas validate the browser draft and (phase 9) the server copy. */
export const GOALS = ['lose', 'maintain', 'gain', 'protein', 'healthier', 'cheaper'] as const;
export const SEXES = ['female', 'male'] as const;
export const MEALS = ['2', '3', '3+1', '3+2'] as const;
export const HEALTH = ['none', 'pregnant', 'breastfeeding', 'chronic'] as const;
export const ACTIVITY_LEVELS = [1, 2, 3, 4, 5] as const;
export const DIET_CHOICES = ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'no_pork', 'low_carb'] as const;
export const STORE_CHOICES = ['cheapest', 'barbora', 'rimi'] as const;
export const COOK_TIMES = ['20', '40', 'any'] as const;
export const ALLERGY_LEVELS = ['allergy', 'intolerance'] as const;

export const LIMITS = {
  adults: { min: 1, max: 6 },
  children: { max: 6 },
  childAge: { min: 1, max: 17 },
  age: { min: 14, max: 100 },
  heightCm: { min: 120, max: 230 },
  weightKg: { min: 35, max: 300 },
  budgetEur: { min: 10, max: 300, step: 5 },
  dislikes: { max: 60 },
} as const;

const int = (min: number, max: number) => z.number().int().min(min).max(max);

export const body = z.object({
  sex: z.enum(SEXES),
  age: int(LIMITS.age.min, LIMITS.age.max),
  heightCm: int(LIMITS.heightCm.min, LIMITS.heightCm.max),
  weightKg: z.number().min(LIMITS.weightKg.min).max(LIMITS.weightKg.max),
});
export type Body = z.infer<typeof body>;

/** Other adults: everything optional; skipped data → EFSA reference values, marked as approximate. */
export const otherAdult = z.object({
  sex: z.enum(SEXES).optional(),
  age: int(18, LIMITS.age.max).optional(),
  heightCm: int(LIMITS.heightCm.min, LIMITS.heightCm.max).optional(),
  weightKg: z.number().min(LIMITS.weightKg.min).max(LIMITS.weightKg.max).optional(),
  goal: z.enum(GOALS).optional(),
});
export type OtherAdult = z.infer<typeof otherAdult>;

export const child = z.object({ age: int(LIMITS.childAge.min, LIMITS.childAge.max), sex: z.enum(SEXES) });
export type Child = z.infer<typeof child>;

export const allergyChoice = z.object({ code: z.enum(ALLERGENS), level: z.enum(ALLERGY_LEVELS) });

export const answers = z
  .object({
    goal: z.enum(GOALS),
    adults: int(LIMITS.adults.min, LIMITS.adults.max),
    children: z.array(child).max(LIMITS.children.max),
    meals: z.enum(MEALS),
    /** ISO time of the explicit health-data consent; body data is not accepted without it */
    consentAt: z.iso.datetime(),
    me: body,
    health: z.enum(HEALTH),
    others: z.array(otherAdult).max(LIMITS.adults.max - 1),
    activity: z.union(ACTIVITY_LEVELS.map((n) => z.literal(n))),
    budgetEur: int(LIMITS.budgetEur.min, LIMITS.budgetEur.max),
    diet: z.enum(DIET_CHOICES),
    allergies: z.array(allergyChoice).max(ALLERGENS.length),
    dislikes: z.array(z.string().regex(/^[a-z][a-z0-9_]{1,40}$/)).max(LIMITS.dislikes.max),
    store: z.enum(STORE_CHOICES),
    cookTime: z.enum(COOK_TIMES),
  })
  .superRefine((a, ctx) => {
    if (a.others.length > a.adults - 1) ctx.addIssue({ code: 'custom', path: ['others'], message: 'too many adults' });
    if (a.health === 'pregnant' && a.me.sex !== 'female') {
      ctx.addIssue({ code: 'custom', path: ['health'], message: 'pregnancy needs sex female' });
    }
    const codes = a.allergies.map((x) => x.code);
    if (new Set(codes).size !== codes.length)
      ctx.addIssue({ code: 'custom', path: ['allergies'], message: 'duplicate' });
  });
export type Answers = z.infer<typeof answers>;

/** What the browser keeps while the questionnaire is being filled in. */
export const draft = z.object({
  goal: z.enum(GOALS).optional(),
  adults: int(LIMITS.adults.min, LIMITS.adults.max).optional(),
  children: z.array(child).max(LIMITS.children.max).optional(),
  meals: z.enum(MEALS).optional(),
  consentAt: z.iso.datetime().optional(),
  me: body.partial().optional(),
  health: z.enum(HEALTH).optional(),
  others: z
    .array(otherAdult)
    .max(LIMITS.adults.max - 1)
    .optional(),
  activity: z.union(ACTIVITY_LEVELS.map((n) => z.literal(n))).optional(),
  budgetEur: int(LIMITS.budgetEur.min, LIMITS.budgetEur.max).optional(),
  diet: z.enum(DIET_CHOICES).optional(),
  allergies: z.array(allergyChoice).max(ALLERGENS.length).optional(),
  dislikes: z
    .array(z.string().regex(/^[a-z][a-z0-9_]{1,40}$/))
    .max(LIMITS.dislikes.max)
    .optional(),
  store: z.enum(STORE_CHOICES).optional(),
  cookTime: z.enum(COOK_TIMES).optional(),
});
export type Draft = z.infer<typeof draft>;
