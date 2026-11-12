import type { RetailerId } from '@/config/markets';
import { categoryOf, matchIngredient, parseBrand, parseGrams } from './matching';
import type { PriceRecord } from './types';

export const CSV_COLUMNS = [
  'retailer', 'product_name', 'price_eur', 'package_grams', 'regular_price_eur', 'ingredient_id', 'brand', 'ean',
  'promo_valid_from', 'promo_valid_to', 'url',
] as const;

export const CSV_TEMPLATE = `${CSV_COLUMNS.join(',')}
lidl,"Vištienos krūtinėlės filė, 1 kg",6.49,1000,7.99,chicken_breast,,4770000000001,2026-11-16,2026-11-22,
iki,"Grikiai, 800 g",1.19,800,,,,,,,
`;

const RETAILERS: RetailerId[] = ['maxima', 'barbora', 'rimi', 'lidl', 'iki'];

/** Minimal RFC-4180 CSV parser (quotes, escaped quotes, commas or semicolons). */
export function parseCsv(text: string): string[][] {
  const delim = (text.split('\n')[0].match(/;/g)?.length ?? 0) > (text.split('\n')[0].match(/,/g)?.length ?? 0) ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c;
    } else if (c === '"') q = true;
    else if (c === delim) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((x) => x.trim() !== '')) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim() !== '')) rows.push(row);
  return rows;
}

export interface ImportResult {
  records: PriceRecord[];
  errors: { line: number; message: string }[];
  approximate: number;
}

const num = (s: string | undefined) => (s && s.trim() !== '' ? Number(s.replace(',', '.')) : NaN);

/** Validate and convert a retailer price CSV into PriceRecords (source: csv_import). */
export function importPriceCsv(text: string, retrievedAt = new Date().toISOString()): ImportResult {
  const rows = parseCsv(text.replace(/^﻿/, ''));
  const errors: ImportResult['errors'] = [];
  const records: PriceRecord[] = [];
  if (rows.length === 0) return { records, errors: [{ line: 1, message: 'Empty file' }], approximate: 0 };
  const header = rows[0].map((h) => h.trim().toLowerCase());
  for (const required of ['retailer', 'product_name', 'price_eur'] as const) {
    if (!header.includes(required)) errors.push({ line: 1, message: `Missing column: ${required}` });
  }
  if (errors.length) return { records, errors, approximate: 0 };
  const col = (r: string[], name: string) => r[header.indexOf(name)]?.trim() ?? '';
  let approximate = 0;
  rows.slice(1).forEach((r, i) => {
    const line = i + 2;
    const retailer = col(r, 'retailer').toLowerCase() as RetailerId;
    const name = col(r, 'product_name');
    const price = num(col(r, 'price_eur'));
    if (!RETAILERS.includes(retailer)) return errors.push({ line, message: `Unknown retailer "${col(r, 'retailer')}"` });
    if (!name) return errors.push({ line, message: 'Empty product_name' });
    if (!(price > 0) || price > 1000) return errors.push({ line, message: `Invalid price_eur "${col(r, 'price_eur')}"` });
    let ingredientId = col(r, 'ingredient_id');
    let match: PriceRecord['match'] = 'exact';
    if (!ingredientId) {
      const m = matchIngredient(name);
      if (!m) return errors.push({ line, message: `Could not match "${name}" to an ingredient — add ingredient_id` });
      ingredientId = m.ingredientId;
      match = m.match;
    }
    const grams = num(col(r, 'package_grams')) || parseGrams(name, ingredientId);
    if (!grams || grams <= 0) return errors.push({ line, message: `Unknown package size for "${name}" — add package_grams` });
    const regular = num(col(r, 'regular_price_eur'));
    if (match === 'approximate') approximate++;
    records.push({
      retailer, ingredientId, match, name,
      brand: col(r, 'brand') || parseBrand(name),
      ean: col(r, 'ean') || null,
      category: categoryOf(ingredientId),
      grams, price,
      regular: regular > 0 ? regular : null,
      promo: regular > price,
      promoValidFrom: col(r, 'promo_valid_from') || null,
      promoValidTo: col(r, 'promo_valid_to') || null,
      perKg: Math.round((price / grams) * 1000 * 100) / 100,
      url: col(r, 'url') || null,
      imageUrl: null,
      retrievedAt,
      source: 'csv_import',
      verification: 'unverified',
    });
    return undefined;
  });
  return { records, errors, approximate };
}
