import { NextResponse } from 'next/server';
import * as z from 'zod/v4';
import { DEFAULT_PLANS } from '@/config/plans';
import { SITE_URL } from '@/config/env';
import { clientIp, rateLimit } from '@/server/rateLimit';
import { stripe } from '@/server/stripe';
import { getViewer } from '@/server/auth';

const Body = z.object({ planId: z.enum(['intro2w', 'monthly', 'quarterly']), email: z.email().max(200), lang: z.enum(['lt', 'ru']), withdrawalConsent: z.literal(true) });

/**
 * Creates a Stripe Checkout Session (subscription mode: cards, Apple Pay and
 * Google Pay are enabled automatically by Stripe for card payments).
 * Without STRIPE_SECRET_KEY the client uses the clearly labelled test mode.
 */
export async function POST(req: Request) {
  const rl = rateLimit(`checkout:${clientIp(req)}`, 10, 60_000);
  if (!rl.ok) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  const s = stripe();
  if (!s) return NextResponse.json({ mode: 'test' });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const plan = DEFAULT_PLANS.find((p) => p.id === parsed.data.planId)!;
  const price = process.env[plan.stripePriceEnv];
  if (!price) return NextResponse.json({ error: `missing ${plan.stripePriceEnv}` }, { status: 500 });
  const viewer = await getViewer();
  const session = await s.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price, quantity: 1 }],
    customer_email: parsed.data.email,
    client_reference_id: viewer?.id,
    locale: parsed.data.lang === 'lt' ? 'lt' : 'ru',
    allow_promotion_codes: true,
    subscription_data: { metadata: { planId: plan.id, userId: viewer?.id ?? '' } },
    metadata: { planId: plan.id, withdrawalConsent: 'true' },
    success_url: `${SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/checkout?canceled=1`,
  });
  return NextResponse.json({ mode: 'stripe', url: session.url });
}
