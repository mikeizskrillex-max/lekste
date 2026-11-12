-- Lėkštė: initial schema. Run in Supabase SQL editor or with `supabase db push`.
-- Every user-owned table has Row Level Security: users see only their own rows.
-- Catalogue tables (ingredients, products, promotions, recipes) are readable by everyone
-- and writable only by admins.

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  language text not null default 'lt' check (language in ('lt', 'ru')),
  sex text check (sex in ('f', 'm')),
  birth_year int,
  height_cm int,
  weight_kg numeric(5,1),
  target_weight_kg numeric(5,1),
  goal text check (goal in ('lose', 'keep', 'gain', 'healthy')),
  activity text,
  household_size int default 1,
  weekly_budget_eur numeric(7,2),
  stores text[] default '{}',
  kcal_target int, protein_g int, fat_g int, carbs_g int,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz default now()
);

create table public.user_preferences (
  user_id uuid primary key references auth.users on delete cascade,
  allergens text[] default '{}',
  lactose_intolerant boolean default false,
  diet_type text default 'any',
  never_ingredients text[] default '{}',
  avoid_ingredients text[] default '{}',
  liked_proteins text[] default '{}',
  liked_cuisines text[] default '{}',
  meals_per_day int default 4,
  breakfast_style text default 'sweet',
  cooking_time_max int default 30,
  equipment text[] default '{}',
  batch_cooking boolean default false,
  spice_level int default 1,
  updated_at timestamptz default now()
);

create table public.consents (
  id bigserial primary key,
  user_id uuid references auth.users on delete cascade,
  type text not null check (type in ('health_data', 'terms', 'immediate_start')),
  version text not null,
  accepted_at timestamptz default now()
);

create table public.subscriptions (
  user_id uuid primary key references auth.users on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text,
  status text,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false
);

create table public.ingredients (
  id text primary key,
  name_lt text not null, name_ru text not null, emoji text,
  category text,
  allergens text[] default '{}',
  diet_flags text[] default '{}',
  kcal_100g numeric, protein_100g numeric, fat_100g numeric, carbs_100g numeric, fiber_100g numeric, sugar_100g numeric,
  is_veg boolean default false
);

create table public.products (
  id bigserial primary key,
  ingredient_id text references public.ingredients,
  store text not null,
  name text not null,
  url text,
  package_grams int,
  price_eur numeric(7,2),
  allergens text[] default '{}'
);

create table public.promotions (
  id bigserial primary key,
  product_id bigint references public.products on delete cascade,
  promo_price_eur numeric(7,2) not null,
  regular_price_eur numeric(7,2),
  valid_from date not null,
  valid_to date not null
);

create table public.recipes (
  id text primary key,
  name_lt text not null, name_ru text not null, emoji text,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'snack', 'dinner')),
  cuisine text, minutes int, difficulty int default 1,
  equipment text[] default '{}', spice_level int default 0, breakfast_style text,
  steps_lt text[] default '{}', steps_ru text[] default '{}',
  status text not null default 'draft' check (status in ('draft', 'approved', 'archived')),
  source text default 'manual' check (source in ('manual', 'ai')),
  image_url text,
  image_status text default 'none' check (image_status in ('none', 'pending', 'approved', 'rejected')),
  image_prompt text
);

create table public.recipe_ingredients (
  recipe_id text references public.recipes on delete cascade,
  ingredient_id text references public.ingredients,
  grams numeric not null,
  primary key (recipe_id, ingredient_id)
);

create table public.meal_plans (
  id bigserial primary key,
  user_id uuid references auth.users on delete cascade,
  week_start date not null,
  status text not null default 'draft' check (status in ('draft', 'approved', 'published')),
  total_cost_eur numeric(7,2),
  explanation text,
  created_at timestamptz default now()
);

create table public.meal_plan_items (
  id bigserial primary key,
  plan_id bigint references public.meal_plans on delete cascade,
  day int check (day between 0 and 6),
  slot int,
  meal_type text,
  recipe_id text references public.recipes,
  servings numeric(4,2) default 1
);

create table public.food_logs (
  id bigserial primary key,
  user_id uuid references auth.users on delete cascade,
  date date not null,
  meal_type text,
  source text check (source in ('plan', 'search', 'custom')),
  recipe_id text references public.recipes,
  food_name text, grams numeric, kcal numeric, protein numeric, fat numeric, carbs numeric
);

create table public.weight_logs (user_id uuid references auth.users on delete cascade, date date, weight_kg numeric(5,1), primary key (user_id, date));
create table public.water_logs (user_id uuid references auth.users on delete cascade, date date, glasses int, primary key (user_id, date));
create table public.meal_feedback (
  id bigserial primary key,
  user_id uuid references auth.users on delete cascade,
  recipe_id text references public.recipes,
  rating text check (rating in ('up', 'down')),
  reason text, ingredient_id text,
  created_at timestamptz default now()
);

-- helper: is the current user an admin?
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- RLS: own rows
do $$
declare t text;
begin
  foreach t in array array['user_preferences','consents','subscriptions','food_logs','weight_logs','water_logs','meal_feedback'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy own_rows on public.%I for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin())', t);
  end loop;
end $$;

alter table public.profiles enable row level security;
create policy own_profile on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy own_profile_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = 'user');
create policy own_profile_insert on public.profiles for insert with check (id = auth.uid() and role = 'user');

alter table public.meal_plans enable row level security;
create policy own_plans on public.meal_plans for select using ((user_id = auth.uid() and status = 'published') or public.is_admin());
create policy admin_plans on public.meal_plans for all using (public.is_admin()) with check (public.is_admin());

alter table public.meal_plan_items enable row level security;
create policy own_plan_items on public.meal_plan_items for select using (
  public.is_admin() or exists (select 1 from public.meal_plans p where p.id = plan_id and p.user_id = auth.uid() and p.status = 'published'));
create policy admin_plan_items on public.meal_plan_items for all using (public.is_admin()) with check (public.is_admin());

-- subscriptions are written only by the Stripe webhook (service role), never by the client
drop policy own_rows on public.subscriptions;
create policy read_own_sub on public.subscriptions for select using (user_id = auth.uid() or public.is_admin());

-- catalogue: public read, admin write
do $$
declare t text;
begin
  foreach t in array array['ingredients','products','promotions','recipe_ingredients'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy public_read on public.%I for select using (true)', t);
    execute format('create policy admin_write on public.%I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;
alter table public.recipes enable row level security;
create policy read_approved on public.recipes for select using (status = 'approved' or public.is_admin());
create policy admin_write on public.recipes for all using (public.is_admin()) with check (public.is_admin());
