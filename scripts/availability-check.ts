/**
 * npm run availability:check — CI rule: no recipe may use an ingredient that is not available in both stores,
 * according to data/availability.json. Recipes are read from data/recipes/*.json when they exist (phase 6).
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { z } from 'zod';
import { availabilitySnapshot, unavailableRecipes, type RecipeRef } from '../src/lib/availability/snapshot';
import { parseCatalogue } from '../src/lib/ingredients/catalogue';

const snap = availabilitySnapshot.parse(JSON.parse(readFileSync('data/availability.json', 'utf8')));
const known = new Set(parseCatalogue(readFileSync('data/seed/ingredients_lt.csv', 'utf8')).rows.map((r) => r.slug));
const unknown = [...snap.bothStores, ...Object.keys(snap.missing)].filter((s) => !known.has(s));
if (unknown.length) {
  console.error(`availability:check — snapshot names ingredients that are not in the catalogue: ${unknown.join(', ')}`);
  process.exit(1);
}
// drafts and rejected recipes never reach menus; only auto_checked / reviewed must be in both stores
const recipeFile = z.array(
  z.object({ slug: z.string(), status: z.string(), ingredients: z.array(z.object({ slug: z.string() })) }),
);
const recipes: RecipeRef[] = existsSync('data/recipes')
  ? readdirSync('data/recipes')
      .filter((f) => f.endsWith('.json'))
      .flatMap((f) => recipeFile.parse(JSON.parse(readFileSync(`data/recipes/${f}`, 'utf8'))))
      .filter((r) => r.status === 'auto_checked' || r.status === 'reviewed')
      .map((r) => ({ slug: r.slug, ingredients: r.ingredients.map((x) => x.slug) }))
  : [];
const bad = unavailableRecipes(recipes, snap);
if (bad.length) {
  for (const b of bad.slice(0, 50)) console.error(`  ${b.recipe}: ${b.ingredient} is not in both stores`);
  console.error(`availability:check — ${bad.length} recipe ingredient(s) not available in both stores`);
  process.exit(1);
}
console.log(
  `availability:check — OK: ${recipes.length} recipes, ${snap.bothStores.length} ingredients in both stores (snapshot ${snap.checkedAt?.slice(0, 10) ?? 'not checked yet'})`,
);
