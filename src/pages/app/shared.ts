import { RECIPE_BY_ID } from '../../data/recipeIndex';
import type { Recipe } from '../../data/recipes';
import { weeklyNeed, type Plan } from '../../lib/planner';
import { basket } from '../../lib/pricing';
import { recipeFacts } from '../../lib/recipes';
import type { MealType } from '../../lib/types';

export interface DayMeal { slot: number; meal: MealType; recipe: Recipe; servings: number; kcal: number; protein: number; fat: number; carbs: number; cost: number }

/** Meals of one day with the user's swaps applied. */
export function dayMeals(plan: Plan, swaps: Record<string, string>, day: number): DayMeal[] {
  return plan.days[day].meals.map((m, slot) => {
    const recipe = RECIPE_BY_ID[swaps[`${day}-${slot}`] ?? m.recipeId];
    const f = recipeFacts(recipe);
    return {
      slot, meal: m.meal, recipe, servings: m.servings,
      kcal: Math.round(f.kcal * m.servings), protein: Math.round(f.protein * m.servings),
      fat: Math.round(f.fat * m.servings), carbs: Math.round(f.carbs * m.servings), cost: f.cost * m.servings,
    };
  });
}

/** Plan with swaps applied, so the shopping list follows what the user will actually cook. */
export function effectivePlan(plan: Plan, swaps: Record<string, string>): Plan {
  return {
    ...plan,
    days: plan.days.map((d, di) => ({ ...d, meals: d.meals.map((m, si) => ({ ...m, recipeId: swaps[`${di}-${si}`] ?? m.recipeId })) })),
  };
}

/** Real-price baskets for the week: each store alone, and the cheapest mix. */
export function weekBaskets(plan: Plan, swaps: Record<string, string>, household: number) {
  const need = weeklyNeed(effectivePlan(plan, swaps), household);
  return { need, barbora: basket(need, 'barbora'), rimi: basket(need, 'rimi'), mix: basket(need, 'mix') };
}

export const MEAL_LABEL: Record<string, { lt: string; ru: string }> = {
  breakfast: { lt: 'Pusryčiai', ru: 'Завтрак' },
  lunch: { lt: 'Pietūs', ru: 'Обед' },
  snack: { lt: 'Užkandis', ru: 'Перекус' },
  dinner: { lt: 'Vakarienė', ru: 'Ужин' },
};

export const DAY_SHORT = { lt: ['Pr', 'An', 'Tr', 'Kt', 'Pn', 'Št', 'Sk'], ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] };
