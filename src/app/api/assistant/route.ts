import { NextResponse } from 'next/server';
import * as z from 'zod/v4';
import { IntentSchema } from '@/ai/intent';
import { getProvider, rulesProvider } from '@/ai/provider';
import { parseRules } from '@/ai/rules';
import { logAi } from '@/server/logs';
import { clientIp, rateLimit } from '@/server/rateLimit';

const Body = z.object({
  message: z.string().min(1).max(500),
  context: z.object({
    lang: z.enum(['lt', 'ru']), today: z.number().int().min(0).max(6), mealsPerDay: z.number().int().min(3).max(5),
    household: z.number().int().min(1).max(8), dietType: z.string().max(20), stores: z.array(z.string().max(10)).max(5),
  }),
});

/**
 * Turns a natural-language request into a structured intent. The client
 * applies it with deterministic planner code. Falls back to the local rules
 * parser if the AI provider fails, refuses or returns nothing actionable.
 */
export async function POST(req: Request) {
  const rl = rateLimit(`assistant:${clientIp(req)}`, 20, 60_000);
  if (!rl.ok) return NextResponse.json({ error: 'rate_limited' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const { message, context } = parsed.data;
  const provider = getProvider();
  const t0 = Date.now();
  try {
    const intent = IntentSchema.parse(await provider.parseIntent(message, context));
    const final = intent.actions.length || provider === rulesProvider ? intent : { ...parseRules(message, context.today), reply: intent.reply };
    await logAi({ at: new Date().toISOString(), provider: provider.name, ok: true, fallback: final !== intent, actions: final.actions.map((a) => a.type), ms: Date.now() - t0 });
    return NextResponse.json({ intent: final, provider: provider.name });
  } catch (e) {
    const intent = parseRules(message, context.today);
    await logAi({ at: new Date().toISOString(), provider: provider.name, ok: false, fallback: true, actions: intent.actions.map((a) => a.type), ms: Date.now() - t0, error: e instanceof Error ? e.message.slice(0, 200) : 'error' });
    return NextResponse.json({ intent, provider: 'rules' });
  }
}
