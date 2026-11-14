/**
 * Finds the public product page (barbora.lt/p/...) for every Barbora product in
 * src/data/prices.ts by searching its exact name, and writes the url back.
 * Polite: identifies itself, one request every 2.5 s, only /search pages
 * (allowed by barbora.lt/robots.txt). Run: node scripts/barbora-urls.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = new URL('../src/data/prices.ts', import.meta.url);
const UA = 'Mozilla/5.0 (compatible; LeksteBot/0.1; product links for shopping lists)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'");

let src = readFileSync(FILE, 'utf8');
const re = /barbora: \{ name: "([^"]+)"([^}]*?)url: null/g;
const names = [...src.matchAll(re)].map((m) => m[1]);
console.log(`${names.length} Barbora products without url`);
let found = 0;
for (const name of names) {
  const res = await fetch(`https://barbora.lt/search?q=${encodeURIComponent(name)}`, { headers: { 'user-agent': UA, 'accept-language': 'lt' } });
  const html = await res.text();
  let url = null;
  for (const m of html.matchAll(/href="(\/p\/[^"]+)"><span id="category-product-title-\d+"[^>]*>([^<]+)<\/span>/g)) {
    if (decode(m[2]).trim() === name.trim()) { url = `https://barbora.lt${m[1]}`; break; }
  }
  if (url) {
    found++;
    src = src.replace(new RegExp(`(barbora: \\{ name: "${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^}]*?url: )null`), `$1"${url}"`);
  }
  console.log(`${url ? '✓' : '✗'} ${name}${url ? ` → ${url}` : ''}`);
  await sleep(2500);
}
writeFileSync(FILE, src);
console.log(`found ${found}/${names.length}`);
