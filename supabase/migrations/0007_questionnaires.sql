-- Lėkštė v2 · 0007 — questionnaire answers saved to the account (health data: owner only, needs explicit consent).

create table public.questionnaires (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  -- validated by the shared Zod schema (src/lib/questionnaire/schema.ts) before it is written
  answers jsonb not null check (jsonb_typeof(answers) = 'object' and answers ? 'goal' and answers ? 'me'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger questionnaires_touch before update on public.questionnaires for each row execute function public.touch_updated_at();
alter table public.questionnaires enable row level security;

-- health data: only the owner, and only after the explicit consent recorded on the profile
create policy questionnaires_select_own on public.questionnaires for select to authenticated
  using (user_id = (select auth.uid()));
create policy questionnaires_insert_own on public.questionnaires for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.health_consent_at is not null));
create policy questionnaires_update_own on public.questionnaires for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.health_consent_at is not null));
create policy questionnaires_delete_own on public.questionnaires for delete to authenticated
  using (user_id = (select auth.uid()));

-- withdrawing the consent deletes the health data
create or replace function public.drop_health_data_on_withdraw() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if old.health_consent_at is not null and new.health_consent_at is null then
    delete from public.questionnaires where user_id = new.id;
  end if;
  return new;
end $$;
revoke execute on function public.drop_health_data_on_withdraw() from public, anon, authenticated;
create trigger profiles_withdraw_consent after update of health_consent_at on public.profiles
  for each row execute function public.drop_health_data_on_withdraw();

-- users may change only their own consent, language and Monday e-mail (not ids or timestamps of others)
revoke update on public.profiles from authenticated;
grant update (locale, health_consent_at, monday_email) on public.profiles to authenticated;
