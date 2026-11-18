/**
 * npm run ingredients:import — loads the catalogue into the database (SUPABASE_DB_URL or DATABASE_URL).
 * Idempotent: upserts ingredients, replaces their synonyms, writes the USDA nutrition row (only when values
 * changed, so checked_at stays truthful). Ingredients removed from the CSV are deactivated, never deleted
 * (recipes may still reference them). Runs in one transaction.
 */
import { readFileSync } from 'node:fs';
import pg from 'pg';
import { parseCatalogue } from '../src/lib/ingredients/catalogue';
import { usdaSubset } from '../src/lib/ingredients/schema';

const url = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
if (!url) {
  console.error('ingredients:import — set SUPABASE_DB_URL (or DATABASE_URL)');
  process.exit(1);
}
const { rows, problems } = parseCatalogue(readFileSync('data/seed/ingredients_lt.csv', 'utf8'));
if (problems.length) {
  console.error('ingredients:import — the CSV has problems, run npm run ingredients:check');
  process.exit(1);
}
const usda = usdaSubset.parse(JSON.parse(readFileSync('data/seed/usda_sr_legacy.json', 'utf8')));

const client = new pg.Client({
  connectionString: url,
  ssl: /localhost|127\.0\.0\.1|\/tmp|host=\//.test(url) ? undefined : { rejectUnauthorized: false },
});
await client.connect();
try {
  await client.query('begin');
  for (const r of rows) {
    const food = r.usda_fdc_id ? usda.foods[r.usda_fdc_id] : undefined;
    if (r.usda_fdc_id && !food) throw new Error(`${r.slug}: USDA ${r.usda_fdc_id} missing`);
    await client.query(
      `insert into public.ingredients
         (slug, name, category, origin, default_unit, piece_g, density, allergens, composition_varies, usda_fdc_id, is_active)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
       on conflict (slug) do update set
         name = excluded.name, category = excluded.category, origin = excluded.origin,
         default_unit = excluded.default_unit, piece_g = excluded.piece_g, density = excluded.density,
         allergens = excluded.allergens, composition_varies = excluded.composition_varies,
         usda_fdc_id = excluded.usda_fdc_id, is_active = true`,
      [
        r.slug,
        { lt: r.name_lt, ru: r.name_ru },
        r.category,
        r.origin,
        r.unit,
        r.piece_g,
        r.density_g_ml,
        r.allergens,
        r.composition_varies,
        r.usda_fdc_id ? Number(r.usda_fdc_id) : null,
      ],
    );
    // Synonyms = both names + listed synonyms. Replaced as a whole so removed synonyms disappear.
    await client.query('delete from public.ingredient_synonyms where ingredient_slug = $1', [r.slug]);
    const terms: [string, string][] = [
      ['lt', r.name_lt],
      ['ru', r.name_ru],
      ...r.synonyms_lt.map((t): [string, string] => ['lt', t]),
      ...r.synonyms_ru.map((t): [string, string] => ['ru', t]),
    ];
    for (const [locale, term] of terms) {
      await client.query(
        `insert into public.ingredient_synonyms (ingredient_slug, locale, term) values ($1, $2, $3)
         on conflict do nothing`,
        [r.slug, locale, term],
      );
    }
    // no USDA record → no USDA row; nutrition comes only from product labels (phase 4)
    const source = food ? `usda:${r.usda_fdc_id}` : '';
    await client.query(
      `delete from public.ingredient_nutrition where ingredient_slug = $1 and source like 'usda:%' and source <> $2`,
      [r.slug, source],
    );
    if (!food) continue;
    await client.query(
      `insert into public.ingredient_nutrition (ingredient_slug, source, kcal, protein, fat, carbs, fiber)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (ingredient_slug, source) do update set
         kcal = excluded.kcal, protein = excluded.protein, fat = excluded.fat, carbs = excluded.carbs,
         fiber = excluded.fiber, checked_at = now()
       where (ingredient_nutrition.kcal, ingredient_nutrition.protein, ingredient_nutrition.fat,
              ingredient_nutrition.carbs, ingredient_nutrition.fiber)
         is distinct from (excluded.kcal, excluded.protein, excluded.fat, excluded.carbs, excluded.fiber)`,
      [r.slug, source, food.kcal, food.protein, food.fat, food.carbs, food.fiber],
    );
  }
  const off = await client.query(
    'update public.ingredients set is_active = false where is_active and not (slug = any($1))',
    [rows.map((r) => r.slug)],
  );
  await client.query('commit');
  console.log(`ingredients:import — ${rows.length} ingredients loaded, ${off.rowCount ?? 0} deactivated`);
} catch (e) {
  await client.query('rollback');
  throw e;
} finally {
  await client.end();
}
