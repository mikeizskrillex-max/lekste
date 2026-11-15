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
  // Prices: env override, otherwise found by lookup key (lekste_monthly, lekste_quarterly, lekste_intro_once)
  const lookup = async (env: string, key: string) => {
    if (process.env[env]) return process.env[env]!;
    const r = await s.prices.list({ lookup_keys: [key], active: true, limit: 1 });
    return r.data[0]?.id;
  };
  const monthly = await lookup('STRIPE_PRICE_MONTHLY', 'lekste_monthly');
  const quarterly = await lookup('STRIPE_PRICE_QUARTERLY', 'lekste_quarterly');
  const introOnce = await lookup('STRIPE_PRICE_INTRO_2W', 'lekste_intro_once');
  // Intro: €9.99 charged now for the first 14 days (one-time item), then the monthly price after a 14-day trial.
  const lineItems = plan.id === 'quarterly' ? [{ price: quarterly, quantity: 1 }]
    : plan.id === 'monthly' ? [{ price: monthly, quantity: 1 }]
    : [{ price: monthly, quantity: 1 }, { price: introOnce, quantity: 1 }];
  if (lineItems.some((l) => !l.price)) return NextResponse.json({ error: 'stripe prices not found' }, { status: 500 });
  const viewer = await getViewer();
  const session = await s.checkout.sessions.create({
    mode: 'subscription',
    line_items: lineItems as { price: string; quantity: number }[],
    customer_email: parsed.data.email,
    client_reference_id: viewer?.id,
    locale: parsed.data.lang === 'lt' ? 'lt' : 'ru',
    allow_promotion_codes: true,
    subscription_data: { metadata: { planId: plan.id, userId: viewer?.id ?? '' }, ...(plan.id === 'intro2w' ? { trial_period_days: 14 } : {}) },
    metadata: { planId: plan.id, withdrawalConsent: 'true' },
    success_url: `${SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan.id}`,
    cancel_url: `${SITE_URL}/checkout?canceled=1`,
  });
  return NextResponse.json({ mode: 'stripe', url: session.url });
}
