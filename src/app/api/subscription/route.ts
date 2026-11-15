import { NextResponse } from 'next/server';
import * as z from 'zod/v4';
import { getViewer } from '@/server/auth';
import { subscriptionFor } from '@/server/billing';
import { clientIp, rateLimit } from '@/server/rateLimit';
import { stripe } from '@/server/stripe';

/** The signed-in user's subscription, straight from Stripe (never trusted from the browser). */
export async function GET() {
  const s = stripe();
  if (!s) return NextResponse.json({ mode: 'test' });
  const v = await getViewer();
  if (!v?.email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json({ mode: 'stripe', subscription: await subscriptionFor(s, v.email) });
}

const Body = z.object({ action: z.enum(['cancel', 'resume']) });

/** Cancel at the end of the paid period (or trial), or undo that. */
export async function POST(req: Request) {
  const rl = rateLimit(`sub:${clientIp(req)}`, 10, 60_000);
  if (!rl.ok) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  const s = stripe();
  if (!s) return NextResponse.json({ mode: 'test' });
  const v = await getViewer();
  if (!v?.email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const cur = await subscriptionFor(s, v.email);
  if (!cur.subscriptionId) return NextResponse.json({ error: 'no_subscription' }, { status: 404 });
  await s.subscriptions.update(cur.subscriptionId, { cancel_at_period_end: parsed.data.action === 'cancel' });
  return NextResponse.json({ mode: 'stripe', subscription: await subscriptionFor(s, v.email) });
}
