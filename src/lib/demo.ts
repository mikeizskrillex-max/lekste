import { calcTargets } from './nutrition';
import { buildPlan, weeklyNeed } from './planner';
import { basket } from './pricing';
import { DEFAULT_ANSWERS } from './store';
import type { QuizAnswers } from './types';

/** Example household used on the landing page: real recipes, real prices. */
export const DEMO_ANSWERS: QuizAnswers = {
  ...DEFAULT_ANSWERS, goal: 'lose', household: 2, weeklyBudget: 70, mealsPerDay: 4, equipment: ['oven', 'blender'],
  cookingTimeMax: 30, likedCuisines: ['home', 'mediterranean'],
};

let cache: ReturnType<typeof compute> | null = null;
function compute() {
  const targets = calcTargets(DEMO_ANSWERS);
  const plan = buildPlan(DEMO_ANSWERS, targets, 11);
  const need = weeklyNeed(plan, DEMO_ANSWERS.household);
  return {
    targets, plan,
    barbora: basket(need, 'barbora'),
    rimi: basket(need, 'rimi'),
    mix: basket(need, 'mix'),
  };
}
export function demo() {
  if (!cache) cache = compute();
  return cache;
}
