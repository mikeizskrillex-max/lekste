import type { RetailerId } from '@/config/markets';
import { DEFAULT_CATALOG } from '@/retail/catalog';
import type { Catalog, PriceRecord } from '@/retail/types';

/** Long-lasting pantry items: only the part used this week counts towards the weekly cost. */
export const PANTRY = new Set(['olive_oil', 'honey', 'soy_sauce', 'sesame', 'peanut_butter', 'walnuts', 'sunflower_seeds', 'garlic']);

/** Cheapest record per kg for an ingredient across the given retailers. */
export function cheapest(id: string, catalog: Catalog = DEFAULT_CATALOG, stores?: RetailerId[]): PriceRecord | null {
  let best: PriceRecord | null = null;
  for (const r of Object.values(catalog[id] ?? {})) {
    if (!r || (stores && !stores.includes(r.retailer))) continue;
    if (!best || r.perKg < best.perKg) best = r;
  }
  return best;
}

/** Cost of the grams actually eaten at the cheapest per-kg price (recipe cost estimates). */
export function portionCost(id: string, grams: number, catalog: Catalog = DEFAULT_CATALOG): number {
  const c = cheapest(id, catalog);
  return c ? (c.perKg * grams) / 1000 : 0;
}

export interface BasketLine {
  ingredientId: string;
  /** consolidated grams needed for the week */
  grams: number;
  record: PriceRecord;
  packs: number;
  pantry: boolean;
  cost: number;
  /** saving vs the regular shelf price when on promotion */
  saving: number;
}

export interface Basket {
  stores: RetailerId[];
  lines: BasketLine[];
  total: number;
  saving: number;
  /** ingredients no selected retailer has a price for */
  missing: string[];
}

function lineCost(r: PriceRecord, grams: number, pantry: boolean): { cost: number; packs: number } {
  const packs = Math.max(1, Math.ceil(grams / r.grams));
  return { packs, cost: pantry ? (r.perKg * grams) / 1000 : packs * r.price };
}

/** Real shelf basket for a set of retailers: whole packages, cheapest store per item within the set. */
export function basketFor(need: Map<string, number>, stores: RetailerId[], catalog: Catalog = DEFAULT_CATALOG): Basket {
  const lines: BasketLine[] = [];
  const missing: string[] = [];
  for (const [id, grams] of need) {
    const pantry = PANTRY.has(id);
    let best: BasketLine | null = null;
    for (const s of stores) {
      const r = catalog[id]?.[s];
      if (!r) continue;
      const { cost, packs } = lineCost(r, grams, pantry);
      if (!best || cost < best.cost) {
        const saving = r.promo && r.regular ? (r.regular - r.price) * (pantry ? grams / r.grams : packs) : 0;
        best = { ingredientId: id, grams, record: r, packs, pantry, cost, saving };
      }
    }
    if (best) lines.push(best); else missing.push(id);
  }
  return {
    stores, lines, missing,
    total: lines.reduce((s, l) => s + l.cost, 0),
    saving: lines.reduce((s, l) => s + l.saving, 0),
  };
}

export interface StoreComparison { retailer: RetailerId; total: number; missing: number; covered: number }

/** Same basket priced at each retailer alone. Retailers without data report full "missing". */
export function compareStores(need: Map<string, number>, retailers: RetailerId[], catalog: Catalog = DEFAULT_CATALOG): StoreComparison[] {
  return retailers.map((r) => {
    const b = basketFor(need, [r], catalog);
    return { retailer: r, total: b.total, missing: b.missing.length, covered: b.lines.length };
  });
}

export type Strategy = 'single' | 'multi' | 'preferred';

export interface StrategyResult extends Basket {
  strategy: Strategy;
  visits: number;
  travelCost: number;
  /** total + travel cost: what the strategy is optimised for */
  effective: number;
}

/**
 * The three shopping strategies.
 * A single: cheapest retailer that covers the whole basket (or most of it).
 * B multi: best value across any combination of retailers, counting each extra store visit at `travelCost`.
 * C preferred: only the user's preferred retailers.
 * The cheapest items one by one are not always the cheapest trip: B weighs visits.
 */
export function strategies(need: Map<string, number>, retailers: RetailerId[], preferred: RetailerId[], travelCost: number, catalog: Catalog = DEFAULT_CATALOG): Record<Strategy, StrategyResult | null> {
  const withData = retailers.filter((r) => Object.values(catalog).some((b) => b[r]));
  const wrap = (b: Basket, strategy: Strategy): StrategyResult => {
    const visits = new Set(b.lines.map((l) => l.record.retailer)).size;
    const travel = Math.max(0, visits - 1) * travelCost;
    return { ...b, strategy, visits, travelCost: travel, effective: b.total + travel };
  };
  // A: fewest missing first, then cheapest
  const singles = withData.map((r) => basketFor(need, [r], catalog)).sort((a, b) => a.missing.length - b.missing.length || a.total - b.total);
  const single = singles[0] ? wrap(singles[0], 'single') : null;
  // B: every non-empty subset (≤ 5 retailers → ≤ 31 subsets)
  let multi: StrategyResult | null = null;
  for (let mask = 1; mask < 1 << withData.length; mask++) {
    const subset = withData.filter((_, i) => mask & (1 << i));
    const b = wrap(basketFor(need, subset, catalog), 'multi');
    if (!multi || b.missing.length < multi.missing.length || (b.missing.length === multi.missing.length && b.effective < multi.effective)) multi = b;
  }
  const pref = preferred.filter((r) => withData.includes(r));
  const preferredRes = pref.length ? wrap(basketFor(need, pref, catalog), 'preferred') : null;
  return { single, multi, preferred: preferredRes };
}
