-- Lėkštė — full database schema (Supabase / PostgreSQL 15)
-- Health-related answers are special-category data (GDPR art. 9): stored only
-- with explicit consent (user_consents), readable only by their owner (RLS),
-- never exposed to the admin UI, deleted on consent withdrawal / account deletion.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- helpers
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$$;

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ---------------------------------------------------------------- users
-- "users" are auth.users (Supabase Auth). profiles extends them 1:1.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  locale text not null default 'lt' check (locale in ('lt','ru','en','lv','et','pl')),
  market text not null default 'LT',
  track_weight boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.user_consents (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('health_data','terms','marketing','immediate_service')),
  granted boolean not null,
  version text not null,
  ip_hash text,
  created_at timestamptz not null default now()
);
create index on public.user_consents (user_id, kind, created_at desc);

create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  household smallint not null default 1 check (household between 1 and 8),
  weekly_budget numeric(8,2) not null default 50 check (weekly_budget between 10 and 1000),
  meals_per_day smallint not null default 4 check (meals_per_day between 3 and 5),
  cooking_time_max smallint not null default 30,
  diet_type text not null default 'any',
  breakfast_style text not null default 'sweet',
  equipment text[] not null default '{oven,blender}',
  preferred_retailers text[] not null default '{}',
  travel_cost numeric(6,2) not null default 1.5,
  liked_cuisines text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- special-category data: only with consent
create table public.nutrition_goals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  goal text not null check (goal in ('lose','keep','gain','healthy')),
  sex text not null check (sex in ('f','m')),
  age smallint not null check (age between 18 and 110),
  height_cm smallint not null,
  weight_kg numeric(5,1) not null,
  target_weight_kg numeric(5,1),
  activity text not null,
  health_flags text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table public.dietary_restrictions (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('allergen','never','avoid','free_text')),
  value text not null,
  unique (user_id, kind, value)
);

create table public.nutrition_targets (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kcal int not null, protein int not null, fat int not null, carbs int not null,
  overridden boolean not null default false,
  valid_from timestamptz not null default now()
);

-- ---------------------------------------------------------------- catalogue
create table public.ingredient_catalog (
  id text primary key,
  name_lt text not null, name_ru text not null, name_en text,
  category text not null,
  allergens text[] not null default '{}',
  diet_flags text[] not null default '{}',
  is_pantry boolean not null default false
);

create table public.nutrition_facts (
  ingredient_id text primary key references public.ingredient_catalog(id) on delete cascade,
  kcal numeric not null, protein numeric not null, fat numeric not null, carbs numeric not null,
  fiber numeric not null default 0, sugar numeric not null default 0,
  source text not null default 'reference tables'
);

create table public.recipes (
  id text primary key,
  name_lt text not null, name_ru text not null,
  meal text not null check (meal in ('breakfast','lunch','dinner','snack')),
  cuisine text not null,
  prep_min smallint not null, cook_min smallint not null,
  level smallint not null default 1,
  equipment text[] not null default '{}',
  steps jsonb not null default '[]',
  tip jsonb,
  photo_path text,
  is_chef boolean not null default false,
  active boolean not null default true
);

create table public.recipe_ingredients (
  recipe_id text not null references public.recipes(id) on delete cascade,
  ingredient_id text not null references public.ingredient_catalog(id),
  grams numeric not null check (grams > 0),
  primary key (recipe_id, ingredient_id)
);

-- ---------------------------------------------------------------- retailers & prices
create table public.supermarkets (
  id text primary key,                       -- maxima, barbora, rimi, lidl, iki
  name text not null,
  market text not null default 'LT',
  website text,
  active boolean not null default true
);

create table public.supermarket_stores (
  id bigserial primary key,
  supermarket_id text not null references public.supermarkets(id),
  name text not null, city text, address text,
  lat numeric, lng numeric
);

create table public.retailer_integrations (
  supermarket_id text primary key references public.supermarkets(id),
  method text check (method in ('official_api','authorized_feed','public_catalog','third_party','csv_import')),
  status text not null default 'not_connected' check (status in ('live','snapshot','csv_only','not_connected','error')),
  terms_reviewed_at timestamptz,
  robots_checked_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  notes text
);

create table public.product_categories (
  id text primary key, name_lt text not null, name_ru text not null, parent_id text references public.product_categories(id)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  supermarket_id text not null references public.supermarkets(id),
  external_id text,
  name text not null,
  brand text,
  category_id text references public.product_categories(id),
  package_grams numeric not null check (package_grams > 0),
  unit text not null default 'g' check (unit in ('g','ml','pcs')),
  url text, image_url text,
  available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (supermarket_id, external_id)
);

create table public.product_identifiers (
  product_id uuid not null references public.products(id) on delete cascade,
  kind text not null check (kind in ('ean','sku','plu')),
  value text not null,
  primary key (kind, value, product_id)
);

-- current price (one row per product); history in price_history
create table public.product_prices (
  product_id uuid primary key references public.products(id) on delete cascade,
  price numeric(8,2) not null check (price >= 0),
  regular_price numeric(8,2),
  unit_price_per_kg numeric(10,2) not null,
  currency text not null default 'EUR',
  source text not null check (source in ('official_api','authorized_feed','public_catalog','third_party','csv_import','demo')),
  verification text not null check (verification in ('verified','snapshot','unverified','demo')),
  retrieved_at timestamptz not null,
  import_job_id bigint
);

create table public.promotions (
  id bigserial primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  promo_price numeric(8,2) not null,
  regular_price numeric(8,2),
  valid_from date, valid_to date,
  conditions text,                            -- e.g. loyalty card required
  source text not null,
  retrieved_at timestamptz not null
);

create table public.price_history (
  id bigserial primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  price numeric(8,2) not null,
  regular_price numeric(8,2),
  promo boolean not null default false,
  source text not null,
  retrieved_at timestamptz not null
);
create index on public.price_history (product_id, retrieved_at desc);

create table public.product_matches (
  product_id uuid not null references public.products(id) on delete cascade,
  ingredient_id text not null references public.ingredient_catalog(id),
  quality text not null check (quality in ('exact','approximate')),
  method text not null check (method in ('ean','name_rules','manual','csv')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  primary key (product_id, ingredient_id)
);

create table public.data_import_jobs (
  id bigserial primary key,
  supermarket_id text references public.supermarkets(id),
  kind text not null check (kind in ('csv','adapter')),
  status text not null default 'pending' check (status in ('pending','running','done','failed')),
  rows_total int, rows_ok int, rows_failed int, approximate int,
  errors jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

-- ---------------------------------------------------------------- plans
create table public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  weekly_cost numeric(8,2),
  issues text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create table public.meal_plan_days (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references public.meal_plans(id) on delete cascade,
  day smallint not null check (day between 0 and 6),
  kcal int, protein int, cost numeric(8,2),
  unique (meal_plan_id, day)
);

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.meal_plan_days(id) on delete cascade,
  slot smallint not null,
  meal text not null,
  recipe_id text not null references public.recipes(id),
  servings numeric not null default 1,
  kcal int, protein int, cost numeric(8,2),
  rating text check (rating in ('up','down'))
);

create table public.meal_completion (
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_id uuid not null references public.meals(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, meal_id)
);

-- ---------------------------------------------------------------- shopping
create table public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_plan_id uuid references public.meal_plans(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.shopping_list_items (
  id bigserial primary key,
  list_id uuid not null references public.shopping_lists(id) on delete cascade,
  ingredient_id text not null references public.ingredient_catalog(id),
  grams numeric not null,
  purchased boolean not null default false
);

create table public.shopping_baskets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  list_id uuid references public.shopping_lists(id) on delete cascade,
  strategy text not null check (strategy in ('single','multi','preferred')),
  total numeric(8,2) not null,
  travel_cost numeric(8,2) not null default 0,
  prices_as_of timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.basket_items (
  id bigserial primary key,
  basket_id uuid not null references public.shopping_baskets(id) on delete cascade,
  product_id uuid references public.products(id),
  ingredient_id text not null,
  packs smallint not null,
  price numeric(8,2) not null,
  cost numeric(8,2) not null
);

create table public.purchase_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  supermarket_id text references public.supermarkets(id),
  paid numeric(8,2) not null check (paid >= 0),
  reference_total numeric(8,2),             -- priciest single store for the same basket
  estimated_total numeric(8,2),             -- our best basket estimate
  purchased_at timestamptz not null default now()
);

create table public.spending_records (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  planned numeric(8,2), paid numeric(8,2),
  unique (user_id, week_start)
);

create table public.savings_records (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  purchase_id uuid references public.purchase_records(id) on delete cascade,
  kind text not null check (kind in ('estimated','verified')),
  amount numeric(8,2) not null,
  created_at timestamptz not null default now()
);

create table public.weight_entries (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  kg numeric(5,1) not null check (kg between 30 and 300),
  primary key (user_id, date)
);

-- ---------------------------------------------------------------- billing
create table public.subscription_plans (
  id text primary key check (id in ('intro2w','monthly','quarterly')),
  price numeric(8,2) not null,
  renewal_price numeric(8,2) not null,
  period_days int not null,
  renewal_days int not null,
  stripe_price_id text,
  highlighted boolean not null default false,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into public.subscription_plans (id, price, renewal_price, period_days, renewal_days, highlighted) values
  ('intro2w', 9.99, 12.99, 14, 30, false), ('monthly', 12.99, 12.99, 30, 30, true), ('quarterly', 29.99, 29.99, 90, 90, false);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  stripe_subscription_id text unique,
  stripe_customer_id text,
  plan_id text references public.subscription_plans(id),
  status text not null,                     -- Stripe status: active, past_due, canceled, …
  cancel_at_period_end boolean not null default false,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payment_events (
  id bigserial primary key,
  stripe_event_id text unique not null,      -- idempotency
  type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- ops & AI
create table public.user_activity (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  event text not null,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.ai_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  kind text not null,
  status text not null default 'done',
  created_at timestamptz not null default now()
);

create table public.ai_generation_logs (
  id bigserial primary key,
  provider text not null,
  ok boolean not null,
  fallback boolean not null default false,
  actions text[] not null default '{}',
  duration_ms int,
  error text,
  created_at timestamptz not null default now()
);

create table public.system_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigserial primary key,
  actor text,
  action text not null,
  target text,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- triggers
create trigger t_profiles before update on public.profiles for each row execute function public.touch_updated_at();
create trigger t_prefs before update on public.user_preferences for each row execute function public.touch_updated_at();
create trigger t_goals before update on public.nutrition_goals for each row execute function public.touch_updated_at();
create trigger t_products before update on public.products for each row execute function public.touch_updated_at();
create trigger t_subs before update on public.subscriptions for each row execute function public.touch_updated_at();

-- new auth user → profile
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, coalesce(new.email, '')) on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- every price change is kept in history
create or replace function public.log_price() returns trigger language plpgsql as $$
begin
  insert into public.price_history (product_id, price, regular_price, promo, source, retrieved_at)
  values (new.product_id, new.price, new.regular_price, new.regular_price is not null and new.regular_price > new.price, new.source, new.retrieved_at);
  return new;
end $$;
create trigger t_price_history after insert or update on public.product_prices for each row execute function public.log_price();

-- ---------------------------------------------------------------- RLS
do $$
declare t text;
begin
  -- owner-only tables (user_id column)
  foreach t in array array['user_consents','user_preferences','nutrition_goals','dietary_restrictions','nutrition_targets','meal_plans',
    'meal_completion','shopping_lists','shopping_baskets','purchase_records','spending_records','savings_records','weight_entries','user_activity','ai_generation_jobs']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy owner_all on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;

  -- public read catalogue, admin write
  foreach t in array array['ingredient_catalog','nutrition_facts','recipes','recipe_ingredients','supermarkets','supermarket_stores','product_categories',
    'products','product_identifiers','product_prices','promotions','price_history','product_matches','subscription_plans']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy read_all on public.%I for select using (true)', t);
    execute format('create policy admin_write on public.%I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;

  -- admin-only tables (service role bypasses RLS for webhooks/jobs)
  foreach t in array array['retailer_integrations','data_import_jobs','payment_events','ai_generation_logs','system_settings','audit_logs']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy admin_read on public.%I for select using (public.is_admin())', t);
  end loop;
end $$;

alter table public.profiles enable row level security;
create policy own_profile on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy admin_profiles on public.profiles for select using (public.is_admin());

alter table public.subscriptions enable row level security;
create policy own_subs on public.subscriptions for select using (user_id = auth.uid());
create policy admin_subs on public.subscriptions for select using (public.is_admin());
-- subscriptions are written only by the Stripe webhook (service role)

-- children of owner tables
alter table public.meal_plan_days enable row level security;
create policy own_days on public.meal_plan_days for all
  using (exists (select 1 from public.meal_plans p where p.id = meal_plan_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.meal_plans p where p.id = meal_plan_id and p.user_id = auth.uid()));
alter table public.meals enable row level security;
create policy own_meals on public.meals for all
  using (exists (select 1 from public.meal_plan_days d join public.meal_plans p on p.id = d.meal_plan_id where d.id = day_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.meal_plan_days d join public.meal_plans p on p.id = d.meal_plan_id where d.id = day_id and p.user_id = auth.uid()));
alter table public.shopping_list_items enable row level security;
create policy own_items on public.shopping_list_items for all
  using (exists (select 1 from public.shopping_lists l where l.id = list_id and l.user_id = auth.uid()))
  with check (exists (select 1 from public.shopping_lists l where l.id = list_id and l.user_id = auth.uid()));
alter table public.basket_items enable row level security;
create policy own_basket_items on public.basket_items for all
  using (exists (select 1 from public.shopping_baskets b where b.id = basket_id and b.user_id = auth.uid()))
  with check (exists (select 1 from public.shopping_baskets b where b.id = basket_id and b.user_id = auth.uid()));

-- ---------------------------------------------------------------- GDPR
-- withdraw health consent: delete special-category data and plans
create or replace function public.withdraw_health_consent() returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_consents (user_id, kind, granted, version) values (auth.uid(), 'health_data', false, 'withdrawal');
  delete from public.nutrition_goals where user_id = auth.uid();
  delete from public.dietary_restrictions where user_id = auth.uid();
  delete from public.nutrition_targets where user_id = auth.uid();
  delete from public.weight_entries where user_id = auth.uid();
  delete from public.meal_plans where user_id = auth.uid();
end $$;

-- seed retailers
insert into public.supermarkets (id, name, website) values
  ('maxima','Maxima','https://www.maxima.lt'), ('barbora','Barbora','https://barbora.lt'), ('rimi','Rimi','https://www.rimi.lt'),
  ('lidl','Lidl','https://www.lidl.lt'), ('iki','Iki','https://iki.lt');
insert into public.retailer_integrations (supermarket_id, method, status, notes) values
  ('barbora','public_catalog','snapshot','Public e-shop catalogue snapshot via script; not real-time.'),
  ('rimi','public_catalog','snapshot','Public e-shop catalogue snapshot via script; not real-time.'),
  ('maxima',null,'csv_only','In-store prices may differ from Barbora; CSV import only.'),
  ('lidl',null,'csv_only','No e-shop with prices; promotions via CSV import.'),
  ('iki',null,'csv_only','No verified source yet; CSV import only.');
