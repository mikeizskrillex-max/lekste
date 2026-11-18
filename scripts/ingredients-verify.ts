/**
 * npm run ingredients:verify [-- --report dir] — after the weekly price check: recomputes availability_level
 * (both_stores / missing) in the database, writes data/availability.json (snapshot for CI) and a report with
 * the reason per store for every missing ingredient. Needs SUPABASE_DB_URL (or DATABASE_URL).
 */
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';
import { availabilitySnapshot, type AvailabilitySnapshot } from '../src/lib/availability/snapshot';

const url = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
if (!url) {
  console.error('ingredients:verify — set SUPABASE_DB_URL (or DATABASE_URL)');
  process.exit(1);
}
const i = process.argv.indexOf('--report');
const reportDir = i > -1 ? (process.argv[i + 1] ?? 'availability-report') : 'availability-report';
const db = new pg.Client({
  connectionString: url,
  ssl: /localhost|127\.0\.0\.1|\/tmp|host=\//.test(url) ? undefined : { rejectUnauthorized: false },
});
await db.connect();
try {
  const changed = (await db.query<{ n: number }>('select public.refresh_availability() as n')).rows[0]?.n ?? 0;
  const rows = (
    await db.query<{ slug: string; level: string; barbora: string; rimi: string; name_lt: string; checked: Date }>(
      `select slug, availability_level as level, name ->> 'lt' as name_lt, availability_checked_at as checked,
              public.store_availability(slug, 'barbora') as barbora, public.store_availability(slug, 'rimi') as rimi
       from public.ingredients where is_active order by slug`,
    )
  ).rows;
  const snap: AvailabilitySnapshot = availabilitySnapshot.parse({
    checkedAt: rows[0]?.checked ? new Date(rows[0].checked).toISOString() : null,
    bothStores: rows.filter((r) => r.level === 'both_stores').map((r) => r.slug),
    missing: Object.fromEntries(
      rows.filter((r) => r.level !== 'both_stores').map((r) => [r.slug, { barbora: r.barbora, rimi: r.rimi }]),
    ),
  });
  writeFileSync('data/availability.json', JSON.stringify(snap, null, 1) + '\n');

  mkdirSync(reportDir, { recursive: true });
  const q = (v: string) => `"${v.replace(/"/g, '""')}"`;
  writeFileSync(
    join(reportDir, 'availability.csv'),
    [
      'ingredient,name,level,barbora,rimi',
      ...rows.map((r) => [r.slug, r.name_lt, r.level, r.barbora, r.rimi].map(q).join(',')),
    ].join('\n') + '\n',
  );
  const missing = rows.filter((r) => r.level !== 'both_stores');
  const summary = [
    `## Ingredient availability — ${snap.checkedAt?.slice(0, 10) ?? '—'}`,
    '',
    `In both stores: **${snap.bothStores.length}** of ${rows.length}. Changed level this week: ${changed}.`,
    '',
    missing.length
      ? '| Ingredient | Barbora | Rimi |\n|---|---|---|\n' +
        missing.map((r) => `| ${r.name_lt} (${r.slug}) | ${r.barbora} | ${r.rimi} |`).join('\n')
      : 'Nothing missing.',
    '',
    'Reasons: no_product — no candidate found · only_doubtful — matches wait for review · out_of_stock · stale_price — not checked for 14 days · anomaly — price waits for review.',
  ].join('\n');
  writeFileSync(join(reportDir, 'availability-summary.md'), summary + '\n');
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '\n');
  console.log(`ingredients:verify — ${snap.bothStores.length} of ${rows.length} in both stores, ${changed} changed`);
} finally {
  await db.end();
}
