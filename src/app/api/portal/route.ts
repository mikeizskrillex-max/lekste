import { NextResponse } from 'next/server';
import { SITE_URL } from '@/config/env';
import { getViewer } from '@/server/auth';
import { stripe } from '@/server/stripe';
import { supabaseAdmin } from '@/server/supabase';

/** Stripe Billing Portal: change card, see invoices, cancel. */
export async function POST() {
  const s = stripe();
  const db = supabaseAdmin();
  const viewer = await getViewer();
  if (!s || !db || !viewer || viewer.mode !== 'supabase') return NextResponse.json({ error: 'not_available' }, { status: 400 });
  const { data } = await db.from('subscriptions').select('stripe_customer_id').eq('user_id', viewer.id).order('updated_at', { ascending: false }).limit(1).maybeSingle();
  if (!data?.stripe_customer_id) return NextResponse.json({ error: 'no_customer' }, { status: 404 });
  const portal = await s.billingPortal.sessions.create({ customer: data.stripe_customer_id, return_url: `${SITE_URL}/app/subscription` });
  return NextResponse.json({ url: portal.url });
}
