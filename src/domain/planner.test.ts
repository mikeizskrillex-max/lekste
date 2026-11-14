import { describe, expect, it } from 'vitest';
import { RECIPES } from '../data/recipes';
import { calcTargets } from './nutrition';
import { buildPlan, eligibleRecipes } from './planner';
import { passesHardRules, recipeFacts } from './recipeFacts';
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

describe('regenerate a day', () => {
  it('replaces every meal of the day with other dishes that still pass hard rules', async () => {
    const { regenerateDay } = await import('./planner');
    const u = { ...base, allergens: ['gluten'] as QuizAnswers['allergens'] };
    const t = calcTargets(u);
    const plan = buildPlan(u, t);
    const next = regenerateDay(plan, u, t, 2, 42);
    const before = plan.days[2].meals.map((m) => m.recipeId);
    const after = next.days[2].meals.map((m) => m.recipeId);
    expect(after).toHaveLength(before.length);
    after.forEach((id) => expect(before).not.toContain(id));
    for (const id of after) expect(recipeFacts(RECIPES.find((r) => r.id === id)!).allergens).not.toContain('gluten');
    expect(next.days[0]).toEqual(plan.days[0]);
  });

  it('has a database of more than 1000 dishes', () => {
    expect(RECIPES.length).toBeGreaterThan(1000);
  });
});

describe('replace a meal', () => {
  it('cheaper and vegetarian replacements keep hard rules', async () => {
    const { replaceMeal } = await import('./planner');
    const u = { ...base, allergens: ['milk'] as QuizAnswers['allergens'], never: ['pork_loin'] };
    const t = calcTargets(u);
    const plan = buildPlan(u, t);
    const slot = plan.days[1].meals.findIndex((m) => m.meal === 'dinner');
    const before = recipeFacts(RECIPES.find((r) => r.id === plan.days[1].meals[slot].recipeId)!);
    const cheaper = replaceMeal(plan, u, t, 1, slot, 'cheaper');
    if (cheaper) {
      const f = recipeFacts(RECIPES.find((r) => r.id === cheaper.days[1].meals[slot].recipeId)!);
      expect(f.cost).toBeLessThan(before.cost);
      expect(f.allergens).not.toContain('milk');
    }
    const veg = replaceMeal(plan, u, t, 1, slot, 'vegetarian')!;
    const vf = recipeFacts(RECIPES.find((r) => r.id === veg.days[1].meals[slot].recipeId)!);
    expect(vf.flags).not.toContain('meat');
    expect(vf.flags).not.toContain('fish');
    expect(vf.allergens).not.toContain('milk');
  });
});

describe('one supermarket', () => {
  it('prices the plan at the chosen store and prefers dishes it sells', async () => {
    const { recipeAtStore, basketFor } = await import('./pricing');
    const { weeklyNeed } = await import('./planner');
    for (const store of ['barbora', 'rimi'] as const) {
      const u = { ...base, homeStore: store };
      const plan = buildPlan(u, calcTargets(u));
      const ids = plan.days.flatMap((d) => d.meals.map((m) => m.recipeId));
      const missing = ids.filter((id) => recipeAtStore(RECIPES.find((r) => r.id === id)!, store).missing.length > 0);
      expect(missing.length).toBeLessThanOrEqual(2);
      const b = basketFor(weeklyNeed(plan, 1), [store]);
      expect(b.lines.every((l) => l.record.retailer === store)).toBe(true);
    }
  });
  it('ignores expired promotions', async () => {
    const { effectiveRecord } = await import('./pricing');
    const rec = { retailer: 'lidl', ingredientId: 'oats', match: 'exact', name: 'x', brand: null, ean: null, category: 'grains', grams: 500, price: 0.5, regular: 1, promo: true,
      promoValidFrom: '2020-01-01', promoValidTo: '2020-01-07', perKg: 1, url: null, imageUrl: null, retrievedAt: '2020-01-01', source: 'csv_import', verification: 'unverified' } as const;
    expect(effectiveRecord(rec)).toMatchObject({ promo: false, price: 1, perKg: 2 });
    expect(effectiveRecord({ ...rec, promoValidTo: '2999-01-01' })).toMatchObject({ promo: true, price: 0.5 });
  });
});

describe('money adds up', () => {
  it('meals sum to days and days sum exactly to the weekly basket', async () => {
    const { allocate } = await import('./allocation');
    for (const household of [1, 3]) {
      const u = { ...base, homeStore: 'barbora' as const, household };
      const plan = buildPlan(u, calcTargets(u));
      const a = allocate(plan, household, 'barbora');
      const days = a.day.reduce((s, x) => s + x, 0);
      expect(days).toBeCloseTo(a.week.total, 6);
      a.meal.forEach((m, d) => expect(m.reduce((s, x) => s + x, 0)).toBeCloseTo(a.day[d], 6));
      expect(a.daySaving.reduce((s, x) => s + x, 0)).toBeCloseTo(a.week.saving, 6);
      // every weekly item is bought exactly once (on its first day)
      const bought = a.items.flat().filter((i) => i.buyToday && i.line).map((i) => i.ingredientId);
      expect(new Set(bought).size).toBe(bought.length);
      expect(bought.length).toBe(a.week.lines.length);
    }
  });
});

describe('real basket fits the budget', () => {
  it('whole-package basket at the chosen store stays within typical budgets', async () => {
    const { planBasketTotal } = await import('./planner');
    for (const [store, budget, household] of [['barbora', 40, 1], ['barbora', 50, 1], ['rimi', 50, 1], ['barbora', 75, 2], ['rimi', 100, 2]] as const) {
      const u = { ...base, homeStore: store, weeklyBudget: budget, household };
      const plan = buildPlan(u, calcTargets(u));
      expect(planBasketTotal(plan, u), `${store} ${budget}`).toBeLessThanOrEqual(budget);
      expect(plan.basketTotal).toBeCloseTo(planBasketTotal(plan, u), 6);
    }
  });
});

describe('new week and favorites', () => {
  it('a new week avoids last week dishes when the library allows', () => {
    const u = { ...base, homeStore: 'barbora' as const, weeklyBudget: 70 };
    const t = calcTargets(u);
    const w1 = buildPlan(u, t, 7);
    const ids1 = w1.days.flatMap((d) => d.meals.map((m) => m.recipeId));
    const w2 = buildPlan(u, t, 4242, ids1);
    const ids2 = w2.days.flatMap((d) => d.meals.map((m) => m.recipeId));
    const repeated = ids2.filter((id) => ids1.includes(id)).length;
    expect(repeated / ids2.length).toBeLessThan(0.15);
  });
  it('favorite recipes appear more often', () => {
    const u = { ...base, homeStore: 'barbora' as const, weeklyBudget: 70 };
    const fav = eligibleRecipes(u).filter((r) => r.meal === 'breakfast').slice(5, 7).map((r) => r.id);
    const plan = buildPlan({ ...u, favorites: fav }, calcTargets(u));
    expect(plan.days.flatMap((d) => d.meals.map((m) => m.recipeId)).some((id) => fav.includes(id))).toBe(true);
  });
  it('disliked ingredients never appear', () => {
    const u = { ...base, homeStore: 'barbora' as const, never: ['beetroot', 'cottage_cheese', 'eggs'] };
    const plan = buildPlan(u, calcTargets(u));
    for (const d of plan.days) for (const m of d.meals) expect(RECIPES.find((r) => r.id === m.recipeId)!.items.some(([id]) => u.never.includes(id))).toBe(false);
  });
});

describe('taste swipe', () => {
  it('liking chicken and disliking fish shifts the menu', async () => {
    const { learnTaste, mainIngredient } = await import('./taste');
    const u = { ...base, homeStore: 'barbora' as const, weeklyBudget: 70 };
    const count = (plan: ReturnType<typeof buildPlan>, ids: string[]) => plan.days.flatMap((d) => d.meals).filter((m) => ids.includes(mainIngredient(RECIPES.find((r) => r.id === m.recipeId)!))).length;
    const before = buildPlan(u, calcTargets(u));
    const learned = { ...u, ...learnTaste(u, ['chicken_buckwheat', 'chicken_curry', 'plov', 'shawarma'], ['salmon_rice', 'cod_tomato', 'tuna_salad']) };
    const after = buildPlan(learned, calcTargets(learned));
    expect(learned.likedProteins).toEqual(expect.arrayContaining(['chicken_breast', 'chicken_thigh']));
    expect(learned.avoid).toEqual(expect.arrayContaining(['salmon', 'cod']));
    expect(count(after, ['chicken_breast', 'chicken_thigh'])).toBeGreaterThanOrEqual(count(before, ['chicken_breast', 'chicken_thigh']));
    expect(count(after, ['salmon', 'cod', 'tuna_can'])).toBeLessThanOrEqual(count(before, ['salmon', 'cod', 'tuna_can']));
    expect(after.days.flatMap((d) => d.meals).some((m) => ['salmon_rice', 'cod_tomato', 'tuna_salad'].includes(m.recipeId))).toBe(false);
  });
});
