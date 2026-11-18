-- Lėkštė v2 · 0001 — foundation: helpers, profiles, stores, admin audit log.
-- Every table has row-level security. Roles: anon (visitor), authenticated (signed-in user), admin via JWT app_metadata.

create extension if not exists pg_trgm with schema extensions;

-- Is the current user an admin? The role lives in app_metadata, which users cannot edit themselves.
create or replace function public.is_admin() returns boolean
language sql stable security invoker set search_path = ''
as $$ select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false) $$;

create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = ''
as $$ begin new.updated_at := now(); return new; end $$;

-- ---------- profiles: one row per account ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  locale text not null default 'lt' check (locale in ('lt', 'ru')),
  -- explicit consent to process health data (weight, goal, allergies); questionnaires require it (phase 3/9)
  health_consent_at timestamptz,
  monday_email boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
alter table public.profiles enable row level security;
create policy profiles_select_own on public.profiles for select to authenticated using (id = (select auth.uid()) or public.is_admin());
create policy profiles_update_own on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
-- inserts only through the sign-up trigger below; deletes cascade from auth.users

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare loc text := new.raw_user_meta_data ->> 'locale';
begin
  insert into public.profiles (id, locale)
  values (new.id, case when loc in ('lt', 'ru') then loc else 'lt' end)
  on conflict (id) do nothing;
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
-- accounts that existed before v2 get a profile too
insert into public.profiles (id) select id from auth.users on conflict (id) do nothing;

-- ---------- stores: supermarkets with a price source ----------
create table public.stores (
  code text primary key check (code ~ '^[a-z0-9_]{2,32}$'),
  name text not null,
  source_type text not null check (source_type in ('eshop_scraper', 'csv_import', 'none')),
  status text not null default 'active' check (status in ('active', 'paused')),
  url text check (url is null or url ~ '^https://'),
  user_note jsonb not null check (jsonb_typeof(user_note) = 'object' and user_note ? 'lt'),
  is_active boolean not null default true,
  sort int not null default 0
);
alter table public.stores enable row level security;
create policy stores_read on public.stores for select to anon, authenticated using (is_active or public.is_admin());
create policy stores_admin_write on public.stores for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Launch stores (owner decision: Barbora and Rimi only). Reference data, so it lives in the migration.
insert into public.stores (code, name, source_type, url, user_note, sort) values
  ('barbora', 'Barbora', 'eshop_scraper', 'https://barbora.lt',
   '{"lt": "Kainos iš Barbora (Maxima) e. parduotuvės.", "ru": "Цены из интернет-магазина Barbora (Maxima)."}', 1),
  ('rimi', 'Rimi', 'eshop_scraper', 'https://www.rimi.lt/e-parduotuve',
   '{"lt": "Kainos iš Rimi e. parduotuvės.", "ru": "Цены из интернет-магазина Rimi."}', 2)
on conflict (code) do nothing;

-- ---------- admin audit log: written by the server (service role), read by admins ----------
create table public.admin_audit (
  id bigint generated always as identity primary key,
  admin_id uuid references auth.users (id) on delete set null,
  action text not null check (length(action) between 1 and 80),
  details jsonb not null default '{}',
  at timestamptz not null default now()
);
create index admin_audit_at on public.admin_audit (at desc);
alter table public.admin_audit enable row level security;
create policy admin_audit_read on public.admin_audit for select to authenticated using (public.is_admin());
