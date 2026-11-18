/**
 * Runs pgTAP tests in supabase/tests/*.test.sql against SUPABASE_DB_URL / DATABASE_URL.
 * Each file runs in a transaction and rolls back, so it never leaves data behind.
 */
import { readdirSync, readFileSync } from 'node:fs';
import pg from 'pg';

const url = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
if (!url) {
  console.error('db:test — set DATABASE_URL (or SUPABASE_DB_URL)');
  process.exit(1);
}
const dir = 'supabase/tests';
const files = readdirSync(dir)
  .filter((f) => f.endsWith('.test.sql'))
  .sort();
const client = new pg.Client({
  connectionString: url,
  ssl: /localhost|127\.0\.0\.1|\/tmp|host=\//.test(url) ? undefined : { rejectUnauthorized: false },
});
await client.connect();
let failed = 0;
let passed = 0;
try {
  for (const f of files) {
    const res = await client.query(readFileSync(`${dir}/${f}`, 'utf8'));
    const lines = (Array.isArray(res) ? res : [res]).flatMap((r) =>
      r.rows.map((row: Record<string, unknown>) => String(Object.values(row)[0] ?? '')),
    );
    const tap = lines.join('\n').split('\n');
    for (const l of tap) {
      if (l.startsWith('ok ')) passed++;
      if (l.startsWith('not ok')) failed++;
      if (l.startsWith('not ok') || l.startsWith('#')) console.log(`  ${l}`);
    }
    console.log(`${tap.some((l) => l.startsWith('not ok')) ? '✗' : '✓'} ${f}`);
  }
} finally {
  await client.end();
}
console.log(`db:test — ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
