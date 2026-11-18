-- Lėkštė v2 · 0002 — ingredient catalogue: ingredients, nutrition per source, synonyms, typo-tolerant search.
-- Data comes from data/seed/ingredients_lt.csv via `npm run ingredients:import` (not from this migration).

-- Same mapping as src/lib/ingredients/normalize.ts: lower case, no Lithuanian diacritics, ё → е, single spaces.
create or replace function public.search_norm(t text) returns text
language sql immutable strict parallel safe set search_path = ''
as $$ select btrim(regexp_replace(translate(lower(t), 'ąčęėįšųūžё', 'aceeisuuzе'), '\s+', ' ', 'g')) $$;

-- ---------- ingredients ----------
create table public.ingredients (
  slug text primary key check (slug ~ '^[a-z][a-z0-9_]{1,40}$'),
  name jsonb not null check (
    jsonb_typeof(name) = 'object' and length(coalesce(name ->> 'lt', '')) between 2 and 80),
  category text not null check (category in (
    'vegetables', 'herbs', 'fruit', 'dried_fruit', 'frozen', 'canned', 'grains', 'legumes', 'bakery', 'meat',
    'fish', 'dairy', 'eggs', 'oils', 'nuts_seeds', 'seasoning', 'spices', 'condiments', 'baking')),
  -- diets (vegetarian, vegan, pescatarian) are derived from origin + allergens in code, never stored by hand
  origin text not null check (origin in ('plant', 'dairy', 'egg', 'fish', 'seafood', 'meat', 'honey')),
  default_unit text not null check (default_unit in ('g', 'ml', 'pcs')),
  piece_g numeric(7, 2) check (piece_g > 0),
  density numeric(4, 2) check (density > 0 and density < 3),
  -- 14 EU allergens + lactose (src/lib/allergens)
  allergens text[] not null default '{}' check (allergens <@ array[
    'gluten', 'crustaceans', 'eggs', 'fish', 'peanuts', 'soy', 'milk', 'nuts', 'celery', 'mustard', 'sesame',
    'sulphites', 'lupin', 'molluscs', 'lactose']::text[]),
  -- composition depends on the product bought → "unknown" (= not allowed) for anyone with an allergy
  composition_varies boolean not null default false,
  -- set by phase 5 (`ingredients:verify`): only both_stores may appear in recipes
  availability_level text not null default 'unverified'
    check (availability_level in ('both_stores', 'missing', 'unverified')),
  usda_fdc_id int check (usda_fdc_id > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (default_unit <> 'pcs' or piece_g is not null),
  check (default_unit <> 'ml' or density is not null),
  check (not ('lactose' = any (allergens)) or 'milk' = any (allergens))
);
create trigger ingredients_touch before update on public.ingredients for each row execute function public.touch_updated_at();
alter table public.ingredients enable row level security;
create policy ingredients_read on public.ingredients for select to anon, authenticated using (is_active or public.is_admin());
create policy ingredients_admin_write on public.ingredients for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- nutrition per 100 g, one row per source ----------
-- usda:<fdc_id> for every ingredient; label:<store>:<product id> from product labels (phase 4).
-- What the planner uses is in the view ingredient_facts: average of labels if any, otherwise USDA.
create table public.ingredient_nutrition (
  id bigint generated always as identity primary key,
  ingredient_slug text not null references public.ingredients (slug) on delete cascade,
  source text not null check (source ~ '^(usda:[0-9]{4,7}|label:(barbora|rimi):[A-Za-z0-9._-]{1,64})$'),
  kcal numeric(6, 1) not null check (kcal between 0 and 900),
  protein numeric(5, 2) not null check (protein between 0 and 100),
  fat numeric(5, 2) not null check (fat between 0 and 100),
  carbs numeric(5, 2) not null check (carbs between 0 and 100),
  fiber numeric(5, 2) check (fiber between 0 and 100),
  checked_at timestamptz not null default now(),
  unique (ingredient_slug, source),
  check (protein + fat + carbs <= 101)
);
alter table public.ingredient_nutrition enable row level security;
create policy ingredient_nutrition_read on public.ingredient_nutrition for select to anon, authenticated using (true);
create policy ingredient_nutrition_admin_write on public.ingredient_nutrition for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- synonyms (names in both languages are synonyms too) ----------
create table public.ingredient_synonyms (
  id bigint generated always as identity primary key,
  ingredient_slug text not null references public.ingredients (slug) on delete cascade,
  locale text not null check (locale in ('lt', 'ru')),
  term text not null check (length(btrim(term)) between 2 and 80),
  term_norm text generated always as (public.search_norm(term)) stored,
  unique (ingredient_slug, locale, term_norm)
);
create index ingredient_synonyms_trgm on public.ingredient_synonyms using gin (term_norm extensions.gin_trgm_ops);
alter table public.ingredient_synonyms enable row level security;
create policy ingredient_synonyms_read on public.ingredient_synonyms for select to anon, authenticated using (true);
create policy ingredient_synonyms_admin_write on public.ingredient_synonyms for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- what the planner reads ----------
-- Owner decision 2026-11-18: label values (average over matched Barbora + Rimi products) where they exist,
-- otherwise USDA. nutrition_sources lists every source that went into the numbers.
create view public.ingredient_facts with (security_invoker = true) as
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
  coalesce(l.checked_at, u.checked_at) as nutrition_checked_at
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
grant select on public.ingredient_facts to anon, authenticated;

-- ---------- search: typos, no diacritics, lt and ru ----------
-- Matches whole terms (similarity) and words inside longer names (word_similarity), best term per ingredient.
create or replace function public.search_ingredients(q text, lim int default 10)
returns table (slug text, name jsonb, matched text, score real)
language sql stable security invoker set search_path = ''
as $$
  with n as (select public.search_norm(q) as q)
  select i.slug, i.name, best.term, best.score
  from (
    select distinct on (s.ingredient_slug) s.ingredient_slug, s.term,
           greatest(extensions.similarity(s.term_norm, n.q), extensions.word_similarity(n.q, s.term_norm)) as score
    from public.ingredient_synonyms s, n
    where length(n.q) >= 2
      and (s.term_norm operator(extensions.%) n.q or n.q operator(extensions.<%) s.term_norm
           or s.term_norm like n.q || '%')
    order by s.ingredient_slug, score desc, length(s.term)
  ) best
  join public.ingredients i on i.slug = best.ingredient_slug and i.is_active
  order by best.score desc, i.slug
  limit greatest(1, least(coalesce(lim, 10), 50))
$$;
grant execute on function public.search_ingredients(text, int) to anon, authenticated;
