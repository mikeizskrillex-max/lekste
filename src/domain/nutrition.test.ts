import { describe, expect, it } from 'vitest';
import { bmr, calcTargets, weeksToGoal } from './nutrition';

describe('nutrition', () => {
  it('computes Mifflin–St Jeor BMR', () => {
    // 72 kg, 168 cm, 31 y woman: 720 + 1050 - 155 - 161 = 1454
    expect(bmr('f', 72, 168, 31)).toBe(1454);
    expect(bmr('m', 80, 180, 30)).toBe(1780);
  });

  it('applies a 15% deficit for weight loss and keeps macros consistent', () => {
    const t = calcTargets({ goal: 'lose', sex: 'f', age: 31, heightCm: 168, weightKg: 72, activity: 'light' });
    expect(t.kcal).toBe(1700); // 1454 * 1.375 * 0.85 = 1699.4 -> 1700
    expect(t.protein).toBe(144);
    const energy = t.protein * 4 + t.fat * 9 + t.carbs * 4;
    expect(Math.abs(energy - t.kcal)).toBeLessThan(15);
  });

  it('never goes below the calorie floor', () => {
    const t = calcTargets({ goal: 'lose', sex: 'f', age: 70, heightCm: 150, weightKg: 45, activity: 'sedentary' });
    expect(t.kcal).toBeGreaterThanOrEqual(1200);
  });

  it('estimates weeks to goal at a safe pace', () => {
    expect(weeksToGoal({ goal: 'lose', weightKg: 80, targetWeightKg: 75 })).toBe(10);
    expect(weeksToGoal({ goal: 'keep', weightKg: 80, targetWeightKg: 75 })).toBeNull();
  });
});
