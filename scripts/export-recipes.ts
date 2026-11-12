/**
 * Exports the whole recipe database to data/recipes.json — one file with every
 * dish (chef + generated): names, ingredients, nutrition, allergens, price,
 * steps, tip and photo. Use it to review the library or to seed the Supabase
 * tables (recipes, recipe_ingredients). Run: npm run db:export
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { RECIPES, recipeImage, isChefRecipe } from '../src/data/recipes';
import { getDetail } from '../src/data/recipeDetails';
import { PRICES_DATE } from '../src/data/prices';
import { recipeFacts } from '../src/domain/recipeFacts';

const round = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;
const out = RECIPES.map((r) => {
  const f = recipeFacts(r);
  const det = getDetail(r.id)!;
  return {
    id: r.id,
    source: isChefRecipe(r.id) ? 'chef' : 'generated',
    name: { lt: r.lt, ru: r.ru },
    meal: r.meal, cuisine: r.cuisine, minutes: { prep: det.prep, cook: det.cook }, level: det.level,
    equipment: r.equipment, spice: r.spice, breakfastStyle: r.breakfastStyle ?? null,
    photo: recipeImage(r.id),
    ingredients: r.items.map(([id, grams]) => ({ id, grams })),
    perServing: { kcal: round(f.kcal, 0), protein: round(f.protein), fat: round(f.fat), carbs: round(f.carbs), fiber: round(f.fiber), sugar: round(f.sugar), costEur: round(f.cost, 2) },
    allergens: f.allergens, dietFlags: f.flags,
    steps: det.steps.map(([minutes, ru, lt]) => ({ minutes, ru, lt })),
    tip: { ru: det.tip[0], lt: det.tip[1] },
  };
});
mkdirSync('data', { recursive: true });
writeFileSync('data/recipes.json', JSON.stringify({ pricesDate: PRICES_DATE, count: out.length, recipes: out }, null, 1));
const by = out.reduce<Record<string, number>>((a, r) => ({ ...a, [r.meal]: (a[r.meal] ?? 0) + 1 }), {});
console.log(`data/recipes.json: ${out.length} recipes`, by);
