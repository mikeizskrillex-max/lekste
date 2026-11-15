# Development status — 2026-11-12

Checks on this commit: `npm run lint` ✓ · `npm run typecheck` ✓ · `npm test` 43/43 ✓ · `npm run build` ✓ ·
`npm run e2e` 37/37 ✓ (scenarios A–J, production build, development mode) · migration applied to local Postgres 16
with a Supabase auth stub: 41 tables, 57 RLS policies, owner isolation checked.

| Phase | Status |
|---|---|
| 1 Foundation, design system | ✅ Next.js App Router, Tailwind tokens (#F8F7F2/#174B35/#31966A/#E9F1E9/#17241D/#F0B95B), Manrope + Inter, UI kit |
| 2 Landing & public pages | ✅ 10 landing sections, /how-it-works, /pricing, /demo (live engine), /supermarkets, /faq, /privacy, /terms (drafts), SEO (metadata, OG, JSON-LD, sitemap, robots) |
| 3 Onboarding → result → checkout | ✅ 9 dynamic questions with back navigation, separate health consent, optional marketing; full sample day; test-mode checkout; Stripe Checkout when keys exist |
| 4 Dashboard | ✅ Menu / Shopping / Progress / Settings (bottom nav on mobile), menu per day, recipe pages with cook mode & timers, replace (any/cheaper/protein/vegetarian), regenerate day, live personalisation |
| 5 Supermarket module | ✅ provenance model, catalogue, matching, CSV import, comparison page, strategies A/B/C, travel cost · ⚠ live data only for Barbora/Rimi (snapshot) |
| 6 AI assistant | ✅ rules provider (LT/RU/EN) + Anthropic provider with structured outputs, fallback, logs · ⚠ Anthropic path not exercised without a key |
| 7 Analytics | ✅ nutrition, finance (estimated vs verified), weight, date ranges (Recharts) |
| 8 Admin, security, GDPR | ✅ admin overview/plans, products, CSV prices, supermarkets, users, analytics, AI logs; middleware; RLS; export/delete/withdraw |

## Needs keys / accounts (cannot be completed in code)

* Supabase project → run migration, set env, configure magic-link redirect. Until then data is per-browser.
* Stripe account → Prices, webhook secret, Apple/Google Pay domain verification. Not tested against live Stripe.
* Resend domain + key. Anthropic API key for the AI provider.
* Server-side persistence of plans/purchases to Supabase tables (schema ready; client store currently local) — next step once Supabase exists.

## Needs human review

* Lithuanian texts (native speaker), legal pages (lawyer: company details, withdrawal right wording).
* Cooking steps for generated recipes; nutrition values are typical reference values.
* Retailer ToS/robots review before any automated price collection; Maxima/Lidl/Iki need an authorised source or CSV.
* Dish photos are Unsplash illustrations, not photos of the exact recipes.
* No reviews, customer counts or testimonials are shown — add only real ones.

## 2026-11-14 — one store, per-day menu, +398 recipes

* The user picks ONE supermarket (onboarding, menu settings, shopping page). Menu, prices, shopping lists and
  recipe "what to buy" blocks use only that store, with its promotions (expired promotions fall back to the
  regular price). The planner prefers dishes the store sells and dishes with promoted ingredients.
* Result page and app show every day of the week with its menu and its own shopping list.
* Recipe database: 1 837 dishes (new families: wraps, warm salads, oven bakes, one-pot grains, toasts,
  smoothies, cream soups, overnight oats, stuffed potatoes, fritters, legume stews, scrambled eggs).

## 2026-11-14 — menu fits the real basket

* All money comes from one source: the weekly basket at the user's store (whole packages, promotions),
  split by day and meal (domain/allocation.ts). Meals add up to days, days add up to the week.
* The planner now plans for the real basket: it prefers dishes that reuse ingredients already bought
  that week, compares candidate weeks by basket total, then swaps the costliest meals until the basket
  fits the budget — never moving a day more than ±12 % off the calorie target.
* Test grid (2 stores × 3 household sizes × 5 budgets × 2 goals): over-budget weeks 32/60 → 12/60
  (the rest are not feasible at that budget, e.g. weight gain for 4 people on €75); worst day calorie
  error 11.6 %; ~0.1 s per plan. When a budget is not feasible, the app says so and offers to set the
  minimum budget or switch to 3 meals.

## 2026-11-14 — dislikes, new week, weekly prices, recipe catalog, installable app

* Onboarding and menu settings: "what you don't like" (~45 ingredients) as a hard rule.
* "New week": archives the current week (history of 12 weeks, restore), builds the next menu with
  different dishes; a banner appears when the calendar week has moved on.
* `scripts/refresh-prices.mjs` reads each Barbora/Rimi product page (price, regular price, promotion
  dates, loyalty-card flag, unit price, availability) into data/prices.json; runs every Monday via
  .github/workflows/refresh-prices.yml (all 128 products read on 2026-11-14, 10 promotions).
  Lidl Lithuania sells food only in stores (no online food prices): CSV import remains the way.
* Public recipe catalog /recipes (and /app/recipes): search, meal, time, vegetarian, high-protein,
  cheapest-first, favourites ♥, "fits me". Favourites are included in menus more often.
* Installable web app (manifest, icons, add-to-home-screen prompt); sharp for fast images.

## 2026-11-14 — taste swipe

* After the questionnaire (and from Menu / Settings): swipe ~16 varied dishes (like / not for me).
  Liked main ingredients and cuisines are favoured, disliked dishes are no longer planned and their main
  ingredient is used less (soft rule, not a ban). The deck respects allergies, diet and dislikes.

## 2026-11-14 — polish pass

* Savings are honest and never "0 €": the same items are compared with the most expensive other store that
  sells them (and the promo part is shown); if another store is cheaper the app says so and offers to switch.
* Today screen: next meal by time of day (photo, what to take out, "Cook now" → cook mode, "Cooked"),
  eaten-today ring, streak of days with ≥3 cooked meals, promotions for you with "+ to menu".
* Progress: eaten vs planned kcal per day, starting/current weight with difference, streak.
* Dates on every day (14 lapkr.), week ranges, Lithuanian short months.
* Shopping: share sheet + WhatsApp, leftovers at home (carried over automatically to the next week for
  shelf-stable items, editable), basics checklist (salt, pepper, frying oil…) with store search links.
* Price history per product with chart and "below usual" badge (weekly script now keeps 52 points).
* Landing: student / couple / family switcher with real menus and baskets; "Why not just ChatGPT?" table.
* Result page: 2.5 s "building your plan" sequence and a headline card with the weekly basket.
* SEO: schema.org/Recipe on every public recipe page.
* Accessibility: icon-only buttons on small phones have labels.
* Not done: proof-reading by a native Lithuanian speaker; dedicated photos for generated dishes.

## 2026-11-15 — accounts and a 1-minute questionnaire

* Email + password accounts (Supabase Auth): register after the result page, sign in, forgot password →
  email link → new password. The whole app state is saved per user in `app_state`
  (supabase/migrations/0003_app_state.sql, RLS: owner only) and loaded on sign-in on any device.
* Questionnaire: 4 screens with defaults (goal tap = next; body + activity on one screen with ± steppers;
  household + budget suggested from household size + store; restrictions with "more options" and one
  combined consent). Email moved to account creation; taste swipe optional from the result page.
* Pricing: €9 / month, €20 / 3 months, €80 lifetime (VAT included), Stripe sandbox verified.
