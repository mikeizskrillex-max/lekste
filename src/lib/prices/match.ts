import { searchNorm } from '@/lib/ingredients/normalize';
import type { Category } from '@/lib/ingredients/schema';
import { nameScore, type CompiledRule } from './candidates';
import type { Snapshot } from './snapshot';

/** Store category words that fit each ingredient category (Barbora categoryPathUrl, Rimi URL path). */
export const STORE_CATEGORY_HINTS: Record<Category, readonly string[]> = {
  vegetables: ['darzov', 'grybai'],
  herbs: ['darzov', 'zalumyn', 'prieskon'],
  fruit: ['vaisi', 'uogos'],
  dried_fruit: ['dziovint', 'riesut', 'bakalej', 'sveik'],
  frozen: ['saldyt'],
  canned: ['konserv', 'bakalej', 'ankst'],
  grains: ['bakalej', 'kruop', 'makaron', 'milt', 'ryz', 'dribsn'],
  legumes: ['bakalej', 'ankst', 'konserv', 'augalin', 'kruop'],
  bakery: ['duon'],
  meat: ['mes', 'paukst', 'desr', 'kulinar'],
  fish: ['zuv', 'jur'],
  dairy: ['pien', 'sur', 'varsk', 'grietin', 'sviest', 'jogurt', 'kefyr'],
  eggs: ['kiausin', 'pien'],
  oils: ['aliej', 'bakalej'],
  nuts_seeds: ['riesut', 'sekl', 'bakalej', 'sveik', 'tepi', 'uzkand'],
  seasoning: ['bakalej', 'prieskon', 'drusk'],
  spices: ['prieskon', 'bakalej'],
  condiments: ['padaz', 'bakalej', 'konserv', 'majonez', 'garstyc', 'prieskon'],
  baking: ['bakalej', 'kepim', 'saldum', 'konditer', 'cukr', 'uogien', 'sokolad', 'medus'],
};

export const AUTO_THRESHOLD = 0.75;
export const REVIEW_THRESHOLD = 0.45;

export interface IngredientFacts {
  slug: string;
  category: Category;
  unit: 'g' | 'ml' | 'pcs';
  usdaKcal: number | null;
  /** weight of one piece, g (needed when a store sells by the piece) */
  pieceG: number | null;
}

export type MatchReason =
  | 'name'
  | 'shelf'
  | 'category_mismatch'
  | 'no_category'
  | 'pack_unit'
  | 'no_pack'
  | 'kcal_mismatch'
  | 'kcal_ok'
  | 'out_of_stock'
  | 'frozen_vs_fresh'
  | 'piece_weight_unknown';

export interface MatchResult {
  confidence: number;
  status: 'auto' | 'needs_review' | 'rejected';
  reasons: MatchReason[];
}

/** How sure we are that this product stands for the ingredient. Deterministic, explained by reasons. */
export function matchProduct(s: Snapshot, ing: IngredientFacts, rule: CompiledRule | undefined): MatchResult {
  const base = nameScore(s.title, rule);
  if (base === null) return { confidence: 0, status: 'rejected', reasons: ['name'] };
  let c = base;
  const reasons: MatchReason[] = [];

  // frozen and fresh are different products for a recipe
  const frozen = /\bsaldyt|\bsald\b|uzsald/.test(searchNorm(`${s.title} ${s.categoryPath ?? ''}`));
  if (frozen !== (ing.category === 'frozen'))
    return { confidence: 0, status: 'rejected', reasons: ['frozen_vs_fresh'] };

  const cat = s.categoryPath ? searchNorm(s.categoryPath) : null;
  if (cat === null) {
    c -= 0.15;
    reasons.push('no_category');
  } else if (!STORE_CATEGORY_HINTS[ing.category].some((h) => cat.includes(h))) {
    return { confidence: 0, status: 'rejected', reasons: ['category_mismatch'] };
  } else {
    c += 0.05;
    // the store's own shelf is named after the product ("…/morkos/…", "…/bulves-morkos-ir-kopustai")
    const shelf = cat.split('/').slice(-2).join(' ').replace(/-/g, ' ').split(' ');
    if (rule?.include.some((line) => line.every((st) => shelf.some((w) => w.startsWith(st.replace(/^=/, '')))))) {
      c += 0.15;
      reasons.push('shelf');
    }
  }

  if (s.soldByWeight) {
    if (ing.unit === 'ml') {
      c -= 0.2;
      reasons.push('pack_unit');
    }
  } else if (s.packSize === null || s.packUnit === null) {
    c -= 0.2;
    reasons.push('no_pack');
  } else if (s.packUnit !== ing.unit && !(ing.unit === 'pcs' && s.packUnit === 'g')) {
    // liquids sold in grams (cream 200 g) or eggs by weight are possible but need a look
    c -= 0.2;
    reasons.push('pack_unit');
  }

  if (s.nutrients && ing.usdaKcal !== null) {
    const diff = Math.abs(s.nutrients.kcal - ing.usdaKcal);
    if (diff > 40 && diff / Math.max(ing.usdaKcal, 1) > 0.35) {
      c -= 0.35;
      reasons.push('kcal_mismatch');
    } else {
      c += 0.1;
      reasons.push('kcal_ok');
    }
  }
  if (!s.inStock) reasons.push('out_of_stock');

  const confidence = Math.round(Math.max(0, Math.min(1, c)) * 100) / 100;
  let status: MatchResult['status'] =
    confidence >= AUTO_THRESHOLD ? 'auto' : confidence >= REVIEW_THRESHOLD ? 'needs_review' : 'rejected';
  // sold by the piece, but we do not know how much a piece weighs → a person decides
  if (!s.soldByWeight && s.packUnit === 'pcs' && ing.unit !== 'pcs' && ing.pieceG === null) {
    reasons.push('piece_weight_unknown');
    if (status === 'auto') status = 'needs_review';
  }
  return { confidence, status, reasons };
}
