import type { Allergen } from '@/lib/allergens';

/** Where an ingredient comes from. Diets are derived from it, never stored by hand. */
export const ORIGINS = ['plant', 'dairy', 'egg', 'fish', 'seafood', 'meat', 'honey'] as const;
export type Origin = (typeof ORIGINS)[number];

export const DIETS = ['vegetarian', 'vegan', 'pescatarian'] as const;
export type Diet = (typeof DIETS)[number];

const ANIMAL_ALLERGENS: readonly Allergen[] = ['milk', 'eggs', 'fish', 'crustaceans', 'molluscs', 'lactose'];

export interface DietFacts {
  origin: Origin;
  allergens: readonly Allergen[];
}

/** Diets this ingredient fits. Vegan also rules out plant products that list animal allergens (e.g. chocolate with milk). */
export function dietsOf(item: DietFacts): Diet[] {
  const diets: Diet[] = [];
  if (item.origin !== 'meat') diets.push('pescatarian');
  if (item.origin !== 'meat' && item.origin !== 'fish' && item.origin !== 'seafood') diets.push('vegetarian');
  if (item.origin === 'plant' && !item.allergens.some((a) => ANIMAL_ALLERGENS.includes(a))) diets.push('vegan');
  return diets;
}

export function fitsDiet(item: DietFacts, diet: Diet | null): boolean {
  return diet === null || dietsOf(item).includes(diet);
}
