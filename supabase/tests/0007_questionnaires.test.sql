-- pgTAP: questionnaires (0007). Runs inside a transaction and rolls back.
begin;
set local search_path = public, extensions;
select plan(9);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'a@example.lt'),
  ('22222222-2222-2222-2222-222222222222', 'b@example.lt');

set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';
select throws_ok($$ insert into public.questionnaires (user_id, answers) values ('11111111-1111-1111-1111-111111111111', '{"goal": "lose", "me": {}}') $$,
  '42501', null, 'no health data without consent');
update public.profiles set health_consent_at = now() where id = '11111111-1111-1111-1111-111111111111';
select lives_ok($$ insert into public.questionnaires (user_id, answers) values ('11111111-1111-1111-1111-111111111111', '{"goal": "lose", "me": {"age": 35}}') $$,
  'with consent the answers are saved');
select throws_ok($$ insert into public.questionnaires (user_id, answers) values ('22222222-2222-2222-2222-222222222222', '{"goal": "lose", "me": {}}') $$,
  '42501', null, 'cannot write answers for someone else');
select throws_ok($$ update public.profiles set id = '33333333-3333-3333-3333-333333333333' where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501', null, 'cannot change own profile id');
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';
select is((select count(*)::int from public.questionnaires), 0, 'another user sees nothing');
reset role;
set local role anon;
select is((select count(*)::int from public.questionnaires), 0, 'visitors see nothing');
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';
select is((select count(*)::int from public.questionnaires), 1, 'the owner sees the answers');
update public.profiles set health_consent_at = null where id = '11111111-1111-1111-1111-111111111111';
select is((select count(*)::int from public.questionnaires), 0, 'withdrawing consent deletes the health data');
reset role;
select throws_ok($$ insert into public.questionnaires (user_id, answers) values ('22222222-2222-2222-2222-222222222222', '{"me": {}}') $$,
  '23514', null, 'answers must have a goal');

select * from finish();
rollback;
