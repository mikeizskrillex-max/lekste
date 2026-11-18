import { packFromTitle } from './pack';
import { snapshot, type LabelNutrients, type Snapshot } from './snapshot';

/**
 * Barbora product page → Snapshot. The page embeds its data as JSON in `window.__remixContext = {...};`.
 * The product is the object that has shopCode, title, price and comparativeUnit. Throws if the page has no
 * product (removed, redirected, layout changed) — the caller records that as a failed page.
 */
type Json = null | boolean | number | string | Json[] | { [k: string]: Json };
type Obj = { [k: string]: Json };

const isObj = (v: Json | undefined): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: Json | undefined): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const str = (v: Json | undefined): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);

export function remixContext(html: string): Json {
  const start = html.indexOf('window.__remixContext = ');
  if (start === -1) throw new Error('barbora: no __remixContext');
  const from = start + 'window.__remixContext = '.length;
  const end = html.indexOf(';</script>', from);
  if (end === -1) throw new Error('barbora: unterminated __remixContext');
  return JSON.parse(html.slice(from, end)) as Json;
}

function findProduct(node: Json, depth = 0): Obj | null {
  if (depth > 40) return null;
  if (Array.isArray(node)) {
    for (const n of node) {
      const f = findProduct(n, depth + 1);
      if (f) return f;
    }
    return null;
  }
  if (!isObj(node)) return null;
  if (
    typeof node.shopCode === 'string' &&
    typeof node.title === 'string' &&
    'price' in node &&
    'comparativeUnit' in node
  ) {
    return node;
  }
  for (const v of Object.values(node)) {
    const f = findProduct(v, depth + 1);
    if (f) return f;
  }
  return null;
}

function nutrients(v: Json | undefined): LabelNutrients | null {
  if (!isObj(v)) return null;
  const val = (k: string) => {
    const e = v[k];
    return isObj(e) ? num(e.value) : null;
  };
  const kcal = val('calories');
  const protein = val('protein');
  const fat = val('fat');
  const carbs = val('carbohydrates');
  if (kcal === null || protein === null || fat === null || carbs === null) return null;
  return { kcal, protein, fat, carbs, fiber: val('fibre') ?? val('fiber') };
}

const day = (v: Json | undefined) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null);

export function parseBarbora(html: string, url: string): Snapshot {
  const p = findProduct(remixContext(html));
  if (!p) throw new Error('barbora: product not found on page');
  const shown = num(p.price);
  if (shown === null) throw new Error('barbora: no price');
  const promo = isObj(p.promotion) ? p.promotion : null;
  const oldPrice = promo ? num(promo.oldPrice) : null;
  const cardOnly = promo?.loyaltyCardRequired === true;
  // shown price is the card price when the promotion needs an Ačiū card; the no-card price is the old one
  const price = cardOnly && oldPrice ? oldPrice : shown;
  const cardPrice = cardOnly && oldPrice ? shown : null;
  const regularPrice = !cardOnly && oldPrice && oldPrice > shown ? oldPrice : null;
  const comparative = isObj(p.comparativeUnit) ? p.comparativeUnit : null;
  const unit = isObj(p.unit) ? p.unit : null;
  const compUnit = str(comparative?.type);
  const title = str(p.title) ?? '';
  const fromTitle = packFromTitle(title);
  const net = num(p.netAmount);

  return snapshot.parse({
    store: 'barbora',
    externalId: str(p.id) ?? '',
    url,
    title,
    brand: str(p.brand),
    categoryPath: str(p.categoryPathUrl),
    packSize: fromTitle?.size ?? (net && net > 0 ? net : null),
    packUnit: fromTitle?.unit ?? (net && net > 0 ? 'g' : null),
    soldByWeight: unit?.type === 'kg',
    saleStepKg: unit?.type === 'kg' ? num(unit.step) : null,
    price,
    regularPrice,
    cardPrice: cardPrice !== null && cardPrice < price ? cardPrice : null,
    promoFrom: promo ? day(promo.validFrom) : null,
    promoTo: promo ? day(promo.validTo) : null,
    unitPrice: num(comparative?.price),
    unitPriceUnit:
      compUnit === 'kg' || compUnit === 'l' ? compUnit : compUnit === 'units' || compUnit === 'vnt' ? 'pcs' : null,
    inStock: p.status === 'active',
    ingredientsText: str(p.ingredients),
    nutrients: nutrients(p.nutrients),
  });
}
