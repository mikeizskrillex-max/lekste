import { describe, expect, it } from 'vitest';
import { PLANS, perMonthEur, TRIAL_DAYS } from '@/lib/plans';

describe('plans', () => {
  it('prices are 8,99 / 19,99 / 79,99 € with a 7-day trial on subscriptions', () => {
    expect(PLANS.map((p) => p.priceEur)).toEqual([8.99, 19.99, 79.99]);
    expect(TRIAL_DAYS).toBe(7);
    expect(PLANS.filter((p) => p.trial).map((p) => p.id)).toEqual(['monthly', 'quarterly']);
  });
  it('3 months ≈ 6,66 € per month, never rounded up', () => {
    expect(perMonthEur(PLANS[1]!)).toBe(6.66);
    expect(perMonthEur(PLANS[0]!)).toBe(8.99);
    expect(perMonthEur(PLANS[2]!)).toBeNull();
  });
});
