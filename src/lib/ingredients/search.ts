import 'server-only';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';

export const searchQuery = z.object({
  q: z.string().trim().min(2).max(80),
  limit: z.number().int().min(1).max(50).default(10),
});

const hit = z.object({
  slug: z.string(),
  name: z.object({ lt: z.string(), ru: z.string().optional() }),
  matched: z.string(),
  score: z.number(),
});
export type IngredientHit = z.infer<typeof hit>;

/**
 * Typo- and diacritics-tolerant ingredient search in Lithuanian and Russian (public.search_ingredients).
 * Returns null when Supabase is not configured, so callers can show a neutral state instead of failing.
 */
export async function searchIngredients(input: z.input<typeof searchQuery>): Promise<IngredientHit[] | null> {
  const { q, limit } = searchQuery.parse(input);
  const db = await supabaseServer();
  if (!db) return null;
  const { data, error } = await db.rpc('search_ingredients', { q, lim: limit });
  if (error) throw new Error(`search_ingredients: ${error.message}`);
  return z.array(hit).parse(data);
}
