# Lėkštė

Web service (no native app) for personal healthy-eating menus in Lithuania: goal + preferences + allergies + budget → a weekly menu from products on promotion, a shopping list by store, a food diary and progress.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # nutrition and planner tests
npm run build
```

Without Supabase keys the site runs in **demo mode**: everything is stored in the browser and there is no payment: every user gets a 7-day free trial with all features open.

- **Prices** (`src/data/prices.ts`): real shelf prices from the public Barbora (Maxima) and Rimi e-shop search pages, collected 2026-11-12, with product names and links. They change weekly and must be refreshed.
- **Photos** (`public/img`): free photos from Unsplash (Unsplash License), used as illustrations of the dishes. Replace with photos of the real recipes (e.g. Higgsfield) before launch.
- **Reviews** on the landing page are clearly marked samples and must be replaced with real ones.

## Recipe database

- **1 439 dishes** in total: 73 hand-written chef recipes (`src/data/recipes.ts`, steps in `src/data/recipeDetails.ts`) and ~1 370 generated dishes (`src/data/db/generator.ts`).
- The generator builds dishes from the ingredients we have real Barbora (Maxima) and Rimi prices for, with cooking patterns: protein + side + vegetables × grill / bake / stew / wok, soups, bowls, pasta, porridges, omelettes, dairy bowls, snacks. Names and steps use grammatical forms written per ingredient (LT/RU). Nutrition, allergens and price are always computed from ingredients.
- `npm run db:export` writes everything to **`data/recipes.json`** (names, ingredients, nutrition, allergens, price, steps, tip, photo) to review the library or seed Supabase.
- The planner picks from the whole database using the user's hard rules (allergies, diet, "never" foods, equipment, time) and preferences, preferring chef recipes. Every day has a **"Generate other dishes for this day"** button; each dish has **Swap** and 👍/👎.
- Generated dishes reuse photos of similar chef dishes; they need real photos (e.g. Higgsfield) and a cook's review before launch. Iki has no online shop with prices, so it is not included.

## What is built

- Landing page with animations (LT / RU).
- Quiz, 15 steps: goal, body, activity, budget, allergies (14 EU allergens), lactose, diet type, dislikes ("less often" / "never"), liked proteins and cuisines, meals per day, breakfast style, cooking time and equipment, batch cooking, spice, health screen (pregnancy, diabetes, etc. → no plan, see a doctor), consents.
- Result page: calorie target (Mifflin–St Jeor), macros, pace, blurred example day, plans.
- Cabinet: Today (calorie ring, meals with "eaten", water), Menu (days, swap, 👍/👎 with reason, recipe sheet), Shopping list (by store, promo savings, copy), Progress (weight chart), Settings (language, data export, delete).
- Safety: allergens, diet type, "never" ingredients, equipment and time are **hard rules checked in code** (`src/lib/recipes.ts`); nutrition, allergens and cost are computed from ingredients, never invented.

## Key files

| File | What |
|---|---|
| `src/lib/nutrition.ts` | calorie and macro targets |
| `src/lib/recipes.ts` | recipe facts + hard rules (allergies etc.) |
| `src/lib/planner.ts` | weekly plan + shopping list (local fallback for the AI step) |
| `src/data/ingredients.ts` | ingredient catalogue (nutrition, allergens, DEMO prices) |
| `src/data/recipes.ts` | starter recipe library (needs to grow to 80–120) |
| `src/i18n/strings.ts` | all LT / RU copy |
| `supabase/migrations/0001_init.sql` | database schema with Row Level Security |

## Next steps

1. Supabase project → run the migration → add `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` → magic-link login and sync.
2. Stripe subscriptions (Checkout, webhook, Customer Portal).
3. Admin: weekly promotions import, recipe library, AI recipe generator, Higgsfield photos, AI menu generation with code checks and manual review.
4. PWA install prompt and offline menu, emails (Resend).

Before launch: a native speaker proof-reads Lithuanian copy; a lawyer reviews privacy policy, terms and the immediate-start consent.
