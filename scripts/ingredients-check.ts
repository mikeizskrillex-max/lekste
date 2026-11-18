/**
 * npm run ingredients:check — validates data/seed/ingredients_lt.csv against data/seed/usda_sr_legacy.json:
 * schema, duplicates, USDA id exists and its description matches, energy vs. macros, macros ≤ 100 g.
 * Exits 1 on any problem. Runs in CI.
 */
import { readFileSync } from 'node:fs';
import { parseCatalogue } from '../src/lib/ingredients/catalogue';
import { ENERGY_CHECK_EXEMPT, energyCheck, macrosFit, usdaSubset } from '../src/lib/ingredients/schema';

const { rows, problems } = parseCatalogue(readFileSync('data/seed/ingredients_lt.csv', 'utf8'));
const usda = usdaSubset.parse(JSON.parse(readFileSync('data/seed/usda_sr_legacy.json', 'utf8')));
const errors = problems.map((p) => `line ${p.line} (${p.slug}): ${p.message}`);

for (const row of rows) {
  const food = usda.foods[row.usda_fdc_id];
  if (!food) {
    errors.push(`${row.slug}: USDA ${row.usda_fdc_id} missing — run npm run usda:extract`);
    continue;
  }
  if (food.description !== row.usda_description) {
    errors.push(`${row.slug}: USDA description differs ("${food.description}")`);
  }
  if (!macrosFit(food)) errors.push(`${row.slug}: protein + fat + carbs > 100 g`);
  const energy = energyCheck(food);
  if (!energy.ok && !ENERGY_CHECK_EXEMPT[row.slug]) {
    errors.push(`${row.slug}: ${food.kcal} kcal but macros give ≈ ${Math.round(energy.estimate)} kcal`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  console.error(`ingredients:check — ${errors.length} problem(s) in ${rows.length} rows`);
  process.exit(1);
}
const withAllergens = rows.filter((r) => r.allergens.length).length;
const varies = rows.filter((r) => r.composition_varies).length;
console.log(
  `ingredients:check — ${rows.length} ingredients OK (${withAllergens} with allergens, ${varies} "composition depends on product")`,
);
