import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseCsv } from '@/lib/csv';
import { parseCatalogue } from '@/lib/ingredients/catalogue';
import { dietsOf, fitsDiet } from '@/lib/ingredients/diet';
import { searchNorm } from '@/lib/ingredients/normalize';
import { ENERGY_CHECK_EXEMPT, energyCheck, usdaSubset } from '@/lib/ingredients/schema';

describe('parseCsv', () => {
  it('handles quotes, escaped quotes, commas and CRLF', () => {
    const rows = parseCsv('a,b\r\n"x, y","say ""hi"""\r\n1,\n');
    expect(rows).toEqual([
      { a: 'x, y', b: 'say "hi"' },
      { a: '1', b: '' },
    ]);
  });
  it('rejects a row with the wrong number of fields', () => {
    expect(() => parseCsv('a,b\n1,2,3\n')).toThrow(/row 2/);
  });
  it('rejects an unterminated quote', () => {
    expect(() => parseCsv('a\n"x\n')).toThrow(/unterminated/);
  });
});

describe('searchNorm', () => {
  it('removes Lithuanian diacritics and case', () => {
    expect(searchNorm('  VIŠTIENOS   Krūtinėlė ')).toBe('vistienos krutinele');
    expect(searchNorm('ąčęėįšųūž')).toBe('aceeisuuz');
  });
  it('maps ё to the Cyrillic е', () => {
    expect(searchNorm('Ёжик')).toBe('ежик');
  });
  it('uses the same letters as public.search_norm in the migration', () => {
    const sql = readFileSync('supabase/migrations/0002_ingredients.sql', 'utf8');
    expect(sql).toContain(`translate(lower(t), 'ąčęėįšųūžё', 'aceeisuuzе')`);
  });
});

describe('diets', () => {
  it('derives diets from origin and allergens', () => {
    expect(dietsOf({ origin: 'plant', allergens: [] })).toEqual(['pescatarian', 'vegetarian', 'no_pork', 'vegan']);
    expect(dietsOf({ origin: 'dairy', allergens: ['milk'] })).toEqual(['pescatarian', 'vegetarian', 'no_pork']);
    expect(dietsOf({ origin: 'fish', allergens: ['fish'] })).toEqual(['pescatarian', 'no_pork']);
    expect(dietsOf({ origin: 'meat', allergens: [] })).toEqual(['no_pork']);
    expect(dietsOf({ origin: 'meat', allergens: [], tags: ['pork'] })).toEqual([]);
  });
  it('a plant product with milk is not vegan', () => {
    expect(fitsDiet({ origin: 'plant', allergens: ['milk', 'soy'] }, 'vegan')).toBe(false);
  });
  it('honey is vegetarian but not vegan', () => {
    expect(fitsDiet({ origin: 'honey', allergens: [] }, 'vegetarian')).toBe(true);
    expect(fitsDiet({ origin: 'honey', allergens: [] }, 'vegan')).toBe(false);
  });
});

describe('ingredient catalogue (data/seed)', () => {
  const { rows, problems } = parseCatalogue(readFileSync('data/seed/ingredients_lt.csv', 'utf8'));
  const usda = usdaSubset.parse(JSON.parse(readFileSync('data/seed/usda_sr_legacy.json', 'utf8')));

  it('parses without problems and has at least 120 ingredients', () => {
    expect(problems).toEqual([]);
    expect(rows.length).toBeGreaterThanOrEqual(120);
  });

  it('mentions no store other than Barbora and Rimi', () => {
    const text = readFileSync('data/seed/ingredients_lt.csv', 'utf8').toLowerCase();
    for (const banned of ['lidl', 'iki ', 'maxima']) expect(text).not.toContain(banned);
  });

  it('every ingredient has USDA values whose energy matches the macros', () => {
    for (const r of rows.filter((x) => x.usda_fdc_id)) {
      const food = usda.foods[r.usda_fdc_id];
      expect(food, r.slug).toBeDefined();
      if (food && !ENERGY_CHECK_EXEMPT[r.slug]) expect(energyCheck(food).ok, r.slug).toBe(true);
    }
  });

  it('flags a swapped label (energy check)', () => {
    expect(energyCheck({ kcal: 41, protein: 0.9, fat: 41, carbs: 9.6, fiber: 2.8 }).ok).toBe(false);
  });

  it('synonyms are unique across ingredients after normalisation', () => {
    const owner = new Map<string, string>();
    const clashes: string[] = [];
    for (const r of rows) {
      for (const t of [r.name_lt, r.name_ru, ...r.synonyms_lt, ...r.synonyms_ru]) {
        const k = searchNorm(t);
        const o = owner.get(k);
        if (o && o !== r.slug) clashes.push(`${t}: ${o} / ${r.slug}`);
        owner.set(k, r.slug);
      }
    }
    expect(clashes).toEqual([]);
  });
});
