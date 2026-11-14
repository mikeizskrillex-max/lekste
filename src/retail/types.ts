import type { RetailerId } from '@/config/markets';

export type { RetailerId };

/** How a price record was obtained. */
export type PriceSource = 'official_api' | 'authorized_feed' | 'public_catalog' | 'third_party' | 'csv_import' | 'demo';
/** How much we trust it. Demo records are never shown as real prices. */
export type Verification = 'verified' | 'snapshot' | 'unverified' | 'demo';
export type MatchQuality = 'exact' | 'approximate';

export type ProductCategory =
  | 'meat' | 'fish' | 'dairy' | 'eggs' | 'vegetables' | 'fruits' | 'grains' | 'pasta'
  | 'bread' | 'oils' | 'nuts' | 'frozen' | 'other';

/** One product on one retailer's shelf, with the price we know for it. */
export interface PriceRecord {
  retailer: RetailerId;
  /** our ingredient this product can be used for */
  ingredientId: string;
  match: MatchQuality;
  name: string;
  brand: string | null;
  ean: string | null;
  category: ProductCategory;
  /** package size in grams (or ml) */
  grams: number;
  price: number;
  /** regular price when the product is on promotion */
  regular: number | null;
  promo: boolean;
  promoValidFrom: string | null;
  promoValidTo: string | null;
  /** the promotion requires the retailer's loyalty card */
  loyalty?: boolean;
  /** earlier checks of the same product (weekly refresh), oldest first */
  history?: { d: string; p: number; promo: boolean }[];
  perKg: number;
  url: string | null;
  imageUrl: string | null;
  retrievedAt: string;
  source: PriceSource;
  verification: Verification;
}

/** ingredientId -> retailer -> best (cheapest per kg) record */
export type Catalog = Record<string, Partial<Record<RetailerId, PriceRecord>>>;
