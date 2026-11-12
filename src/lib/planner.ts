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
  // budget awareness: the tighter the budget per person per day, the more a recipe's price matters
  const perDay = u.weeklyBudget / Math.max(1, u.household) / 7;
  s -= recipeFacts(r).cost * Math.max(0.5, 10 / Math.max(perDay, 1));
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

const MAIN = new Set<MealType>(['lunch', 'dinner']);

/** Can this recipe fill this slot? Lunch and dinner are both "main meals". */
function fits(r: Recipe, slot: MealType): boolean {
  return r.meal === slot || (MAIN.has(slot) && MAIN.has(r.meal));
}

function buildOnce(u: QuizAnswers, t: Targets, pool: Recipe[], baseSlots: MealType[], seed: number): Plan {
  const rand = rng(seed);
  const used = new Map<string, number>();
  const issues: string[] = [];
  const days: PlanDay[] = [];

  const pickFor = (slot: MealType, chosen: Recipe[]): Recipe | null => {
    // relax the variety rule step by step instead of leaving a meal empty
    for (const cap of [2, 3, Infinity]) {
      const options = pool.filter((r) => fits(r, slot) && (used.get(r.id) ?? 0) < cap && !chosen.includes(r));
      if (options.length === 0) continue;
      if (cap > 2) issues.push(`not_enough_recipes:${slot}`);
      const ranked = options
        .map((r) => ({ r, s: score(r, u) + (r.meal === slot ? 1 : 0) + rand() * 2.5 }))
        .sort((a, b) => b.s - a.s);
      return ranked[0].r;
    }
    return null;
  };

  for (let d = 0; d < 7; d++) {
    const chosen: Recipe[] = [];
    const labels: MealType[] = [];
    for (const slot of baseSlots) {
      // batch cooking: repeat yesterday's main meal on odd days
      const prev = days[d - 1]?.meals.find((m) => m.meal === slot);
      if (u.batchCooking && d % 2 === 1 && prev && MAIN.has(slot)) {
        chosen.push(pool.find((x) => x.id === prev.recipeId)!);
        labels.push(slot);
        continue;
      }
      const pick = pickFor(slot, chosen);
      if (!pick) { issues.push(`no_recipe:${slot}`); continue; }
      chosen.push(pick);
      labels.push(slot);
      used.set(pick.id, (used.get(pick.id) ?? 0) + 1);
    }

    // high calorie targets: add snacks rather than serving huge portions
    let base = chosen.reduce((s, r) => s + recipeFacts(r).kcal, 0) || 1;
    while (t.kcal / base > 1.45 && chosen.length < 6) {
      const extra = pickFor('snack', chosen);
      if (!extra) break;
      chosen.splice(chosen.length - 1, 0, extra);
      labels.splice(labels.length - 1, 0, 'snack');
      used.set(extra.id, (used.get(extra.id) ?? 0) + 1);
      base += recipeFacts(extra).kcal;
    }

    const factor = Math.min(1.75, Math.max(0.6, t.kcal / base));
    const servings = Math.round(factor * 4) / 4;
    const meals: PlanMeal[] = chosen.map((r, i) => {
      const f = recipeFacts(r);
      return { recipeId: r.id, meal: labels[i], servings, kcal: Math.round(f.kcal * servings), protein: Math.round(f.protein * servings), cost: f.cost * servings };
    });
    days.push({
      meals,
      kcal: meals.reduce((s, m) => s + m.kcal, 0),
      protein: meals.reduce((s, m) => s + m.protein, 0),
      cost: meals.reduce((s, m) => s + m.cost, 0),
      vegGrams: chosen.reduce((s, r) => s + recipeFacts(r).vegGrams * servings, 0),
      fiber: chosen.reduce((s, r) => s + recipeFacts(r).fiber * servings, 0),
    });
  }

  const weeklyCost = days.reduce((s, d) => s + d.cost, 0) * u.household;
  if (weeklyCost > u.weeklyBudget) issues.push('over_budget');
  return { days, weeklyCost, issues: [...new Set(issues)] };
}

/**
 * Local planner (demo mode, and fallback for the AI step). Tries several
 * candidate weeks and keeps the one that best balances calories, protein,
 * budget and the user's preferences. Never leaves a meal empty.
 */
export function buildPlan(u: QuizAnswers, t: Targets, seed = 7): Plan {
  const pool = eligibleRecipes(u);
  const slots = mealSlots(u);
  let best: Plan | null = null;
  let bestScore = Infinity;
  for (let k = 0; k < 10; k++) {
    const plan = buildOnce(u, t, pool, slots, seed + k * 101);
    const kcalErr = plan.days.reduce((s, d) => s + Math.abs(d.kcal - t.kcal) / t.kcal, 0) / 7;
    const protErr = plan.days.reduce((s, d) => s + Math.max(0, t.protein * 0.9 - d.protein) / t.protein, 0) / 7;
    const over = Math.max(0, plan.weeklyCost - u.weeklyBudget) / u.weeklyBudget;
    const total = kcalErr * 3 + protErr * 2 + over * 4 + plan.weeklyCost / u.weeklyBudget * 0.3;
    if (total < bestScore) { bestScore = total; best = plan; }
  }
  return best!;
}

/** Grams of each ingredient needed for the whole household for the week. */
export function weeklyNeed(plan: Plan, household: number): Map<string, number> {
  const recipes = Object.fromEntries(RECIPES.map((r) => [r.id, r]));
  const grams = new Map<string, number>();
  for (const day of plan.days) {
    for (const m of day.meals) {
      for (const [id, g] of recipes[m.recipeId].items) {
        grams.set(id, (grams.get(id) ?? 0) + g * m.servings * household);
      }
    }
  }
  return grams;
}
