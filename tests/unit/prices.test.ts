import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseCatalogue } from '@/lib/ingredients/catalogue';
import { isPriceJump } from '@/lib/prices/anomaly';
import { parseBarbora } from '@/lib/prices/barbora';
import { compileRules, matchRules, nameScore, nameWords, rankCandidates } from '@/lib/prices/candidates';
import { parsePriceCsv } from '@/lib/prices/csv-import';
import { matchProduct, type IngredientFacts } from '@/lib/prices/match';
import { packFromTitle } from '@/lib/prices/pack';
import { parseRimi } from '@/lib/prices/rimi';
import { parseRobots } from '@/lib/prices/robots';
import { productWordsFromUrl, sitemapLocs } from '@/lib/prices/sitemap';
import type { Snapshot } from '@/lib/prices/snapshot';

const rulesJson = matchRules.parse(JSON.parse(readFileSync('data/seed/store_match_rules.json', 'utf8')));
const rules = compileRules(rulesJson);

describe('pack size from a title', () => {
  it.each([
    ['Grikiai EXTRA LINE, 800 g', { size: 800, unit: 'g' }],
    ['Pienas 2,5 % rieb., 1 l', { size: 1000, unit: 'ml' }],
    ['Kiaušiniai M, 10 vnt.', { size: 10, unit: 'pcs' }],
    ['Jogurtas 4 x 125 g', { size: 500, unit: 'g' }],
    ['Plautos morkos, 1 kg', { size: 1000, unit: 'g' }],
    ['Aliejus 0,5 l', { size: 500, unit: 'ml' }],
  ] as const)('%s', (title, pack) => expect(packFromTitle(title)).toEqual(pack));
  it('no size → null', () => expect(packFromTitle('Brokolis')).toBeNull());
});

describe('robots.txt', () => {
  const r = parseRobots(
    'User-agent: *\nDisallow: /search?q=*\nDisallow: /cart\nAllow: /\n\nUser-agent: other\nDisallow: /',
  );
  it('allows product pages', () => expect(r.allows('/e-parduotuve/lt/produktai/x/p/1')).toBe(true));
  it('blocks what it disallows', () => {
    expect(r.allows('/search?q=pienas')).toBe(false);
    expect(r.allows('/cart')).toBe(false);
  });
});

describe('sitemap', () => {
  it('reads <loc> and product words', () => {
    const locs = sitemapLocs('<urlset><url><loc>https://barbora.lt/p/plautos-morkos-1-kg</loc></url></urlset>');
    expect(locs).toEqual(['https://barbora.lt/p/plautos-morkos-1-kg']);
    expect(productWordsFromUrl('https://www.rimi.lt/e-parduotuve/lt/produktai/a/b/morkos-1-kg/p/272768')).toBe(
      'morkos 1 kg',
    );
  });
});

describe('candidate names', () => {
  it('every catalogue ingredient has a rule', () => {
    const { rows } = parseCatalogue(readFileSync('data/seed/ingredients_lt.csv', 'utf8'));
    expect(rows.filter((r) => !rules.has(r.slug)).map((r) => r.slug)).toEqual([]);
  });
  it('finds plain products and skips processed ones', () => {
    expect(nameScore('Plautos morkos, 1 kg', rules.get('carrot'))).not.toBeNull();
    expect(nameScore('Morkų sultys, 1 l', rules.get('carrot'))).toBeNull();
    expect(nameScore('Pienas 2,5 %, 1 l', rules.get('milk'))).not.toBeNull();
    expect(nameScore('Kokosų pienas, 400 ml', rules.get('milk'))).toBeNull();
    expect(nameScore('Troškinta jautiena, 240 g', rules.get('beef_stew'))).toBeNull();
    expect(nameScore('Skanėstas katėms su lašiša', rules.get('salmon'))).toBeNull();
  });
  it('ranks the product word first', () => {
    const items = ['bulviu prieskoniai 35 g', 'bulves linkejimai is kaimo 1 kg'].map((n) => ({
      url: n,
      words: nameWords(n),
    }));
    const rule = rules.get('potato');
    expect(rule && rankCandidates(items, rule, 1)[0]?.url).toBe('bulves linkejimai is kaimo 1 kg');
  });
});

const snap = (o: Partial<Snapshot>): Snapshot => ({
  store: 'rimi',
  externalId: '1',
  url: 'https://www.rimi.lt/x',
  title: 'Plautos morkos, 1 kg',
  brand: null,
  categoryPath: 'vaisiai-darzoves-ir-geles/darzoves-ir-grybai/morkos',
  packSize: 1000,
  packUnit: 'g',
  soldByWeight: false,
  saleStepKg: null,
  price: 0.69,
  regularPrice: null,
  cardPrice: null,
  promoFrom: null,
  promoTo: null,
  unitPrice: 0.69,
  unitPriceUnit: 'kg',
  inStock: true,
  ingredientsText: null,
  nutrients: null,
  ...o,
});
const carrot: IngredientFacts = { slug: 'carrot', category: 'vegetables', unit: 'g', usdaKcal: 41, pieceG: 70 };

describe('match confidence', () => {
  it('plain carrots on the carrot shelf → auto', () => {
    expect(matchProduct(snap({}), carrot, rules.get('carrot')).status).toBe('auto');
  });
  it('wrong store section → rejected', () => {
    expect(matchProduct(snap({ categoryPath: 'kosmetika-ir-higiena/x' }), carrot, rules.get('carrot')).status).toBe(
      'rejected',
    );
  });
  it('frozen product for a fresh ingredient → rejected', () => {
    const r = matchProduct(
      snap({ title: 'Šaldytos morkos, 400 g', categoryPath: 'saldytas-maistas/darzoves' }),
      carrot,
      rules.get('carrot'),
    );
    expect(r.reasons).toContain('frozen_vs_fresh');
  });
  it('label kcal far from USDA → doubtful at best', () => {
    const beans: IngredientFacts = {
      slug: 'canned_red_beans',
      category: 'canned',
      unit: 'g',
      usdaKcal: 84,
      pieceG: null,
    };
    const r = matchProduct(
      snap({
        title: 'Raudonosios pupelės, 500 g',
        categoryPath: 'bakaleja/ankstiniai',
        nutrients: { kcal: 333, protein: 24, fat: 1, carbs: 50, fiber: null },
      }),
      beans,
      rules.get('canned_red_beans'),
    );
    expect(r.reasons).toContain('kcal_mismatch');
    expect(r.status).not.toBe('auto');
  });
  it('sold by the piece without a known piece weight → needs a person', () => {
    const broccoli: IngredientFacts = {
      slug: 'broccoli',
      category: 'vegetables',
      unit: 'g',
      usdaKcal: 34,
      pieceG: null,
    };
    const r = matchProduct(
      snap({ title: 'Brokolis, 1 vnt.', categoryPath: 'darzoves/brokoliai', packSize: 1, packUnit: 'pcs' }),
      broccoli,
      rules.get('broccoli'),
    );
    expect(r.status).toBe('needs_review');
  });
});

describe('price anomalies', () => {
  it('more than 50 % up or down is a jump', () => {
    expect(isPriceJump(1, 1.51)).toBe(true);
    expect(isPriceJump(2, 0.99)).toBe(true);
    expect(isPriceJump(1, 1.5)).toBe(false);
    expect(isPriceJump(null, 5)).toBe(false);
  });
});

const barboraPage = (product: object) =>
  `<html><script nonce="">window.__remixContext = ${JSON.stringify({ state: { loaderData: { p: { queries: [{ state: { data: product } }] } } } })};</script></html>`;

describe('Barbora page', () => {
  const base = {
    id: '000000000000180895',
    shopCode: 'X500',
    title: 'Plautos morkos, 1 kg',
    categoryPathUrl: 'c/LQNK/darzoves-ir-vaisiai/darzoves-ir-grybai/bulves-morkos-ir-kopustai',
    price: 0.69,
    comparativeUnit: { type: 'kg', price: 0.69 },
    unit: { type: 'kg', step: 0.5 },
    status: 'active',
    brand: '',
    ingredients: null,
    nutrients: null,
  };
  it('reads price, unit price and weight step', () => {
    const s = parseBarbora(barboraPage({ ...base, promotion: null }), 'https://barbora.lt/p/plautos-morkos-1-kg');
    expect(s).toMatchObject({
      price: 0.69,
      cardPrice: null,
      unitPrice: 0.69,
      unitPriceUnit: 'kg',
      soldByWeight: true,
      saleStepKg: 0.5,
      packSize: 1000,
    });
  });
  it('Ačiū card promotion: the shopper without a card pays the old price', () => {
    const promo = {
      oldPrice: 0.89,
      loyaltyCardRequired: true,
      validFrom: '2026-11-17T00:00:00Z',
      validTo: '2026-11-23T00:00:00Z',
    };
    const s = parseBarbora(barboraPage({ ...base, promotion: promo }), 'https://barbora.lt/p/x');
    expect(s).toMatchObject({
      price: 0.89,
      cardPrice: 0.69,
      regularPrice: null,
      promoFrom: '2026-11-17',
      promoTo: '2026-11-23',
    });
  });
  it('promotion for everyone: price is the promo price, regular price kept', () => {
    const s = parseBarbora(
      barboraPage({ ...base, promotion: { oldPrice: 0.99, loyaltyCardRequired: false } }),
      'https://barbora.lt/p/x',
    );
    expect(s).toMatchObject({ price: 0.69, regularPrice: 0.99, cardPrice: null });
  });
  it('label nutrients', () => {
    const n = { calories: { value: 319 }, protein: { value: 12.1 }, carbohydrates: { value: 61 }, fat: { value: 3 } };
    const s = parseBarbora(
      barboraPage({ ...base, title: 'Grikiai, 800 g', nutrients: n, ingredients: 'Grikiai. Galimi GLITIMO pėdsakai.' }),
      'https://barbora.lt/p/x',
    );
    expect(s.nutrients).toEqual({ kcal: 319, protein: 12.1, fat: 3, carbs: 61, fiber: null });
    expect(s.ingredientsText).toContain('GLITIMO');
  });
  it('a page without a product throws', () => {
    expect(() => parseBarbora('<html></html>', 'https://barbora.lt/p/x')).toThrow();
  });
});

const rimiPage = ({ old = '', card = '' }: { old?: string; card?: string }) => `
<script type="application/ld+json">{"@type":"Product","name":"Citrinos Mayer, 1 kg","sku":"969226","offers":{"price":"1.99","availability":"InStock"}}</script>
<div class="product__main js-product-container">${card}</div>
<h1 id="product_name" class="name"> Citrinos Mayer, 1 kg </h1>
<div class="price-wrapper"><div class="price"><span>1</span><div><sup>99</sup><sub> €/kg </sub></div>${old}</div>
<div><p class="price-per"> 1,99 €/kg </p></div></div>
<p class="notice"> Pasiūlymas galioja nuo 2026.11.17 iki 2026.11.23 </p>
<input type="hidden" name="step" value="0.46">
<script>var tabs = [{ html: ${JSON.stringify('<table><tr><td>energinė vertė</td><td>121 kJ/ 29 kcal</td></tr><tr><td>riebalai</td><td>0.3 g</td></tr><tr><td>angliavandeniai</td><td>9.3 g</td></tr><tr><td>baltymai</td><td>1.1 g</td></tr></table><dl><dt>Prekės ženklas</dt><dd class="text">Mayer</dd></dl>')},
}];</script>`;
const RIMI_URL =
  'https://www.rimi.lt/e-parduotuve/lt/produktai/vaisiai-darzoves-ir-geles/vaisiai-ir-uogos/citrinos/citrinos-mayer-1-kg/p/969226';

describe('Rimi page', () => {
  it('reads price, unit price, step, label and brand', () => {
    const s = parseRimi(rimiPage({}), RIMI_URL);
    expect(s).toMatchObject({
      externalId: '969226',
      price: 1.99,
      unitPrice: 1.99,
      unitPriceUnit: 'kg',
      soldByWeight: true,
      saleStepKg: 0.46,
      brand: 'Mayer',
      categoryPath: 'vaisiai-darzoves-ir-geles/vaisiai-ir-uogos/citrinos',
      promoTo: '2026-11-23',
    });
    expect(s.nutrients).toEqual({ kcal: 29, protein: 1.1, fat: 0.3, carbs: 9.3, fiber: null });
  });
  it('old price of a promotion for everyone', () => {
    expect(parseRimi(rimiPage({ old: '<p class="price__old-price">2,49€</p>' }), RIMI_URL).regularPrice).toBe(2.49);
  });
  it('Mano Rimi card price', () => {
    const card =
      '<div class="price-label"><img src="/x/rimi-card.png"><span class="major">1</span><span class="cents">49</span></div>';
    expect(parseRimi(rimiPage({ card }), RIMI_URL).cardPrice).toBe(1.49);
  });
});

describe('CSV price import', () => {
  const today = new Date('2026-11-18T10:00:00Z');
  const head = 'store,external_id,url,title,price,regular_price,card_price,pack_size,pack_unit,in_stock,checked_at\n';
  it('accepts a good row and reads the pack from the title', () => {
    const { rows, problems } = parsePriceCsv(
      head + 'rimi,272768,https://www.rimi.lt/x,"Plautos morkos, 1 kg","0,69",,,,,yes,2026-11-16\n',
      today,
    );
    expect(problems).toEqual([]);
    expect(rows[0]?.snapshot).toMatchObject({ price: 0.69, packSize: 1000, packUnit: 'g' });
  });
  it('rejects old dates, missing prices and unknown stores', () => {
    const { problems } = parsePriceCsv(
      head +
        'rimi,1,https://www.rimi.lt/x,Morkos,1,,,,,yes,2026-10-01\n' +
        'rimi,2,https://www.rimi.lt/x,Morkos,,,,,,yes,\n' +
        'lidl,3,https://www.lidl.lt/x,Morkos,1,,,,,yes,\n',
      today,
    );
    expect(problems.map((p) => p.line)).toEqual([2, 3, 4]);
  });
});
