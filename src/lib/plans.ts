/**
 * Subscription plans (prices include PVM). Single source for the site and, in phase 11, for Stripe.
 * Owner decision 2026-11-18: 8,99 € / 30 d · 19,99 € / 90 d · 79,99 € once.
 */
export const TRIAL_DAYS = 7;

export type PlanId = 'monthly' | 'quarterly' | 'lifetime';
export type Plan = {
  id: PlanId;
  priceEur: number;
  /** null = one-time payment */
  periodDays: number | null;
  trial: boolean;
  highlighted: boolean;
};

export const PLANS: readonly Plan[] = [
  { id: 'monthly', priceEur: 8.99, periodDays: 30, trial: true, highlighted: false },
  { id: 'quarterly', priceEur: 19.99, periodDays: 90, trial: true, highlighted: true },
  { id: 'lifetime', priceEur: 79.99, periodDays: null, trial: false, highlighted: false },
] as const;

/** Price per 30 days, for "≈ 6,66 €/mėn." — rounded down to the cent so it never overstates the saving. */
export function perMonthEur(plan: Plan): number | null {
  if (!plan.periodDays) return null;
  return Math.floor((plan.priceEur / plan.periodDays) * 30 * 100) / 100;
}

/** Features each plan unlocks (feature flags, SPEC §10). Free: questionnaire, norm, first day of own menu, basket total. */
export const FEATURES = {
  free: ['questionnaire', 'norm', 'firstDay', 'basketTotal'],
  paid: ['fullWeek', 'shoppingList', 'assistant', 'nextWeek', 'history', 'favorites'],
} as const;
