import { describe, expect, it } from 'vitest';
import { effectiveTargets } from '@/domain/nutrition';
import { buildPlan } from '@/domain/planner';
import { RECIPE_BY_ID } from '@/data/recipeIndex';
import { recipeFacts } from '@/domain/recipeFacts';
import { DEFAULT_ANSWERS } from '@/state/store';
import { PROGRAMS, withProgram } from './programs';

describe('nutrition programs', () => {
  for (const p of PROGRAMS) {
    it(`${p.id}: a full week near the targets`, () => {
      const a = withProgram(DEFAULT_ANSWERS, p, { sex: p.sex ?? 'f', weightKg: p.sex === 'm' ? 80 : 68, household: 1, store: 'barbora' });
      const t = effectiveTargets(a);
      const plan = buildPlan(a, t, 3);
      expect(plan.days).toHaveLength(7);
      const kcal = plan.days.reduce((s, d) => s + d.kcal, 0) / 7;
      const prot = plan.days.reduce((s, d) => s + d.protein, 0) / 7;
      expect(Math.abs(kcal - t.kcal) / t.kcal).toBeLessThan(0.15);
      expect(prot).toBeGreaterThan(t.protein * 0.85);
      const ids = plan.days.flatMap((d) => d.meals.map((m) => m.recipeId));
      if (p.id === 'veg') for (const id of ids) expect(recipeFacts(RECIPE_BY_ID[id]).flags).not.toContain('meat');
      if (p.id === 'quick') for (const id of ids) expect(RECIPE_BY_ID[id].minutes).toBeLessThanOrEqual(15);
    });
  }
});
