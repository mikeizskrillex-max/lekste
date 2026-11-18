/**
 * Builds data/seed/usda_sr_legacy.json: kcal, protein, fat, carbs and fiber per 100 g for every usda_fdc_id
 * in data/seed/ingredients_lt.csv, taken from the official USDA FoodData Central "SR Legacy" CSV download
 * (public domain). Run after adding ingredients:  npm run usda:extract [-- path/to/sr_legacy.zip]
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseCsv } from '../src/lib/csv';
import { parseCatalogue } from '../src/lib/ingredients/catalogue';
import type { UsdaSubset } from '../src/lib/ingredients/schema';

const URL = 'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip';
// FoodData Central nutrient ids
const NUTRIENTS = { '1008': 'kcal', '1003': 'protein', '1004': 'fat', '1005': 'carbs', '1079': 'fiber' } as const;

const work = mkdtempSync(join(tmpdir(), 'usda-'));
let zip = process.argv[2];
if (!zip) {
  zip = join(work, 'sr.zip');
  console.log(`Downloading ${URL}`);
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`download failed: HTTP ${res.status}`);
  writeFileSync(zip, Buffer.from(await res.arrayBuffer()));
}
execFileSync('unzip', ['-oq', zip, '-d', work]);
const dir = join(work, readdirSync(work).find((d) => d.startsWith('FoodData_Central')) ?? '');

const { rows, problems } = parseCatalogue(readFileSync('data/seed/ingredients_lt.csv', 'utf8'));
if (problems.length) throw new Error(`fix ingredients_lt.csv first (npm run ingredients:check)`);
const wanted = new Set(rows.map((r) => r.usda_fdc_id).filter(Boolean));

const descriptions = new Map(
  parseCsv(readFileSync(join(dir, 'food.csv'), 'utf8')).map((f) => [f.fdc_id, f.description]),
);
const values = new Map<string, Record<string, number>>();
for (const r of parseCsv(readFileSync(join(dir, 'food_nutrient.csv'), 'utf8'))) {
  const id = r.fdc_id ?? '';
  const key = NUTRIENTS[r.nutrient_id as keyof typeof NUTRIENTS];
  if (!wanted.has(id) || !key) continue;
  values.set(id, { ...values.get(id), [key]: Number(r.amount) });
}

const foods: UsdaSubset['foods'] = {};
for (const id of [...wanted].sort()) {
  const v = values.get(id);
  const description = descriptions.get(id);
  if (!v || !description || v.kcal === undefined) throw new Error(`USDA ${id}: not found or no energy value`);
  foods[id] = {
    description,
    kcal: v.kcal,
    protein: v.protein ?? 0,
    fat: v.fat ?? 0,
    carbs: v.carbs ?? 0,
    fiber: v.fiber ?? null,
  };
}
const out: UsdaSubset = {
  source: 'USDA FoodData Central, SR Legacy (April 2018 release), https://fdc.nal.usda.gov',
  licence: 'Public domain (CC0 1.0). Values per 100 g edible portion.',
  foods,
};
writeFileSync('data/seed/usda_sr_legacy.json', JSON.stringify(out, null, 1) + '\n');
console.log(`usda:extract — ${Object.keys(foods).length} foods written to data/seed/usda_sr_legacy.json`);
