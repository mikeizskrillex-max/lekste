/**
 * Subscription plans. These are the defaults from the original business
 * concept; the admin panel can override price and visibility (stored in
 * system_settings in production, in local storage in development mode).
 * Never hard-code prices in components — always read them from here.
 */
/** Free trial for subscriptions (card required, charged on day 8 unless cancelled). */
export const TRIAL_DAYS = 7;

export type PlanId = 'monthly' | 'quarterly' | 'lifetime';

export interface Plan {
  id: PlanId;
  /** first charge in EUR, VAT included */
  price: number;
  /** what is charged on renewal, EUR */
  renewalPrice: number;
  /** length of the first period in days */
  periodDays: number;
  /** renewal period in days */
  renewalDays: number;
  stripePriceEnv: string;
  highlighted?: boolean;
  /** one payment, access forever (no renewal) */
  oneTime?: boolean;
  active: boolean;
}

export const DEFAULT_PLANS: Plan[] = [
  { id: 'monthly', price: 9, renewalPrice: 9, periodDays: 30, renewalDays: 30, stripePriceEnv: 'STRIPE_PRICE_MONTHLY', active: true },
  { id: 'quarterly', price: 20, renewalPrice: 20, periodDays: 90, renewalDays: 90, stripePriceEnv: 'STRIPE_PRICE_QUARTERLY', highlighted: true, active: true },
  { id: 'lifetime', price: 80, renewalPrice: 0, periodDays: 0, renewalDays: 0, stripePriceEnv: 'STRIPE_PRICE_LIFETIME', oneTime: true, active: true },
];

export function planMonthlyEquivalent(p: Plan): number {
  return p.oneTime ? 0 : (p.renewalPrice / p.renewalDays) * 30;
}
