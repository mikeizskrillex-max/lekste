import { PRICES, type StoreId, type StoreOffer } from '../data/prices';

export const STORES: StoreId[] = ['barbora', 'rimi'];

/** Long-lasting pantry items: only the part used this week counts towards the weekly cost. */
export const PANTRY = new Set(['olive_oil', 'honey', 'soy_sauce', 'sesame', 'peanut_butter', 'walnuts']);

/** Cheapest offer per kg for an ingredient across stores. */
export function cheapest(id: string): { store: StoreId; offer: StoreOffer } | null {
  const offers = PRICES[id];
  if (!offers) return null;
  let best: { store: StoreId; offer: StoreOffer } | null = null;
  for (const s of STORES) {
    const o = offers[s];
    if (o && (!best || o.perKg < best.offer.perKg)) best = { store: s, offer: o };
  }
  return best;
}

/** Cost of the grams actually eaten, at the cheapest per-kg price. */
export function portionCost(id: string, grams: number): number {
  const c = cheapest(id);
  return c ? (c.offer.perKg * grams) / 1000 : 0;
}

export interface BasketLine {
  ingredientId: string;
  grams: number;
  store: StoreId;
  offer: StoreOffer;
  packs: number;
  /** true when only the used part of a pantry package is counted */
  pantry: boolean;
  cost: number;
  /** saving vs the regular price when the product is on promotion */
  saving: number;
}

/** Real shelf basket: whole packages, from one store or the cheapest mix. */
export function basket(need: Map<string, number>, mode: StoreId | 'mix'): { lines: BasketLine[]; total: number; saving: number; missing: string[] } {
  const lines: BasketLine[] = [];
  const missing: string[] = [];
  for (const [id, grams] of need) {
    const offers = PRICES[id] ?? {};
    let pick: { store: StoreId; offer: StoreOffer } | null = null;
    if (mode === 'mix') {
      for (const s of STORES) {
        const o = offers[s];
        if (!o) continue;
        const price = (x: StoreOffer) => (PANTRY.has(id) ? (x.perKg * grams) / 1000 : Math.ceil(grams / x.grams) * x.price);
        const cost = price(o);
        const cur = pick ? price(pick.offer) : Infinity;
        if (cost < cur) pick = { store: s, offer: o };
      }
    } else if (offers[mode]) {
      pick = { store: mode, offer: offers[mode]! };
    }
    if (!pick) { missing.push(id); continue; }
    const pantry = PANTRY.has(id);
    const packs = Math.max(1, Math.ceil(grams / pick.offer.grams));
    const cost = pantry ? (pick.offer.perKg * grams) / 1000 : packs * pick.offer.price;
    const saving = pick.offer.promo && pick.offer.regular ? (pick.offer.regular - pick.offer.price) * (pantry ? grams / pick.offer.grams : packs) : 0;
    lines.push({ ingredientId: id, grams, store: pick.store, offer: pick.offer, packs, pantry, cost, saving });
  }
  return {
    lines,
    total: lines.reduce((s, l) => s + l.cost, 0),
    saving: lines.reduce((s, l) => s + l.saving, 0),
    missing,
  };
}
