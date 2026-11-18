import { z } from 'zod';
import { parseCsv } from '@/lib/csv';
import { packFromTitle } from './pack';
import { STORE_CODES, snapshot, type Snapshot } from './snapshot';

/**
 * CSV price import (owner decision: in addition to the weekly scrape). One row per product:
 *   store,external_id,url,title,price,regular_price,card_price,pack_size,pack_unit,in_stock,checked_at
 * Optional columns may be empty. checked_at (YYYY-MM-DD) defaults to the import day; it must not be in the future
 * and not older than 14 days, or the price would never reach a basket anyway.
 */
/** "0,69" → 0.69, "" → null; then checked by the given number schema */
const opt = (schema: z.ZodNumber) =>
  z
    .string()
    .transform((s) => (s.trim() === '' ? null : Number(s.replace(',', '.'))))
    .pipe(schema.nullable());

export const csvRow = z.object({
  store: z.enum(STORE_CODES),
  external_id: z.string().regex(/^[A-Za-z0-9._-]{1,64}$/),
  url: z.url().startsWith('https://'),
  title: z.string().min(2).max(300),
  price: opt(z.number().positive().max(10000)),
  regular_price: opt(z.number().positive().max(10000)),
  card_price: opt(z.number().positive().max(10000)),
  pack_size: opt(z.number().positive()),
  pack_unit: z.enum(['g', 'ml', 'pcs', '']),
  in_stock: z.enum(['yes', 'no', '']).transform((v) => v !== 'no'),
  checked_at: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/),
});

export interface CsvProblem {
  line: number;
  message: string;
}

export function parsePriceCsv(
  text: string,
  today: Date,
): { rows: { snapshot: Snapshot; checkedAt: Date }[]; problems: CsvProblem[] } {
  const rows: { snapshot: Snapshot; checkedAt: Date }[] = [];
  const problems: CsvProblem[] = [];
  parseCsv(text).forEach((raw, i) => {
    const line = i + 2;
    const r = csvRow.safeParse(raw);
    if (!r.success) {
      problems.push({ line, message: r.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`).join('; ') });
      return;
    }
    const d = r.data;
    if (d.price === null) {
      problems.push({ line, message: 'price is required' });
      return;
    }
    const checkedAt = d.checked_at ? new Date(`${d.checked_at}T12:00:00Z`) : today;
    const ageDays = (today.getTime() - checkedAt.getTime()) / 86_400_000;
    if (ageDays < -1 || ageDays > 14) {
      problems.push({ line, message: 'checked_at must be within the last 14 days' });
      return;
    }
    const pack = d.pack_size && d.pack_unit ? { size: d.pack_size, unit: d.pack_unit } : packFromTitle(d.title);
    const s = snapshot.safeParse({
      store: d.store,
      externalId: d.external_id,
      url: d.url,
      title: d.title,
      brand: null,
      categoryPath: null,
      packSize: pack?.size ?? null,
      packUnit: pack?.unit ?? null,
      soldByWeight: false,
      saleStepKg: null,
      price: d.price,
      regularPrice: d.regular_price,
      cardPrice: d.card_price,
      promoFrom: null,
      promoTo: null,
      unitPrice: null,
      unitPriceUnit: null,
      inStock: d.in_stock,
      ingredientsText: null,
      nutrients: null,
    });
    if (!s.success) problems.push({ line, message: s.error.issues.map((x) => x.message).join('; ') });
    else rows.push({ snapshot: s.data, checkedAt });
  });
  return { rows, problems };
}
