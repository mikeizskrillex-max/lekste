/**
 * Company details and contacts. Empty fields are never shown on the site.
 * TODO(owner): fill in before switching Stripe to live mode (phase 11).
 */
export const company = {
  legalName: '',
  code: '',
  vatCode: '',
  address: '',
  supportEmail: '',
} as const;

export const site = {
  name: 'Lėkštė',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
} as const;

/** Stores supported at launch (owner decision, docs/decisions.md). */
export const STORES = ['barbora', 'rimi'] as const;
export type StoreCode = (typeof STORES)[number];
export const STORE_NAMES: Record<StoreCode, string> = { barbora: 'Barbora', rimi: 'Rimi' };

/** A price older than this is "unverified" and never enters a basket. */
export const PRICE_MAX_AGE_DAYS = Number(process.env.PRICE_MAX_AGE_DAYS ?? 14);
