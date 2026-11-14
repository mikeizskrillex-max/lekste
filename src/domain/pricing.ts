import type { RetailerId } from '@/config/markets';
import { DEFAULT_CATALOG } from '@/retail/catalog';
import type { Recipe } from '@/data/recipes';
import type { Catalog, PriceRecord } from '@/retail/types';

/**
 * Promotion validity: a promotion is used only between its valid-from and
 * valid-to dates; afterwards the regular shelf price applies.
 */
export function effectiveRecord(r: PriceRecord, now = Date.now()): PriceRecord {
  if (!r.promo) return r;
  const from = r.promoValidFrom ? Date.parse(r.promoValidFrom) : -Infinity;
  const to = r.promoValidTo ? Date.parse(r.promoValidTo) + 86400000 : Infinity;
  if (now >= from && now < to) return r;
  if (!r.regular) return { ...r, promo: false };
  return { ...r, promo: false, price: r.regular, regular: null, perKg: (r.regular / r.grams) * 1000 };
}

/** Catalogue the planner prices recipes with (snapshot + admin CSV imports). Set by the app store. */
let active: Catalog = DEFAULT_CATALOG;
let storeCache = new Map<string, WeakMap<Recipe, StoreCost>>();
export function setActiveCatalog(c: Catalog) { if (c !== active) { active = c; storeCache = new Map(); } }
export const activeCatalog = () => active;

export interface StoreCost { cost: number; missing: string[]; promo: string[]; promoSaving: number }

/**
 * Cost of one serving at ONE supermarket, using its promotions. Ingredients
 * that store has no price for are counted at the cheapest known price and
 * reported in `missing`, so the planner can avoid them.
 */
export function recipeAtStore(r: Recipe, store: RetailerId, catalog: Catalog = active): StoreCost {
  const cacheable = catalog === active;
  let byRecipe = storeCache.get(store);
  if (cacheable && !byRecipe) { byRecipe = new WeakMap(); storeCache.set(store, byRecipe); }
  const hit = cacheable ? byRecipe!.get(r) : undefined;
  if (hit) return hit;
  const out: StoreCost = { cost: 0, missing: [], promo: [], promoSaving: 0 };
  for (const [id, g] of r.items) {
    const raw = catalog[id]?.[store];
    if (!raw) { out.missing.push(id); const c = cheapest(id, catalog); out.cost += c ? (c.perKg * g) / 1000 : 0; continue; }
    const e = effectiveRecord(raw);
    out.cost += (e.perKg * g) / 1000;
    if (e.promo) { out.promo.push(id); if (e.regular) out.promoSaving += (((e.regular - e.price) / e.grams) * g); }
  }
  if (cacheable) byRecipe!.set(r, out);
  return out;
}

/** Long-lasting pantry items: only the part used this week counts towards the weekly cost. */
export const PANTRY = new Set(['olive_oil', 'honey', 'soy_sauce', 'sesame', 'peanut_butter', 'walnuts', 'sunflower_seeds', 'garlic']);

/** Cheapest record per kg for an ingredient across the given retailers. */
export function cheapest(id: string, catalog: Catalog = DEFAULT_CATALOG, stores?: RetailerId[]): PriceRecord | null {
  let best: PriceRecord | null = null;
  for (const raw of Object.values(catalog[id] ?? {})) {
    if (!raw || (stores && !stores.includes(raw.retailer))) continue;
    const r = effectiveRecord(raw);
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
      const raw = catalog[id]?.[s];
      if (!raw) continue;
      const r = effectiveRecord(raw);
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

export interface StoreComparison { retailer: RetailerId; total: number; missing: number; covered: number; saving: number }

/** Same basket priced at each retailer alone. Retailers without data report full "missing". */
export function compareStores(need: Map<string, number>, retailers: RetailerId[], catalog: Catalog = DEFAULT_CATALOG): StoreComparison[] {
  return retailers.map((r) => {
    const b = basketFor(need, [r], catalog);
    return { retailer: r, total: b.total, missing: b.missing.length, covered: b.lines.length, saving: b.saving };
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
