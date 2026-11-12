# Lėkštė

Web service (no native app) for personal healthy-eating menus in Lithuania: goal + preferences + allergies + budget → a weekly menu from products on promotion, a shopping list by store, a food diary and progress.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # nutrition and planner tests
npm run build
```

Without Supabase keys the site runs in **demo mode**: everything is stored in the browser, payment is skipped, prices and promotions are sample data.

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
