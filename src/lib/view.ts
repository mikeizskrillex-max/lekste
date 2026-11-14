import type { Locale, RetailerId } from '@/config/markets';
import { INGREDIENT_BY_ID, INGREDIENTS } from '@/data/ingredients';
import { RECIPE_BY_ID } from '@/data/recipeIndex';
import type { Recipe } from '@/data/recipes';
import type { Plan } from '@/domain/planner';
import type { Allergen, QuizAnswers } from '@/domain/types';
import { RETAILERS } from '@/retail/retailers';

export const recipeById = (id: string): Recipe | undefined => RECIPE_BY_ID[id];
export const recipeName = (id: string, lang: Locale) => { const r = RECIPE_BY_ID[id]; return r ? r[lang] : id; };
export const ingName = (id: string, lang: Locale) => INGREDIENT_BY_ID[id]?.[lang] ?? id;
export const ingEmoji = (id: string) => INGREDIENT_BY_ID[id]?.emoji ?? '•';
export const retailerName = (r: RetailerId | 'mixed') => (r === 'mixed' ? '—' : RETAILERS[r].name);

export const fmtGrams = (g: number, lang: Locale) =>
  g >= 1000 ? `${(g / 1000).toLocaleString(lang === 'lt' ? 'lt-LT' : 'ru-RU', { maximumFractionDigits: 1 })} ${lang === 'lt' ? 'kg' : 'кг'}` : `${Math.round(g)} ${lang === 'lt' ? 'g' : 'г'}`;

/** Simple exclusion chips of onboarding question 8 mapped to hard rules. */
export type Exclusion = 'fish' | 'pork' | 'mushrooms' | 'dairy' | 'gluten';
export const EXCLUSIONS: Exclusion[] = ['fish', 'pork', 'mushrooms', 'dairy', 'gluten'];

const FISH_IDS = INGREDIENTS.filter((i) => i.flags.includes('fish') || i.flags.includes('seafood')).map((i) => i.id);
const PORK_IDS = INGREDIENTS.filter((i) => i.flags.includes('pork')).map((i) => i.id);

export function exclusionOn(a: QuizAnswers, e: Exclusion): boolean {
  switch (e) {
    case 'fish': return FISH_IDS.length > 0 && FISH_IDS.every((id) => a.never.includes(id));
    case 'pork': return a.dietType === 'no_pork' || (PORK_IDS.length > 0 && PORK_IDS.every((id) => a.never.includes(id)));
    case 'mushrooms': return a.never.includes('mushrooms');
    case 'dairy': return a.allergens.includes('milk');
    case 'gluten': return a.allergens.includes('gluten');
  }
}

export function toggleExclusion(a: QuizAnswers, e: Exclusion): Partial<QuizAnswers> {
  const on = exclusionOn(a, e);
  const setNever = (ids: string[]) => ({ never: on ? a.never.filter((x) => !ids.includes(x)) : Array.from(new Set([...a.never, ...ids])) });
  const setAllergen = (al: Allergen) => ({ allergens: on ? a.allergens.filter((x) => x !== al) : [...a.allergens, al] });
  switch (e) {
    case 'fish': return setNever(FISH_IDS);
    case 'pork': return { ...setNever(PORK_IDS), dietType: on && a.dietType === 'no_pork' ? 'any' : a.dietType };
    case 'mushrooms': return setNever(['mushrooms']);
    case 'dairy': return setAllergen('milk');
    case 'gluten': return setAllergen('gluten');
  }
}

/** Sample profile used on public pages (illustrative, clearly labelled there). */
export const SAMPLE_ANSWERS: QuizAnswers = {
  goal: 'lose', sex: 'f', age: 34, heightCm: 168, weightKg: 74, targetWeightKg: 68, activity: 'light', household: 2, weeklyBudget: 60,
  allergens: [], lactoseIntolerant: false, dietType: 'any', never: [], avoid: [], likedProteins: [], likedCuisines: [], mealsPerDay: 4,
  breakfastStyle: 'sweet', cookingTimeMax: 30, equipment: ['oven', 'blender'], batchCooking: false, spice: 1, stores: ['barbora'], homeStore: 'barbora',
  health: [], email: '', consentHealth: true, consentTerms: true, travelCost: 1.5,
};

export const planAvgKcal = (p: Plan) => p.days.reduce((s, d) => s + d.kcal, 0) / Math.max(1, p.days.length);
export const planAvgProtein = (p: Plan) => p.days.reduce((s, d) => s + d.protein, 0) / Math.max(1, p.days.length);

export function download(name: string, text: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
