import { isChefRecipe, RECIPES, type Recipe } from '../data/recipes';
import type { RetailerId } from '@/config/markets';
import { activeCatalog, basketFor, cheapest, effectiveRecord, PANTRY, recipeAtStore } from './pricing';
import { passesHardRules, recipeFacts } from './recipeFacts';
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
export interface Plan {
  days: PlanDay[];
  /** sum of portion costs (what is eaten) */
  weeklyCost: number;
  /** real weekly basket with whole packages at the user's store */
  basketTotal?: number;
  issues: string[];
}

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

/** Price of one serving for this user: at their supermarket (with its promotions) when chosen. */
export function costOf(r: Recipe, u: Pick<QuizAnswers, 'homeStore'>): number {
  return u.homeStore ? recipeAtStore(r, u.homeStore).cost : recipeFacts(r).cost;
}

let recipeIndex: Map<string, Recipe> | null = null;
const RECIPE_INDEX = () => (recipeIndex ??= new Map(RECIPES.map((r) => [r.id, r])));

/** Shelf price of one package of an ingredient at the user's store (or the cheapest anywhere). */
const packCache = new WeakMap<object, Map<string, Map<string, number>>>();
function packPrice(id: string, u: Pick<QuizAnswers, 'homeStore'>): number {
  const c = activeCatalog();
  let byStore = packCache.get(c);
  if (!byStore) { byStore = new Map(); packCache.set(c, byStore); }
  const sk = u.homeStore ?? '';
  let m = byStore.get(sk);
  if (!m) { m = new Map(); byStore.set(sk, m); }
  let v = m.get(id);
  if (v === undefined) { v = packPriceRaw(id, u, c); m.set(id, v); }
  return v;
}
function packPriceRaw(id: string, u: Pick<QuizAnswers, 'homeStore'>, c: ReturnType<typeof activeCatalog>): number {
  const own = u.homeStore ? c[id]?.[u.homeStore] : undefined;
  const r = own ? effectiveRecord(own) : cheapest(id, c);
  return r ? r.price : 0;
}

/**
 * Extra money a recipe adds to the WEEK's basket given what is already bought:
 * ingredients from opened packages are almost free, a new ingredient costs a
 * whole package. This is what makes a menu fit a real budget.
 */
function newPackCost(r: Recipe, have: Set<string>, u: Pick<QuizAnswers, 'homeStore'>): number {
  let s = 0;
  for (const [id] of r.items) if (!have.has(id) && !PANTRY.has(id)) s += packPrice(id, u);
  return s;
}

/** The real weekly basket: whole packages at the user's store (all stores with data otherwise). */
export function planBasketTotal(plan: Plan, u: Pick<QuizAnswers, 'homeStore' | 'household'>): number {
  const c = activeCatalog();
  const stores = (u.homeStore ? [u.homeStore] : (['maxima', 'barbora', 'rimi', 'lidl', 'iki'] as RetailerId[]));
  return basketFor(weeklyNeed(plan, u.household), stores, c).total;
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
  if (isChefRecipe(r.id)) s += 1.2; // curated recipes first, generated ones add variety
  // budget awareness: the tighter the budget per person per day, the more a recipe's price matters
  const perDay = u.weeklyBudget / Math.max(1, u.household) / 7;
  s -= costOf(r, u) * Math.max(0.5, 10 / Math.max(perDay, 1));
  if (u.homeStore) {
    const at = recipeAtStore(r, u.homeStore);
    s += Math.min(2, at.promo.length * 0.8); // this week's promotions in the user's store
    s -= at.missing.length * 2.5; // the store does not sell an ingredient
  }
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

function makeDay(chosen: Recipe[], labels: MealType[], t: Targets, u: Pick<QuizAnswers, 'homeStore'>): PlanDay {
  const base = chosen.reduce((s, r) => s + recipeFacts(r).kcal, 0) || 1;
  const factor = Math.min(1.75, Math.max(0.6, t.kcal / base));
  const servings = Math.round(factor * 4) / 4;
  const meals: PlanMeal[] = chosen.map((r, i) => {
    const f = recipeFacts(r);
    return { recipeId: r.id, meal: labels[i], servings, kcal: Math.round(f.kcal * servings), protein: Math.round(f.protein * servings), cost: costOf(r, u) * servings };
  });
  return {
    meals,
    kcal: meals.reduce((s, m) => s + m.kcal, 0),
    protein: meals.reduce((s, m) => s + m.protein, 0),
    cost: meals.reduce((s, m) => s + m.cost, 0),
    vegGrams: chosen.reduce((s, r) => s + recipeFacts(r).vegGrams * servings, 0),
    fiber: chosen.reduce((s, r) => s + recipeFacts(r).fiber * servings, 0),
  };
}

function buildOnce(u: QuizAnswers, t: Targets, pool: Recipe[], baseSlots: MealType[], seed: number, scores?: Map<Recipe, number>): Plan {
  const sc = (r: Recipe) => scores?.get(r) ?? score(r, u);
  const rand = rng(seed);
  const used = new Map<string, number>();
  const have = new Set<string>();
  // how much a new package hurts: more when the budget per person is tight
  const perPersonDay = u.weeklyBudget / Math.max(1, u.household) / 7;
  const packWeight = Math.max(0.4, Math.min(3, 9 / Math.max(perPersonDay, 1))) * Math.min(2, Math.sqrt(u.household));
  const issues: string[] = [];
  const days: PlanDay[] = [];

  const pickFor = (slot: MealType, chosen: Recipe[]): Recipe | null => {
    // relax the variety rule step by step instead of leaving a meal empty
    for (const cap of [2, 3, Infinity]) {
      const options = pool.filter((r) => fits(r, slot) && (used.get(r.id) ?? 0) < cap && !chosen.includes(r));
      if (options.length === 0) continue;
      if (cap > 2) issues.push(`not_enough_recipes:${slot}`);
      const ranked = options
        .map((r) => ({ r, s: sc(r) + (r.meal === slot ? 1 : 0) + rand() * 2.5 - newPackCost(r, have, u) * packWeight / 2.5 }))
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
      pick.items.forEach(([id]) => have.add(id));
    }

    // high calorie targets: add snacks rather than serving huge portions
    let base = chosen.reduce((s, r) => s + recipeFacts(r).kcal, 0) || 1;
    while (t.kcal / base > 1.45 && chosen.length < 6) {
      const extra = pickFor('snack', chosen);
      if (!extra) break;
      chosen.splice(chosen.length - 1, 0, extra);
      labels.splice(labels.length - 1, 0, 'snack');
      used.set(extra.id, (used.get(extra.id) ?? 0) + 1);
      extra.items.forEach(([id]) => have.add(id));
      base += recipeFacts(extra).kcal;
    }

    days.push(makeDay(chosen, labels, t, u));
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
  const scores = new Map(pool.map((r) => [r, score(r, u)]));
  for (let k = 0; k < 10; k++) {
    const plan = buildOnce(u, t, pool, slots, seed + k * 101, scores);
    const basket = planBasketTotal(plan, u);
    const kcalErr = plan.days.reduce((s, d) => s + Math.abs(d.kcal - t.kcal) / t.kcal, 0) / 7;
    const protErr = plan.days.reduce((s, d) => s + Math.max(0, t.protein * 0.9 - d.protein) / t.protein, 0) / 7;
    const over = Math.max(0, basket - u.weeklyBudget) / u.weeklyBudget;
    // a day far off the calorie target is unacceptable whatever it saves
    const worstDay = Math.max(...plan.days.map((d) => Math.abs(d.kcal - t.kcal) / t.kcal));
    const total = kcalErr * 3 + protErr * 2 + over * 6 + (basket / u.weeklyBudget) * 0.3 + Math.max(0, worstDay - 0.15) * 60;
    if (total < bestScore) { bestScore = total; best = { ...plan, basketTotal: basket }; }
  }
  return fitBudget(best!, u, t, pool, scores);
}

/**
 * Budget repair on the REAL basket: while the week's whole-package basket is over
 * budget, swap the meal whose replacement saves the most money (reusing what is
 * already bought), keeping calories close. Hard rules hold: only eligible recipes.
 */
function fitBudget(plan: Plan, u: QuizAnswers, t: Targets, pool: Recipe[], scores: Map<Recipe, number>): Plan {
  let cur = plan;
  let total = cur.basketTotal ?? planBasketTotal(cur, u);
  const byId = new Map(pool.map((r) => [r.id, r]));
  for (let iter = 0; iter < 30 && total > u.weeklyBudget; iter++) {
    const counts = new Map<string, number>();
    cur.days.forEach((d) => d.meals.forEach((m) => counts.set(m.recipeId, (counts.get(m.recipeId) ?? 0) + 1)));
    let bestPlan: Plan | null = null;
    let bestTotal = total;
    for (let d = 0; d < cur.days.length; d++) {
      for (let slot = 0; slot < cur.days[d].meals.length; slot++) {
        const m = cur.days[d].meals[slot];
        const r0 = byId.get(m.recipeId) ?? RECIPES.find((x) => x.id === m.recipeId)!;
        const k0 = recipeFacts(r0).kcal;
        // ingredients the rest of the week still buys
        const have = new Set<string>();
        cur.days.forEach((dd, di) => dd.meals.forEach((mm, si) => { if (di !== d || si !== slot) byId.get(mm.recipeId)?.items.forEach(([id]) => have.add(id)); }));
        const inDay = new Set(cur.days[d].meals.map((x) => x.recipeId));
        const cands = pool
          .filter((r) => fits(r, m.meal) && !inDay.has(r.id) && (counts.get(r.id) ?? 0) < 2 && Math.abs(recipeFacts(r).kcal - k0) <= Math.max(120, k0 * 0.25))
          .map((r) => ({ r, c: newPackCost(r, have, u) + costOf(r, u) - (scores.get(r) ?? 0) * 0.05 }))
          .sort((a, b) => a.c - b.c)
          .slice(0, 6);
        for (const { r } of cands) {
          const f = recipeFacts(r);
          const meals = cur.days[d].meals.map((x, i) => (i === slot ? { ...x, recipeId: r.id, kcal: Math.round(f.kcal * x.servings), protein: Math.round(f.protein * x.servings), cost: costOf(r, u) * x.servings } : x));
          const day: PlanDay = { ...cur.days[d], meals, kcal: meals.reduce((s, x) => s + x.kcal, 0), protein: meals.reduce((s, x) => s + x.protein, 0), cost: meals.reduce((s, x) => s + x.cost, 0) };
          // money never beats nutrition: keep the day within ±12 % of the calorie target (or no worse than now)
          const errNow = Math.abs(cur.days[d].kcal - t.kcal) / t.kcal;
          if (Math.abs(day.kcal - t.kcal) / t.kcal > Math.max(0.12, errNow)) continue;
          if (day.protein < Math.min(cur.days[d].protein, t.protein * 0.85)) continue;
          const days = cur.days.map((x, i) => (i === d ? day : x));
          const next: Plan = { ...cur, days, weeklyCost: days.reduce((s, x) => s + x.cost, 0) * u.household };
          const nt = planBasketTotal(next, u);
          if (nt < bestTotal - 0.01) { bestTotal = nt; bestPlan = next; }
        }
      }
    }
    if (!bestPlan) break;
    cur = bestPlan;
    total = bestTotal;
  }
  const issues = cur.issues.filter((x) => x !== 'over_budget');
  if (total > u.weeklyBudget) issues.push('over_budget');
  return { ...cur, basketTotal: total, issues };
}

/** Grams of each ingredient needed for the whole household for the week. */
export function weeklyNeed(plan: Plan, household: number): Map<string, number> {
  const recipes = RECIPE_INDEX();
  const grams = new Map<string, number>();
  for (const day of plan.days) {
    for (const m of day.meals) {
      for (const [id, g] of recipes.get(m.recipeId)!.items) {
        grams.set(id, (grams.get(id) ?? 0) + g * m.servings * household);
      }
    }
  }
  return grams;
}

/**
 * "Generate other dishes for this day": replaces every meal of one day with
 * different recipes that still pass all hard rules and fit the user's targets.
 * Recipes the user rated 👎 are skipped.
 */
export function regenerateDay(plan: Plan, u: QuizAnswers, t: Targets, day: number, seed: number, disliked: string[] = []): Plan {
  const pool = eligibleRecipes(u).filter((r) => !disliked.includes(r.id));
  const rand = rng(seed * 7919 + day);
  const current = new Set(plan.days[day].meals.map((m) => m.recipeId));
  const usedElsewhere = new Map<string, number>();
  plan.days.forEach((d, i) => { if (i !== day) d.meals.forEach((m) => usedElsewhere.set(m.recipeId, (usedElsewhere.get(m.recipeId) ?? 0) + 1)); });
  const chosen: Recipe[] = [];
  const labels: MealType[] = [];
  for (const m of plan.days[day].meals) {
    const options = pool.filter((r) => fits(r, m.meal) && !current.has(r.id) && !chosen.includes(r) && (usedElsewhere.get(r.id) ?? 0) < 2);
    const fallback = pool.filter((r) => fits(r, m.meal) && !chosen.includes(r));
    const list = options.length ? options : fallback;
    if (!list.length) continue;
    const pick = list.map((r) => ({ r, s: score(r, u) + rand() * 4 })).sort((a, b) => b.s - a.s)[0].r;
    chosen.push(pick);
    labels.push(m.meal);
  }
  const days = plan.days.map((d, i) => (i === day ? makeDay(chosen, labels, t, u) : d));
  const weeklyCost = days.reduce((s, d) => s + d.cost, 0) * u.household;
  return { ...plan, days, weeklyCost };
}

export type ReplaceMode = 'any' | 'cheaper' | 'protein' | 'vegetarian';

/**
 * Replace one meal. Every candidate passes the user's hard rules (allergies,
 * diet, "never" foods, equipment, time); the mode adds one more constraint.
 * Returns null when nothing satisfies the request, so the caller can explain why.
 */
export function replaceMeal(plan: Plan, u: QuizAnswers, t: Targets, day: number, slot: number, mode: ReplaceMode = 'any', seed = 1, disliked: string[] = []): Plan | null {
  const cur = plan.days[day]?.meals[slot];
  if (!cur) return null;
  const curR = RECIPES.find((r) => r.id === cur.recipeId)!;
  const curF = recipeFacts(curR);
  const inDay = new Set(plan.days[day].meals.map((m) => m.recipeId));
  const rand = rng(seed * 31 + day * 7 + slot);
  const options = eligibleRecipes(u).filter((r) => {
    if (!fits(r, cur.meal) || inDay.has(r.id) || disliked.includes(r.id)) return false;
    const f = recipeFacts(r);
    if (mode === 'cheaper' && !(costOf(r, u) < costOf(curR, u) * 0.92)) return false;
    if (mode === 'protein' && !(f.protein > curF.protein * 1.15)) return false;
    if (mode === 'vegetarian' && (f.flags.includes('meat') || f.flags.includes('fish') || f.flags.includes('seafood'))) return false;
    return true;
  });
  if (!options.length) return null;
  const rank = (r: Recipe) => {
    const f = recipeFacts(r);
    let s = score(r, u) + rand() * 3;
    if (mode === 'cheaper') s += (costOf(curR, u) - costOf(r, u)) * 3;
    if (mode === 'protein') s += (f.protein - curF.protein) / 5;
    // keep the day close to the calorie target
    s -= Math.abs(f.kcal - curF.kcal) / 150;
    return s;
  };
  const pick = options.map((r) => ({ r, s: rank(r) })).sort((a, b) => b.s - a.s)[0].r;
  const f = recipeFacts(pick);
  const meals = plan.days[day].meals.map((m, i) => (i === slot
    ? { ...m, recipeId: pick.id, kcal: Math.round(f.kcal * m.servings), protein: Math.round(f.protein * m.servings), cost: costOf(pick, u) * m.servings }
    : m));
  const dayObj: PlanDay = {
    ...plan.days[day], meals,
    kcal: meals.reduce((s, m) => s + m.kcal, 0),
    protein: meals.reduce((s, m) => s + m.protein, 0),
    cost: meals.reduce((s, m) => s + m.cost, 0),
  };
  const days = plan.days.map((d, i) => (i === day ? dayObj : d));
  return { ...plan, days, weeklyCost: days.reduce((s, d) => s + d.cost, 0) * u.household };
}
