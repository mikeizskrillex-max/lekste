import { describe, expect, it } from 'vitest';
import { RECIPES } from '../data/recipes';
import { calcTargets } from './nutrition';
import { buildPlan, eligibleRecipes } from './planner';
import { passesHardRules, recipeFacts } from './recipes';
import type { QuizAnswers } from './types';

const base: QuizAnswers = {
  goal: 'lose', sex: 'f', age: 31, heightCm: 168, weightKg: 72, targetWeightKg: 66, activity: 'light',
  household: 1, weeklyBudget: 60, allergens: [], lactoseIntolerant: false, dietType: 'any', never: [], avoid: [],
  likedProteins: [], likedCuisines: [], mealsPerDay: 4, breakfastStyle: 'sweet', cookingTimeMax: 60,
  equipment: ['stove', 'oven', 'blender'], batchCooking: false, spice: 1, stores: [], health: [], email: '',
  consentHealth: true, consentTerms: true,
};

describe('recipe facts', () => {
  it('derives allergens from ingredients', () => {
    const shrimp = RECIPES.find((r) => r.id === 'shrimp_rice')!;
    expect(recipeFacts(shrimp).allergens).toEqual(expect.arrayContaining(['crustaceans', 'soy', 'gluten', 'sesame']));
  });
});

describe('hard rules', () => {
  it('never lets an allergen through', () => {
    const u = { ...base, allergens: ['gluten', 'milk'] as QuizAnswers['allergens'] };
    for (const r of eligibleRecipes(u)) {
      const a = recipeFacts(r).allergens;
      expect(a).not.toContain('gluten');
      expect(a).not.toContain('milk');
    }
  });

  it('treats lactose intolerance as no milk', () => {
    const u = { ...base, lactoseIntolerant: true };
    expect(eligibleRecipes(u).every((r) => !recipeFacts(r).allergens.includes('milk'))).toBe(true);
  });

  it('keeps vegan plans free of animal products', () => {
    const u = { ...base, dietType: 'vegan' as const };
    expect(eligibleRecipes(u).every((r) => !recipeFacts(r).flags.includes('animal'))).toBe(true);
    expect(eligibleRecipes(u).length).toBeGreaterThan(3);
  });

  it('respects never-ingredients, time and equipment', () => {
    const r = RECIPES.find((x) => x.id === 'cod_veg')!;
    expect(passesHardRules(r, { ...base, never: ['cod'] })).toBe(false);
    expect(passesHardRules(r, { ...base, equipment: [] })).toBe(false);
    expect(passesHardRules(r, { ...base, cookingTimeMax: 15 })).toBe(false);
  });
});

describe('planner', () => {
  it('builds 7 days close to the calorie target', () => {
    const t = calcTargets(base);
    const plan = buildPlan(base, t);
    expect(plan.days).toHaveLength(7);
    for (const d of plan.days) {
      expect(Math.abs(d.kcal - t.kcal) / t.kcal).toBeLessThan(0.15);
    }
  });

  it('does not repeat a recipe more than twice a week', () => {
    const plan = buildPlan(base, calcTargets(base));
    const counts = new Map<string, number>();
    plan.days.flatMap((d) => d.meals).forEach((m) => counts.set(m.recipeId, (counts.get(m.recipeId) ?? 0) + 1));
    expect(Math.max(...counts.values())).toBeLessThanOrEqual(2);
  });
});

describe('planner with tough constraints', () => {
  it('never leaves a meal empty and keeps lunch and dinner as real main meals', () => {
    const u = { ...base, goal: 'gain' as const, weightKg: 85, heightCm: 185, sex: 'm' as const, activity: 'high' as const,
      allergens: ['nuts'] as QuizAnswers['allergens'], weeklyBudget: 40, mealsPerDay: 3 as const };
    const t = calcTargets(u);
    const plan = buildPlan(u, t);
    for (const d of plan.days) {
      expect(d.meals.filter((m) => m.meal !== 'snack').length).toBe(3);
      for (const m of d.meals.filter((x) => x.meal === 'lunch' || x.meal === 'dinner')) {
        expect(['lunch', 'dinner']).toContain(RECIPES.find((r) => r.id === m.recipeId)!.meal);
      }
      expect(Math.abs(d.kcal - t.kcal) / t.kcal).toBeLessThan(0.2);
    }
  });

  it('has a big enough library for vegans and gluten-free users', () => {
    const vegan = eligibleRecipes({ ...base, dietType: 'vegan' });
    const gf = eligibleRecipes({ ...base, allergens: ['gluten'] });
    expect(vegan.filter((r) => r.meal === 'lunch' || r.meal === 'dinner').length).toBeGreaterThanOrEqual(7);
    expect(gf.filter((r) => r.meal === 'lunch' || r.meal === 'dinner').length).toBeGreaterThanOrEqual(20);
  });
});
