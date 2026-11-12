import type { Activity, QuizAnswers, Targets } from './types';

const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
};

/** Basal metabolic rate, Mifflin–St Jeor. */
export function bmr(sex: 'f' | 'm', weightKg: number, heightCm: number, age: number): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'm' ? 5 : -161);
}

type TargetInput = Pick<QuizAnswers, 'goal' | 'sex' | 'age' | 'heightCm' | 'weightKg' | 'activity'>;

/**
 * Daily calorie and macro targets. Deliberately conservative:
 * -15% for weight loss with a floor, +10% for gain, protein by body weight,
 * fat at 27% of energy, carbs take the rest.
 */
export function calcTargets(a: TargetInput): Targets {
  const tdee = bmr(a.sex, a.weightKg, a.heightCm, a.age) * ACTIVITY_FACTOR[a.activity];
  const floor = a.sex === 'm' ? 1500 : 1200;
  let kcal = tdee;
  if (a.goal === 'lose') kcal = Math.max(tdee * 0.85, floor);
  if (a.goal === 'gain') kcal = tdee * 1.1;
  kcal = Math.round(kcal / 10) * 10;

  const proteinPerKg = a.goal === 'lose' || a.goal === 'gain' ? 2.0 : 1.6;
  const protein = Math.round(a.weightKg * proteinPerKg);
  const fat = Math.round((kcal * 0.27) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  const pace = a.goal === 'lose' ? -0.5 : a.goal === 'gain' ? 0.25 : 0;
  return { kcal, protein, fat, carbs, pace };
}

/** Rough weeks to reach target weight at the safe pace. */
export function weeksToGoal(a: Pick<QuizAnswers, 'goal' | 'weightKg' | 'targetWeightKg'>): number | null {
  if (a.goal !== 'lose' && a.goal !== 'gain') return null;
  const diff = Math.abs(a.weightKg - a.targetWeightKg);
  if (diff < 0.5) return null;
  const pace = a.goal === 'lose' ? 0.5 : 0.25;
  return Math.ceil(diff / pace);
}
