-- Lėkštė v2 · 0004 — store products and prices (Barbora, Rimi), price history, anomalies, scrape runs, CSV imports,
-- ingredient ↔ product matches. Every price has a source and a check time; the basket reads only basket_prices.

-- ---------- products as sold in a store ----------
create table public.store_products (
  id uuid primary key default gen_random_uuid(),
  store_code text not null references public.stores (code),
  external_id text not null check (external_id ~ '^[A-Za-z0-9._-]{1,64}$'),
  url text not null check (url ~ '^https://'),
  title text not null check (length(title) between 2 and 300),
  brand text,
  category_path text,
  pack_size numeric(10, 3) check (pack_size > 0),
  pack_unit text check (pack_unit in ('g', 'ml', 'pcs')),
  sold_by_weight boolean not null default false,
  -- products sold by weight are added in steps (Rimi bananas: 1.6 kg); kg
  sale_step_kg numeric(6, 3) check (sale_step_kg > 0),
  -- what a shopper without a loyalty card pays today (includes promotions open to everyone)
  price numeric(8, 2) not null check (price > 0),
  -- shelf price before a promotion open to everyone (null = no such promotion)
  regular_price numeric(8, 2) check (regular_price > 0),
  -- price with the store's loyalty card (Ačiū, Mano Rimi); null = no card offer
  card_price numeric(8, 2) check (card_price > 0),
  promo_from date,
  promo_to date,
  unit_price numeric(10, 2) check (unit_price > 0),
  unit_price_unit text check (unit_price_unit in ('kg', 'l', 'pcs')),
  in_stock boolean not null,
  -- label data as published by the store (null = not on the page)
  ingredients_text text,
  nutrients jsonb check (nutrients is null or jsonb_typeof(nutrients) = 'object'),
  source text not null check (source ~ '^(scraper:(barbora|rimi)|csv:[A-Za-z0-9._-]{1,80})$'),
  checked_at timestamptz not null,
  first_seen_at timestamptz not null default now(),
  missing_since timestamptz,
  unique (store_code, external_id),
  check (card_price is null or card_price <= coalesce(regular_price, price)),
  check (promo_to is null or promo_from is null or promo_to >= promo_from)
);
create index store_products_checked on public.store_products (store_code, checked_at desc);
alter table public.store_products enable row level security;
create policy store_products_read on public.store_products for select to anon, authenticated using (true);
create policy store_products_admin_write on public.store_products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- every observed price ----------
create table public.price_history (
  id bigint generated always as identity primary key,
  product_id uuid not null references public.store_products (id) on delete cascade,
  price numeric(8, 2) not null check (price > 0),
  regular_price numeric(8, 2),
  card_price numeric(8, 2),
  in_stock boolean not null,
  source text not null,
  checked_at timestamptz not null
);
create index price_history_product on public.price_history (product_id, checked_at desc);
alter table public.price_history enable row level security;
create policy price_history_read on public.price_history for select to anon, authenticated using (true);
create policy price_history_admin_write on public.price_history for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- review queue: big jumps and vanished products stay out of baskets until an admin decides ----------
create table public.price_anomalies (
  id bigint generated always as identity primary key,
  product_id uuid not null references public.store_products (id) on delete cascade,
  kind text not null check (kind in ('jump_gt_50', 'disappeared', 'parse_error')),
  old_price numeric(8, 2),
  new_price numeric(8, 2),
  status text not null default 'open' check (status in ('open', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  resolved_by uuid references auth.users (id) on delete set null,
  resolved_at timestamptz,
  check ((status = 'open') = (resolved_at is null))
);
create unique index price_anomalies_one_open on public.price_anomalies (product_id, kind) where status = 'open';
alter table public.price_anomalies enable row level security;
create policy price_anomalies_admin on public.price_anomalies for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- scrape runs (one per store per Monday) ----------
create table public.scrape_runs (
  id bigint generated always as identity primary key,
  store_code text not null references public.stores (code),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  pages_ok int not null default 0,
  pages_failed int not null default 0,
  products_changed int not null default 0,
  anomalies int not null default 0,
  log text
);
alter table public.scrape_runs enable row level security;
create policy scrape_runs_admin on public.scrape_runs for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- CSV imports (preview first, then apply; can be rolled back) ----------
create table public.csv_imports (
  id bigint generated always as identity primary key,
  store_code text not null references public.stores (code),
  file_name text not null check (file_name ~ '^[A-Za-z0-9._-]{1,80}$'),
  rows int not null default 0 check (rows >= 0),
  preview jsonb not null default '[]',
  status text not null default 'previewed' check (status in ('previewed', 'applied', 'rolled_back')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  applied_at timestamptz
);
alter table public.csv_imports enable row level security;
create policy csv_imports_admin on public.csv_imports for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- which product stands for which ingredient ----------
-- auto: confident automatic match (used) · needs_review: doubtful (not used until confirmed)
create table public.ingredient_store_matches (
  id bigint generated always as identity primary key,
  ingredient_slug text not null references public.ingredients (slug) on delete cascade,
  product_id uuid not null references public.store_products (id) on delete cascade,
  confidence numeric(3, 2) not null check (confidence between 0 and 1),
  status text not null check (status in ('auto', 'needs_review', 'confirmed', 'rejected')),
  reason text,
  updated_at timestamptz not null default now(),
  unique (ingredient_slug, product_id)
);
create index ingredient_store_matches_slug on public.ingredient_store_matches (ingredient_slug) where status in ('auto', 'confirmed');
alter table public.ingredient_store_matches enable row level security;
create policy ingredient_store_matches_read on public.ingredient_store_matches for select to anon, authenticated using (true);
create policy ingredient_store_matches_admin_write on public.ingredient_store_matches for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- the only prices a basket may use ----------
-- fresh (checked within 14 days), in stock, matched (auto or confirmed), no open anomaly.
create view public.basket_prices with (security_invoker = true) as
select
  m.ingredient_slug, p.id as product_id, p.store_code, p.external_id, p.url, p.title, p.brand,
  p.pack_size, p.pack_unit, p.sold_by_weight, p.sale_step_kg, p.price, p.regular_price,
  case when p.card_price is not null and (p.promo_to is null or p.promo_to >= current_date) then p.card_price end as card_price,
  p.unit_price, p.unit_price_unit, p.source, p.checked_at, m.confidence, m.status as match_status
from public.ingredient_store_matches m
join public.store_products p on p.id = m.product_id
where m.status in ('auto', 'confirmed')
  and p.in_stock
  and p.checked_at > now() - interval '14 days'
  and not exists (select 1 from public.price_anomalies a where a.product_id = p.id and a.status = 'open');
grant select on public.basket_prices to anon, authenticated;
