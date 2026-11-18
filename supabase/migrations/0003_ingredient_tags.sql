-- Lėkštė v2 · 0003 — ingredient tags for diet filters ("be kiaulienos" needs to know which products are pork).
alter table public.ingredients
  add column tags text[] not null default '{}' check (tags <@ array['pork']::text[]);

-- ingredient_facts exposes the tags too (the view is recreated with the new column at the end)
create or replace view public.ingredient_facts with (security_invoker = true) as
select
  i.slug, i.name, i.category, i.origin, i.default_unit, i.piece_g, i.density, i.allergens,
  i.composition_varies, i.availability_level,
  coalesce(l.kcal, u.kcal) as kcal_100g,
  coalesce(l.protein, u.protein) as protein_100g,
  coalesce(l.fat, u.fat) as fat_100g,
  coalesce(l.carbs, u.carbs) as carbs_100g,
  case when l.n is not null then l.fiber else u.fiber end as fiber_100g,
  case when l.n is not null then 'label_avg' when u.source is not null then 'usda' end as nutrition_basis,
  case when l.n is not null then l.sources when u.source is not null then array[u.source] end as nutrition_sources,
  coalesce(l.checked_at, u.checked_at) as nutrition_checked_at,
  i.tags
from public.ingredients i
left join lateral (
  select count(*) as n, round(avg(kcal), 1) as kcal, round(avg(protein), 2) as protein, round(avg(fat), 2) as fat,
         round(avg(carbs), 2) as carbs, round(avg(fiber), 2) as fiber,
         array_agg(source order by source) as sources, max(checked_at) as checked_at
  from public.ingredient_nutrition n
  where n.ingredient_slug = i.slug and n.source like 'label:%'
  having count(*) > 0
) l on true
left join lateral (
  select n.source, n.kcal, n.protein, n.fat, n.carbs, n.fiber, n.checked_at
  from public.ingredient_nutrition n
  where n.ingredient_slug = i.slug and n.source like 'usda:%'
  order by n.checked_at desc
  limit 1
) u on true
where i.is_active;
