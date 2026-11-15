import { NextResponse } from 'next/server';
import { SITE_URL } from '@/config/env';
import { getViewer } from '@/server/auth';
import { stripe } from '@/server/stripe';

/** Stripe customer portal: change card, invoices/receipts, cancel. Customer found by account email. */
export async function POST() {
  const s = stripe();
  const viewer = await getViewer();
  if (!s || !viewer?.email) return NextResponse.json({ error: 'not_available' }, { status: 400 });
  const customer = (await s.customers.list({ email: viewer.email, limit: 1 })).data[0];
  if (!customer) return NextResponse.json({ error: 'no_customer' }, { status: 404 });
  const portal = await s.billingPortal.sessions.create({ customer: customer.id, return_url: `${SITE_URL}/app/subscription` });
  return NextResponse.json({ url: portal.url });
}
