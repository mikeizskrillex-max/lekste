import { MATCH_RULES } from './matchRules';
import type { MatchQuality, ProductCategory } from './types';

/** Lowercase, strip Lithuanian diacritics. */
export function fold(s: string): string {
  return s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
}

const PIECE_G: Record<string, number> = { eggs: 60, avocado: 200, cucumber: 300, lavash: 200, rye_bread: 800 };

/** Package size in grams/ml parsed from a product title ("4x125 g", "0,9 kg", "10 vnt."). */
export function parseGrams(name: string, ingredientId?: string): number | null {
  const n = fold(name).replace(/,/g, '.');
  const multi = n.match(/(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*(kg|g|ml|l)\b/);
  if (multi) return Number(multi[1]) * Number(multi[2]) * (multi[3] === 'kg' || multi[3] === 'l' ? 1000 : 1);
  const all = [...n.matchAll(/(\d+(?:\.\d+)?)\s*(kg|g|ml|l)\b/g)];
  if (all.length) {
    const [, q, u] = all[all.length - 1];
    return Number(q) * (u === 'kg' || u === 'l' ? 1000 : 1);
  }
  const pcs = n.match(/(\d+)\s*vnt/);
  if (pcs && ingredientId && PIECE_G[ingredientId]) return Number(pcs[1]) * PIECE_G[ingredientId];
  return null;
}

/** Brand = the run of UPPER-CASE words in a Lithuanian product title ("Grikiai EXTRA LINE, 800 g"). */
export function parseBrand(name: string): string | null {
  const m = name.match(/\b([A-ZĄČĘĖĮŠŲŪŽ][A-ZĄČĘĖĮŠŲŪŽ&'.-]{1,}(?:\s+[A-ZĄČĘĖĮŠŲŪŽ&'.-]{2,})*)\b/);
  return m && m[1].length > 1 ? m[1].trim() : null;
}

/** Does this product title fit our ingredient? */
export function matchesIngredient(name: string, ingredientId: string): boolean {
  const rule = MATCH_RULES[ingredientId];
  if (!rule) return false;
  const f = fold(name);
  return rule.need.every((group) => group.split('|').some((w) => f.includes(w))) && !rule.exclude.some((w) => f.includes(w));
}

/** Find the ingredient a free-text product title belongs to (CSV rows without ingredient id). */
export function matchIngredient(name: string): { ingredientId: string; match: MatchQuality } | null {
  const hits = Object.keys(MATCH_RULES).filter((id) => matchesIngredient(name, id));
  if (hits.length === 0) return null;
  // the most specific rule (most "need" groups) wins; ties are approximate
  hits.sort((a, b) => MATCH_RULES[b].need.length - MATCH_RULES[a].need.length);
  const exact = hits.length === 1 || MATCH_RULES[hits[0]].need.length > MATCH_RULES[hits[1]].need.length;
  return { ingredientId: hits[0], match: exact ? 'exact' : 'approximate' };
}

const CATEGORY: Record<string, ProductCategory> = {
  chicken_breast: 'meat', chicken_thigh: 'meat', turkey_mince: 'meat', turkey_fillet: 'meat', beef_mince: 'meat', pork_loin: 'meat',
  cod: 'fish', salmon: 'fish', tuna_can: 'fish', shrimp: 'fish',
  eggs: 'eggs', cottage_cheese: 'dairy', greek_yogurt: 'dairy', natural_yogurt: 'dairy', kefir: 'dairy', milk: 'dairy', cheese: 'dairy', feta: 'dairy', sour_cream: 'dairy',
  buckwheat: 'grains', oats: 'grains', rice: 'grains', bulgur: 'grains', barley: 'grains', quinoa: 'grains', lentils: 'grains', chickpeas: 'grains', beans: 'grains',
  pasta: 'pasta', rye_bread: 'bread', lavash: 'bread', olive_oil: 'oils', walnuts: 'nuts', peanut_butter: 'nuts', sesame: 'nuts', sunflower_seeds: 'nuts',
  mixed_veg: 'frozen', green_peas: 'frozen', berries: 'frozen',
  apple: 'fruits', banana: 'fruits', pear: 'fruits', orange: 'fruits', lemon: 'fruits', avocado: 'fruits',
};
export function categoryOf(ingredientId: string): ProductCategory {
  return CATEGORY[ingredientId] ?? (['tofu', 'honey', 'soy_sauce', 'canned_tomatoes', 'corn'].includes(ingredientId) ? 'other' : 'vegetables');
}
