-- Lėkštė v2 · 0005 — ingredient availability in both stores (owner decision 2026-11-18).
-- both_stores: a confident match (auto/confirmed) with a basket-ready price in Barbora AND in Rimi.
-- A product that is gone for a week keeps both_stores for 14 days (like price freshness); after that — missing.

alter table public.ingredients
  add column last_seen_both_at timestamptz,
  add column availability_checked_at timestamptz;

-- Why an ingredient is (not) available in one store, for reports and the admin panel.
create or replace function public.store_availability(p_slug text, p_store text)
returns text
language sql stable security invoker set search_path = ''
as $$
  select case
    when exists (select 1 from public.basket_prices b where b.ingredient_slug = p_slug and b.store_code = p_store) then 'ok'
    when exists (
      select 1 from public.ingredient_store_matches m join public.store_products p on p.id = m.product_id
      where m.ingredient_slug = p_slug and p.store_code = p_store and m.status in ('auto', 'confirmed')
        and exists (select 1 from public.price_anomalies a where a.product_id = p.id and a.status = 'open')) then 'anomaly'
    when exists (
      select 1 from public.ingredient_store_matches m join public.store_products p on p.id = m.product_id
      where m.ingredient_slug = p_slug and p.store_code = p_store and m.status in ('auto', 'confirmed') and not p.in_stock) then 'out_of_stock'
    when exists (
      select 1 from public.ingredient_store_matches m join public.store_products p on p.id = m.product_id
      where m.ingredient_slug = p_slug and p.store_code = p_store and m.status in ('auto', 'confirmed')) then 'stale_price'
    when exists (
      select 1 from public.ingredient_store_matches m join public.store_products p on p.id = m.product_id
      where m.ingredient_slug = p_slug and p.store_code = p_store and m.status = 'needs_review') then 'only_doubtful'
    else 'no_product'
  end
$$;

-- Recompute availability_level for every active ingredient. Returns how many changed level.
create or replace function public.refresh_availability(p_now timestamptz default now())
returns int
language plpgsql security invoker set search_path = ''
as $$
declare changed int;
begin
  with s as (
    select i.slug,
           public.store_availability(i.slug, 'barbora') = 'ok' and public.store_availability(i.slug, 'rimi') = 'ok' as both_now,
           i.last_seen_both_at, i.availability_level as old_level
    from public.ingredients i where i.is_active
  ), n as (
    select slug, both_now,
           case when both_now then p_now else last_seen_both_at end as seen,
           old_level
    from s
  ), u as (
    update public.ingredients i
    set last_seen_both_at = n.seen,
        availability_checked_at = p_now,
        availability_level = case when n.seen is not null and n.seen > p_now - interval '14 days' then 'both_stores' else 'missing' end
    from n where i.slug = n.slug
    returning i.slug, n.old_level, i.availability_level
  )
  select count(*) into changed from u where old_level is distinct from availability_level;
  return changed;
end $$;
revoke execute on function public.refresh_availability(timestamptz) from public, anon, authenticated;
