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
| `npm run e2e` | Playwright scenarios A–J against a running server (`E2E_URL`, default :3000) |
| `npm run db:export` | export the recipe database to `data/recipes.json` |

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
* We never order on the user's behalf; links open the retailer's page.
* Before automated collection: review each retailer's Terms of Service and robots.txt, rate-limit, identify the client.

## Documentation

* [ARCHITECTURE.md](ARCHITECTURE.md) — modules, data flow, security
* [DEVELOPMENT_STATUS.md](DEVELOPMENT_STATUS.md) — what is done, what needs keys or review
* Lithuanian copy must be proof-read by a native speaker; legal pages are drafts for a lawyer.
