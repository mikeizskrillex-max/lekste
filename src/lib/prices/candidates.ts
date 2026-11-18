import { z } from 'zod';
import { searchNorm } from '@/lib/ingredients/normalize';

/**
 * Finding store products for an ingredient, from product names (sitemap URL words or page titles).
 * Rules live in data/seed/store_match_rules.json:
 *   include — at least one line whose every stem starts a word of the name ("=word" — the exact word);
 *   exclude — the product is skipped if any line matches (all stems of that line).
 */
export const matchRules = z.object({
  _note: z.string().optional(),
  globalExclude: z.array(z.string().min(2)),
  rules: z.record(
    z.string().regex(/^[a-z][a-z0-9_]{1,40}$/),
    z.object({ include: z.array(z.string().min(2)).min(1), exclude: z.array(z.string().min(2)) }),
  ),
});
export type MatchRules = z.infer<typeof matchRules>;

const NOISE = new Set([
  'g',
  'kg',
  'ml',
  'l',
  'cl',
  'vnt',
  'proc',
  'rieb',
  'x',
  'su',
  'ir',
  'be',
  'is',
  'pak',
  'fas',
  'n',
]);

/** Normalised words of a product name, without numbers and units. */
export function nameWords(name: string): string[] {
  return searchNorm(name)
    .replace(/[^a-z0-9а-я ]+/g, ' ')
    .split(' ')
    .filter((w) => w && !NOISE.has(w) && !/^\d/.test(w));
}

type Line = readonly string[];
export interface CompiledRule {
  include: Line[];
  exclude: Line[];
}

const compileLine = (line: string): Line => searchNorm(line).split(' ').filter(Boolean);

/** Pre-split every rule line once; matching then runs over thousands of names quickly. */
export function compileRules(rules: MatchRules): Map<string, CompiledRule> {
  const global = rules.globalExclude.map(compileLine);
  return new Map(
    Object.entries(rules.rules).map(([slug, r]) => [
      slug,
      { include: r.include.map(compileLine), exclude: [...global, ...r.exclude.map(compileLine)] },
    ]),
  );
}

function lineMatches(line: Line, words: readonly string[]): boolean {
  return line.every((stem) =>
    stem.startsWith('=') ? words.includes(stem.slice(1)) : words.some((w) => w.startsWith(stem)),
  );
}

/**
 * Score 0.4–1 or null (no match). Higher when the matched line covers more of the name ("Morkos, 1 kg" beats
 * "Morkos su petražolių lapeliais") and when the name starts with the product word.
 */
export function scoreWords(words: readonly string[], rule: CompiledRule): number | null {
  if (!words.length) return null;
  if (rule.exclude.some((line) => lineMatches(line, words))) return null;
  let best = 0;
  let head = false;
  for (const line of rule.include) {
    if (!lineMatches(line, words)) continue;
    best = Math.max(best, Math.min(1, line.length / words.length));
    // Lithuanian titles usually start with the product itself: "Bulvės LINKĖJIMAI IŠ KAIMO" beats "Bulvių prieskoniai"
    const first = words[0] ?? '';
    if (line.some((stem) => (stem.startsWith('=') ? first === stem.slice(1) : first.startsWith(stem)))) head = true;
  }
  if (best === 0) return null;
  return Math.round(Math.min(1, 0.4 + 0.5 * best + (head ? 0.1 : 0)) * 100) / 100;
}

export function nameScore(name: string, rule: CompiledRule | undefined): number | null {
  return rule ? scoreWords(nameWords(name), rule) : null;
}

export interface NamedItem {
  url: string;
  words: readonly string[];
}

export interface Candidate {
  url: string;
  score: number;
}

/** Best candidates for an ingredient among product names (e.g. from a sitemap). */
export function rankCandidates(items: readonly NamedItem[], rule: CompiledRule, limit = 5): Candidate[] {
  const out: Candidate[] = [];
  for (const it of items) {
    const score = scoreWords(it.words, rule);
    if (score !== null) out.push({ url: it.url, score });
  }
  return out.sort((a, b) => b.score - a.score || a.url.length - b.url.length).slice(0, limit);
}
