import 'server-only';
import type Stripe from 'stripe';
import { supabaseAdmin } from './supabase';
import { stripe } from './stripe';

/** One account as the admin sees it. No health answers (goal, body, allergies) are included. */
export interface AdminUserRow {
  id: string;
  email: string;
  registeredAt: string;
  confirmed: boolean;
  lastSignInAt: string | null;
  onboarded: boolean;
  store: string | null;
  household: number | null;
  budget: number | null;
  /** last time the app saved this account's data */
  lastActiveAt: string | null;
  plan: string | null;
  status: 'none' | 'trialing' | 'active' | 'past_due' | 'canceled';
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
  periodEnd: string | null;
  paidTotal: number;
}

export interface AdminAnalytics {
  generatedAt: string;
  config: { supabase: boolean; stripe: boolean; stripeLive: boolean };
  problems: string[];
  users: AdminUserRow[];
  /** paying customers found in Stripe without an account here (e.g. deleted accounts) */
  stripeOnly: { email: string; status: string; plan: string | null; paidTotal: number }[];
  totals: {
    users: number; new24h: number; new7d: number; new30d: number; confirmed: number; onboarded: number;
    trialsEver: number; trialing: number; active: number; pastDue: number; canceled: number; cancelling: number;
    paying: number; revenue: number; revenue30d: number; mrr: number;
  };
  daily: { date: string; signups: number; trials: number; revenue: number; visitors: number; ctaPlan: number; ctaMonth: number }[];
  stores: { store: string; users: number }[];
  /** anonymous site traffic (events table); null when the table is not set up */
  site: SiteStats | null;
}

export interface SiteStats {
  onlineNow: number;
  visitors: { today: number; d7: number; d30: number };
  pageviews: { today: number; d7: number; d30: number };
  ctaPlan: { today: number; d7: number; d30: number; people30: number };
  ctaMonth: { today: number; d7: number; d30: number; people30: number };
  /** 30 days, counted as unique visitors per day */
  funnel: { label: string; n: number }[];
  topPages: { path: string; views: number }[];
  referrers: { ref: string; visitors: number }[];
  devices: { device: string; visitors: number }[];
  ctaPlaces: { place: string; clicks: number }[];
}

export interface EventRow { at: string; name: 'pageview' | 'cta_plan' | 'cta_month'; path: string; visitor: string; device: string | null; ref: string | null; place: string | null }

function firstViews(pv: EventRow[]): Map<string, EventRow> {
  const first = new Map<string, EventRow>();
  for (const e of pv) { const k = `${e.at.slice(0, 10)}|${e.visitor}`; const f = first.get(k); if (!f || e.at < f.at) first.set(k, e); }
  return first;
}

export function siteStats(ev: EventRow[], now: number): SiteStats {
  const today = new Date(now).toISOString().slice(0, 10);
  const within = (e: EventRow, days: number) => now - Date.parse(e.at) <= days * DAY;
  const isToday = (e: EventRow) => e.at.slice(0, 10) === today;
  // the visitor id changes daily, so "unique" means unique per day, summed over days
  const uniq = (list: EventRow[]) => new Set(list.map((e) => `${e.at.slice(0, 10)}|${e.visitor}`)).size;
  const pv = ev.filter((e) => e.name === 'pageview');
  const cp = ev.filter((e) => e.name === 'cta_plan');
  const cm = ev.filter((e) => e.name === 'cta_month');
  const count = (list: EventRow[]) => ({ today: list.filter(isToday).length, d7: list.filter((e) => within(e, 7)).length, d30: list.length });
  const visitorsOn = (pred: (e: EventRow) => boolean) => uniq(pv.filter(pred));
  const tally = <K extends string>(list: EventRow[], key: (e: EventRow) => K | null, uniqueVisitors: boolean) => {
    const m = new Map<K, Set<string> | number>();
    for (const e of list) {
      const k = key(e); if (!k) continue;
      if (uniqueVisitors) { const set = (m.get(k) as Set<string> | undefined) ?? new Set<string>(); set.add(`${e.at.slice(0, 10)}|${e.visitor}`); m.set(k, set); }
      else m.set(k, ((m.get(k) as number | undefined) ?? 0) + 1);
    }
    return [...m].map(([k, v]) => [k, typeof v === 'number' ? v : v.size] as const).sort((a, b) => b[1] - a[1]);
  };
  return {
    onlineNow: new Set(ev.filter((e) => now - Date.parse(e.at) <= 5 * 60000).map((e) => e.visitor)).size,
    visitors: { today: visitorsOn(isToday), d7: visitorsOn((e) => within(e, 7)), d30: uniq(pv) },
    pageviews: count(pv),
    ctaPlan: { ...count(cp), people30: uniq(cp) },
    ctaMonth: { ...count(cm), people30: uniq(cm) },
    funnel: [
      { label: 'Зашли на сайт', n: uniq(pv) },
      { label: 'Нажали «Sudaryti planą»', n: uniq(cp) },
      { label: 'Открыли анкету', n: visitorsOn((e) => e.path === '/onboarding') },
      { label: 'Дошли до своего плана', n: visitorsOn((e) => e.path === '/onboarding/result') },
      { label: 'Нажали «Gauti mėnesio planą»', n: uniq(cm) },
      { label: 'Открыли оплату', n: visitorsOn((e) => e.path === '/checkout') },
    ],
    topPages: tally(pv, (e) => e.path, false).slice(0, 10).map(([path, views]) => ({ path, views })),
    // the source of a visit is the referrer of its first page view that day
    referrers: tally([...firstViews(pv).values()], (e) => e.ref ?? 'прямой заход / приложение', true).slice(0, 10).map(([ref, visitors]) => ({ ref, visitors })),
    devices: tally(pv, (e) => e.device ?? '—', true).map(([device, visitors]) => ({ device, visitors })),
    ctaPlaces: tally(cp, (e) => e.place ?? '—', false).map(([place, clicks]) => ({ place, clicks })),
  };
}

const DAY = 86400000;
const iso = (sec?: number | null) => (sec ? new Date(sec * 1000).toISOString() : null);
const dayOf = (s: string) => s.slice(0, 10);
const RANK: Record<string, number> = { active: 5, trialing: 4, past_due: 3, unpaid: 3, incomplete: 1, paused: 1, canceled: 0, incomplete_expired: 0 };
const PLAN_MONTHLY: Record<string, number> = { monthly: 9, quarterly: 20 / 3, lifetime: 0 };

interface StripeView { status: AdminUserRow['status']; plan: string | null; cancelAtPeriodEnd: boolean; trialEnd: string | null; periodEnd: string | null; paidTotal: number; trialStartedAt: string | null }

async function stripeByEmail(s: Stripe, problems: string[]): Promise<{ byEmail: Map<string, StripeView>; payments: { date: string; amount: number }[] }> {
  const byEmail = new Map<string, StripeView>();
  const payments: { date: string; amount: number }[] = [];
  const view = (email: string) => {
    let v = byEmail.get(email);
    if (!v) { v = { status: 'none', plan: null, cancelAtPeriodEnd: false, trialEnd: null, periodEnd: null, paidTotal: 0, trialStartedAt: null }; byEmail.set(email, v); }
    return v;
  };
  try {
    const subs = await s.subscriptions.list({ status: 'all', limit: 100, expand: ['data.customer'] }).autoPagingToArray({ limit: 5000 });
    const best = new Map<string, Stripe.Subscription>();
    for (const sub of subs) {
      const c = sub.customer as Stripe.Customer | Stripe.DeletedCustomer;
      const email = 'email' in c && c.email ? c.email.toLowerCase() : null;
      if (!email) continue;
      if (sub.trial_start) { const v = view(email); const t = iso(sub.trial_start)!; if (!v.trialStartedAt || t < v.trialStartedAt) v.trialStartedAt = t; }
      const cur = best.get(email);
      if (!cur || (RANK[sub.status] ?? 0) > (RANK[cur.status] ?? 0) || ((RANK[sub.status] ?? 0) === (RANK[cur.status] ?? 0) && sub.created > cur.created)) best.set(email, sub);
    }
    for (const [email, sub] of best) {
      const v = view(email);
      v.plan = (sub.metadata?.planId as string | undefined) ?? 'monthly';
      v.status = sub.status === 'trialing' ? 'trialing' : sub.status === 'active' ? 'active' : sub.status === 'past_due' || sub.status === 'unpaid' ? 'past_due' : 'canceled';
      v.cancelAtPeriodEnd = sub.cancel_at_period_end;
      v.trialEnd = iso(sub.trial_end);
      v.periodEnd = iso(sub.items.data[0]?.current_period_end ?? sub.ended_at);
    }
  } catch (e) { problems.push(`Stripe: не удалось прочитать подписки (${(e as Error).message})`); }
  try {
    const invoices = await s.invoices.list({ status: 'paid', limit: 100 }).autoPagingToArray({ limit: 10000 });
    for (const inv of invoices) {
      if (!inv.total) continue; // the free-trial invoice is 0 €
      const amount = inv.total / 100;
      payments.push({ date: iso(inv.status_transitions?.paid_at ?? inv.created)!, amount });
      if (inv.customer_email) view(inv.customer_email.toLowerCase()).paidTotal += amount;
    }
  } catch (e) { problems.push(`Stripe: не удалось прочитать счета (${(e as Error).message})`); }
  try {
    const sessions = await s.checkout.sessions.list({ limit: 100 }).autoPagingToArray({ limit: 5000 });
    for (const cs of sessions) {
      if (cs.mode !== 'payment' || cs.payment_status !== 'paid' || cs.metadata?.planId !== 'lifetime') continue;
      const email = (cs.customer_details?.email ?? cs.customer_email ?? '').toLowerCase();
      if (!email) continue;
      const v = view(email);
      const amount = (cs.amount_total ?? 0) / 100;
      v.plan = 'lifetime'; v.status = 'active'; v.cancelAtPeriodEnd = false; v.periodEnd = null; v.paidTotal += amount;
      payments.push({ date: iso(cs.created)!, amount });
    }
  } catch (e) { problems.push(`Stripe: не удалось прочитать покупки «навсегда» (${(e as Error).message})`); }
  return { byEmail, payments };
}

export async function buildAdminAnalytics(): Promise<AdminAnalytics> {
  const db = supabaseAdmin();
  const s = stripe();
  const problems: string[] = [];
  if (!db) problems.push('В Vercel не задан SUPABASE_SECRET_KEY — без него список регистраций недоступен (Vercel → Settings → Environment Variables → SUPABASE_SECRET_KEY = Secret key из Supabase → Project Settings → API Keys, затем Redeploy).');
  if (!s) problems.push('В Vercel не задан STRIPE_SECRET_KEY — подписки и оплаты не видны.');

  // ---- accounts (Supabase Auth) + their app data ----
  const users: AdminUserRow[] = [];
  if (db) {
    try {
      for (let page = 1; page <= 50; page++) {
        const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) throw error;
        for (const u of data.users) {
          users.push({
            id: u.id, email: (u.email ?? '').toLowerCase(), registeredAt: u.created_at, confirmed: !!u.email_confirmed_at,
            lastSignInAt: u.last_sign_in_at ?? null, onboarded: false, store: null, household: null, budget: null, lastActiveAt: null,
            plan: null, status: 'none', cancelAtPeriodEnd: false, trialEnd: null, periodEnd: null, paidTotal: 0,
          });
        }
        if (data.users.length < 1000) break;
      }
    } catch (e) { problems.push(`Supabase: не удалось прочитать пользователей (${(e as Error).message})`); }
    try {
      const { data, error } = await db.from('app_state')
        .select('user_id, updated_at, onboarded:data->onboarded, store:data->answers->>homeStore, household:data->answers->household, budget:data->answers->weeklyBudget')
        .limit(50000);
      if (error) throw error;
      const byId = new Map(users.map((u) => [u.id, u]));
      for (const r of (data ?? []) as unknown as { user_id: string; updated_at: string; onboarded: boolean | null; store: string | null; household: number | null; budget: number | null }[]) {
        const u = byId.get(r.user_id);
        if (!u) continue;
        u.onboarded = r.onboarded === true; u.store = r.store; u.household = r.household ?? null; u.budget = r.budget ?? null; u.lastActiveAt = r.updated_at;
      }
    } catch (e) { problems.push(`Supabase: таблица app_state недоступна — выполните supabase/migrations/0003_app_state.sql (${(e as Error).message})`); }
  }

  // ---- site traffic (anonymous events) ----
  let events: EventRow[] | null = null;
  if (db) {
    try {
      const from = new Date(Date.now() - 30 * DAY).toISOString();
      const all: EventRow[] = [];
      for (let off = 0; off < 200000; off += 1000) {
        const { data, error } = await db.from('events').select('at, name, path, visitor, device, ref, place').gte('at', from).order('at', { ascending: false }).range(off, off + 999);
        if (error) throw error;
        all.push(...((data ?? []) as EventRow[]));
        if (!data || data.length < 1000) break;
      }
      events = all;
    } catch (e) { problems.push(`Посещения сайта не считаются: выполните supabase/migrations/0004_events.sql в Supabase → SQL Editor (${(e as Error).message})`); }
  }

  // ---- subscriptions and money (Stripe) ----
  const stripeOnly: AdminAnalytics['stripeOnly'] = [];
  let payments: { date: string; amount: number }[] = [];
  const trialStarts: string[] = [];
  if (s) {
    const r = await stripeByEmail(s, problems);
    payments = r.payments;
    const byEmail = new Map(users.map((u) => [u.email, u]));
    for (const [email, v] of r.byEmail) {
      if (v.trialStartedAt) trialStarts.push(v.trialStartedAt);
      const u = byEmail.get(email);
      if (u) Object.assign(u, { plan: v.plan, status: v.status, cancelAtPeriodEnd: v.cancelAtPeriodEnd, trialEnd: v.trialEnd, periodEnd: v.periodEnd, paidTotal: Math.round(v.paidTotal * 100) / 100 });
      else if (v.status !== 'none' || v.paidTotal > 0) stripeOnly.push({ email, status: v.status, plan: v.plan, paidTotal: Math.round(v.paidTotal * 100) / 100 });
    }
  }

  users.sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));
  const now = Date.now();
  const since = (iso: string, days: number) => now - Date.parse(iso) <= days * DAY;
  const revenue = payments.reduce((x, p) => x + p.amount, 0);
  const totals: AdminAnalytics['totals'] = {
    users: users.length,
    new24h: users.filter((u) => since(u.registeredAt, 1)).length,
    new7d: users.filter((u) => since(u.registeredAt, 7)).length,
    new30d: users.filter((u) => since(u.registeredAt, 30)).length,
    confirmed: users.filter((u) => u.confirmed).length,
    onboarded: users.filter((u) => u.onboarded).length,
    trialsEver: trialStarts.length,
    trialing: users.filter((u) => u.status === 'trialing').length,
    active: users.filter((u) => u.status === 'active').length,
    pastDue: users.filter((u) => u.status === 'past_due').length,
    canceled: users.filter((u) => u.status === 'canceled').length,
    cancelling: users.filter((u) => u.cancelAtPeriodEnd && (u.status === 'active' || u.status === 'trialing')).length,
    paying: users.filter((u) => u.paidTotal > 0).length,
    revenue: Math.round(revenue * 100) / 100,
    revenue30d: Math.round(payments.filter((p) => since(p.date, 30)).reduce((x, p) => x + p.amount, 0) * 100) / 100,
    mrr: Math.round(users.filter((u) => u.status === 'active' && !u.cancelAtPeriodEnd).reduce((x, u) => x + (PLAN_MONTHLY[u.plan ?? 'monthly'] ?? 9), 0) * 100) / 100,
  };

  const daily: AdminAnalytics['daily'] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * DAY).toISOString().slice(0, 10);
    daily.push({
      date: d,
      signups: users.filter((u) => dayOf(u.registeredAt) === d).length,
      trials: trialStarts.filter((t) => dayOf(t) === d).length,
      revenue: Math.round(payments.filter((p) => dayOf(p.date) === d).reduce((x, p) => x + p.amount, 0) * 100) / 100,
      visitors: new Set((events ?? []).filter((e) => e.name === 'pageview' && dayOf(e.at) === d).map((e) => e.visitor)).size,
      ctaPlan: (events ?? []).filter((e) => e.name === 'cta_plan' && dayOf(e.at) === d).length,
      ctaMonth: (events ?? []).filter((e) => e.name === 'cta_month' && dayOf(e.at) === d).length,
    });
  }
  const storeCount = new Map<string, number>();
  for (const u of users) if (u.store) storeCount.set(u.store, (storeCount.get(u.store) ?? 0) + 1);

  return {
    generatedAt: new Date().toISOString(),
    config: { supabase: !!db, stripe: !!s, stripeLive: (process.env.STRIPE_SECRET_KEY ?? '').startsWith('sk_live') || (process.env.STRIPE_SECRET_KEY ?? '').startsWith('rk_live') },
    problems, users, stripeOnly, totals, daily,
    stores: [...storeCount].map(([store, n]) => ({ store, users: n })).sort((a, b) => b.users - a.users),
    site: events ? siteStats(events, now) : null,
  };
}
