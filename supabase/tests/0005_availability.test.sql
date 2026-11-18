-- pgTAP: ingredient availability (0005). Runs inside a transaction and rolls back.
begin;
set local search_path = public, extensions;
select plan(10);

insert into public.store_products (id, store_code, external_id, url, title, pack_size, pack_unit, price, in_stock, source, checked_at) values
  ('b0000000-0000-0000-0000-000000000001', 'barbora', 'a1', 'https://barbora.lt/p/a1', 'Morkos, 1 kg', 1000, 'g', 0.59, true, 'scraper:barbora', now()),
  ('b0000000-0000-0000-0000-000000000002', 'rimi', 'a2', 'https://www.rimi.lt/a2', 'Morkos, 1 kg', 1000, 'g', 0.69, true, 'scraper:rimi', now()),
  ('b0000000-0000-0000-0000-000000000003', 'barbora', 'a3', 'https://barbora.lt/p/a3', 'Svogūnai, 1 kg', 1000, 'g', 0.45, true, 'scraper:barbora', now()),
  ('b0000000-0000-0000-0000-000000000004', 'rimi', 'a4', 'https://www.rimi.lt/a4', 'Svogūnai, 1 kg', 1000, 'g', 0.45, false, 'scraper:rimi', now()),
  ('b0000000-0000-0000-0000-000000000005', 'rimi', 'a5', 'https://www.rimi.lt/a5', 'Česnakai', 100, 'g', 0.99, true, 'scraper:rimi', now());
insert into public.ingredient_store_matches (ingredient_slug, product_id, confidence, status) values
  ('carrot', 'b0000000-0000-0000-0000-000000000001', 0.9, 'auto'),
  ('carrot', 'b0000000-0000-0000-0000-000000000002', 0.9, 'confirmed'),
  ('onion', 'b0000000-0000-0000-0000-000000000003', 0.9, 'auto'),
  ('onion', 'b0000000-0000-0000-0000-000000000004', 0.9, 'auto'),
  ('garlic', 'b0000000-0000-0000-0000-000000000005', 0.6, 'needs_review');

select is(public.store_availability('onion', 'rimi'), 'out_of_stock', 'reason: out of stock');
select is(public.store_availability('garlic', 'rimi'), 'only_doubtful', 'reason: only a doubtful match');
select is(public.store_availability('garlic', 'barbora'), 'no_product', 'reason: no product');

select ok(public.refresh_availability() >= 1, 'refresh reports changes');
select is((select availability_level from public.ingredients where slug = 'carrot'), 'both_stores', 'carrot is in both stores');
select is((select availability_level from public.ingredients where slug = 'onion'), 'missing', 'onion out of stock in Rimi and never seen in both → missing');
select is((select availability_level from public.ingredients where slug = 'garlic'), 'missing', 'a doubtful match does not count');

-- carrots run out in Rimi: both_stores is kept for 14 days, then missing
update public.store_products set in_stock = false where external_id = 'a2';
select public.refresh_availability(now() + interval '7 days');
select is((select availability_level from public.ingredients where slug = 'carrot'), 'both_stores', 'gone for a week → still both_stores (grace)');
select public.refresh_availability(now() + interval '15 days');
select is((select availability_level from public.ingredients where slug = 'carrot'), 'missing', 'gone for 15 days → missing');

set local role authenticated;
select throws_ok($$ select public.refresh_availability() $$, '42501', null, 'users cannot run the refresh');
reset role;

select * from finish();
rollback;
