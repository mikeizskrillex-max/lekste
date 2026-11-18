/**
 * npm run recipes:check — CI gate for data/recipes/*.json:
 *  - schema, unique slugs;
 *  - every recipe that can reach menus (auto_checked / reviewed) passes all auto-check rules again;
 *  - balance report against SPEC §8.2 targets (shares of meals, vegetarian, vegan, ≤ 30 min).
 * Drafts are reported, not failed. Availability (both_stores) is checked by availability:check.
 */
import { recipeFacts } from '../src/lib/recipes/facts';
import { loadRecipes } from '../src/lib/recipes/load';
import { checkRecipe } from '../src/lib/recipes/sanity';
import { seedCatalogue } from '../src/lib/recipes/seed-catalogue';

const all = loadRecipes();
const { info, names } = seedCatalogue();
const errors: string[] = [];
const seen = new Map<string, string>();
for (const { file, recipe } of all) {
  const prev = seen.get(recipe.slug);
  if (prev) errors.push(`${file}: slug ${recipe.slug} also in ${prev}`);
  seen.set(recipe.slug, file);
}
const live = all.filter((x) => x.recipe.status === 'auto_checked' || x.recipe.status === 'reviewed');
const earlier: (typeof all)[number]['recipe'][] = [];
for (const { file, recipe } of all) {
  const reasons = checkRecipe(recipe, { catalogue: info, names, existing: earlier });
  earlier.push(recipe);
  if (reasons.length && live.some((l) => l.recipe.slug === recipe.slug))
    errors.push(`${file}: ${recipe.slug} — ${reasons.join(', ')}`);
}

const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
const facts = live.map((x) => ({ r: x.recipe, f: recipeFacts(x.recipe, info) }));
const by = (m: string) => facts.filter((x) => x.r.meal === m).length;
const line = (label: string, have: number, target: string) => `| ${label} | ${have} % | ${target} |`;
console.log(
  [
    `recipes:check — ${all.length} recipes: ${live.length} usable (auto_checked/reviewed), ${all.filter((x) => x.recipe.status === 'draft').length} drafts`,
    '',
    '| Share of usable recipes | Now | Target |',
    '|---|---|---|',
    line('breakfast', pct(by('breakfast'), live.length), '≈ 25 %'),
    line('lunch', pct(by('lunch'), live.length), '≈ 30 %'),
    line('dinner', pct(by('dinner'), live.length), '≈ 30 %'),
    line('snack', pct(by('snack'), live.length), '≈ 15 %'),
    line('vegetarian', pct(facts.filter((x) => x.f.diets.includes('vegetarian')).length, live.length), '≥ 25 %'),
    line('vegan', pct(facts.filter((x) => x.f.diets.includes('vegan')).length, live.length), '≥ 10 %'),
    line('≤ 30 min', pct(facts.filter((x) => x.r.timeTotalMin <= 30).length, live.length), '≥ 40 %'),
  ].join('\n'),
);
if (errors.length) {
  console.error(errors.join('\n'));
  console.error(`recipes:check — ${errors.length} problem(s)`);
  process.exit(1);
}
