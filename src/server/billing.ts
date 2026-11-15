import 'server-only';
import type Stripe from 'stripe';

export type RemoteStatus = 'none' | 'trialing' | 'active' | 'past_due' | 'canceled';
export interface RemotePayment { id: string; date: string; amount: number; status: 'paid' | 'failed' | 'refunded' | 'open'; planId: string | null; receiptUrl: string | null }
export interface RemoteSubscription {
  planId: 'monthly' | 'quarterly' | 'lifetime' | null;
  status: RemoteStatus;
  subscriptionId: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  trialEnd: string | null;
  startedAt: string | null;
  payments: RemotePayment[];
}

const iso = (sec?: number | null) => (sec ? new Date(sec * 1000).toISOString() : null);
const RANK: Record<string, number> = { active: 4, trialing: 4, past_due: 3, unpaid: 2, incomplete: 1, canceled: 0, incomplete_expired: 0, paused: 1 };

/**
 * The customer's subscription as Stripe knows it — the source of truth.
 * Customers are found by the account email (checkout always uses it).
 */
export async function subscriptionFor(s: Stripe, email: string): Promise<RemoteSubscription> {
  const out: RemoteSubscription = { planId: null, status: 'none', subscriptionId: null, cancelAtPeriodEnd: false, currentPeriodEnd: null, trialEnd: null, startedAt: null, payments: [] };
  const customers = (await s.customers.list({ email, limit: 10 })).data;
  let best: Stripe.Subscription | null = null;
  for (const c of customers) {
    const subs = (await s.subscriptions.list({ customer: c.id, status: 'all', limit: 10 })).data;
    for (const sub of subs) if (!best || (RANK[sub.status] ?? 0) > (RANK[best.status] ?? 0) || ((RANK[sub.status] ?? 0) === (RANK[best.status] ?? 0) && sub.created > best.created)) best = sub;
    // lifetime = paid one-time checkout
    const sessions = (await s.checkout.sessions.list({ customer: c.id, limit: 20 })).data;
    for (const cs of sessions) {
      if (cs.mode === 'payment' && cs.payment_status === 'paid' && cs.metadata?.planId === 'lifetime') {
        out.planId = 'lifetime'; out.status = 'active'; out.startedAt = iso(cs.created);
        out.payments.push({ id: cs.id, date: iso(cs.created)!, amount: (cs.amount_total ?? 0) / 100, status: 'paid', planId: 'lifetime', receiptUrl: null });
      }
    }
    for (const inv of (await s.invoices.list({ customer: c.id, limit: 12 })).data) {
      if (inv.total === 0 && inv.status === 'paid') continue; // free trial start
      out.payments.push({
        id: inv.id ?? `inv_${inv.created}`, date: iso(inv.created)!, amount: inv.total / 100,
        status: inv.status === 'paid' ? 'paid' : inv.status === 'open' ? (inv.attempted ? 'failed' : 'open') : inv.status === 'uncollectible' ? 'failed' : 'paid',
        planId: (inv.parent?.subscription_details?.metadata?.planId as string | undefined) ?? null, receiptUrl: inv.hosted_invoice_url ?? null,
      });
    }
  }
  out.payments.sort((a, b) => b.date.localeCompare(a.date));
  if (out.planId === 'lifetime') return out;
  if (best) {
    const item = best.items.data[0];
    out.planId = (best.metadata?.planId as RemoteSubscription['planId']) ?? 'monthly';
    out.status = best.status === 'trialing' ? 'trialing' : best.status === 'active' ? 'active' : best.status === 'past_due' || best.status === 'unpaid' ? 'past_due' : 'canceled';
    out.subscriptionId = best.id;
    out.cancelAtPeriodEnd = best.cancel_at_period_end;
    out.currentPeriodEnd = iso(item?.current_period_end ?? best.ended_at);
    out.trialEnd = iso(best.trial_end);
    out.startedAt = iso(best.start_date);
  }
  return out;
}
