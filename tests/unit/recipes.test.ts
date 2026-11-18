import { describe, expect, it } from 'vitest';
import { fromAi, recipeSlug } from '@/lib/recipes/convert';
import { recipeFacts } from '@/lib/recipes/facts';
import type { AiRecipe } from '@/lib/recipes/prompt';
import { checkRecipe, isDuplicate } from '@/lib/recipes/sanity';
import { seedCatalogue } from '@/lib/recipes/seed-catalogue';

const { info, names } = seedCatalogue();
const ai: AiRecipe = {
  title_lt: 'Grikių košė su grybais',
  title_ru: 'Гречка с грибами',
  description_lt: 'Soti ir paprasta vakarienė.',
  description_ru: 'Сытный и простой ужин.',
  steps: [
    { lt: 'Išvirkite grikius pasūdytame vandenyje.', ru: 'Сварите гречку.' },
    { lt: 'Pakepinkite svogūną ir pievagrybius aliejuje.', ru: 'Обжарьте лук и шампиньоны.' },
    { lt: 'Sumaišykite su grikiais ir patiekite.', ru: 'Смешайте и подавайте.' },
  ],
  servings: 2,
  time_active_min: 15,
  time_total_min: 25,
  difficulty: 'easy',
  equipment: ['stove'],
  cuisine: 'lithuanian',
  season: ['all'],
  kid_friendly: true,
  ingredients: [
    { slug: 'buckwheat', grams: 160 },
    { slug: 'onion', grams: 110 },
    { slug: 'mushroom', grams: 250 },
    { slug: 'sunflower_oil', grams: 20 },
    { slug: 'salt', grams: 3 },
  ],
};
const make = (a: AiRecipe = ai) => {
  const r = fromAi(a, 'dinner', 'ai:test', new Set(), new Date('2026-11-18T10:00:00Z'));
  if (!r.ok) throw new Error(r.error);
  return r.recipe;
};

describe('recipe conversion', () => {
  it('slug from the Lithuanian title, unique', () => {
    expect(recipeSlug('Grikių košė su grybais', new Set())).toBe('grikiu-kose-su-grybais');
    expect(recipeSlug('Grikių košė su grybais', new Set(['grikiu-kose-su-grybais']))).toBe('grikiu-kose-su-grybais-2');
  });
  it('model output becomes a draft', () => expect(make().status).toBe('draft'));
  it('rejects a recipe without steps', () => {
    expect(fromAi({ ...ai, steps: [] }, 'dinner', 'ai:test', new Set(), new Date()).ok).toBe(false);
  });
});

describe('recipe facts (computed, never from AI)', () => {
  it('kcal per serving from the catalogue', () => {
    const f = recipeFacts(make(), info);
    // buckwheat 343×1.6 + onion 40×1.1 + mushrooms 22×2.5 + oil 884×0.2 ≈ 548.8+44+55+176.8 = 824.6 / 2
    expect(f.perServing.kcal).toBeGreaterThan(380);
    expect(f.perServing.kcal).toBeLessThan(450);
    expect(f.diets).toContain('vegan');
  });
  it('allergens are the union of the ingredients', () => {
    const f = recipeFacts(
      {
        servings: 1,
        ingredients: [
          { slug: 'butter', grams: 10 },
          { slug: 'pasta', grams: 100 },
        ],
      },
      info,
    );
    expect(f.allergens).toEqual(['gluten', 'milk', 'lactose']);
  });
});

describe('auto-check', () => {
  const ctx = { catalogue: info, names, existing: [] };
  it('a sound recipe passes', () => expect(checkRecipe(make(), ctx)).toEqual([]));
  it('unknown ingredient', () => {
    expect(
      checkRecipe(make({ ...ai, ingredients: [...ai.ingredients, { slug: 'tahini', grams: 30 }] }), ctx),
    ).toContain('unknown_ingredient:tahini');
  });
  it('too much salt', () => {
    expect(
      checkRecipe(
        make({ ...ai, ingredients: ai.ingredients.map((i) => (i.slug === 'salt' ? { ...i, grams: 20 } : i)) }),
        ctx,
      ),
    ).toContain('too_much:salt');
  });
  it('ingredient missing from the steps', () => {
    const r = make({ ...ai, ingredients: [...ai.ingredients, { slug: 'carrot', grams: 100 }] });
    expect(checkRecipe(r, ctx)).toContain('not_in_steps:carrot');
  });
  it('kcal out of range for the meal', () => {
    const r = make({
      ...ai,
      ingredients: ai.ingredients.map((i) => (i.slug === 'buckwheat' ? { ...i, grams: 900 } : i)),
    });
    expect(checkRecipe(r, ctx).some((x) => x.startsWith('kcal_out_of_range') || x.startsWith('too_much'))).toBe(true);
  });
  it('diet mismatch', () => {
    const r = make({
      ...ai,
      ingredients: [...ai.ingredients, { slug: 'bacon', grams: 60 }],
      steps: [...ai.steps, { lt: 'Įdėkite šoninę.', ru: 'Добавьте бекон.' }],
    });
    expect(checkRecipe(r, { ...ctx, wantedDiet: 'vegetarian' })).toContain('diet_mismatch:vegetarian');
  });
  it('ingredient without nutrition data (waits for labels)', () => {
    const r = make({
      ...ai,
      ingredients: [...ai.ingredients, { slug: 'kastinys', grams: 40 }],
      steps: [...ai.steps, { lt: 'Patiekite su kastiniu.', ru: 'Подавайте с кастинисом.' }],
    });
    expect(checkRecipe(r, ctx)).toContain('no_nutrition:kastinys');
  });
  it('duplicates', () => {
    const a = make();
    const b = { ...make(), slug: 'kitas', title: { lt: 'Grikių košė su grybukais', ru: 'x' } };
    expect(isDuplicate(a, b)).toBe(true);
    expect(checkRecipe(b, { ...ctx, existing: [a] })).toContain(`duplicate:${a.slug}`);
  });
});
