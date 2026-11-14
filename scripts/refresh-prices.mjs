/**
 * Weekly price & promotion refresh for data/prices.json.
 *
 * Reads every product's OWN public page (barbora.lt/p/…, rimi.lt/e-parduotuve/…/p/…),
 * which robots.txt of both stores allows, and updates: price, regular price,
 * promotion (valid from/to, loyalty card), unit price per kg, availability.
 * Polite: identifies itself, one request every 2 s, stops on repeated errors.
 *
 *   node scripts/refresh-prices.mjs            # behind a proxy add NODE_USE_ENV_PROXY=1
 *   node scripts/refresh-prices.mjs --dry-run  # print changes, write nothing
 */
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = new URL('../data/prices.json', import.meta.url);
const UA = 'Mozilla/5.0 (compatible; LeksteBot/0.1; weekly price check for meal planning)';
const DRY = process.argv.includes('--dry-run');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const num = (s) => Number(String(s).replace(',', '.'));
const round = (n) => Math.round(n * 100) / 100;

/** Barbora product page: the product's JSON object (matched by its url slug). */
export function parseBarbora(html, url) {
  const slug = url.split('/p/')[1];
  const i = html.indexOf(`"url":"${slug}"`);
  if (i < 0) return null;
  const seg = html.slice(i, i + 4000);
  const price = seg.match(/"price":([\d.]+),"promotion":(null|\{[^}]*\})/);
  if (!price) return null;
  const promo = price[2] === 'null' ? null : JSON.parse(price[2]);
  const unit = seg.match(/"comparativeUnit":\{"type":"(\w+)","price":([\d.]+)/);
  const status = seg.match(/"status":"(\w+)"/)?.[1];
  return {
    price: Number(price[1]),
    regular: promo?.oldPrice ?? null,
    promo: !!promo && promo.oldPrice > Number(price[1]),
    promoFrom: promo?.validFrom?.slice(0, 10) ?? null,
    promoTo: promo?.validTo ? new Date(Date.parse(promo.validTo) - 1).toISOString().slice(0, 10) : null,
    loyalty: !!promo?.loyaltyCardRequired,
    perKg: unit && (unit[1] === 'kg' || unit[1] === 'l') ? Number(unit[2]) : null,
    available: status ? status === 'active' : true,
  };
}

/** Rimi product page: schema.org offer + the main price block. */
export function parseRimi(html) {
  const ld = html.match(/"offers":\s*\{[^}]*?"price":\s*"([\d.]+)"[^}]*?"availability":\s*"(\w+)"/);
  if (!ld) return null;
  const i = html.indexOf('class="price-wrapper');
  const block = i >= 0 ? html.slice(i, i + 2500) : '';
  const old = block.match(/price__old-price">\s*([\d,]+)\s*€/);
  const per = block.match(/price-per">\s*([\d,]+)\s*€\/(kg|l)/);
  const valid = block.match(/galioja nuo (\d{4})\.(\d{2})\.(\d{2}) iki (\d{4})\.(\d{2})\.(\d{2})/);
  const price = Number(ld[1]);
  return {
    price,
    regular: old ? num(old[1]) : null,
    promo: !!old && num(old[1]) > price,
    promoFrom: valid ? `${valid[1]}-${valid[2]}-${valid[3]}` : null,
    promoTo: valid ? `${valid[4]}-${valid[5]}-${valid[6]}` : null,
    loyalty: /Mano Rimi/i.test(block),
    perKg: per ? num(per[1]) : null,
    available: ld[2] !== 'OutOfStock',
  };
}

async function main() {
  const data = JSON.parse(readFileSync(FILE, 'utf8'));
  const now = new Date().toISOString();
  let ok = 0, failed = 0, changed = 0, promos = 0, consecutiveErrors = 0;
  for (const [ingredient, byStore] of Object.entries(data.offers)) {
    for (const [store, offer] of Object.entries(byStore)) {
      if (!offer.url) continue;
      let parsed = null;
      try {
        const res = await fetch(offer.url, { headers: { 'user-agent': UA, 'accept-language': 'lt' }, redirect: 'follow' });
        if (res.status === 404) parsed = { ...offer, available: false };
        else if (res.ok) {
          const html = await res.text();
          parsed = store === 'barbora' ? parseBarbora(html, offer.url) : parseRimi(html);
        }
        consecutiveErrors = 0;
      } catch (e) {
        consecutiveErrors++;
        if (consecutiveErrors >= 5) throw new Error(`stopping: ${consecutiveErrors} network errors in a row (${e.message})`);
      }
      if (!parsed) { failed++; console.log(`✗ ${store} ${ingredient}: could not read ${offer.url}`); await sleep(2000); continue; }
      ok++;
      const next = {
        ...offer,
        price: parsed.price ?? offer.price,
        regular: parsed.promo ? parsed.regular : null,
        promo: parsed.promo,
        promoFrom: parsed.promo ? parsed.promoFrom : null,
        promoTo: parsed.promo ? parsed.promoTo : null,
        loyalty: parsed.promo ? parsed.loyalty : false,
        perKg: round(parsed.perKg ?? ((parsed.price ?? offer.price) / offer.grams) * 1000),
        available: parsed.available,
        retrievedAt: now,
      };
      if (next.promo) promos++;
      if (next.price !== offer.price || next.promo !== offer.promo || next.available !== offer.available) {
        changed++;
        console.log(`• ${store} ${ingredient}: ${offer.price} → ${next.price}${next.promo ? ` (akcija, įprasta ${next.regular}${next.loyalty ? ', su kortele' : ''}, iki ${next.promoTo})` : ''}${next.available ? '' : ' NEPRIEINAMA'}`);
      }
      byStore[store] = next;
      await sleep(2000);
    }
  }
  data.updatedAt = now;
  console.log(`read ${ok}, failed ${failed}, changed ${changed}, promotions ${promos}`);
  if (ok === 0) throw new Error('nothing could be read — not writing');
  if (!DRY) writeFileSync(FILE, JSON.stringify(data, null, 1) + '\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
