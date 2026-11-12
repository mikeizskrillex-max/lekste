# Architecture

```
src/
  app/                Next.js App Router: public pages, /onboarding, /checkout, /app/*, /admin/*, /api/*
  components/         UI kit (ui.tsx), site chrome, landing, onboarding, checkout, app pages, admin
  domain/             pure business logic (no React, fully unit-tested)
    nutrition.ts      Mifflin–St Jeor targets, safe floors, manual overrides (effectiveTargets)
    planner.ts        weekly plan (best of 10 candidates), regenerateDay, replaceMeal (any/cheaper/protein/vegetarian)
    recipeFacts.ts    nutrition, allergens, diet flags and cost computed from ingredients; hard rules
    pricing.ts        baskets with whole packages, pantry pro-rating, store comparison, strategies A/B/C
  data/               ingredients (66), recipes (73 chef + 1 366 generated), cooking steps, price snapshot
  retail/             retailer adapters, price records with provenance, catalogue builder, CSV import, product matching
  ai/                 intent schema (zod), rules parser, provider interface + Anthropic provider, deterministic applyIntent
  server/             server-only: Supabase clients, auth (viewer), signed dev session, Stripe, Resend, rate limit, logs/audit
  state/store.tsx     client state; development-mode persistence (localStorage)
  i18n/               LT (primary) + RU dictionaries, provider with cookie; config/markets.ts prepares EN/LV/ET/PL
  config/             plans (prices are configurable, never hard-coded in components), markets, integrations
  middleware.ts       protects /app, /admin, /api/admin (Supabase session or signed dev cookie; admin role)
supabase/migrations/  full schema with RLS
scripts/              e2e scenarios, recipe export
```

## Key decisions

* **Deterministic core, AI at the edge.** Calories, allergens, prices and baskets are computed by code from data.
  The AI provider only turns free text into a structured `Intent` (zod schema, structured outputs); the client then
  applies it with the same planner functions as the buttons. A model cannot invent a price, and every replacement
  passes the hard rules (14 EU allergens, diet type, never-foods, equipment, cooking time).
* **Provider independence.** `AiProvider` interface; `rules` (default) and `anthropic` implementations, chosen by
  `AI_PROVIDER`. Any provider error, refusal or empty result falls back to the rules parser and is logged
  (metadata only) for `/admin/ai`.
* **Price provenance.** `PriceRecord` = retailer, product, package, price/regular/promo + validity, €/kg, url,
  `retrievedAt`, `source` (official_api | authorized_feed | public_catalog | third_party | csv_import | demo),
  `verification`, match quality (exact/approximate). The catalogue keeps the latest record per ingredient × retailer
  and drops demo records. Comparisons on public pages are like-for-like (only items every priced retailer has).
* **Strategies.** A — cheapest single store (fewest missing items first); B — best value over every store subset,
  each extra visit costs the user's `travelCost`; C — preferred stores only.
* **Savings.** *Estimated* = priciest single store − best basket for the plan. *Verified* = from purchase records the
  user enters (reference − paid). They are always shown separately.
* **Development mode** is explicit: a banner lists missing integrations, checkout says no money moves, emails are
  previewed, data stays in the browser.

## Security & GDPR

* RLS on every table; owner-only for personal data; catalogue public-read/admin-write; ops tables admin-read,
  written by the service role (webhooks, jobs). Verified locally: a user sees only their own rows.
* Health data (art. 9): separate explicit consent; withdrawal deletes goals, restrictions, targets, weights and plans
  (`withdraw_health_consent()`); export (JSON) and account deletion in Settings; admin UI never shows health answers.
* No health data is sent to AI providers. Rate limits on assistant, checkout, dev login. Stripe webhook signature
  verified, events stored idempotently. Audit log for admin actions. Security headers in `next.config.mjs`.
* Dev sessions are HMAC-signed (Web Crypto), httpOnly, and disabled in production without `SESSION_SECRET`.

## Data flow

onboarding answers → `effectiveTargets` → `buildPlan` → plan (store) → `weeklyNeed` → `strategies` over the catalogue
(snapshot + CSV imports) → basket, shopping list, comparison, analytics.
