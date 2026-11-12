import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { RECIPES, recipeImage } from './recipes';

describe('recipe photos', () => {
  it('every recipe resolves to an existing image file', () => {
    const missing = RECIPES.filter((r) => !existsSync(path.join(process.cwd(), 'public', recipeImage(r.id)))).map((r) => r.id);
    expect(missing).toEqual([]);
  });
});
