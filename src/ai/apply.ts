import { effectiveTargets } from '@/domain/nutrition';
import { buildPlan, regenerateDay, replaceMeal, type Plan } from '@/domain/planner';
import type { DietType, QuizAnswers } from '@/domain/types';
import { toggleExclusion, exclusionOn } from '@/lib/view';
import type { Intent } from './intent';

export interface Note { kind: 'ok' | 'fail'; key: string; vars?: Record<string, string | number> }

/**
 * Applies a structured intent with our own deterministic code. Every replacement
 * goes through the planner's hard rules (allergies, diet, never-foods).
 */
export function applyIntent(answers: QuizAnswers, plan: Plan | null, intent: Intent, disliked: string[], seed = Date.now() % 9973): { answers: QuizAnswers; plan: Plan | null; notes: Note[] } {
  let a = { ...answers };
  const notes: Note[] = [];
  let rebuild = false;
  for (const x of intent.actions) {
    switch (x.type) {
      case 'set_targets': {
        const base = effectiveTargets(a);
        const o = { ...(a.overrides ?? {}) };
        if (x.kcal) o.kcal = x.kcal;
        if (x.protein) o.protein = x.protein;
        if (x.proteinFactor) o.protein = Math.round(base.protein * x.proteinFactor);
        a = { ...a, overrides: o }; rebuild = true;
        notes.push({ kind: 'ok', key: 'n_targets', vars: { kcal: effectiveTargets(a).kcal, protein: effectiveTargets(a).protein } });
        break;
      }
      case 'set_budget': if (x.budget && x.budget >= 15 && x.budget <= 500) { a = { ...a, weeklyBudget: Math.round(x.budget) }; rebuild = true; notes.push({ kind: 'ok', key: 'n_budget', vars: { n: Math.round(x.budget) } }); } break;
      case 'set_household': if (x.household && x.household >= 1 && x.household <= 8) { a = { ...a, household: x.household }; notes.push({ kind: 'ok', key: 'n_household', vars: { n: x.household } }); } break;
      case 'set_diet': if (x.diet) { a = { ...a, dietType: x.diet as DietType }; rebuild = true; notes.push({ kind: 'ok', key: `n_diet_${x.diet}` }); } break;
      case 'exclude': if (x.exclusion && !exclusionOn(a, x.exclusion)) { a = { ...a, ...toggleExclusion(a, x.exclusion) }; rebuild = true; notes.push({ kind: 'ok', key: `n_ex_${x.exclusion}` }); } break;
      case 'set_stores': if (x.stores?.length) { a = { ...a, stores: [x.stores[0]], homeStore: x.stores[0] }; rebuild = true; notes.push({ kind: 'ok', key: 'n_stores', vars: { s: x.stores.join(', ') } }); } break;
      case 'set_meals_per_day': if (x.value && [3, 4, 5].includes(x.value)) { a = { ...a, mealsPerDay: x.value as 3 | 4 | 5 }; rebuild = true; notes.push({ kind: 'ok', key: 'n_meals', vars: { n: x.value } }); } break;
      case 'set_cooking_time': if (x.value && [15, 30, 60].includes(x.value)) { a = { ...a, cookingTimeMax: x.value as 15 | 30 | 60 }; rebuild = true; notes.push({ kind: 'ok', key: 'n_time', vars: { n: x.value } }); } break;
      default: break;
    }
  }
  let p = plan;
  if (p && rebuild) p = buildPlan(a, effectiveTargets(a), seed);
  if (!p) return { answers: a, plan: p, notes };
  const t = effectiveTargets(a);
  for (const x of intent.actions) {
    if (x.type === 'regenerate_day' && x.day !== null) {
      p = regenerateDay(p, a, t, x.day, seed, disliked);
      notes.push({ kind: 'ok', key: 'n_regen', vars: { d: x.day } });
    }
    if (x.type === 'replace_meal') {
      const days = x.day === null ? [0, 1, 2, 3, 4, 5, 6] : [x.day];
      let changed = 0; let failed = 0;
      for (const d of days) {
        p.days[d].meals.forEach((m, slot) => {
          if (x.meal && m.meal !== x.meal) return;
          const next = replaceMeal(p!, a, t, d, slot, x.mode ?? 'any', seed + slot + d * 13, disliked);
          if (next) { p = next; changed++; } else failed++;
        });
      }
      notes.push(changed ? { kind: 'ok', key: 'n_replaced', vars: { n: changed } } : { kind: 'fail', key: 'replaceNone' });
      if (changed && failed) notes.push({ kind: 'fail', key: 'n_partial', vars: { n: failed } });
    }
  }
  return { answers: a, plan: p, notes };
}
