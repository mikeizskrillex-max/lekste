/**
 * Applies supabase/migrations/*.sql in name order, each in its own transaction, and records it in
 * lekste_meta.migrations (with a checksum: an applied file that later changes stops the run).
 * Usage: SUPABASE_DB_URL=postgres://… npm run db:migrate   (or DATABASE_URL for a local test database)
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import pg from 'pg';

const url = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
if (!url) {
  console.error('db:migrate — set SUPABASE_DB_URL (or DATABASE_URL)');
  process.exit(1);
}
const dir = 'supabase/migrations';
const files = readdirSync(dir)
  .filter((f) => /^\d{4}_[\w-]+\.sql$/.test(f))
  .sort();
const client = new pg.Client({
  connectionString: url,
  ssl: /localhost|127\.0\.0\.1|\/tmp|host=\//.test(url) ? undefined : { rejectUnauthorized: false },
});
await client.connect();
try {
  await client.query(`create schema if not exists lekste_meta;
    create table if not exists lekste_meta.migrations (name text primary key, checksum text not null, applied_at timestamptz not null default now());
    revoke all on schema lekste_meta from public;`);
  const done = new Map(
    (
      await client.query<{ name: string; checksum: string }>('select name, checksum from lekste_meta.migrations')
    ).rows.map((r) => [r.name, r.checksum]),
  );
  let applied = 0;
  for (const f of files) {
    const sql = readFileSync(`${dir}/${f}`, 'utf8');
    const sum = createHash('sha256').update(sql).digest('hex');
    if (done.has(f)) {
      if (done.get(f) !== sum) throw new Error(`${f} was changed after it was applied — add a new migration instead`);
      continue;
    }
    await client.query('begin');
    try {
      await client.query(sql);
      await client.query('insert into lekste_meta.migrations (name, checksum) values ($1, $2)', [f, sum]);
      await client.query('commit');
      console.log(`✓ ${f}`);
      applied++;
    } catch (e) {
      await client.query('rollback');
      throw new Error(`${f}: ${(e as Error).message}`);
    }
  }
  console.log(`db:migrate — ${applied} applied, ${files.length - applied} already up to date`);
} finally {
  await client.end();
}
