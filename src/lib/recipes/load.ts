import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { recipeFile, type Recipe } from './schema';

/** All recipes from data/recipes/*.json, with the file each came from. */
export function loadRecipes(dir = 'data/recipes'): { file: string; recipe: Recipe }[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .flatMap((f) =>
      recipeFile.parse(JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'))).map((recipe) => ({ file: f, recipe })),
    );
}
