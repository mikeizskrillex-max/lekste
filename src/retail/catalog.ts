import { PRICES, PRICES_UPDATED_AT } from '@/data/prices';
import type { RetailerId } from '@/config/markets';
import { categoryOf, parseBrand } from './matching';
import type { Catalog, PriceRecord } from './types';

/** When the bundled Barbora/Rimi snapshot was collected (Europe/Vilnius). */
export const SNAPSHOT_AT = PRICES_UPDATED_AT;

/** The bundled, script-collected snapshot of public e-shop prices as PriceRecords. */
export const SNAPSHOT_RECORDS: PriceRecord[] = Object.entries(PRICES).flatMap(([ingredientId, byStore]) =>
  Object.entries(byStore).filter(([, o]) => o && o.available !== false).map(([retailer, o]) => ({
    retailer: retailer as RetailerId,
    ingredientId,
    match: 'exact' as const,
    name: o!.name,
    brand: parseBrand(o!.name),
    ean: null,
    category: categoryOf(ingredientId),
    grams: o!.grams,
    price: o!.price,
    regular: o!.regular,
    promo: o!.promo,
    promoValidFrom: o!.promoFrom ?? null,
    promoValidTo: o!.promoTo ?? null,
    loyalty: o!.loyalty ?? false,
    perKg: o!.perKg,
    url: o!.url,
    imageUrl: null,
    retrievedAt: o!.retrievedAt ?? SNAPSHOT_AT,
    source: 'public_catalog' as const,
    verification: 'snapshot' as const,
  })),
);

/**
 * Build the effective catalog: for every ingredient and retailer keep the most
 * recently retrieved record (ties: cheapest per kg). Demo records are excluded
 * unless explicitly requested, so they can never pose as real prices.
 */
export function buildCatalog(records: PriceRecord[], opts: { includeDemo?: boolean } = {}): Catalog {
  const out: Catalog = {};
  for (const r of records) {
    if (r.verification === 'demo' && !opts.includeDemo) continue;
    const slot = (out[r.ingredientId] ??= {});
    const cur = slot[r.retailer];
    if (!cur || r.retrievedAt > cur.retrievedAt || (r.retrievedAt === cur.retrievedAt && r.perKg < cur.perKg)) slot[r.retailer] = r;
  }
  return out;
}

export const DEFAULT_CATALOG: Catalog = buildCatalog(SNAPSHOT_RECORDS);

/** Retailers that have at least one usable price record in the catalog. */
export function retailersWithData(catalog: Catalog): RetailerId[] {
  const s = new Set<RetailerId>();
  for (const byStore of Object.values(catalog)) for (const k of Object.keys(byStore)) s.add(k as RetailerId);
  return [...s];
}

/** Latest retrieval time across the catalog (shown to users as "prices checked"). */
export function latestRetrieval(records: PriceRecord[]): string | null {
  return records.reduce<string | null>((m, r) => (!m || r.retrievedAt > m ? r.retrievedAt : m), null);
}
