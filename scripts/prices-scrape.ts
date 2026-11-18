/**
 * npm run prices:scrape -- --store barbora|rimi [--limit N] [--per 6] [--delay 2000] [--report dir] [--dry-run]
 *
 * Weekly price check (GitHub Actions, Mondays ~03:40 Vilnius). Politely, one page every 2 s, only pages robots.txt
 * allows:
 *   1. product URLs from the store's sitemap (no site search),
 *   2. best candidates per catalogue ingredient by name + every product already matched,
 *   3. each product page → price, promotion, loyalty-card price, pack, label data,
 *   4. writes store_products + price_history, flags > 50 % jumps and vanished products, scores matches,
 *   5. writes a report (summary + CSV of everything that needs a human look).
 * Without SUPABASE_DB_URL / DATABASE_URL (or with --dry-run) nothing is written to a database; the report and a
 * JSON file of snapshots are still produced.
 */
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';
import { parseCatalogue } from '../src/lib/ingredients/catalogue';
import { energyCheck, usdaSubset } from '../src/lib/ingredients/schema';
import { parseBarbora } from '../src/lib/prices/barbora';
import { compileRules, matchRules, nameWords, rankCandidates } from '../src/lib/prices/candidates';
import { markMissing, trackedUrls, writeLabelNutrition, writeMatch, writeSnapshot } from '../src/lib/prices/db';
import { PoliteFetcher, USER_AGENT } from '../src/lib/prices/http';
import { matchProduct, type IngredientFacts, type MatchResult } from '../src/lib/prices/match';
import { parseRimi } from '../src/lib/prices/rimi';
import { parseRobots } from '../src/lib/prices/robots';
import { productWordsFromUrl, sitemapLocs } from '../src/lib/prices/sitemap';
import type { Snapshot, StoreCode } from '../src/lib/prices/snapshot';

const arg = (name: string, fallback?: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const store = arg('store') as StoreCode | undefined;
if (store !== 'barbora' && store !== 'rimi') {
  console.error('prices:scrape — --store barbora|rimi');
  process.exit(1);
}
const limit = Number(arg('limit', '0'));
const per = Number(arg('per', '6'));
const delay = Number(arg('delay', '2000'));
const reportDir = arg('report', 'price-report') ?? 'price-report';
const dry = process.argv.includes('--dry-run');
const dbUrl = dry ? undefined : process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

const BASE = store === 'barbora' ? 'https://barbora.lt' : 'https://www.rimi.lt';
// Rimi: only food sections of the e-shop (the URL path names the section)
const RIMI_FOOD =
  /\/produktai\/(bakaleja|mesa-ir-zuvis-|pieno-produktai-ir-kiausiniai|saldytas-maistas|vaisiai-darzoves-ir-geles|duonos-gaminiai-|augaliniai-produktai|saldumynai-ir-uzkandziai)\//;

const http = new PoliteFetcher(delay);
const at = new Date();
const source = `scraper:${store}`;
const log: string[] = [];
const say = (s: string) => {
  log.push(s);
  console.log(s);
};

// ---------- catalogue ----------
const { rows } = parseCatalogue(readFileSync('data/seed/ingredients_lt.csv', 'utf8'));
const usda = usdaSubset.parse(JSON.parse(readFileSync('data/seed/usda_sr_legacy.json', 'utf8')));
const rules = compileRules(matchRules.parse(JSON.parse(readFileSync('data/seed/store_match_rules.json', 'utf8'))));
const ingredients = (limit ? rows.slice(0, limit) : rows).map((r): IngredientFacts => ({
  slug: r.slug,
  category: r.category,
  unit: r.unit,
  usdaKcal: r.usda_fdc_id ? (usda.foods[r.usda_fdc_id]?.kcal ?? null) : null,
  pieceG: r.piece_g,
}));

// ---------- robots.txt and sitemap ----------
const robotsText = await http.text(`${BASE}/robots.txt`);
const robots = parseRobots(robotsText ?? '');
const sitemapUrls =
  store === 'barbora'
    ? ['https://barbora.lt/sitemap-products.xml']
    : sitemapLocs((await http.text('https://www.rimi.lt/e-parduotuve/sitemap.xml')) ?? '').filter((u) =>
        /Product_lt_\d+\.xml$/.test(u),
      );
const productUrls: string[] = [];
for (const u of sitemapUrls) productUrls.push(...sitemapLocs((await http.text(u)) ?? ''));
const items = productUrls
  .filter((u) => (store === 'rimi' ? RIMI_FOOD.test(u) : u.startsWith('https://barbora.lt/p/')))
  .filter((u) => robots.allows(new URL(u).pathname))
  .map((url) => ({ url, words: nameWords(productWordsFromUrl(url)) }));
say(`${store}: ${items.length} products in the sitemap after filters (${USER_AGENT})`);

// ---------- which pages to read ----------
const db = dbUrl
  ? new pg.Client({
      connectionString: dbUrl,
      ssl: /localhost|127\.0\.0\.1|\/tmp|host=\//.test(dbUrl) ? undefined : { rejectUnauthorized: false },
    })
  : null;
await db?.connect();
const toRead = new Map<string, Set<string>>(); // url → ingredient slugs
const add = (url: string, slug: string) => toRead.set(url, (toRead.get(url) ?? new Set()).add(slug));
for (const ing of ingredients) {
  const rule = rules.get(ing.slug);
  if (rule) for (const c of rankCandidates(items, rule, per)) add(c.url, ing.slug);
}
const tracked = db ? await trackedUrls(db, store) : new Map<string, string[]>();
for (const [url, slugs] of tracked) for (const s of slugs) add(url, s);
say(`${toRead.size} product pages to read for ${ingredients.length} ingredients`);

// ---------- read, score, write ----------
interface ReviewRow {
  slug: string;
  url: string;
  title: string;
  price: number;
  confidence: number;
  status: string;
  reasons: string;
}
const review: ReviewRow[] = [];
const snapshots: Snapshot[] = [];
const stats = { ok: 0, failed: 0, missing: 0, changed: 0, anomalies: 0, auto: 0, review: 0 };
const bySlug = new Map(ingredients.map((i) => [i.slug, i]));
let n = 0;
for (const [url, slugs] of toRead) {
  n++;
  if (!robots.allows(new URL(url).pathname)) continue;
  let s: Snapshot;
  try {
    const html = await http.text(url);
    if (html === null) {
      stats.missing++;
      if (db && (await markMissing(db, store, url, at))) stats.anomalies++;
      continue;
    }
    s = store === 'barbora' ? parseBarbora(html, url) : parseRimi(html, url);
    stats.ok++;
  } catch (e) {
    stats.failed++;
    say(`  ✗ ${url}: ${(e as Error).message}`);
    continue;
  }
  snapshots.push(s);
  const results: [string, MatchResult][] = [...slugs].flatMap((slug) => {
    const ing = bySlug.get(slug);
    return ing ? [[slug, matchProduct(s, ing, rules.get(slug))] as [string, MatchResult]] : [];
  });
  // not a product we need and not one we track: do not store it
  if (!tracked.has(url) && !results.some(([, m]) => m.status !== 'rejected')) continue;
  if (db) {
    const w = await writeSnapshot(db, s, source, at);
    if (w.changed) stats.changed++;
    if (w.anomaly) stats.anomalies++;
    for (const [slug, m] of results) {
      await writeMatch(db, slug, w.productId, m);
      if (m.status === 'auto' && s.nutrients && energyCheck({ ...s.nutrients }).ok) {
        await writeLabelNutrition(db, slug, s, at);
      }
    }
  }
  for (const [slug, m] of results) {
    if (m.status === 'auto') stats.auto++;
    if (m.status === 'needs_review') stats.review++;
    if (m.status !== 'rejected') {
      review.push({
        slug,
        url,
        title: s.title,
        price: s.price,
        confidence: m.confidence,
        status: m.status,
        reasons: m.reasons.join(' '),
      });
    }
  }
  if (n % 50 === 0) say(`  … ${n} / ${toRead.size}`);
}

// ---------- run log + report ----------
const covered = new Set(review.filter((r) => r.status === 'auto').map((r) => r.slug));
const uncovered = ingredients.filter((i) => !covered.has(i.slug)).map((i) => i.slug);
if (db) {
  await db.query(
    `insert into public.scrape_runs (store_code, started_at, finished_at, pages_ok, pages_failed, products_changed, anomalies, log)
     values ($1, $2, now(), $3, $4, $5, $6, $7)`,
    [store, at, stats.ok, stats.failed + stats.missing, stats.changed, stats.anomalies, log.join('\n').slice(0, 20000)],
  );
  await db.end();
}
mkdirSync(reportDir, { recursive: true });
const csv = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
writeFileSync(
  join(reportDir, `${store}-matches.csv`),
  [
    'ingredient,status,confidence,price_eur,title,reasons,url',
    ...review
      .sort((a, b) => a.slug.localeCompare(b.slug) || b.confidence - a.confidence)
      .map((r) => [r.slug, r.status, r.confidence, r.price, r.title, r.reasons, r.url].map(csv).join(',')),
  ].join('\n') + '\n',
);
writeFileSync(join(reportDir, `${store}-snapshots.json`), JSON.stringify(snapshots, null, 1));
const summary = [
  `## ${store === 'barbora' ? 'Barbora' : 'Rimi'} — ${at.toISOString().slice(0, 10)}`,
  '',
  `| Pages read | Failed | Gone | Price changed | Review queue (anomalies) | Auto matches | Doubtful matches |`,
  `|---|---|---|---|---|---|---|`,
  `| ${stats.ok} | ${stats.failed} | ${stats.missing} | ${stats.changed} | ${stats.anomalies} | ${stats.auto} | ${stats.review} |`,
  '',
  `Ingredients without a confident product (${uncovered.length}): ${uncovered.join(', ') || '—'}`,
  '',
  `Doubtful matches and their reasons: \`${store}-matches.csv\` (status = needs_review). ${db ? '' : '**Dry run: nothing was written to the database.**'}`,
].join('\n');
writeFileSync(join(reportDir, `${store}-summary.md`), summary + '\n');
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '\n');
console.log(summary);
