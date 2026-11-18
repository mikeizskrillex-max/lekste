import { packFromTitle } from './pack';
import { snapshot, type LabelNutrients, type Snapshot } from './snapshot';

/**
 * Rimi product page → Snapshot. Name, SKU, price and availability come from the JSON-LD block; the old price,
 * Mano Rimi card price, promotion dates and unit price from the main product block; label data from the
 * product details, which the page keeps as JSON-encoded HTML strings.
 */
const decode = (s: string) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const euro = (s: string | undefined) => (s ? Number(s.replace(/\s/g, '').replace(',', '.')) : NaN);

interface LdProduct {
  name?: string;
  sku?: string;
  brand?: { name?: string } | string;
  offers?: { price?: string | number; availability?: string; url?: string };
}

function ldProduct(html: string): LdProduct | null {
  for (const m of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      const v = JSON.parse(m[1] ?? '') as LdProduct & { '@type'?: string };
      if (v['@type'] === 'Product') return v;
    } catch {
      // other JSON-LD blocks may be malformed; ignore them
    }
  }
  return null;
}

/** Details tabs are JS string literals: html: "<div ...>" — decode them as JSON strings. */
function detailsHtml(html: string): string {
  const parts: string[] = [];
  for (const m of html.matchAll(/html: ("(?:[^"\\]|\\.)*")/g)) {
    try {
      parts.push(JSON.parse(m[1] ?? '""') as string);
    } catch {
      // not a JSON string literal
    }
  }
  return parts.join('\n');
}

function labelNutrients(details: string): LabelNutrients | null {
  const rows = new Map<string, string>();
  for (const m of details.matchAll(/<tr>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/g)) {
    rows.set(decode(m[1] ?? '').toLowerCase(), decode(m[2] ?? ''));
  }
  const g = (key: string) => {
    const v = rows.get(key);
    const n = v ? Number((/(\d+(?:[.,]\d+)?)\s*g/i.exec(v)?.[1] ?? '').replace(',', '.')) : NaN;
    return Number.isFinite(n) ? n : null;
  };
  const energy = rows.get('energinė vertė');
  const kcal = energy ? Number((/(\d+(?:[.,]\d+)?)\s*kcal/i.exec(energy)?.[1] ?? '').replace(',', '.')) : NaN;
  const protein = g('baltymai');
  const fat = g('riebalai');
  const carbs = g('angliavandeniai');
  if (!Number.isFinite(kcal) || protein === null || fat === null || carbs === null) return null;
  return { kcal, protein, fat, carbs, fiber: g('skaidulinės medžiagos') };
}

function ingredientsText(details: string): string | null {
  const m = /<dt>\s*Sudedamosios dalys\s*<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/i.exec(details);
  return m ? decode(m[1] ?? '') || null : null;
}

const isoDay = (d: string) => {
  const [y, mo, da] = d.split('.');
  return `${y}-${mo}-${da}`;
};

export function parseRimi(html: string, url: string): Snapshot {
  const ld = ldProduct(html);
  if (!ld?.sku || !ld.name || ld.offers?.price === undefined) throw new Error('rimi: product data not found');
  const start = html.indexOf('product__main');
  const nameAt = html.indexOf('id="product_name"', start);
  if (start === -1 || nameAt === -1) throw new Error('rimi: product block not found');
  const imageBlock = html.slice(start, nameAt);
  const after = html.slice(nameAt, nameAt + 4000);

  const price = Number(ld.offers.price);
  const old = euro(/class="price__old-price">\s*([\d\s.,]+)\s*€/.exec(after)?.[1]);
  const card = imageBlock.includes('rimi-card')
    ? Number(
        `${/<span class="major">\s*(\d+)\s*<\/span>/.exec(imageBlock)?.[1] ?? ''}.${/<span class="cents">\s*(\d+)\s*<\/span>/.exec(imageBlock)?.[1] ?? ''}`,
      )
    : NaN;
  const per = /class="price-per">\s*([\d\s.,]+)\s*€\/(kg|l|vnt)\.?/i.exec(after);
  const valid = /galioja nuo (\d{4}\.\d{2}\.\d{2}) iki (\d{4}\.\d{2}\.\d{2})/.exec(after);
  const perUnit = per?.[2]?.toLowerCase();
  const sub = /<sub>\s*€\/(kg|vnt)\.?\s*<\/sub>/.exec(after)?.[1];
  const step = Number(/name="step" value="([\d.]+)"/.exec(after)?.[1] ?? NaN);
  const details = detailsHtml(html);
  const title = decode(ld.name);
  const pack = packFromTitle(title);
  const ldBrand = typeof ld.brand === 'string' ? ld.brand : (ld.brand?.name ?? null);
  const dtBrand = /<dt>\s*Prekės ženklas\s*<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/i.exec(details)?.[1];
  const brand = ldBrand || (dtBrand ? decode(dtBrand) : null);
  const path = new URL(url).pathname.split('/produktai/')[1]?.split('/').slice(0, -3).join('/') ?? null;

  return snapshot.parse({
    store: 'rimi',
    externalId: String(ld.sku),
    url,
    title,
    brand: brand || null,
    categoryPath: path || null,
    packSize: pack?.size ?? null,
    packUnit: pack?.unit ?? null,
    soldByWeight: sub === 'kg',
    saleStepKg: sub === 'kg' && Number.isFinite(step) && step > 0 ? step : null,
    price,
    regularPrice: Number.isFinite(old) && old > price ? old : null,
    cardPrice: Number.isFinite(card) && card > 0 && card < price ? card : null,
    promoFrom: valid?.[1] ? isoDay(valid[1]) : null,
    promoTo: valid?.[2] ? isoDay(valid[2]) : null,
    unitPrice: per ? euro(per[1]) : null,
    unitPriceUnit: perUnit === 'kg' || perUnit === 'l' ? perUnit : perUnit === 'vnt' ? 'pcs' : null,
    inStock: (ld.offers.availability ?? '').includes('InStock'),
    ingredientsText: ingredientsText(details),
    nutrients: labelNutrients(details),
  });
}
