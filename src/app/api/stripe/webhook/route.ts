import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { audit } from '@/server/logs';
import { stripe } from '@/server/stripe';
import { supabaseAdmin } from '@/server/supabase';

/**
 * Stripe webhook: verifies the signature, stores every event in payment_events
 * (idempotent by event id) and mirrors the subscription state into
 * subscriptions. Handles checkout completion, renewals, failed payments,
 * cancellations and refunds.
 */
export async function POST(req: Request) {
  const s = stripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!s || !secret) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  const sig = req.headers.get('stripe-signature');
  const raw = await req.text();
  let event: Stripe.Event;
  try { event = s.webhooks.constructEvent(raw, sig ?? '', secret); } catch { return NextResponse.json({ error: 'bad_signature' }, { status: 400 }); }

  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ received: true, stored: false });
  const { error: dup } = await db.from('payment_events').insert({ stripe_event_id: event.id, type: event.type, payload: event.data.object as unknown as Record<string, unknown> });
  if (dup?.code === '23505') return NextResponse.json({ received: true, duplicate: true });

  const upsertSub = async (sub: Stripe.Subscription, status?: string) => {
    const userId = sub.metadata?.userId || null;
    await db.from('subscriptions').upsert({
      stripe_subscription_id: sub.id,
      stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
      user_id: userId && !userId.startsWith('dev:') ? userId : null,
      plan_id: sub.metadata?.planId ?? null,
      status: status ?? sub.status,
      cancel_at_period_end: sub.cancel_at_period_end,
      current_period_end: sub.items.data[0]?.current_period_end ? new Date(sub.items.data[0].current_period_end * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'stripe_subscription_id' });
  };

  switch (event.type) {
    case 'checkout.session.completed': {
      const cs = event.data.object;
      if (cs.subscription) await upsertSub(await s.subscriptions.retrieve(typeof cs.subscription === 'string' ? cs.subscription : cs.subscription.id));
      else if (cs.mode === 'payment' && cs.payment_status === 'paid') {
        // lifetime access: one payment, no renewal
        const userId = cs.metadata?.userId || null;
        await db.from('subscriptions').upsert({
          stripe_subscription_id: cs.id,
          stripe_customer_id: typeof cs.customer === 'string' ? cs.customer : cs.customer?.id ?? null,
          user_id: userId && !userId.startsWith('dev:') ? userId : null,
          plan_id: cs.metadata?.planId ?? 'lifetime',
          status: 'active',
          cancel_at_period_end: false,
          current_period_end: null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'stripe_subscription_id' });
      }
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await upsertSub(event.data.object);
      break;
    case 'invoice.payment_failed': {
      const inv = event.data.object;
      const subId = inv.parent?.subscription_details?.subscription;
      if (subId) await db.from('subscriptions').update({ status: 'past_due', updated_at: new Date().toISOString() }).eq('stripe_subscription_id', typeof subId === 'string' ? subId : subId.id);
      break;
    }
    case 'charge.refunded':
      await audit('stripe', 'refund', event.data.object.id, { amount: event.data.object.amount_refunded });
      break;
    default:
      break;
  }
  return NextResponse.json({ received: true });
}
