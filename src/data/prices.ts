/**
 * REAL shelf prices from the public Barbora (Maxima) and Rimi e-shops, read
 * from each product's own page by scripts/refresh-prices.mjs (run weekly by
 * .github/workflows/refresh-prices.yml). Data lives in data/prices.json.
 * perKg uses the store's own unit price when it gives one.
 */
import data from '../../data/prices.json';

export interface StoreOffer {
  name: string; price: number; grams: number; perKg: number; promo: boolean; regular: number | null; url: string | null;
  promoFrom: string | null; promoTo: string | null;
  /** promotion needs the store's loyalty card (Maxima "Ačiū", "Mano Rimi") */
  loyalty: boolean;
  available: boolean;
  retrievedAt: string;
}
export type StoreId = 'barbora' | 'rimi';
export const PRICES_UPDATED_AT: string = data.updatedAt;
export const PRICES_DATE = data.updatedAt.slice(0, 10);
export const STORE_LABEL: Record<StoreId, string> = { barbora: 'Barbora (Maxima)', rimi: 'Rimi' };
export const PRICES = data.offers as Record<string, Partial<Record<StoreId, StoreOffer>>>;
