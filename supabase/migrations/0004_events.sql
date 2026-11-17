-- Anonymous site analytics: page views and button clicks (no cookies, no personal data).
-- "visitor" is a hash of IP + browser + a salt that changes every day, so a person
-- cannot be followed across days and nothing is stored on their device.
-- Run once in Supabase → SQL Editor.
create table if not exists public.events (
  id bigserial primary key,
  at timestamptz not null default now(),
  name text not null check (name in ('pageview', 'cta_plan', 'cta_month')),
  path text not null default '/',
  visitor text not null,
  device text,
  ref text,
  place text
);
create index if not exists events_at on public.events (at desc);
create index if not exists events_name_at on public.events (name, at desc);
-- only the server (service role) reads and writes; no access for visitors
alter table public.events enable row level security;
