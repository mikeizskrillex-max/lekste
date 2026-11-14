import type { RetailerId } from '@/config/markets';
import { RECIPE_BY_ID } from '@/data/recipeIndex';
import type { Catalog } from '@/retail/types';
import type { Plan } from './planner';
import { basketFor, type Basket, type BasketLine } from './pricing';
import { weeklyNeed } from './planner';

export interface DayItem {
  ingredientId: string;
  /** grams needed this day (whole household) */
  grams: number;
  /** this day's share of the weekly cost of the item */
  share: number;
  line: BasketLine | null;
  /** first day of the week this item is needed: that's when it has to be bought */
  buyToday: boolean;
}

export interface Allocation {
  week: Basket;
  /** day[d] = share of the weekly basket used on day d; sums to week.total */
  day: number[];
  /** meal[d][slot] = share of the weekly basket used by that meal */
  meal: number[][];
  /** promotion savings by day; sums to week.saving */
  daySaving: number[];
  items: DayItem[][];
}

/**
 * ONE source of truth for money: the weekly basket at the user's store (whole
 * packages, promotions). Every ingredient's cost is split over the days and
 * meals in proportion to the grams they use, so meals add up to days and days
 * add up exactly to the weekly basket the user pays at the till.
 */
export function allocate(plan: Plan, household: number, store: RetailerId, catalog?: Catalog): Allocation {
  const week = basketFor(weeklyNeed(plan, household), [store], catalog);
  const lines = new Map(week.lines.map((l) => [l.ingredientId, l]));
  const firstDay = new Map<string, number>();
  const day = plan.days.map(() => 0);
  const daySaving = plan.days.map(() => 0);
  const meal = plan.days.map((d) => d.meals.map(() => 0));
  const items: DayItem[][] = plan.days.map((d, di) => {
    const perDay = new Map<string, number>();
    d.meals.forEach((m, si) => {
      for (const [id, g] of RECIPE_BY_ID[m.recipeId]?.items ?? []) {
        const grams = g * m.servings * household;
        perDay.set(id, (perDay.get(id) ?? 0) + grams);
        const l = lines.get(id);
        if (!l) continue;
        const share = (l.cost * grams) / l.grams;
        meal[di][si] += share;
        day[di] += share;
        daySaving[di] += (l.saving * grams) / l.grams;
      }
      for (const [id] of RECIPE_BY_ID[m.recipeId]?.items ?? []) if (!firstDay.has(id)) firstDay.set(id, di);
    });
    return [...perDay].map(([id, grams]) => {
      const l = lines.get(id) ?? null;
      return { ingredientId: id, grams, share: l ? (l.cost * grams) / l.grams : 0, line: l, buyToday: false };
    });
  });
  items.forEach((list, di) => list.forEach((it) => { it.buyToday = firstDay.get(it.ingredientId) === di; }));
  return { week, day, meal, daySaving, items };
}
