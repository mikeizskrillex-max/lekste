import { recipeAllergens, type Allergen } from '@/lib/allergens';
import { dietsOf, type Diet, type Origin } from '@/lib/ingredients/diet';
import type { Recipe } from './schema';

/** What the planner needs to know about one ingredient (from ingredient_facts or the seed catalogue). */
export interface IngredientInfo {
  slug: string;
  nameLt: string;
  origin: Origin;
  allergens: readonly Allergen[];
  compositionVaries: boolean;
  tags: readonly string[];
  category: string;
  kcal: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
}

export interface RecipeFacts {
  perServing: { kcal: number; protein: number; fat: number; carbs: number; grams: number };
  allergens: Allergen[];
  compositionVaries: boolean;
  diets: Diet[];
  /** ingredients without nutrition data — such a recipe cannot be used */
  missingNutrition: string[];
  unknownIngredients: string[];
}

/** KBJU, allergens and diets of a recipe — computed from its ingredients only (SPEC §8.2). */
export function recipeFacts(
  r: Pick<Recipe, 'ingredients' | 'servings'>,
  catalogue: ReadonlyMap<string, IngredientInfo>,
): RecipeFacts {
  let kcal = 0;
  let protein = 0;
  let fat = 0;
  let carbs = 0;
  let grams = 0;
  const missingNutrition: string[] = [];
  const unknownIngredients: string[] = [];
  const infos: IngredientInfo[] = [];
  for (const { slug, grams: g } of r.ingredients) {
    const info = catalogue.get(slug);
    if (!info) {
      unknownIngredients.push(slug);
      continue;
    }
    infos.push(info);
    grams += g;
    if (info.kcal === null || info.protein === null || info.fat === null || info.carbs === null) {
      missingNutrition.push(slug);
      continue;
    }
    kcal += (info.kcal * g) / 100;
    protein += (info.protein * g) / 100;
    fat += (info.fat * g) / 100;
    carbs += (info.carbs * g) / 100;
  }
  const s = r.servings;
  const allDiets: Diet[] = ['pescatarian', 'vegetarian', 'no_pork', 'vegan'];
  return {
    perServing: {
      kcal: Math.round(kcal / s),
      protein: Math.round((protein / s) * 10) / 10,
      fat: Math.round((fat / s) * 10) / 10,
      carbs: Math.round((carbs / s) * 10) / 10,
      grams: Math.round(grams / s),
    },
    allergens: recipeAllergens(infos.map((i) => ({ allergens: i.allergens, compositionVaries: i.compositionVaries }))),
    compositionVaries: infos.some((i) => i.compositionVaries),
    diets: allDiets.filter(
      (d) =>
        infos.length > 0 &&
        infos.every((i) => dietsOf({ origin: i.origin, allergens: i.allergens, tags: i.tags }).includes(d)),
    ),
    missingNutrition,
    unknownIngredients,
  };
}
