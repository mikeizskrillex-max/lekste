import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { IntentSchema, type AssistantContext, type Intent } from './intent';
import { parseRules } from './rules';

/** Provider-independent interface: swap the implementation via AI_PROVIDER. */
export interface AiProvider {
  name: string;
  parseIntent(message: string, ctx: AssistantContext): Promise<Intent>;
}

export const rulesProvider: AiProvider = {
  name: 'rules',
  async parseIntent(message, ctx) { return parseRules(message, ctx.today); },
};

const SYSTEM = `You convert a user's request about their weekly meal plan into structured actions for the Lėkštė app (Lithuania).
The user writes in Lithuanian, Russian or English. Days: 0 = Monday … 6 = Sunday; "today" is day {today}.
Rules:
- Only emit actions the user asked for. Unknown or unrelated requests → empty actions and a short reply explaining what you can do.
- Never state prices, calories or nutrition numbers in the reply; the app computes them from its own database.
- Never give medical advice; for illness, pregnancy or eating disorders suggest a doctor or dietitian.
- replace_meal: day + meal + mode (cheaper | protein | vegetarian | any). meal = null means every meal of that day; day = null means the whole week.
- set_targets: kcal and/or protein in grams, or proteinFactor (1.2 = +20 %) for "more protein".
- set_stores: only when the user wants to shop only at specific retailers (maxima, barbora, rimi, lidl, iki).
- Fill every field; use null when not applicable.
- reply: one short friendly sentence in the user's language ({lang}).`;

export function anthropicProvider(apiKey: string): AiProvider {
  const client = new Anthropic({ apiKey });
  return {
    name: 'anthropic',
    async parseIntent(message, ctx) {
      const res = await client.messages.parse({
        model: process.env.AI_MODEL || 'claude-opus-5-5',
        max_tokens: 1024,
        system: SYSTEM.replace('{today}', String(ctx.today)).replace('{lang}', ctx.lang),
        // Only the message and non-health preferences are sent (no weight, height, age or health flags).
        messages: [{ role: 'user', content: `Context: ${JSON.stringify({ mealsPerDay: ctx.mealsPerDay, household: ctx.household, dietType: ctx.dietType, stores: ctx.stores })}\n\nRequest: ${message}` }],
        output_config: { format: zodOutputFormat(IntentSchema) },
      });
      if (res.stop_reason === 'refusal' || !res.parsed_output) throw new Error(`provider returned ${res.stop_reason}`);
      return res.parsed_output;
    },
  };
}

export function getProvider(): AiProvider {
  if (process.env.AI_PROVIDER === 'anthropic' && process.env.ANTHROPIC_API_KEY) return anthropicProvider(process.env.ANTHROPIC_API_KEY);
  return rulesProvider;
}
