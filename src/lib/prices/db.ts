import type pg from 'pg';
import { isPriceJump } from './anomaly';
import type { MatchResult } from './match';
import type { Snapshot, StoreCode } from './snapshot';

/**
 * Writes scrape results. Used by scripts (service connection, bypasses RLS). Each product is written in its own
 * transaction so one bad page never loses the rest of the run.
 */
export interface WriteOutcome {
  productId: string;
  changed: boolean;
  anomaly: 'jump_gt_50' | null;
}

export async function writeSnapshot(db: pg.Client, s: Snapshot, source: string, at: Date): Promise<WriteOutcome> {
  await db.query('begin');
  try {
    const prev = await db.query<{ id: string; price: string }>(
      'select id, price from public.store_products where store_code = $1 and external_id = $2 for update',
      [s.store, s.externalId],
    );
    const old = prev.rows[0] ? Number(prev.rows[0].price) : null;
    const row = await db.query<{ id: string }>(
      `insert into public.store_products
         (store_code, external_id, url, title, brand, category_path, pack_size, pack_unit, sold_by_weight, sale_step_kg,
          price, regular_price, card_price, promo_from, promo_to, unit_price, unit_price_unit, in_stock,
          ingredients_text, nutrients, source, checked_at, missing_since)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,null)
       on conflict (store_code, external_id) do update set
         url = excluded.url, title = excluded.title, brand = excluded.brand, category_path = excluded.category_path,
         pack_size = excluded.pack_size, pack_unit = excluded.pack_unit, sold_by_weight = excluded.sold_by_weight,
         sale_step_kg = excluded.sale_step_kg, price = excluded.price, regular_price = excluded.regular_price,
         card_price = excluded.card_price, promo_from = excluded.promo_from, promo_to = excluded.promo_to,
         unit_price = excluded.unit_price, unit_price_unit = excluded.unit_price_unit, in_stock = excluded.in_stock,
         ingredients_text = excluded.ingredients_text, nutrients = excluded.nutrients, source = excluded.source,
         checked_at = excluded.checked_at, missing_since = null
       returning id`,
      [
        s.store,
        s.externalId,
        s.url,
        s.title,
        s.brand,
        s.categoryPath,
        s.packSize,
        s.packUnit,
        s.soldByWeight,
        s.saleStepKg,
        s.price,
        s.regularPrice,
        s.cardPrice,
        s.promoFrom,
        s.promoTo,
        s.unitPrice,
        s.unitPriceUnit,
        s.inStock,
        s.ingredientsText,
        s.nutrients,
        source,
        at,
      ],
    );
    const productId = row.rows[0]?.id;
    if (!productId) throw new Error('store_products upsert returned no id');
    await db.query(
      `insert into public.price_history (product_id, price, regular_price, card_price, in_stock, source, checked_at)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [productId, s.price, s.regularPrice, s.cardPrice, s.inStock, source, at],
    );
    let anomaly: WriteOutcome['anomaly'] = null;
    if (isPriceJump(old, s.price)) {
      anomaly = 'jump_gt_50';
      await db.query(
        `insert into public.price_anomalies (product_id, kind, old_price, new_price) values ($1, 'jump_gt_50', $2, $3)
         on conflict (product_id, kind) where status = 'open' do update set new_price = excluded.new_price`,
        [productId, old, s.price],
      );
    }
    await db.query('commit');
    return { productId, changed: old === null || old !== s.price, anomaly };
  } catch (e) {
    await db.query('rollback');
    throw e;
  }
}

/** Admin decisions (confirmed / rejected) are never overwritten by the robot. */
export async function writeMatch(db: pg.Client, slug: string, productId: string, m: MatchResult): Promise<void> {
  if (m.status === 'rejected') {
    await db.query(
      `delete from public.ingredient_store_matches where ingredient_slug = $1 and product_id = $2 and status in ('auto', 'needs_review')`,
      [slug, productId],
    );
    return;
  }
  await db.query(
    `insert into public.ingredient_store_matches (ingredient_slug, product_id, confidence, status, reason)
     values ($1, $2, $3, $4, $5)
     on conflict (ingredient_slug, product_id) do update set
       confidence = excluded.confidence, reason = excluded.reason, updated_at = now(),
       status = case when ingredient_store_matches.status in ('confirmed', 'rejected')
                     then ingredient_store_matches.status else excluded.status end`,
    [slug, productId, m.confidence, m.status, m.reasons.join(',')],
  );
}

/** Label values of a product that confidently stands for an ingredient become a nutrition source. */
export async function writeLabelNutrition(db: pg.Client, slug: string, s: Snapshot, at: Date): Promise<void> {
  if (!s.nutrients) return;
  const n = s.nutrients;
  await db.query(
    `insert into public.ingredient_nutrition (ingredient_slug, source, kcal, protein, fat, carbs, fiber, checked_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     on conflict (ingredient_slug, source) do update set kcal = excluded.kcal, protein = excluded.protein,
       fat = excluded.fat, carbs = excluded.carbs, fiber = excluded.fiber, checked_at = excluded.checked_at`,
    [slug, `label:${s.store}:${s.externalId}`, n.kcal, n.protein, n.fat, n.carbs, n.fiber, at],
  );
}

/** Products we track that the store no longer has: out of stock + a "disappeared" item in the review queue. */
export async function markMissing(db: pg.Client, store: StoreCode, url: string, at: Date): Promise<boolean> {
  const r = await db.query<{ id: string; price: string }>(
    `update public.store_products set in_stock = false, missing_since = coalesce(missing_since, $3)
     where store_code = $1 and url = $2 returning id, price`,
    [store, url, at],
  );
  const p = r.rows[0];
  if (!p) return false;
  await db.query(
    `insert into public.price_anomalies (product_id, kind, old_price) values ($1, 'disappeared', $2)
     on conflict (product_id, kind) where status = 'open' do nothing`,
    [p.id, p.price],
  );
  return true;
}

/** URLs of products already matched to an ingredient, so they are re-checked every week. */
export async function trackedUrls(db: pg.Client, store: StoreCode): Promise<Map<string, string[]>> {
  const r = await db.query<{ url: string; slugs: string[] }>(
    `select p.url, array_agg(m.ingredient_slug) as slugs
     from public.ingredient_store_matches m join public.store_products p on p.id = m.product_id
     where p.store_code = $1 and m.status <> 'rejected' group by p.url`,
    [store],
  );
  return new Map(r.rows.map((x) => [x.url, x.slugs]));
}
