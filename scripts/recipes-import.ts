/**
 * npm run recipes:import — data/recipes/*.json → public.recipes + recipe_ingredients (SUPABASE_DB_URL or
 * DATABASE_URL). Idempotent by slug; admin decisions made in the database (reviewed / rejected) are kept.
 */
import pg from 'pg';
import { loadRecipes } from '../src/lib/recipes/load';

const url = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
if (!url) {
  console.error('recipes:import — set SUPABASE_DB_URL (or DATABASE_URL)');
  process.exit(1);
}
const db = new pg.Client({
  connectionString: url,
  ssl: /localhost|127\.0\.0\.1|\/tmp|host=\//.test(url) ? undefined : { rejectUnauthorized: false },
});
await db.connect();
const all = loadRecipes();
try {
  await db.query('begin');
  for (const { recipe: r } of all) {
    const row = await db.query<{ id: string }>(
      `insert into public.recipes (slug, title, description, steps, servings, time_active_min, time_total_min, difficulty,
         equipment, meal, cuisine, season, kid_friendly, photo, source, status, review_sample, reject_reasons, created_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       on conflict (slug) do update set title = excluded.title, description = excluded.description, steps = excluded.steps,
         servings = excluded.servings, time_active_min = excluded.time_active_min, time_total_min = excluded.time_total_min,
         difficulty = excluded.difficulty, equipment = excluded.equipment, meal = excluded.meal, cuisine = excluded.cuisine,
         season = excluded.season, kid_friendly = excluded.kid_friendly, photo = coalesce(excluded.photo, recipes.photo),
         source = excluded.source, review_sample = excluded.review_sample, reject_reasons = excluded.reject_reasons,
         status = case when recipes.status in ('reviewed', 'rejected') then recipes.status else excluded.status end
       returning id`,
      [
        r.slug,
        r.title,
        r.description,
        JSON.stringify(r.steps),
        r.servings,
        r.timeActiveMin,
        r.timeTotalMin,
        r.difficulty,
        r.equipment,
        r.meal,
        r.cuisine,
        r.season,
        r.kidFriendly,
        r.photo,
        r.source,
        r.status,
        r.reviewSample,
        r.rejectReasons,
        r.createdAt,
      ],
    );
    const id = row.rows[0]?.id;
    if (!id) throw new Error(`no id for ${r.slug}`);
    await db.query('delete from public.recipe_ingredients where recipe_id = $1', [id]);
    for (const i of r.ingredients) {
      await db.query('insert into public.recipe_ingredients (recipe_id, ingredient_slug, grams) values ($1, $2, $3)', [
        id,
        i.slug,
        i.grams,
      ]);
    }
  }
  await db.query('commit');
  console.log(`recipes:import — ${all.length} recipes loaded`);
} catch (e) {
  await db.query('rollback');
  throw e;
} finally {
  await db.end();
}
