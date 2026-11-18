-- Lėkštė v2 · 0000 — remove the v1 schema from the shared Supabase project.
-- Accounts (auth.users) are kept. v1 data is not migrated (owner decision, docs/decisions.md).
-- Idempotent: safe to run on a database that never had v1.

drop trigger if exists on_auth_user_created on auth.users;

drop table if exists
  public.app_state, public.events,
  public.audit_logs, public.system_settings, public.ai_generation_logs, public.ai_generation_jobs, public.user_activity,
  public.payment_events, public.subscriptions, public.subscription_plans, public.weight_entries,
  public.savings_records, public.spending_records, public.purchase_records,
  public.basket_items, public.shopping_baskets, public.shopping_list_items, public.shopping_lists,
  public.meal_completion, public.meals, public.meal_plan_days, public.meal_plans,
  public.data_import_jobs, public.product_matches, public.price_history, public.promotions, public.product_prices,
  public.product_identifiers, public.products, public.product_categories, public.retailer_integrations,
  public.supermarket_stores, public.supermarkets, public.recipe_ingredients, public.recipes, public.nutrition_facts,
  public.ingredient_catalog, public.nutrition_targets, public.dietary_restrictions, public.nutrition_goals,
  public.user_preferences, public.user_consents, public.profiles
  cascade;

drop function if exists public.withdraw_health_consent() cascade;
drop function if exists public.log_price() cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.touch_updated_at() cascade;
drop function if exists public.is_admin() cascade;
