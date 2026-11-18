-- pgTAP: row-level security and constraints of 0001_foundation. Runs inside a transaction and rolls back.
begin;
set local search_path = public, extensions;
select plan(17);

-- every table in public has RLS switched on
select is(
  (select count(*)::int from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and not c.relrowsecurity),
  0, 'RLS is enabled on every public table');

-- launch stores: Barbora and Rimi only
select results_eq('select code from public.stores order by sort', array['barbora', 'rimi'], 'launch stores are Barbora and Rimi');

-- every existing account has a profile (backfill for accounts created before v2)
select is((select count(*)::int from auth.users u where not exists (select 1 from public.profiles p where p.id = u.id)), 0, 'every account has a profile');

-- two accounts; the sign-up trigger creates their profiles
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'a@example.lt', '{"locale": "ru"}'),
  ('22222222-2222-2222-2222-222222222222', 'b@example.lt', '{"locale": "xx"}');
select is((select locale from public.profiles where id = '11111111-1111-1111-1111-111111111111'), 'ru', 'profile takes the sign-up language');
select is((select locale from public.profiles where id = '22222222-2222-2222-2222-222222222222'), 'lt', 'unknown language falls back to lt');

-- visitor (anon)
set local role anon;
select is((select count(*)::int from public.stores), 2, 'visitor sees the active stores');
select is((select count(*)::int from public.profiles), 0, 'visitor sees no profiles');
select throws_ok($$ insert into public.stores (code, name, source_type, user_note) values ('lidl', 'Lidl', 'none', '{"lt": "x"}') $$,
  '42501', null, 'visitor cannot add a store');
select is((select count(*)::int from public.admin_audit), 0, 'visitor cannot read the admin log');
reset role;

-- signed-in user A
set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';
select is((select count(*)::int from public.profiles), 1, 'user sees only their own profile');
update public.profiles set monday_email = false where id = '22222222-2222-2222-2222-222222222222';
update public.profiles set monday_email = false where id = '11111111-1111-1111-1111-111111111111';
select throws_ok($$ insert into public.profiles (id) values ('33333333-3333-3333-3333-333333333333') $$,
  '42501', null, 'user cannot create profiles directly');
update public.stores set name = 'X' where code = 'rimi';
reset role;
select is((select name from public.stores where code = 'rimi'), 'Rimi', 'user cannot change stores (the update touches no rows)');
select is((select monday_email from public.profiles where id = '22222222-2222-2222-2222-222222222222'), true, 'user A could not change user B');
select is((select monday_email from public.profiles where id = '11111111-1111-1111-1111-111111111111'), false, 'user A changed their own profile');

-- admin (role in app_metadata)
set local role authenticated;
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated", "app_metadata": {"role": "admin"}}';
select is((select count(*)::int from public.profiles), 2, 'admin reads all profiles');
reset role;

-- constraints
select throws_ok($$ insert into public.stores (code, name, source_type, user_note) values ('iki', 'Iki', 'none', '{"ru": "без lt"}') $$,
  '23514', null, 'a store note must have Lithuanian text');
select throws_ok($$ update public.profiles set locale = 'en' where id = '11111111-1111-1111-1111-111111111111' $$,
  '23514', null, 'profile language is lt or ru');

select * from finish();
rollback;
