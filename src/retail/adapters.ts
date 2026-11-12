/**
 * Retailer adapters. Each supermarket implements the same interface; the rest
 * of the app only sees PriceRecords. Server-side only.
 *
 * Rules every adapter follows: public pages only, no logins, no CAPTCHA
 * bypass, one request at a time with a pause, an honest User-Agent, and the
 * retailer's terms and robots rules must be checked before enabling it in
 * production (RETAILER_FETCH_ENABLED). A retailer without a lawful,
 * verifiable source stays CSV-only.
 */
import type { RetailerId } from '@/config/markets';
import { categoryOf, matchesIngredient, parseBrand, parseGrams } from './matching';
import { SEARCH_QUERIES } from './searchQueries';
import type { PriceRecord } from './types';

export interface RetailerAdapter {
  id: RetailerId;
  kind: 'public_catalog' | 'csv_only';
  /** Search the retailer for one ingredient; returns candidate records. */
  search?(ingredientId: string, query: string): Promise<PriceRecord[]>;
}

const UA = 'LeksteBot/0.1 (+price comparison; contact via website)';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const num = (s: string) => Number(s.replace(',', '.'));
const decode = (s: string) => s.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'");

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'lt-LT' }, cache: 'no-store' });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.text();
}

function record(retailer: RetailerId, ingredientId: string, name: string, price: number, grams: number | null, perKg: number | null, regular: number | null, url: string | null): PriceRecord | null {
  const g = grams ?? (perKg ? Math.round((price / perKg) * 1000) : null);
  if (!g) return null;
  return {
    retailer, ingredientId, match: 'exact', name, brand: parseBrand(name), ean: null, category: categoryOf(ingredientId),
    grams: g, price, regular, promo: regular !== null && regular > price, promoValidFrom: null, promoValidTo: null,
    perKg: perKg ?? Math.round((price / g) * 100000) / 100, url, imageUrl: null,
    retrievedAt: new Date().toISOString(), source: 'public_catalog', verification: 'snapshot',
  };
}

/** Rimi e-shop public search page. */
export function parseRimi(html: string, ingredientId: string): PriceRecord[] {
  const out: PriceRecord[] = [];
  for (const chunk of html.split('data-product-code="').slice(1, 13)) {
    const name = chunk.match(/class="card__name">([^<]+)</)?.[1];
    const price = chunk.match(/([0-9]+[.,][0-9]+)\s*€\s*už\s*(vnt|kg)/);
    if (!name || !price) continue;
    const per = chunk.match(/Kaina\s*už\s*vienetą:\s*([0-9,]+)\s*€\s*\/\s*(kg|l|vnt)/);
    const old = chunk.match(/Įprasta kaina:\s*([0-9,]+)/);
    const url = chunk.match(/href="(\/e-parduotuve\/lt\/produktai\/[^"]+)"/)?.[1];
    const title = decode(name.trim());
    if (!matchesIngredient(title, ingredientId)) continue;
    const r = record('rimi', ingredientId, title, num(price[1]), parseGrams(title, ingredientId),
      per && (per[2] === 'kg' || per[2] === 'l') ? num(per[1]) : null, old ? num(old[1]) : null, url ? `https://www.rimi.lt${url}` : null);
    if (r) out.push(r);
  }
  return out;
}

/** Barbora public search page. */
export function parseBarbora(html: string, ingredientId: string): PriceRecord[] {
  const out: PriceRecord[] = [];
  for (const chunk of html.split('data-cnstrc-item-id="').slice(1, 13)) {
    const name = chunk.match(/data-cnstrc-item-name="([^"]+)"/)?.[1];
    const price = chunk.match(/data-cnstrc-item-price="([0-9.]+)"/)?.[1];
    if (!name || !price) continue;
    const per = chunk.match(/(kilogramo|litro) kaina:\s*([0-9,]+)€/);
    const url = chunk.match(/href="(\/produktai\/[^"]+)"/)?.[1];
    const title = decode(name.trim());
    if (!matchesIngredient(title, ingredientId)) continue;
    const r = record('barbora', ingredientId, title, Number(price), parseGrams(title, ingredientId), per ? num(per[2]) : null, null, url ? `https://barbora.lt${url}` : null);
    if (r) out.push(r);
  }
  return out;
}

export const ADAPTERS: Record<RetailerId, RetailerAdapter> = {
  rimi: { id: 'rimi', kind: 'public_catalog', search: async (id, q) => parseRimi(await fetchText(`https://www.rimi.lt/e-parduotuve/lt/paieska?${new URLSearchParams({ query: q })}`), id) },
  barbora: { id: 'barbora', kind: 'public_catalog', search: async (id, q) => parseBarbora(await fetchText(`https://barbora.lt/paieska?${new URLSearchParams({ q })}`), id) },
  maxima: { id: 'maxima', kind: 'csv_only' },
  lidl: { id: 'lidl', kind: 'csv_only' },
  iki: { id: 'iki', kind: 'csv_only' },
};

/** Lithuanian search queries per ingredient (what a shopper would type). */
export function searchQuery(ingredientId: string): string {
  return SEARCH_QUERIES[ingredientId] ?? ingredientId.replace(/_/g, ' ');
}

/** Refresh one retailer for all ingredients, politely (one request every 2.5 s). */
export async function refreshRetailer(retailer: RetailerId, ingredientIds: string[], onProgress?: (done: number) => void): Promise<PriceRecord[]> {
  const a = ADAPTERS[retailer];
  if (!a.search) return [];
  const out: PriceRecord[] = [];
  for (const [i, id] of ingredientIds.entries()) {
    const found = await a.search(id, searchQuery(id)).catch(() => []);
    const best = found.sort((x, y) => x.perKg - y.perKg)[0];
    if (best) out.push(best);
    onProgress?.(i + 1);
    await sleep(2500);
  }
  return out;
}
