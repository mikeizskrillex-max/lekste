import { INGREDIENT_BY_ID } from '../data/ingredients';
import type { Recipe } from '../data/recipes';
import { portionCost } from './pricing';
import type { Allergen, DietFlag, QuizAnswers } from './types';

export interface RecipeFacts {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  sugar: number;
  /** grams of vegetables and fruit */
  vegGrams: number;
  cost: number;
  allergens: Allergen[];
  flags: DietFlag[];
}

const cache = new Map<string, RecipeFacts>();

/** Nutrition, allergens, diet flags and cost of ONE serving, computed from ingredients only. */
export function recipeFacts(r: Recipe): RecipeFacts {
  const hit = cache.get(r.id);
  if (hit) return hit;
  const f: RecipeFacts = { kcal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, sugar: 0, vegGrams: 0, cost: 0, allergens: [], flags: [] };
  const allergens = new Set<Allergen>();
  const flags = new Set<DietFlag>();
  for (const [id, grams] of r.items) {
    const ing = INGREDIENT_BY_ID[id];
    if (!ing) throw new Error(`Recipe ${r.id} uses unknown ingredient ${id}`);
    const k = grams / 100;
    f.kcal += ing.kcal * k;
    f.protein += ing.protein * k;
    f.fat += ing.fat * k;
    f.carbs += ing.carbs * k;
    f.fiber += ing.fiber * k;
    f.sugar += ing.sugar * k;
    if (ing.veg) f.vegGrams += grams;
    f.cost += portionCost(id, grams);
    ing.allergens.forEach((a) => allergens.add(a));
    ing.flags.forEach((x) => flags.add(x));
  }
  f.allergens = [...allergens];
  f.flags = [...flags];
  cache.set(r.id, f);
  return f;
}

type HardRules = Pick<QuizAnswers, 'allergens' | 'lactoseIntolerant' | 'dietType' | 'never' | 'equipment' | 'cookingTimeMax'>;

/**
 * Hard constraints. A recipe that fails here must never reach the user,
 * whatever any AI step later suggests.
 */
export function passesHardRules(r: Recipe, u: HardRules): boolean {
  const f = recipeFacts(r);
  const banned = new Set<Allergen>(u.allergens);
  if (u.lactoseIntolerant) banned.add('milk');
  if (f.allergens.some((a) => banned.has(a))) return false;

  const has = (x: DietFlag) => f.flags.includes(x);
  switch (u.dietType) {
    case 'vegan': if (has('animal')) return false; break;
    case 'vegetarian': if (has('meat') || has('fish') || has('seafood')) return false; break;
    case 'pescatarian': if (has('meat')) return false; break;
    case 'no_pork': if (has('pork')) return false; break;
    case 'no_beef': if (has('beef')) return false; break;
    default: break;
  }
  if (r.items.some(([id]) => u.never.includes(id))) return false;
  if (r.minutes > u.cookingTimeMax) return false;
  // stove is assumed in every kitchen
  const owned = new Set([...u.equipment, 'stove']);
  if (r.equipment.some((e) => !owned.has(e))) return false;
  return true;
}
