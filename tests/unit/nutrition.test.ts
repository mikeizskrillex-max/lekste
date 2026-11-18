import { describe, expect, it } from 'vitest';
import { adultReferenceKcal, childKcal } from '@/lib/nutrition/efsa';
import { MIN_KCAL, needsDoctor, safeTarget } from '@/lib/nutrition/safety';
import { householdTargets, macrosFor, maintenanceKcal, mifflinBmr, totals } from '@/lib/nutrition/targets';
import { answers, type Answers } from '@/lib/questionnaire/schema';
import { defaultBudget, firstIncomplete, stepComplete } from '@/lib/questionnaire/steps';

const base: Answers = {
  goal: 'maintain',
  adults: 1,
  children: [],
  meals: '3+1',
  consentAt: '2026-11-18T10:00:00.000Z',
  me: { sex: 'male', age: 30, heightCm: 180, weightKg: 80 },
  health: 'none',
  others: [],
  activity: 3,
  budgetEur: 30,
  diet: 'omnivore',
  allergies: [],
  dislikes: [],
  store: 'cheapest',
  cookTime: 'any',
};

describe('Mifflin–St Jeor (control examples)', () => {
  it('man 30 y, 180 cm, 80 kg → BMR 1780', () => expect(mifflinBmr('male', 30, 180, 80)).toBe(1780));
  it('woman 25 y, 165 cm, 60 kg → BMR 1345.25', () => expect(mifflinBmr('female', 25, 165, 60)).toBe(1345.25));
  it('moderate activity × 1.55', () => expect(maintenanceKcal('male', 30, 180, 80, 3)).toBeCloseTo(2759, 0));
});

describe('EFSA values', () => {
  it('children from the EFSA table (MJ × 238.83)', () => {
    expect(childKcal(8, 'male')).toBe(Math.round(7.6 * 238.83));
    expect(childKcal(8, 'female')).toBe(Math.round(7.1 * 238.83));
    expect(childKcal(1, 'female')).toBe(Math.round(3.0 * 238.83));
  });
  it('adult reference without data = average of men and women, 30–39 y', () => {
    expect(adultReferenceKcal(undefined, undefined)).toBe(Math.round(((10.8 + 8.7) / 2) * 238.83));
  });
});

describe('safety limits (SPEC §9)', () => {
  const lose = {
    goal: 'lose' as const,
    sex: 'female' as const,
    age: 35,
    weightKg: 70,
    heightCm: 168,
    health: 'none' as const,
  };
  it('deficit is at most 20 % of maintenance', () => {
    const r = safeTarget({ ...lose, weightKg: 120, maintenance: 2000 });
    expect(r.kcal).toBe(1600);
  });
  it('deficit is capped by 0.75 % body weight per week', () => {
    const r = safeTarget({ ...lose, weightKg: 50, heightCm: 160, maintenance: 2400 });
    expect(r.kcal).toBe(Math.round(2400 - (50 * 0.0075 * 7700) / 7));
    expect(r.notes).toContain('rate_capped');
  });
  it('never below the minimum', () => {
    const r = safeTarget({ ...lose, maintenance: 1350 });
    expect(r.kcal).toBe(MIN_KCAL.female);
    expect(r.notes).toContain('min_floor');
  });
  it('maintenance under the minimum → no deficit, see a doctor', () => {
    const r = safeTarget({ ...lose, maintenance: 1150 });
    expect(r.kcal).toBe(1150);
    expect(needsDoctor(r.notes)).toBe(true);
  });
  it.each(['pregnant', 'breastfeeding', 'chronic'] as const)('%s → no deficit, see a doctor', (health) => {
    const r = safeTarget({ ...lose, health, maintenance: 2200 });
    expect(r.kcal).toBe(2200);
    expect(needsDoctor(r.notes)).toBe(true);
  });
  it('under 18 → no deficit and no surplus', () => {
    expect(safeTarget({ ...lose, age: 16, maintenance: 2200 }).kcal).toBe(2200);
    expect(safeTarget({ ...lose, goal: 'gain', age: 16, maintenance: 2200 }).kcal).toBe(2200);
  });
  it('BMI under 18.5 → weight loss not offered', () => {
    const r = safeTarget({ ...lose, weightKg: 50, heightCm: 170, maintenance: 1900 });
    expect(r).toEqual({ kcal: 1900, notes: ['bmi_low'] });
  });
  it('gain adds 10 %', () => expect(safeTarget({ ...lose, goal: 'gain', maintenance: 2000 }).kcal).toBe(2200));
});

describe('macros', () => {
  it('add up to the energy target (±10 kcal from rounding)', () => {
    const m = macrosFor(2000, { weightKg: 70, goal: 'lose', lowCarb: false });
    expect(m.protein).toBe(112);
    expect(Math.abs(m.protein * 4 + m.fat * 9 + m.carbs * 4 - 2000)).toBeLessThanOrEqual(10);
  });
  it('low-carb keeps carbs at 25 % of energy', () => {
    expect(macrosFor(2000, { weightKg: 70, goal: 'maintain', lowCarb: true }).carbs).toBe(125);
  });
  it('protein never exceeds 35 % of energy', () => {
    expect(macrosFor(1500, { weightKg: 150, goal: 'protein', lowCarb: false }).protein).toBe(131);
  });
});

describe('household', () => {
  it('one adult + partner without data + child', () => {
    const people = householdTargets({ ...base, adults: 2, others: [{}], children: [{ age: 6, sex: 'female' }] });
    expect(people.map((p) => p.kind)).toEqual(['me', 'adult', 'child']);
    expect(people[1]?.approximate).toBe(true);
    expect(totals(people).kcal).toBe(people.reduce((s, p) => s + p.kcal, 0));
  });
  it('a teenager filling in gets the EFSA value, never a deficit', () => {
    const [me] = householdTargets({
      ...base,
      goal: 'lose',
      me: { sex: 'female', age: 15, heightCm: 165, weightKg: 70 },
    });
    expect(me?.kcal).toBe(childKcal(15, 'female'));
    expect(me?.notes).toContain('under18');
  });
});

describe('questionnaire schema and steps', () => {
  it('accepts complete answers', () => expect(answers.safeParse(base).success).toBe(true));
  it('rejects pregnancy for a man', () =>
    expect(answers.safeParse({ ...base, health: 'pregnant' }).success).toBe(false));
  it('rejects body data without consent', () => {
    const rest: Partial<Answers> = { ...base };
    delete rest.consentAt;
    expect(answers.safeParse(rest).success).toBe(false);
    expect(stepComplete('body', { me: base.me, health: 'none' })).toBe(false);
  });
  it('continues where the person stopped', () => {
    expect(firstIncomplete({})).toBe(0);
    expect(firstIncomplete({ goal: 'lose', adults: 1, meals: '3' })).toBe(2);
  });
  it('slider default from household size', () => expect(defaultBudget(2, 2)).toBe(100));
});
