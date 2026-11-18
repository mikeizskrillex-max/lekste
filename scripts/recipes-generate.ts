/**
 * npm run recipes:generate -- --count 20 --meal dinner [--diet vegetarian] [--max-minutes 30] [--budget]
 *                              [--batch 5] [--max-usd 5] [--out data/recipes/<file>.json]
 *
 * Original recipes from the catalogue only (owner decision: AI originals + strict auto-check). Text in lt + ru in one
 * request. Only ingredients available in both stores (data/availability.json); while that snapshot is empty
 * (before the first real price run) the whole catalogue is used and every recipe stays a draft.
 * Needs ANTHROPIC_API_KEY and AI_RECIPE_MODEL. Stops before the spending limit (--max-usd).
 */
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { availabilitySnapshot } from '../src/lib/availability/snapshot';
import { fromAi } from '../src/lib/recipes/convert';
import { PROMPT_VERSION, SYSTEM_PROMPT, aiBatch, userPrompt, type WantedDiet } from '../src/lib/recipes/prompt';
import { checkRecipe } from '../src/lib/recipes/sanity';
import { MEALS, recipeFile, type Recipe } from '../src/lib/recipes/schema';
import { seedCatalogue } from '../src/lib/recipes/seed-catalogue';

const arg = (n: string, d?: string) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 ? process.argv[i + 1] : d;
};
const count = Number(arg('count', '5'));
const meal = arg('meal', 'dinner') as Recipe['meal'];
const diet = (arg('diet') ?? null) as WantedDiet;
const batch = Number(arg('batch', '5'));
const maxUsd = Number(arg('max-usd', '5'));
const maxMinutes = arg('max-minutes') ? Number(arg('max-minutes')) : undefined;
const budget = process.argv.includes('--budget');
if (!MEALS.includes(meal)) throw new Error(`--meal ${MEALS.join('|')}`);
if (diet && !['vegetarian', 'vegan', 'pescatarian', 'no_pork'].includes(diet))
  throw new Error('--diet vegetarian|vegan|pescatarian|no_pork');
const model = process.env.AI_RECIPE_MODEL;
if (!model) throw new Error('set AI_RECIPE_MODEL');
// list price of the recipe model per million tokens (USD); override when it changes
const PRICE_IN = Number(process.env.AI_RECIPE_PRICE_IN_USD_PER_MTOK ?? '4');
const PRICE_OUT = Number(process.env.AI_RECIPE_PRICE_OUT_USD_PER_MTOK ?? '20');

const { info, names, units } = seedCatalogue();
const snap = availabilitySnapshot.parse(JSON.parse(readFileSync('data/availability.json', 'utf8')));
const draftOnly = snap.bothStores.length === 0;
const allowed = [...info.values()]
  .filter((i) => i.kcal !== null)
  .filter((i) => draftOnly || snap.bothStores.includes(i.slug))
  .map((i) => ({ slug: i.slug, name: i.nameLt, unit: units.get(i.slug) ?? 'g' }));

const existing: Recipe[] = existsSync('data/recipes')
  ? readdirSync('data/recipes')
      .filter((f) => f.endsWith('.json'))
      .flatMap((f) => recipeFile.parse(JSON.parse(readFileSync(`data/recipes/${f}`, 'utf8'))))
  : [];
const taken = new Set(existing.map((r) => r.slug));
const out =
  arg('out', `data/recipes/${meal}${diet ? `-${diet}` : ''}-${new Date().toISOString().slice(0, 10)}.json`) ?? '';
const written: Recipe[] = existsSync(out) ? recipeFile.parse(JSON.parse(readFileSync(out, 'utf8'))) : [];

const client = new Anthropic();
let spent = 0;
const rejected: { title: string; reasons: string[] }[] = [];
let accepted = 0;
let sampleCounter = existing.filter((r) => r.status === 'auto_checked').length;

while (accepted < count) {
  const n = Math.min(batch, count - accepted);
  // rough upper bound for one more request, so the limit is never crossed
  if (spent + (8000 * PRICE_IN + 24000 * PRICE_OUT) / 1e6 > maxUsd) {
    console.log(`stopping: the next request could pass the ${maxUsd} USD limit`);
    break;
  }
  const titles = [...existing, ...written]
    .filter((r) => r.meal === meal)
    .map((r) => r.title.lt)
    .slice(-150);
  const res = await client.messages.parse({
    model,
    max_tokens: 24000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: userPrompt({ count: n, meal, diet, ingredients: allowed, existingTitles: titles, maxMinutes, budget }),
      },
    ],
    output_config: { format: zodOutputFormat(aiBatch), effort: 'medium' },
  });
  const cost = (res.usage.input_tokens * PRICE_IN + res.usage.output_tokens * PRICE_OUT) / 1e6;
  spent += cost;
  console.log(
    `request: ${res.usage.input_tokens} in / ${res.usage.output_tokens} out tokens ≈ ${cost.toFixed(3)} USD (total ${spent.toFixed(2)})`,
  );
  const parsed = res.parsed_output;
  if (!parsed) {
    console.log(`  no structured output (stop reason: ${res.stop_reason})`);
    continue;
  }
  for (const a of parsed.recipes) {
    const conv = fromAi(a, meal, `ai:${PROMPT_VERSION}`, taken, new Date());
    if (!conv.ok) {
      rejected.push({ title: a.title_lt, reasons: [`schema: ${conv.error}`] });
      continue;
    }
    const r = conv.recipe;
    const reasons = checkRecipe(r, { catalogue: info, names, existing: [...existing, ...written], wantedDiet: diet });
    const notAvailable = draftOnly
      ? []
      : r.ingredients.filter((i) => !snap.bothStores.includes(i.slug)).map((i) => `not_both_stores:${i.slug}`);
    const all = [...reasons, ...notAvailable];
    if (all.length) {
      rejected.push({ title: r.title.lt, reasons: all });
      continue;
    }
    taken.add(r.slug);
    sampleCounter++;
    written.push({
      ...r,
      status: draftOnly ? 'draft' : 'auto_checked',
      reviewSample: draftOnly || sampleCounter % 10 === 0,
    });
    accepted++;
  }
  mkdirSync('data/recipes', { recursive: true });
  writeFileSync(out, JSON.stringify(written, null, 1) + '\n');
}

console.log(
  `\nrecipes:generate — ${accepted} accepted into ${out}, ${rejected.length} rejected, spent ≈ ${spent.toFixed(2)} USD${draftOnly ? ' (drafts: availability not checked yet)' : ''}`,
);
for (const r of rejected) console.log(`  ✗ ${r.title}: ${r.reasons.join(', ')}`);
