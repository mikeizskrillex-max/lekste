/**
 * Safety limits for calorie targets (SPEC §9). Owner decision 2026-11-18: "standard" limits.
 * TODO: проверить диетологом.
 *
 * - Never below MIN_KCAL (women 1200, men 1500) — common clinical floor for unsupervised diets.
 * - Deficit at most 20 % of maintenance and at most ~0.75 % of body weight per week (≈ 7700 kcal per kg).
 * - No deficit under 18, in pregnancy, while breastfeeding, with a chronic illness, or with BMI < 18.5.
 * - If maintenance itself is under the floor, no deficit is offered and the person is gently pointed to a doctor.
 */
import type { Sex } from './efsa';

export const MIN_KCAL: Readonly<Record<Sex, number>> = { female: 1200, male: 1500 };
export const MAX_DEFICIT_SHARE = 0.2;
export const MAX_WEEKLY_LOSS_SHARE = 0.0075;
export const KCAL_PER_KG = 7700;
export const BMI_MIN_FOR_LOSS = 18.5;
export const GAIN_SURPLUS_SHARE = 0.1;

export type SafetyNote =
  | 'under18' // no deficit for teenagers
  | 'health' // pregnancy, breastfeeding, chronic illness → no deficit, talk to a doctor
  | 'bmi_low' // BMI < 18.5 → weight loss not offered
  | 'rate_capped' // deficit limited by the weekly loss limit
  | 'min_floor' // target raised to the minimum
  | 'maintenance_low'; // maintenance is already under the minimum → no deficit, talk to a doctor

export interface GoalInput {
  goal: 'lose' | 'maintain' | 'gain' | 'protein' | 'healthier' | 'cheaper';
  maintenance: number;
  sex: Sex;
  age: number;
  weightKg: number;
  heightCm: number;
  health: 'none' | 'pregnant' | 'breastfeeding' | 'chronic';
}

export function bmi(weightKg: number, heightCm: number): number {
  return weightKg / (heightCm / 100) ** 2;
}

/** Calorie target after the goal, never outside the safety limits. */
export function safeTarget(p: GoalInput): { kcal: number; notes: SafetyNote[] } {
  const notes: SafetyNote[] = [];
  if (p.age < 18) notes.push('under18');
  if (p.health !== 'none') notes.push('health');

  if (p.goal === 'gain') {
    // a surplus is not a deficit, but teenagers get their EFSA value unchanged
    return { kcal: Math.round(p.age < 18 ? p.maintenance : p.maintenance * (1 + GAIN_SURPLUS_SHARE)), notes };
  }
  if (p.goal !== 'lose') return { kcal: Math.round(p.maintenance), notes };

  if (notes.length) return { kcal: Math.round(p.maintenance), notes };
  if (bmi(p.weightKg, p.heightCm) < BMI_MIN_FOR_LOSS) return { kcal: Math.round(p.maintenance), notes: ['bmi_low'] };

  const floor = MIN_KCAL[p.sex];
  if (p.maintenance <= floor) return { kcal: Math.round(p.maintenance), notes: ['maintenance_low'] };

  const byShare = p.maintenance * MAX_DEFICIT_SHARE;
  const byRate = (p.weightKg * MAX_WEEKLY_LOSS_SHARE * KCAL_PER_KG) / 7;
  if (byRate < byShare) notes.push('rate_capped');
  let kcal = p.maintenance - Math.min(byShare, byRate);
  if (kcal < floor) {
    kcal = floor;
    notes.push('min_floor');
  }
  return { kcal: Math.round(kcal), notes };
}

/** Notes after which the result screen says «aptarkite su gydytoju». */
export function needsDoctor(notes: readonly SafetyNote[]): boolean {
  return notes.includes('health') || notes.includes('maintenance_low') || notes.includes('bmi_low');
}
