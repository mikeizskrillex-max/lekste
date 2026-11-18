/**
 * Daily energy and macro targets per person. Deterministic, no AI. TODO: проверить диетологом.
 *
 * Adults with body data: Mifflin–St Jeor (Mifflin et al., Am J Clin Nutr 1990;51:241–7) × activity factor,
 * then the goal through safety.ts. Adults without body data and children: EFSA energy ARs (efsa.ts).
 * Macros:
 *   protein — g per kg body weight by goal (EFSA PRI 0.83 g/kg is the floor; 1.6–1.8 g/kg for weight loss,
 *             gain and "more protein", in line with ISSN position stand 2017), capped at 35 % of energy;
 *             without a body weight 18 % of energy (children 15 %);
 *   fat     — 30 % of energy (EFSA reference intake 20–35 %; toddlers 1–3 y: 35 %); low-carb: the remainder;
 *   carbs   — the remainder; low-carb: 25 % of energy.
 */
import { adultReferenceKcal, childKcal, type Sex } from './efsa';
import { safeTarget, type SafetyNote } from './safety';
import type { Answers, OtherAdult } from '@/lib/questionnaire/schema';

/** Activity factors for levels 1–5 (sedentary … very active). */
export const ACTIVITY_FACTORS = [1.2, 1.375, 1.55, 1.725, 1.9] as const;

const PROTEIN_G_PER_KG: Record<Answers['goal'], number> = {
  lose: 1.6,
  gain: 1.6,
  protein: 1.8,
  maintain: 1.0,
  healthier: 1.0,
  cheaper: 1.0,
};

export function mifflinBmr(sex: Sex, age: number, heightCm: number, weightKg: number): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'male' ? 5 : -161);
}

export function maintenanceKcal(sex: Sex, age: number, heightCm: number, weightKg: number, activity: number): number {
  const factor = ACTIVITY_FACTORS[activity - 1];
  if (factor === undefined) throw new RangeError(`activity ${activity}`);
  return mifflinBmr(sex, age, heightCm, weightKg) * factor;
}

export interface Macros {
  protein: number;
  fat: number;
  carbs: number;
}

export function macrosFor(
  kcal: number,
  opts: { weightKg?: number; goal: Answers['goal']; lowCarb: boolean; childAge?: number },
): Macros {
  let proteinKcal: number;
  if (opts.childAge !== undefined) proteinKcal = kcal * 0.15;
  else if (opts.weightKg) proteinKcal = Math.min(opts.weightKg * PROTEIN_G_PER_KG[opts.goal] * 4, kcal * 0.35);
  else proteinKcal = kcal * 0.18;

  const fatShare = opts.childAge !== undefined && opts.childAge <= 3 ? 0.35 : 0.3;
  let fatKcal: number;
  let carbKcal: number;
  if (opts.lowCarb && opts.childAge === undefined) {
    carbKcal = kcal * 0.25;
    fatKcal = Math.max(kcal - proteinKcal - carbKcal, 0);
  } else {
    fatKcal = kcal * fatShare;
    carbKcal = Math.max(kcal - proteinKcal - fatKcal, 0);
  }
  return { protein: Math.round(proteinKcal / 4), fat: Math.round(fatKcal / 9), carbs: Math.round(carbKcal / 4) };
}

export type PersonKind = 'me' | 'adult' | 'child';

export interface PersonTarget extends Macros {
  kind: PersonKind;
  /** position among adults (1 = the person filling in) or children (1, 2, …) */
  index: number;
  age?: number;
  kcal: number;
  /** true when EFSA reference values were used instead of the person's own body data */
  approximate: boolean;
  notes: SafetyNote[];
}

function otherAdultTarget(o: OtherAdult, a: Answers, index: number): PersonTarget {
  const goal = o.goal ?? 'maintain';
  const lowCarb = a.diet === 'low_carb';
  if (o.sex && o.age && o.heightCm && o.weightKg) {
    const maintenance = maintenanceKcal(o.sex, o.age, o.heightCm, o.weightKg, a.activity);
    const t = safeTarget({
      goal,
      maintenance,
      sex: o.sex,
      age: o.age,
      weightKg: o.weightKg,
      heightCm: o.heightCm,
      health: 'none',
    });
    return {
      kind: 'adult',
      index,
      age: o.age,
      kcal: t.kcal,
      notes: t.notes,
      approximate: false,
      ...macrosFor(t.kcal, { weightKg: o.weightKg, goal, lowCarb }),
    };
  }
  // Without body data no deficit or surplus is calculated: the EFSA maintenance value is shown as approximate.
  const kcal = adultReferenceKcal(o.age, o.sex);
  return {
    kind: 'adult',
    index,
    age: o.age,
    kcal,
    notes: [],
    approximate: true,
    ...macrosFor(kcal, { goal: 'maintain', lowCarb }),
  };
}

/** Targets for everyone who eats. The first entry is always the person who filled in the questionnaire. */
export function householdTargets(a: Answers): PersonTarget[] {
  const lowCarb = a.diet === 'low_carb';
  const people: PersonTarget[] = [];

  const { sex, age, heightCm, weightKg } = a.me;
  const maintenance = age < 18 ? childKcal(age, sex) : maintenanceKcal(sex, age, heightCm, weightKg, a.activity);
  const me = safeTarget({ goal: a.goal, maintenance, sex, age, weightKg, heightCm, health: a.health });
  people.push({
    kind: 'me',
    index: 1,
    age,
    kcal: me.kcal,
    notes: me.notes,
    approximate: false,
    ...macrosFor(me.kcal, { weightKg, goal: a.goal, lowCarb }),
  });

  for (let i = 0; i < a.adults - 1; i++) people.push(otherAdultTarget(a.others[i] ?? {}, a, i + 2));

  a.children.forEach((c, i) => {
    const kcal = childKcal(c.age, c.sex);
    people.push({
      kind: 'child',
      index: i + 1,
      age: c.age,
      kcal,
      notes: [],
      approximate: true,
      ...macrosFor(kcal, { goal: 'maintain', lowCarb: false, childAge: c.age }),
    });
  });
  return people;
}

export function totals(people: readonly PersonTarget[]): Macros & { kcal: number } {
  return people.reduce(
    (s, p) => ({ kcal: s.kcal + p.kcal, protein: s.protein + p.protein, fat: s.fat + p.fat, carbs: s.carbs + p.carbs }),
    { kcal: 0, protein: 0, fat: 0, carbs: 0 },
  );
}
