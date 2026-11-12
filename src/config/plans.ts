/**
 * Subscription plans. These are the defaults from the original business
 * concept; the admin panel can override price and visibility (stored in
 * system_settings in production, in local storage in development mode).
 * Never hard-code prices in components — always read them from here.
 */
export type PlanId = 'intro2w' | 'monthly' | 'quarterly';

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
  active: boolean;
}

export const DEFAULT_PLANS: Plan[] = [
  { id: 'intro2w', price: 9.99, renewalPrice: 12.99, periodDays: 14, renewalDays: 30, stripePriceEnv: 'STRIPE_PRICE_INTRO_2W', active: true },
  { id: 'monthly', price: 12.99, renewalPrice: 12.99, periodDays: 30, renewalDays: 30, stripePriceEnv: 'STRIPE_PRICE_MONTHLY', highlighted: true, active: true },
  { id: 'quarterly', price: 29.99, renewalPrice: 29.99, periodDays: 90, renewalDays: 90, stripePriceEnv: 'STRIPE_PRICE_QUARTERLY', active: true },
];

export function planMonthlyEquivalent(p: Plan): number {
  return (p.renewalPrice / p.renewalDays) * 30;
}
