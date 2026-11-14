# Development status — 2026-11-12

Checks on this commit: `npm run lint` ✓ · `npm run typecheck` ✓ · `npm test` 36/36 ✓ · `npm run build` ✓ ·
`npm run e2e` 24/24 ✓ (scenarios A–J, production build, development mode) · migration applied to local Postgres 16
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
