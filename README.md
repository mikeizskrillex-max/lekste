# Lėkštė v2

Personal AI meal planner for Lithuania: a weekly menu for your goal and budget → the cheapest basket at Barbora or Rimi → a shopping list with links to the products.

- Specification: [`SPEC.md`](SPEC.md) · owner decisions that override it: [`docs/decisions.md`](docs/decisions.md)
- Project rules for Claude Code: [`CLAUDE.md`](CLAUDE.md)
- Plan and phases: [`docs/plan.md`](docs/plan.md) · database: [`docs/db.md`](docs/db.md)
- Version 1 is preserved in the `v1-final` branch.

## Development

```bash
npm install
npm run dev            # http://localhost:3000 (lt) · /ru (ru) · /dizainas (design system)
npm run lint && npm run typecheck && npm test && npm run i18n:check && npm run build
npm run test:e2e       # Playwright, 360 px and 1440 px
npm run db:local       # throwaway Postgres 16 + pgTAP: applies migrations and runs the RLS tests
```

Environment variables: see `.env.example`. Migrations reach Supabase through GitHub Actions once the `SUPABASE_DB_URL` repository secret is set.

Status: phase 1 (foundation and design system) done. The app is built phase by phase; setup and deployment instructions arrive in phase 14.
