import { describe, expect, it } from 'vitest';
import { basketFor, strategies } from '@/domain/pricing';
import { buildCatalog, DEFAULT_CATALOG, SNAPSHOT_RECORDS } from './catalog';
import { importPriceCsv, parseCsv } from './csv';
import { matchIngredient, parseGrams } from './matching';

describe('csv import', () => {
  it('parses quoted fields and semicolons', () => {
    expect(parseCsv('a;b\n"x; y";2')).toEqual([['a', 'b'], ['x; y', '2']]);
  });
  it('imports valid rows as unverified csv records and reports errors per line', () => {
    const r = importPriceCsv('retailer,product_name,price_eur,package_grams,ingredient_id\nlidl,Avižiniai dribsniai 500 g,0.49,500,oats\nfoo,X,1,100,oats\nlidl,Y,-1,100,oats');
    expect(r.records).toHaveLength(1);
    expect(r.records[0]).toMatchObject({ retailer: 'lidl', ingredientId: 'oats', source: 'csv_import', verification: 'unverified', perKg: 0.98 });
    expect(r.errors.map((e) => e.line)).toEqual([3, 4]);
  });
  it('rejects a file without required columns', () => {
    expect(importPriceCsv('name,price\nx,1').errors[0].message).toMatch(/Missing column/);
  });
});

describe('matching', () => {
  it('reads package size from product titles', () => {
    expect(parseGrams('Grikiai, 800 g')).toBe(800);
    expect(parseGrams('Pienas 2,5 %, 1 l')).toBe(1000);
  });
  it('matches product titles to ingredients', () => {
    expect(matchIngredient('Grikių kruopos 800 g')?.ingredientId).toBe('buckwheat');
  });
});

describe('catalog & strategies', () => {
  it('never includes demo records', () => {
    const demo = { ...SNAPSHOT_RECORDS[0], retailer: 'iki' as const, verification: 'demo' as const, source: 'demo' as const };
    expect(buildCatalog([...SNAPSHOT_RECORDS, demo])[demo.ingredientId]?.iki).toBeUndefined();
  });
  it('buys whole packages but pro-rates pantry items', () => {
    const b = basketFor(new Map([['oats', 100], ['olive_oil', 20]]), ['barbora', 'rimi']);
    const oats = b.lines.find((l) => l.ingredientId === 'oats')!;
    expect(oats.packs).toBe(1);
    expect(oats.cost).toBeCloseTo(oats.record.price);
    const oil = b.lines.find((l) => l.ingredientId === 'olive_oil')!;
    expect(oil.cost).toBeLessThan(oil.record.price);
  });
  it('multi-store strategy is never worse than the best single store (incl. travel)', () => {
    const need = new Map([['oats', 500], ['eggs', 600], ['chicken_breast', 1000], ['rice', 500], ['banana', 600]]);
    const s = strategies(need, ['maxima', 'barbora', 'rimi', 'lidl', 'iki'], ['rimi'], 1.5, DEFAULT_CATALOG);
    expect(s.multi && s.single).toBeTruthy();
    expect(s.multi!.effective).toBeLessThanOrEqual(s.single!.effective + 1e-9);
    expect(s.preferred!.lines.every((l) => l.record.retailer === 'rimi')).toBe(true);
  });
});
