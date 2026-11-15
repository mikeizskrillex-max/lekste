-- New pricing (VAT included): 1 month €9, 3 months €20, lifetime €80 (one payment).
-- Run once in Supabase → SQL Editor after 0001_schema.sql.
alter table public.subscription_plans drop constraint if exists subscription_plans_id_check;
alter table public.subscription_plans add constraint subscription_plans_id_check check (id in ('intro2w','monthly','quarterly','lifetime'));
update public.subscription_plans set active = false where id = 'intro2w';
insert into public.subscription_plans (id, price, renewal_price, period_days, renewal_days, highlighted, active) values
  ('monthly', 9.00, 9.00, 30, 30, false, true),
  ('quarterly', 20.00, 20.00, 90, 90, true, true),
  ('lifetime', 80.00, 0, 0, 0, false, true)
on conflict (id) do update set price = excluded.price, renewal_price = excluded.renewal_price, period_days = excluded.period_days,
  renewal_days = excluded.renewal_days, highlighted = excluded.highlighted, active = excluded.active, updated_at = now();
