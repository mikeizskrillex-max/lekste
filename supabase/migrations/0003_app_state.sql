-- Account data: the app's full state (questionnaire, menu, purchases, weight…) per user,
-- so a user fills the questionnaire once and sees the same data on every device.
-- Run once in Supabase → SQL Editor.
create table if not exists public.app_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.app_state enable row level security;
drop policy if exists own_state on public.app_state;
create policy own_state on public.app_state for all using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.app_state to authenticated;
