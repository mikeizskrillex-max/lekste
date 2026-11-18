-- Lėkštė v2 · 0006 — recipes. Text in lt + ru; nutrition, allergens and diets are computed from ingredients
-- (view recipe_facts), never stored. Menus read menu_recipes: checked recipes whose every ingredient is in both
-- stores this week and has nutrition data.

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,80}$'),
  title jsonb not null check (jsonb_typeof(title) = 'object' and length(coalesce(title ->> 'lt', '')) >= 2),
  description jsonb not null check (jsonb_typeof(description) = 'object' and description ? 'lt'),
  steps jsonb not null check (jsonb_typeof(steps) = 'array' and jsonb_array_length(steps) between 2 and 12),
  servings int not null check (servings between 1 and 8),
  time_active_min int not null check (time_active_min between 1 and 180),
  time_total_min int not null check (time_total_min between 1 and 480),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  equipment text[] not null check (equipment <@ array['stove', 'oven', 'multicooker', 'blender', 'microwave', 'none']::text[]),
  meal text not null check (meal in ('breakfast', 'lunch', 'dinner', 'snack')),
  cuisine text not null check (cuisine in ('lithuanian', 'east_european', 'international')),
  season text[] not null check (season <@ array['all', 'winter', 'spring', 'summer', 'autumn']::text[]),
  kid_friendly boolean not null default false,
  photo text,
  -- about 300 recipes are fully public (owner decision); others show title, photo and nutrition without steps
  is_public boolean not null default false,
  source text not null check (length(source) between 3 and 200),
  status text not null default 'draft' check (status in ('draft', 'auto_checked', 'reviewed', 'rejected')),
  review_sample boolean not null default false,
  reject_reasons text[] not null default '{}',
  reviewed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (time_active_min <= time_total_min)
);
create trigger recipes_touch before update on public.recipes for each row execute function public.touch_updated_at();
alter table public.recipes enable row level security;
create policy recipes_read on public.recipes for select to anon, authenticated
  using (status in ('auto_checked', 'reviewed') or public.is_admin());
create policy recipes_admin_write on public.recipes for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.recipe_ingredients (
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  ingredient_slug text not null references public.ingredients (slug),
  -- grams for the whole recipe
  grams numeric(8, 1) not null check (grams > 0 and grams <= 5000),
  primary key (recipe_id, ingredient_slug)
);
alter table public.recipe_ingredients enable row level security;
create policy recipe_ingredients_read on public.recipe_ingredients for select to anon, authenticated
  using (exists (select 1 from public.recipes r where r.id = recipe_id));
create policy recipe_ingredients_admin_write on public.recipe_ingredients for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Per-serving nutrition, allergens and diets from ingredient_facts (label average, otherwise USDA).
create view public.recipe_facts with (security_invoker = true) as
select
  r.id as recipe_id, r.slug, r.servings,
  round(sum(f.kcal_100g * ri.grams / 100) / r.servings) as kcal,
  round(sum(f.protein_100g * ri.grams / 100) / r.servings, 1) as protein,
  round(sum(f.fat_100g * ri.grams / 100) / r.servings, 1) as fat,
  round(sum(f.carbs_100g * ri.grams / 100) / r.servings, 1) as carbs,
  round(sum(ri.grams) / r.servings) as grams_per_serving,
  coalesce(array(select distinct a from public.recipe_ingredients x join public.ingredients i on i.slug = x.ingredient_slug,
                 unnest(i.allergens) a where x.recipe_id = r.id order by a), '{}') as allergens,
  bool_or(f.composition_varies) as composition_varies,
  bool_and(f.origin not in ('meat', 'fish', 'seafood')) as vegetarian,
  bool_and(f.origin = 'plant' and not (f.allergens && array['milk', 'eggs', 'fish', 'crustaceans', 'molluscs', 'lactose'])) as vegan,
  bool_and(f.origin <> 'meat') as pescatarian,
  bool_and(not ('pork' = any (f.tags))) as no_pork,
  bool_and(f.kcal_100g is not null) as has_nutrition,
  bool_and(f.availability_level = 'both_stores') as in_both_stores
from public.recipes r
join public.recipe_ingredients ri on ri.recipe_id = r.id
join public.ingredient_facts f on f.slug = ri.ingredient_slug
group by r.id;
grant select on public.recipe_facts to anon, authenticated;

-- The only recipes a menu may use this week.
create view public.menu_recipes with (security_invoker = true) as
select r.*, f.kcal, f.protein, f.fat, f.carbs, f.grams_per_serving, f.allergens, f.composition_varies,
       f.vegetarian, f.vegan, f.pescatarian, f.no_pork
from public.recipes r join public.recipe_facts f on f.recipe_id = r.id
where r.status in ('auto_checked', 'reviewed') and f.has_nutrition and f.in_both_stores;
grant select on public.menu_recipes to anon, authenticated;
