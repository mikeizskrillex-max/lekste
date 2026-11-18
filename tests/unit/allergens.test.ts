import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  ALLERGENS,
  allergenVerdict,
  isAllergen,
  isAllowed,
  recipeAllergens,
  recipeIsAllowed,
  type AllergenFacts,
} from '@/lib/allergens';
import { parseCatalogue } from '@/lib/ingredients/catalogue';

const carrot: AllergenFacts = { allergens: [], compositionVaries: false };
const butter: AllergenFacts = { allergens: ['milk', 'lactose'], compositionVaries: false };
const bread: AllergenFacts = { allergens: ['gluten'], compositionVaries: true };
const spice: AllergenFacts = { allergens: [], compositionVaries: true };

describe('allergen filter (SPEC §9 — must always pass)', () => {
  it('has the 14 EU allergens plus lactose', () => {
    expect(ALLERGENS).toHaveLength(15);
    expect(isAllergen('gluten')).toBe(true);
    expect(isAllergen('wheat')).toBe(false);
  });

  it('allows everything for someone without allergies', () => {
    for (const item of [carrot, butter, bread, spice]) expect(isAllowed(item, [])).toBe(true);
  });

  it('blocks an ingredient that contains the allergen', () => {
    expect(allergenVerdict(butter, ['milk'])).toBe('contains');
    expect(allergenVerdict(butter, ['lactose'])).toBe('contains');
    expect(isAllowed(bread, ['gluten'])).toBe(false);
  });

  it('treats unknown composition as "no" for anyone with any allergy (strict mode)', () => {
    expect(allergenVerdict(spice, ['nuts'])).toBe('unknown');
    expect(isAllowed(spice, ['nuts'])).toBe(false);
    expect(isAllowed(spice, [])).toBe(true);
  });

  it('allows a plain ingredient without the allergen', () => {
    expect(allergenVerdict(carrot, ['milk', 'gluten'])).toBe('ok');
  });

  it('a recipe has the union of its ingredients’ allergens, in canonical order', () => {
    expect(recipeAllergens([bread, carrot, butter])).toEqual(['gluten', 'milk', 'lactose']);
  });

  it('a recipe is blocked if any one ingredient is blocked', () => {
    expect(recipeIsAllowed([carrot, butter], ['milk'])).toBe(false);
    expect(recipeIsAllowed([carrot, spice], ['milk'])).toBe(false);
    expect(recipeIsAllowed([carrot], ['milk'])).toBe(true);
  });

  it('an empty recipe is never allowed', () => {
    expect(recipeIsAllowed([], [])).toBe(false);
  });
});

describe('allergens in the real catalogue', () => {
  const { rows } = parseCatalogue(readFileSync('data/seed/ingredients_lt.csv', 'utf8'));
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  const facts = (slug: string): AllergenFacts => {
    const r = bySlug.get(slug);
    if (!r) throw new Error(`no ${slug}`);
    return { allergens: r.allergens, compositionVaries: r.composition_varies };
  };

  it.each([
    ['milk', 'milk'],
    ['butter', 'milk'],
    ['egg', 'eggs'],
    ['salmon', 'fish'],
    ['shrimp', 'crustaceans'],
    ['peanuts', 'peanuts'],
    ['walnuts', 'nuts'],
    ['tofu', 'soy'],
    ['sesame', 'sesame'],
    ['celery', 'celery'],
    ['mustard', 'mustard'],
    ['pasta', 'gluten'],
    ['rye_bread', 'gluten'],
    ['oats', 'gluten'],
  ] as const)('%s is blocked for %s', (slug, allergen) => {
    expect(isAllowed(facts(slug), [allergen])).toBe(false);
  });

  it('processed foods count as "composition depends on product"', () => {
    for (const slug of ['frankfurters', 'mayonnaise', 'ketchup', 'soy_sauce', 'dark_chocolate', 'buckwheat']) {
      expect(facts(slug).compositionVaries).toBe(true);
    }
  });

  it('plain fresh produce stays allowed for allergy sufferers', () => {
    for (const slug of ['carrot', 'potato', 'apple', 'chicken_breast']) {
      expect(isAllowed(facts(slug), ['milk', 'gluten', 'nuts'])).toBe(true);
    }
  });
});
