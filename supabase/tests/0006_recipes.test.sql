-- pgTAP: recipes (0006). Runs inside a transaction and rolls back.
begin;
set local search_path = public, extensions;
select plan(12);

insert into public.recipes (id, slug, title, description, steps, servings, time_active_min, time_total_min, difficulty,
  equipment, meal, cuisine, season, source, status) values
  ('c0000000-0000-0000-0000-000000000001', 'test-morku-sriuba', '{"lt": "Morkų sriuba", "ru": "Морковный суп"}',
   '{"lt": "Paprasta", "ru": "Простой"}', '[{"lt": "Supjaustykite morkas.", "ru": "x"}, {"lt": "Virkite.", "ru": "y"}]',
   2, 10, 30, 'easy', '{stove}', 'lunch', 'lithuanian', '{all}', 'ai:test', 'auto_checked'),
  ('c0000000-0000-0000-0000-000000000002', 'test-juodrastis', '{"lt": "Juodraštis", "ru": "Черновик"}',
   '{"lt": "x", "ru": "x"}', '[{"lt": "a", "ru": "a"}, {"lt": "b", "ru": "b"}]',
   1, 5, 5, 'easy', '{none}', 'snack', 'international', '{all}', 'ai:test', 'draft');
insert into public.recipe_ingredients (recipe_id, ingredient_slug, grams) values
  ('c0000000-0000-0000-0000-000000000001', 'carrot', 400),
  ('c0000000-0000-0000-0000-000000000001', 'butter', 20),
  ('c0000000-0000-0000-0000-000000000002', 'apple', 150);

-- carrot 41 kcal/100 g × 400 g + butter 717 × 20 g = 164 + 143.4 = 307.4 kcal / 2 servings ≈ 154
select is((select kcal from public.recipe_facts where slug = 'test-morku-sriuba'), 154::numeric, 'kcal per serving from ingredients');
select is((select allergens from public.recipe_facts where slug = 'test-morku-sriuba'), '{lactose,milk}'::text[], 'allergens = union of ingredients');
select is((select vegetarian from public.recipe_facts where slug = 'test-morku-sriuba'), true, 'butter + carrots are vegetarian');
select is((select vegan from public.recipe_facts where slug = 'test-morku-sriuba'), false, 'butter is not vegan');
select is((select count(*)::int from public.menu_recipes where slug = 'test-morku-sriuba'), 0, 'not in menus while ingredients are not in both stores');
update public.ingredients set availability_level = 'both_stores' where slug in ('carrot', 'butter', 'apple');
select is((select count(*)::int from public.menu_recipes where slug = 'test-morku-sriuba'), 1, 'in menus once every ingredient is in both stores');
select is((select count(*)::int from public.menu_recipes where slug = 'test-juodrastis'), 0, 'drafts never reach menus');

select throws_ok($$ insert into public.recipes (slug, title, description, steps, servings, time_active_min, time_total_min, difficulty, equipment, meal, cuisine, season, source)
  values ('blogas', '{"ru": "без lt"}', '{"lt": "x"}', '[{"lt":"a"},{"lt":"b"}]', 2, 5, 5, 'easy', '{none}', 'lunch', 'international', '{all}', 'ai:test') $$,
  '23514', null, 'a recipe needs a Lithuanian title');
select throws_ok($$ insert into public.recipe_ingredients (recipe_id, ingredient_slug, grams) values ('c0000000-0000-0000-0000-000000000001', 'unicorn', 10) $$,
  '23503', null, 'ingredients must exist in the catalogue');

set local role anon;
select is((select count(*)::int from public.recipes where slug like 'test-%'), 1, 'visitors see only checked recipes');
select is((select count(*)::int from public.recipe_ingredients where recipe_id = 'c0000000-0000-0000-0000-000000000002'), 0, 'and not the ingredients of drafts');
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';
update public.recipes set status = 'reviewed' where slug = 'test-morku-sriuba';
reset role;
select is((select status from public.recipes where slug = 'test-morku-sriuba'), 'auto_checked', 'users cannot change recipe status');

select * from finish();
rollback;
