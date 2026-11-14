import { INGREDIENT_BY_ID } from '@/data/ingredients';
import { CHEF_RECIPES, type Recipe } from '@/data/recipes';
import { passesHardRules } from './recipeFacts';
import type { QuizAnswers } from './types';

/** Hand-picked, varied dishes for the taste swipe (main protein, cuisine, meal type all differ). */
const DECK = [
  'chicken_buckwheat', 'pasta_beef', 'salmon_rice', 'chickpea_curry', 'borscht', 'pork_oven', 'syrniki', 'shakshuka',
  'shrimp_rice', 'greek_salad_chicken', 'plov', 'tofu_buckwheat', 'lentil_soup', 'oat_berries', 'cod_tomato', 'lasagna',
  'ramen', 'shawarma', 'pumpkin_soup', 'turkey_buckwheat_cutlets', 'vegan_bowl', 'bibimbap', 'egg_bake', 'tuna_salad', 'beef_stew', 'curd_toast',
];
const BY_ID = new Map(CHEF_RECIPES.map((r) => [r.id, r]));

/** Up to `n` dishes the user is allowed to eat (allergies, diet, dislikes respected). */
export function tasteDeck(u: QuizAnswers, n = 16): Recipe[] {
  const ok = (r: Recipe) => passesHardRules(r, { ...u, cookingTimeMax: 60, equipment: ['stove', 'oven', 'blender', 'airfryer', 'multicooker'] });
  const out = DECK.map((id) => BY_ID.get(id)!).filter((r) => r && ok(r)).slice(0, n);
  for (const r of CHEF_RECIPES) { if (out.length >= Math.min(n, 12)) break; if (!out.includes(r) && ok(r)) out.push(r); }
  return out;
}

/** The ingredient that carries most of a dish's protein ("chicken dish", "lentil dish"…). */
export function mainIngredient(r: Recipe): string {
  return [...r.items].sort((a, b) => (INGREDIENT_BY_ID[b[0]]?.protein ?? 0) * b[1] - (INGREDIENT_BY_ID[a[0]]?.protein ?? 0) * a[1])[0][0];
}

/**
 * Learn soft preferences from swipes: liked mains and cuisines are favoured,
 * mains only ever disliked are used less (not banned), and the swiped dishes
 * themselves are boosted or pushed away.
 */
export function learnTaste(u: QuizAnswers, liked: string[], disliked: string[]): Partial<QuizAnswers> {
  const recipe = (id: string) => BY_ID.get(id);
  const likedMains = new Set(liked.map((id) => recipe(id)).filter(Boolean).map((r) => mainIngredient(r!)));
  const dislikedMains = new Set(disliked.map((id) => recipe(id)).filter(Boolean).map((r) => mainIngredient(r!)));
  const cuisine = new Map<string, number>();
  liked.forEach((id) => { const r = recipe(id); if (r) cuisine.set(r.cuisine, (cuisine.get(r.cuisine) ?? 0) + 1); });
  disliked.forEach((id) => { const r = recipe(id); if (r) cuisine.set(r.cuisine, (cuisine.get(r.cuisine) ?? 0) - 1); });
  return {
    likedProteins: [...new Set([...u.likedProteins, ...likedMains])],
    avoid: [...new Set([...u.avoid.filter((x) => !likedMains.has(x)), ...[...dislikedMains].filter((x) => !likedMains.has(x))])],
    likedCuisines: [...cuisine].filter(([, v]) => v >= 2).map(([c]) => c),
    tasteLiked: liked,
    dislikedRecipes: [...new Set([...(u.dislikedRecipes ?? []), ...disliked])],
  };
}
