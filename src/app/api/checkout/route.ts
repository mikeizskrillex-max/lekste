import { NextResponse } from 'next/server';
import * as z from 'zod/v4';
import { DEFAULT_PLANS, TRIAL_DAYS } from '@/config/plans';
import { SITE_URL } from '@/config/env';
import { clientIp, rateLimit } from '@/server/rateLimit';
import { stripe } from '@/server/stripe';
import { getViewer } from '@/server/auth';

const Body = z.object({ planId: z.enum(['monthly', 'quarterly', 'lifetime']), email: z.email().max(200), lang: z.enum(['lt', 'ru']), withdrawalConsent: z.literal(true) });

/**
 * Creates a Stripe Checkout Session (subscription or one-time payment: cards, Apple Pay and
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
  // Prices: env override, otherwise found by lookup key (lekste_monthly, lekste_quarterly, lekste_lifetime). All VAT-inclusive.
  const key = { monthly: 'lekste_monthly', quarterly: 'lekste_quarterly', lifetime: 'lekste_lifetime' }[plan.id];
  const price = process.env[plan.stripePriceEnv] || (await s.prices.list({ lookup_keys: [key], active: true, limit: 1 })).data[0]?.id;
  if (!price) return NextResponse.json({ error: 'stripe price not found' }, { status: 500 });
  const viewer = await getViewer();
  const common = {
    line_items: [{ price, quantity: 1 }],
    // the account email links the payment to the account (subscription status is looked up by it)
    customer_email: viewer?.email || parsed.data.email,
    client_reference_id: viewer?.id,
    locale: (parsed.data.lang === 'lt' ? 'lt' : 'ru') as 'lt' | 'ru',
    allow_promotion_codes: true,
    metadata: { planId: plan.id, withdrawalConsent: 'true', userId: viewer?.id ?? '' },
    success_url: `${SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan.id}`,
    cancel_url: `${SITE_URL}/checkout?canceled=1`,
  };
  // Lifetime = one payment; monthly / 3 months = subscription that renews until cancelled.
  const session = plan.oneTime
    ? await s.checkout.sessions.create({ ...common, mode: 'payment', customer_creation: 'always', invoice_creation: { enabled: true } })
    : await s.checkout.sessions.create({
      ...common,
      mode: 'subscription',
      payment_method_collection: 'always',
      subscription_data: {
        metadata: { planId: plan.id, userId: viewer?.id ?? '' },
        // 7 days free; the card is charged on day 8 unless cancelled before
        trial_period_days: TRIAL_DAYS,
        trial_settings: { end_behavior: { missing_payment_method: 'cancel' } },
      },
    });
  return NextResponse.json({ mode: 'stripe', url: session.url });
}
