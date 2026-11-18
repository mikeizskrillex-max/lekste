-- pgTAP: ingredient catalogue (0002). Expects the catalogue loaded by `npm run ingredients:import`.
begin;
set local search_path = public, extensions;
select plan(28);

-- catalogue is loaded and complete
select ok((select count(*) from public.ingredients where is_active) >= 120, 'at least 120 active ingredients');
select is((select count(*)::int from public.ingredients i
           where not exists (select 1 from public.ingredient_nutrition n where n.ingredient_slug = i.slug and n.source like 'usda:%')),
          0, 'every ingredient has a USDA nutrition row');
select is((select count(*)::int from public.ingredient_facts where kcal_100g is null), 0, 'every ingredient has kcal in ingredient_facts');
select is((select count(*)::int from public.ingredients i
           where not exists (select 1 from public.ingredient_synonyms s where s.ingredient_slug = i.slug and s.locale = 'ru')),
          0, 'every ingredient has a Russian name');
select is((select count(*)::int from public.ingredients where availability_level = 'both_stores'), 0,
          'nothing is both_stores before phase 5 verifies it');

-- normalisation
select is(public.search_norm('  VIŠTIENOS   Krūtinėlė '), 'vistienos krutinele', 'search_norm drops diacritics and case');
select is(public.search_norm('Ёжик'), 'ежик', 'search_norm maps ё to е');

-- search: typos, no diacritics, Russian
select is((select slug from public.search_ingredients('grikai') limit 1), 'buckwheat', 'typo "grikai" finds buckwheat');
select is((select slug from public.search_ingredients('morkos') limit 1), 'carrot', '"morkos" finds carrots');
select is((select slug from public.search_ingredients('MORKA') limit 1), 'carrot', 'upper case and a synonym work');
select ok(exists (select 1 from public.search_ingredients('vistiena') where slug = 'chicken_breast'), '"vistiena" without diacritics finds chicken');
select is((select slug from public.search_ingredients('морковка') limit 1), 'carrot', 'Russian synonym finds carrots');
select is((select slug from public.search_ingredients('гречка') limit 1), 'buckwheat', 'Russian "гречка" finds buckwheat');
select is((select slug from public.search_ingredients('svietas') limit 1), 'butter', 'typo "svietas" finds butter');
select is((select count(*)::int from public.search_ingredients('x')), 0, 'one-letter queries return nothing');
select ok((select count(*) from public.search_ingredients('a', 500)) <= 50, 'result size is capped');

-- facts: labels override USDA by their average
insert into public.ingredient_nutrition (ingredient_slug, source, kcal, protein, fat, carbs, fiber) values
  ('buckwheat', 'label:barbora:123', 319, 12.1, 3, 61, 9),
  ('buckwheat', 'label:rimi:abc', 331, 12.9, 3.4, 62, 10);
select is((select kcal_100g from public.ingredient_facts where slug = 'buckwheat'), 325.0, 'labels are averaged');
select is((select nutrition_basis from public.ingredient_facts where slug = 'buckwheat'), 'label_avg', 'basis says label average');
select is((select nutrition_basis from public.ingredient_facts where slug = 'carrot'), 'usda', 'without labels the basis is USDA');

-- constraints
select throws_ok($$ insert into public.ingredients (slug, name, category, origin, default_unit, allergens)
                    values ('x_test', '{"lt": "Testas"}', 'dairy', 'dairy', 'g', '{lactose}') $$,
  '23514', null, 'lactose requires milk');
select throws_ok($$ insert into public.ingredients (slug, name, category, origin, default_unit, allergens)
                    values ('x_test', '{"lt": "Testas"}', 'dairy', 'dairy', 'g', '{wheat}') $$,
  '23514', null, 'only known allergen codes');
select throws_ok($$ insert into public.ingredients (slug, name, category, origin, default_unit)
                    values ('x_test', '{"ru": "Тест"}', 'dairy', 'dairy', 'g') $$,
  '23514', null, 'Lithuanian name is required');
select throws_ok($$ insert into public.ingredients (slug, name, category, origin, default_unit)
                    values ('x_test', '{"lt": "Testas"}', 'eggs', 'egg', 'pcs') $$,
  '23514', null, 'pieces need piece_g');
select throws_ok($$ insert into public.ingredient_nutrition (ingredient_slug, source, kcal, protein, fat, carbs)
                    values ('carrot', 'guess', 41, 1, 0, 10) $$,
  '23514', null, 'nutrition needs a known source');
select throws_ok($$ insert into public.ingredient_nutrition (ingredient_slug, source, kcal, protein, fat, carbs)
                    values ('carrot', 'label:rimi:z', 41, 60, 30, 20) $$,
  '23514', null, 'macros cannot exceed 100 g');

-- RLS: visitors read, nobody but admins writes
set local role anon;
select ok((select count(*) from public.search_ingredients('morkos')) > 0, 'visitor can search');
select throws_ok($$ insert into public.ingredient_nutrition (ingredient_slug, source, kcal, protein, fat, carbs)
                    values ('carrot', 'label:rimi:y', 41, 1, 0, 10) $$,
  '42501', null, 'visitor cannot write nutrition');
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';
update public.ingredients set allergens = '{}' where slug = 'butter';
reset role;
select is((select allergens from public.ingredients where slug = 'butter'), '{milk,lactose}'::text[],
  'a signed-in user cannot change allergens');

select * from finish();
rollback;
