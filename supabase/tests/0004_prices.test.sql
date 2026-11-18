-- pgTAP: prices (0004). Runs inside a transaction and rolls back.
begin;
set local search_path = public, extensions;
select plan(18);

insert into public.store_products (id, store_code, external_id, url, title, pack_size, pack_unit, price, in_stock, source, checked_at) values
  ('a0000000-0000-0000-0000-000000000001', 'rimi', 't1', 'https://www.rimi.lt/t1', 'Plautos morkos, 1 kg', 1000, 'g', 0.69, true, 'scraper:rimi', now() - interval '2 days'),
  ('a0000000-0000-0000-0000-000000000002', 'rimi', 't2', 'https://www.rimi.lt/t2', 'Senos morkos, 1 kg', 1000, 'g', 0.59, true, 'scraper:rimi', now() - interval '15 days'),
  ('a0000000-0000-0000-0000-000000000003', 'barbora', 't3', 'https://barbora.lt/p/t3', 'Morkos, 1 kg', 1000, 'g', 0.49, true, 'scraper:barbora', now()),
  ('a0000000-0000-0000-0000-000000000004', 'barbora', 't4', 'https://barbora.lt/p/t4', 'Morkos, 2 kg', 2000, 'g', 0.99, false, 'scraper:barbora', now()),
  ('a0000000-0000-0000-0000-000000000005', 'barbora', 't5', 'https://barbora.lt/p/t5', 'Ekologiškos morkos', 500, 'g', 1.29, true, 'csv:prices-2026-11-16.csv', now());
insert into public.ingredient_store_matches (ingredient_slug, product_id, confidence, status) values
  ('carrot', 'a0000000-0000-0000-0000-000000000001', 0.9, 'auto'),
  ('carrot', 'a0000000-0000-0000-0000-000000000002', 0.9, 'auto'),
  ('carrot', 'a0000000-0000-0000-0000-000000000003', 0.9, 'confirmed'),
  ('carrot', 'a0000000-0000-0000-0000-000000000004', 0.9, 'auto'),
  ('carrot', 'a0000000-0000-0000-0000-000000000005', 0.6, 'needs_review');
insert into public.price_anomalies (product_id, kind, old_price, new_price) values ('a0000000-0000-0000-0000-000000000003', 'jump_gt_50', 0.2, 0.49);

-- the basket sees only fresh, in-stock, matched products without an open anomaly
select results_eq($$ select external_id from public.basket_prices where ingredient_slug = 'carrot' order by 1 $$, array['t1'],
  'basket_prices: fresh + in stock + matched + no open anomaly');
update public.price_anomalies set status = 'approved', resolved_at = now() where product_id = 'a0000000-0000-0000-0000-000000000003';
select results_eq($$ select external_id from public.basket_prices where ingredient_slug = 'carrot' order by 1 $$, array['t1', 't3'],
  'an approved anomaly lets the price in');
select is((select count(*)::int from public.basket_prices where source is null or checked_at is null), 0,
  'every basket price has a source and a check time');

-- constraints
select throws_ok($$ insert into public.store_products (store_code, external_id, url, title, price, in_stock, source, checked_at)
                    values ('rimi', 'x1', 'https://www.rimi.lt/x', 'Be šaltinio', 1, true, 'guess', now()) $$,
  '23514', null, 'a price needs a known source');
select throws_ok($$ insert into public.store_products (store_code, external_id, url, title, price, in_stock, source)
                    values ('rimi', 'x2', 'https://www.rimi.lt/x', 'Be laiko', 1, true, 'scraper:rimi') $$,
  '23502', null, 'a price needs checked_at');
select throws_ok($$ insert into public.store_products (store_code, external_id, url, title, price, card_price, in_stock, source, checked_at)
                    values ('rimi', 'x3', 'https://www.rimi.lt/x', 'Kortelė', 1, 2, true, 'scraper:rimi', now()) $$,
  '23514', null, 'a card price cannot be above the shelf price');
select throws_ok($$ insert into public.store_products (store_code, external_id, url, title, price, in_stock, source, checked_at)
                    values ('lidl', 'x4', 'https://www.lidl.lt/x', 'Kita parduotuvė', 1, true, 'scraper:rimi', now()) $$,
  '23503', null, 'only known stores');
select throws_ok($$ insert into public.store_products (store_code, external_id, url, title, price, in_stock, source, checked_at)
                    values ('rimi', 'x5', 'http://www.rimi.lt/x', 'Be https', 1, true, 'scraper:rimi', now()) $$,
  '23514', null, 'product links are https');
select throws_ok($$ insert into public.price_anomalies (product_id, kind) values ('a0000000-0000-0000-0000-000000000001', 'jump_gt_50'),
                    ('a0000000-0000-0000-0000-000000000001', 'jump_gt_50') $$,
  '23505', null, 'one open anomaly of a kind per product');
select throws_ok($$ insert into public.ingredient_store_matches (ingredient_slug, product_id, confidence, status)
                    values ('carrot', 'a0000000-0000-0000-0000-000000000001', 0.5, 'maybe') $$,
  '23514', null, 'match status is one of the known ones');

-- RLS: prices are public, the review queue and logs are for admins
set local role anon;
select is((select count(*)::int from public.store_products where external_id like 't%'), 5, 'visitor reads products');
select is((select count(*)::int from public.price_anomalies), 0, 'visitor cannot see the review queue');
select is((select count(*)::int from public.scrape_runs), 0, 'visitor cannot see scrape runs');
update public.store_products set price = 0.01 where external_id = 't1';
select is((select price from public.store_products where external_id = 't1'), 0.69::numeric, 'visitor cannot change prices');
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';
update public.store_products set price = 0.01 where external_id = 't1';
select is((select count(*)::int from public.csv_imports), 0, 'a user cannot see CSV imports');
reset role;
select is((select price from public.store_products where external_id = 't1'), 0.69::numeric, 'a user cannot change prices');
set local role authenticated;
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated", "app_metadata": {"role": "admin"}}';
select is((select count(*)::int from public.price_anomalies), 1, 'admin sees the review queue');
reset role;
select is((select count(*)::int from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and not c.relrowsecurity),
  0, 'RLS is still on for every table');

select * from finish();
rollback;
