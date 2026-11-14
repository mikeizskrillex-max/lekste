import { describe, expect, it } from 'vitest';
import { INGREDIENT_BY_ID } from './ingredients';
import { getDetail } from './recipeDetails';
import { RECIPES } from './recipes';

describe('recipe database', () => {
  it('has unique ids, known ingredients, steps and names in both languages', () => {
    const ids = new Set<string>();
    for (const r of RECIPES) {
      expect(ids.has(r.id), r.id).toBe(false);
      ids.add(r.id);
      for (const [id, g] of r.items) { expect(INGREDIENT_BY_ID[id], `${r.id}: ${id}`).toBeTruthy(); expect(g).toBeGreaterThan(0); }
      expect(r.lt.length > 3 && r.ru.length > 3, r.id).toBe(true);
      const d = getDetail(r.id);
      expect((d?.steps.length ?? r.stepsLt.length) > 0, r.id).toBe(true);
    }
  });
  it('names are unique per language', () => {
    const lt = RECIPES.map((r) => r.lt);
    const dup = lt.filter((n, i) => lt.indexOf(n) !== i);
    expect(dup).toEqual([]);
  });
  it('database has 1 800+ dishes', () => {
    expect(RECIPES.length).toBeGreaterThan(1800);
  });
});
