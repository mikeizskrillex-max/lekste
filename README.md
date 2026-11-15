# Lėkštė — Valgyk geriau. Išleisk mažiau.

AI-powered nutrition planner and smart grocery basket for Lithuania. A user answers
9 questions, gets a personal weekly menu that fits their calorie/macro targets,
allergies and budget, and a consolidated shopping list priced across Maxima,
Lidl, Rimi, Iki and Barbora.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Framer Motion · Recharts ·
Supabase (Auth magic link, Postgres + RLS) · Stripe (Checkout, Billing, webhooks) ·
Resend (email) · provider-independent AI layer (Anthropic Claude or local rules) · Vercel.

## Quick start

```bash
npm install
cp .env.example .env.local     # optional: leave empty for development mode
npm run dev                    # http://localhost:3000
```

With **no keys** the app runs in a clearly labelled *development mode*:

| Integration | Without keys | With keys |
|---|---|---|
| Supabase | data in browser localStorage, signed dev-session cookie (`/api/dev/login`) | magic-link auth, Postgres with RLS |
| Stripe | “test mode” checkout, no money moves, banner on every page | Stripe Checkout + webhooks + Billing Portal |
| AI | local rules parser (LT/RU/EN) | Claude via `AI_PROVIDER=anthropic` + `ANTHROPIC_API_KEY`, rules as fallback |
| Resend | email preview on `/success`, subjects logged in Settings | real transactional email |

Admin panel in development mode: `/login?admin=1&next=/admin`, passphrase from
`DEV_ADMIN_PASSPHRASE` (default `lekste-admin` only when `NODE_ENV !== production`).
`next start` is production mode: set `SESSION_SECRET` (and `DEV_ADMIN_PASSPHRASE`) or configure Supabase.

## Scripts

| | |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` / `typecheck` | ESLint, `tsc --noEmit` |
| `npm test` | Vitest unit tests (nutrition, planner, retail, CSV, assistant parser, photos) |
| `npm run e2e` | Playwright scenarios against a running server built with `NEXT_PUBLIC_SUPABASE_URL=none` (development mode; `E2E_URL`, default :3000) |
| `npm run db:export` | export the recipe database to `data/recipes.json` |

## Supabase

The project URL and publishable key are public and set as defaults in `src/config/supabasePublic.ts`
(environment variables override them; `NEXT_PUBLIC_SUPABASE_URL=none` turns Supabase off). The secret key
(`SUPABASE_SECRET_KEY`) belongs only in the hosting's environment variables.

## Production setup

1. **Supabase:** create a project, run `supabase/migrations/0001_schema.sql`, enable Email (magic link)
   auth with redirect `https://<domain>/auth/callback`. Make an admin by setting
   `app_metadata.role = "admin"` on the user (SQL: `update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}' where email = '…'`).
2. **Stripe:** create three recurring Prices (intro €9.99 first 14 days → €12.99/month is best modelled as a
   €12.99/month price with a €3 off first-invoice coupon or a 14-day intro price; monthly €12.99; quarterly €29.99),
   put the IDs in `STRIPE_PRICE_*`, add a webhook to `/api/stripe/webhook` for `checkout.session.completed`,
   `customer.subscription.*`, `invoice.payment_failed`, `charge.refunded`. Enable Apple Pay / Google Pay in the dashboard.
3. **Resend:** verify the sending domain, set `RESEND_API_KEY` and `EMAIL_FROM`.
4. **AI:** `AI_PROVIDER=anthropic`, `ANTHROPIC_API_KEY`. Only the user's message and non-health preferences are sent.
5. Deploy on Vercel with the variables from `.env.example`.

## Price data — honesty rules

* Barbora and Rimi prices are a **snapshot of their public e-shop catalogues** (date shown everywhere). Not real-time.
* Maxima (in-store), Lidl and Iki have **no verified source** yet → CSV import in `/admin/prices` only.
* Every price carries `source`, `retrievedAt` and `verification`; demo records are never shown as real prices.
* We never order on the user's behalf; every list item has a 🛒 button that opens the product page in the
  retailer's e-shop (Barbora 64/64, Rimi 64/64 products linked), where the user adds it to the cart.
  `node scripts/barbora-urls.mjs` (with `NODE_USE_ENV_PROXY=1` behind a proxy) finds missing Barbora links.
* Before automated collection: review each retailer's Terms of Service and robots.txt, rate-limit, identify the client.

## Weekly price refresh

`NODE_USE_ENV_PROXY=1 node scripts/refresh-prices.mjs` (proxy variable only behind a proxy) reads every
product page and updates `data/prices.json`. `.github/workflows/refresh-prices.yml` does this every Monday
05:17 UTC (and on demand: Actions → Refresh store prices → Run workflow) and commits the file when prices
changed; the hosting redeploys on that commit. If the repository restricts Actions, allow "Read and write
permissions" for workflows in Settings → Actions → General.

## Documentation

* [ARCHITECTURE.md](ARCHITECTURE.md) — modules, data flow, security
* [DEVELOPMENT_STATUS.md](DEVELOPMENT_STATUS.md) — what is done, what needs keys or review
* Lithuanian copy must be proof-read by a native speaker; legal pages are drafts for a lawyer.
