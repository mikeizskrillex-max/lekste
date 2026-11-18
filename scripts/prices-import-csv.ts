/**
 * npm run prices:import-csv -- <file.csv>            preview: checks every row, shows what would change
 * npm run prices:import-csv -- <file.csv> --apply    writes prices (source csv:<file name>), records the import
 * npm run prices:import-csv -- --rollback <id>       removes that import's prices from history and restores the
 *                                                     previous price of each product
 * Needs SUPABASE_DB_URL (or DATABASE_URL). Column format: src/lib/prices/csv-import.ts.
 */
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import pg from 'pg';
import { parsePriceCsv } from '../src/lib/prices/csv-import';
import { writeSnapshot } from '../src/lib/prices/db';

const url = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
if (!url) {
  console.error('prices:import-csv — set SUPABASE_DB_URL (or DATABASE_URL)');
  process.exit(1);
}
const db = new pg.Client({
  connectionString: url,
  ssl: /localhost|127\.0\.0\.1|\/tmp|host=\//.test(url) ? undefined : { rejectUnauthorized: false },
});
await db.connect();
try {
  const rb = process.argv.indexOf('--rollback');
  if (rb > -1) {
    const id = Number(process.argv[rb + 1]);
    const imp = await db.query<{ file_name: string; status: string }>(
      'select file_name, status from public.csv_imports where id = $1',
      [id],
    );
    const row = imp.rows[0];
    if (!row || row.status !== 'applied') throw new Error(`import ${id} is not an applied import`);
    const source = `csv:${row.file_name}`;
    await db.query('begin');
    const touched = await db.query<{ product_id: string }>(
      'delete from public.price_history where source = $1 returning product_id',
      [source],
    );
    for (const pid of new Set(touched.rows.map((r) => r.product_id))) {
      const last = await db.query<{
        price: string;
        regular_price: string | null;
        card_price: string | null;
        in_stock: boolean;
        source: string;
        checked_at: Date;
      }>(
        'select price, regular_price, card_price, in_stock, source, checked_at from public.price_history where product_id = $1 order by checked_at desc limit 1',
        [pid],
      );
      const l = last.rows[0];
      if (l) {
        await db.query(
          'update public.store_products set price = $2, regular_price = $3, card_price = $4, in_stock = $5, source = $6, checked_at = $7 where id = $1',
          [pid, l.price, l.regular_price, l.card_price, l.in_stock, l.source, l.checked_at],
        );
      } else {
        await db.query('delete from public.store_products where id = $1', [pid]);
      }
    }
    await db.query("update public.csv_imports set status = 'rolled_back' where id = $1", [id]);
    await db.query('commit');
    console.log(`prices:import-csv — import ${id} rolled back (${touched.rowCount ?? 0} prices removed)`);
  } else {
    const file = process.argv[2];
    if (!file || file.startsWith('--')) throw new Error('usage: prices:import-csv -- <file.csv> [--apply]');
    const fileName = basename(file)
      .replace(/[^A-Za-z0-9._-]/g, '_')
      .slice(0, 80);
    const { rows, problems } = parsePriceCsv(readFileSync(file, 'utf8'), new Date());
    for (const p of problems) console.error(`  line ${p.line}: ${p.message}`);
    const preview = [];
    for (const r of rows) {
      const cur = await db.query<{ price: string }>(
        'select price from public.store_products where store_code = $1 and external_id = $2',
        [r.snapshot.store, r.snapshot.externalId],
      );
      preview.push({
        store: r.snapshot.store,
        id: r.snapshot.externalId,
        title: r.snapshot.title,
        old: cur.rows[0] ? Number(cur.rows[0].price) : null,
        new: r.snapshot.price,
      });
    }
    console.table(preview.slice(0, 50));
    const apply = process.argv.includes('--apply');
    if (problems.length && apply) throw new Error(`${problems.length} row(s) have problems — fix the file first`);
    const stores = [...new Set(rows.map((r) => r.snapshot.store))];
    const imp = await db.query<{ id: number }>(
      `insert into public.csv_imports (store_code, file_name, rows, preview, status, applied_at) values ($1, $2, $3, $4, $5, $6) returning id`,
      [
        stores[0] ?? 'barbora',
        fileName,
        rows.length,
        JSON.stringify(preview.slice(0, 200)),
        apply ? 'applied' : 'previewed',
        apply ? new Date() : null,
      ],
    );
    if (apply) {
      let jumps = 0;
      for (const r of rows) if ((await writeSnapshot(db, r.snapshot, `csv:${fileName}`, r.checkedAt)).anomaly) jumps++;
      console.log(
        `prices:import-csv — import ${imp.rows[0]?.id}: ${rows.length} prices written, ${jumps} sent to the review queue (> 50 % change)`,
      );
    } else {
      console.log(
        `prices:import-csv — preview ${imp.rows[0]?.id}: ${rows.length} rows OK, ${problems.length} with problems. Add --apply to write.`,
      );
    }
  }
} catch (e) {
  await db.query('rollback').catch(() => undefined);
  console.error(`prices:import-csv — ${(e as Error).message}`);
  process.exitCode = 1;
} finally {
  await db.end();
}
