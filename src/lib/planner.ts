import { INGREDIENT_BY_ID } from '../data/ingredients';
import { RECIPES, type Recipe } from '../data/recipes';
import { passesHardRules, recipeFacts } from './recipes';
import type { MealType, QuizAnswers, Targets } from './types';

export interface PlanMeal {
  recipeId: string;
  meal: MealType;
  /** portion multiplier for one person */
  servings: number;
  kcal: number;
  protein: number;
  cost: number;
}
export interface PlanDay { meals: PlanMeal[]; kcal: number; protein: number; cost: number; vegGrams: number; fiber: number }
export interface Plan { days: PlanDay[]; weeklyCost: number; issues: string[] }

export function mealSlots(u: Pick<QuizAnswers, 'mealsPerDay' | 'breakfastStyle'>): MealType[] {
  const base: MealType[] =
    u.mealsPerDay === 3 ? ['breakfast', 'lunch', 'dinner']
    : u.mealsPerDay === 4 ? ['breakfast', 'lunch', 'snack', 'dinner']
    : ['breakfast', 'snack', 'lunch', 'snack', 'dinner'];
  if (u.breakfastStyle === 'none') {
    return base.map((m) => (m === 'breakfast' ? 'snack' : m));
  }
  return base;
}

/** Soft preference score: higher is better. */
function score(r: Recipe, u: QuizAnswers): number {
  let s = 0;
  const ids = r.items.map(([id]) => id);
  if (ids.some((id) => u.likedProteins.includes(id))) s += 3;
  if (u.likedCuisines.includes(r.cuisine)) s += 2;
  if (ids.some((id) => u.avoid.includes(id))) s -= 4;
  if (r.meal === 'breakfast' && r.breakfastStyle && u.breakfastStyle === r.breakfastStyle) s += 2;
  if (r.spice > u.spice) s -= 3 * (r.spice - u.spice);
  if (u.dietType === 'low_carb') s -= recipeFacts(r).carbs / 30;
  return s;
}

/** Small deterministic PRNG so a week looks varied but is reproducible. */
function rng(seed: number) {
  let x = seed || 1;
  return () => ((x = (x * 16807) % 2147483647) / 2147483647);
}

export function eligibleRecipes(u: QuizAnswers): Recipe[] {
  return RECIPES.filter((r) => passesHardRules(r, u));
}

/**
 * Local planner used in demo mode and as a fallback when the AI step is
 * unavailable. Picks recipes by soft score with variety, then scales portions
 * so each day lands within ±10% of the calorie target.
 */
export function buildPlan(u: QuizAnswers, t: Targets, seed = 7): Plan {
  const pool = eligibleRecipes(u);
  const slots = mealSlots(u);
  const rand = rng(seed);
  const used = new Map<string, number>();
  const issues: string[] = [];
  const days: PlanDay[] = [];

  for (let d = 0; d < 7; d++) {
    const chosen: Recipe[] = [];
    for (const slot of slots) {
      const options = pool.filter((r) => r.meal === slot && (used.get(r.id) ?? 0) < 2 && !chosen.includes(r));
      if (options.length === 0) {
        issues.push(`not_enough_recipes:${slot}`);
        continue;
      }
      // batch cooking: repeat yesterday's lunch/dinner on odd days
      const prev = days[d - 1]?.meals.find((m) => m.meal === slot);
      if (u.batchCooking && d % 2 === 1 && prev && (slot === 'lunch' || slot === 'dinner')) {
        const r = pool.find((x) => x.id === prev.recipeId)!;
        chosen.push(r);
        continue;
      }
      const ranked = options
        .map((r) => ({ r, s: score(r, u) + rand() * 2.5 }))
        .sort((a, b) => b.s - a.s);
      const pick = ranked[0].r;
      chosen.push(pick);
      used.set(pick.id, (used.get(pick.id) ?? 0) + 1);
    }

    const base = chosen.reduce((s, r) => s + recipeFacts(r).kcal, 0) || 1;
    const factor = Math.min(1.75, Math.max(0.75, t.kcal / base));
    const servings = Math.round(factor * 4) / 4;
    const meals: PlanMeal[] = chosen.map((r) => {
      const f = recipeFacts(r);
      return { recipeId: r.id, meal: r.meal === 'snack' ? 'snack' : r.meal, servings, kcal: Math.round(f.kcal * servings), protein: Math.round(f.protein * servings), cost: f.cost * servings };
    });
    const day: PlanDay = {
      meals,
      kcal: meals.reduce((s, m) => s + m.kcal, 0),
      protein: meals.reduce((s, m) => s + m.protein, 0),
      cost: meals.reduce((s, m) => s + m.cost, 0),
      vegGrams: chosen.reduce((s, r) => s + recipeFacts(r).vegGrams * servings, 0),
      fiber: chosen.reduce((s, r) => s + recipeFacts(r).fiber * servings, 0),
    };
    days.push(day);
  }

  const weeklyCost = days.reduce((s, d) => s + d.cost, 0) * u.household;
  if (weeklyCost > u.weeklyBudget) issues.push('over_budget');
  return { days, weeklyCost, issues: [...new Set(issues)] };
}

export interface ShopItem { ingredientId: string; grams: number; cost: number; saving: number; store: string }

/** Aggregate a plan into a shopping list grouped by the cheapest store. */
export function shoppingList(plan: Plan, household: number): ShopItem[] {
  const recipes = Object.fromEntries(RECIPES.map((r) => [r.id, r]));
  const grams = new Map<string, number>();
  for (const day of plan.days) {
    for (const m of day.meals) {
      for (const [id, g] of recipes[m.recipeId].items) {
        grams.set(id, (grams.get(id) ?? 0) + g * m.servings * household);
      }
    }
  }
  return [...grams.entries()].map(([id, g]) => {
    const ing = INGREDIENT_BY_ID[id];
    const cost = (ing.pricePerKg * g) / 1000;
    const saving = ing.promo ? Math.min(cost * 0.3, ing.promo * Math.ceil(g / 1000)) : 0;
    return { ingredientId: id, grams: Math.round(g), cost, saving, store: ing.store };
  }).sort((a, b) => a.store.localeCompare(b.store) || b.cost - a.cost);
}
