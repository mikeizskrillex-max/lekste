'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useModes } from '@/app/providers';
import type { PlanId } from '@/config/plans';
import { INGREDIENTS } from '@/data/ingredients';
import { RECIPES } from '@/data/recipes';
import { recipeFacts } from '@/domain/recipeFacts';
import { download } from '@/lib/view';
import { CSV_TEMPLATE, importPriceCsv, type ImportResult } from '@/retail/csv';
import { categoryOf } from '@/retail/matching';
import { latestRetrieval } from '@/retail/catalog';
import { RETAILER_ORDER, RETAILERS } from '@/retail/retailers';
import { useStore } from '@/state/store';
import { DevBanner, Logo } from './site';
import { Badge, Button, Card, Container, Stat, cx, inputCls } from './ui';

/** Admin UI is internal and in English. */
const NAV = [
  ['/admin', 'Overview'], ['/admin/products', 'Products'], ['/admin/prices', 'Prices & CSV import'], ['/admin/supermarkets', 'Supermarkets'],
  ['/admin/users', 'Users'], ['/admin/analytics', 'Analytics'], ['/admin/ai', 'AI logs'],
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  return (
    <div className="min-h-screen bg-paper">
      <DevBanner />
      <header className="border-b border-line bg-card">
        <Container className="flex h-14 items-center justify-between"><div className="flex items-center gap-3"><Logo /><Badge tone="ink">Admin</Badge></div><Link href="/app" className="text-[13.5px] font-semibold text-leaf">← App</Link></Container>
        <Container className="no-scrollbar flex gap-1 overflow-x-auto pb-2">
          {NAV.map(([h, l]) => <Link key={h} href={h} className={cx('shrink-0 rounded-xl px-3 py-2 text-[13.5px] font-semibold', path === h ? 'bg-sage text-forest' : 'text-ink/70 hover:bg-paper')}>{l}</Link>)}
        </Container>
      </header>
      <Container className="py-8">{children}</Container>
    </div>
  );
}

const H = ({ children, sub }: { children: ReactNode; sub?: ReactNode }) => <div className="mb-5"><h1 className="font-display text-[28px] font-extrabold">{children}</h1>{sub && <p className="mt-1 text-[14px] text-muted">{sub}</p>}</div>;
const eur = (n: number) => `€${n.toFixed(2)}`;

export function AdminOverview() {
  const modes = useModes();
  const { priceRecords, catalog, plans, setPlans } = useStore();
  const [draft, setDraft] = useState(plans);
  useEffect(() => setDraft(plans), [plans]);
  const upd = (id: PlanId, k: 'price' | 'renewalPrice' | 'active', v: number | boolean) => setDraft((d) => d.map((p) => (p.id === id ? { ...p, [k]: v } : p)));
  return (
    <>
      <H sub="Integration status and catalogue health.">Overview</H>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Recipes" value={RECIPES.length} sub={`${RECIPES.filter((r) => !r.id.startsWith('g_')).length} chef-written`} />
        <Stat label="Ingredients" value={INGREDIENTS.length} />
        <Stat label="Price records" value={priceRecords.length} sub={`${Object.keys(catalog).length} ingredients priced`} />
        <Stat label="Latest price" value={<span className="text-[16px]">{latestRetrieval(priceRecords)?.slice(0, 10) ?? '—'}</span>} />
      </div>
      <Card className="mt-6 p-5">
        <h2 className="font-extrabold">Integrations</h2>
        <ul className="mt-3 grid gap-2 text-[14px] sm:grid-cols-2">
          {([['Supabase (auth, database)', modes.supabase], ['Stripe (billing)', modes.stripe], ['AI provider', modes.ai], ['Resend (email)', modes.email]] as const).map(([l, on]) => (
            <li key={l} className="flex items-center justify-between rounded-xl bg-paper px-3 py-2"><span>{l}</span><Badge tone={on ? 'leaf' : 'line'}>{on ? 'connected' : 'not configured'}</Badge></li>
          ))}
        </ul>
      </Card>
      <Card className="mt-6 p-5">
        <h2 className="font-extrabold">Subscription plans</h2>
        <p className="mt-1 text-[13px] text-muted">Prices shown on the site. Stripe charges the Price IDs configured in env; keep both in sync. Dev mode stores this in this browser; production stores it in system_settings.</p>
        <div className="mt-4 space-y-3">
          {draft.map((p) => (
            <div key={p.id} className="grid grid-cols-2 items-center gap-3 rounded-xl bg-paper p-3 text-[14px] md:grid-cols-[1fr_140px_140px_100px]">
              <b>{p.id}</b>
              <label className="text-[12px] text-muted">First charge<input type="number" step="0.01" min="0" value={p.price} onChange={(e) => upd(p.id, 'price', Number(e.target.value))} className={inputCls} /></label>
              <label className="text-[12px] text-muted">Renewal<input type="number" step="0.01" min="0" value={p.renewalPrice} onChange={(e) => upd(p.id, 'renewalPrice', Number(e.target.value))} className={inputCls} /></label>
              <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={p.active} onChange={(e) => upd(p.id, 'active', e.target.checked)} className="h-4 w-4 accent-[#31966A]" />active</label>
            </div>
          ))}
        </div>
        <Button className="mt-4" onClick={() => setPlans(draft)}>Save plans</Button>
      </Card>
    </>
  );
}

export function AdminProducts() {
  const { catalog } = useStore();
  const [q, setQ] = useState('');
  const rows = INGREDIENTS.filter((i) => !q || `${i.id} ${i.lt} ${i.ru}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <H sub="Ingredient catalogue with nutrition per 100 g and which retailers have a matched product.">Products</H>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className={cx(inputCls, 'mb-4 max-w-sm')} />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-[13px]">
          <thead className="bg-paper text-left text-muted"><tr>{['id', 'LT', 'Category', 'kcal', 'P/F/C', 'Allergens', 'Retailers (match)'].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((i) => (
              <tr key={i.id} className="border-t border-line">
                <td className="px-3 py-2 font-mono text-[12px]">{i.id}</td><td className="px-3 py-2">{i.emoji} {i.lt}</td><td className="px-3 py-2">{categoryOf(i.id)}</td>
                <td className="px-3 py-2 tabular-nums">{i.kcal}</td><td className="px-3 py-2 tabular-nums">{i.protein}/{i.fat}/{i.carbs}</td><td className="px-3 py-2">{i.allergens.join(', ') || '—'}</td>
                <td className="px-3 py-2">{RETAILER_ORDER.filter((r) => catalog[i.id]?.[r]).map((r) => <span key={r} className="mr-1">{RETAILERS[r].name}{catalog[i.id]![r]!.match === 'approximate' ? '≈' : ''}</span>)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

export function AdminPrices() {
  const { importPrices, resetPrices, priceRecords } = useStore();
  const [text, setText] = useState('');
  const [res, setRes] = useState<ImportResult | null>(null);
  const [applied, setApplied] = useState(false);
  const imported = priceRecords.filter((r) => r.source === 'csv_import');
  return (
    <>
      <H sub="Import verified prices (e.g. Maxima, Lidl, Iki promotions) from CSV. Rows are matched to ingredients; approximate matches are flagged. Imported records are marked unverified until reviewed.">Prices & CSV import</H>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => download('lekste-prices-template.csv', CSV_TEMPLATE, 'text/csv')}>Download template</Button>
            <label className="inline-flex h-9 cursor-pointer items-center rounded-2xl px-3.5 text-[13px] font-semibold ring-1 ring-line">Choose file<input type="file" accept=".csv,text/csv" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setText(await f.text()); }} /></label>
          </div>
          <textarea value={text} onChange={(e) => { setText(e.target.value); setRes(null); setApplied(false); }} rows={10} placeholder={CSV_TEMPLATE} className={cx(inputCls, 'mt-3 font-mono text-[12px]')} aria-label="CSV" />
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => setRes(importPriceCsv(text))} disabled={!text.trim()}>Validate</Button>
            <Button size="sm" variant="dark" disabled={!res || !res.records.length || applied} onClick={() => { importPrices(res!.records); setApplied(true); }}>Import {res?.records.length ?? 0} records</Button>
          </div>
          {res && (
            <div className="mt-4 space-y-2 text-[13px]">
              <p><b>{res.records.length}</b> valid · <b>{res.errors.length}</b> errors · <b>{res.approximate}</b> approximate matches</p>
              {res.errors.slice(0, 20).map((e, i) => <p key={i} className="text-danger">line {e.line}: {e.message}</p>)}
              {applied && <p className="font-semibold text-leaf">✓ Imported. Catalogue, baskets and comparisons now use these prices.</p>}
            </div>
          )}
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between"><h2 className="font-extrabold">Imported records ({imported.length})</h2>{imported.length > 0 && <Button size="sm" variant="ghost" onClick={resetPrices}>Remove all imports</Button>}</div>
          <ul className="mt-3 max-h-[420px] space-y-1.5 overflow-y-auto text-[12.5px]">
            {imported.slice().reverse().map((r, i) => <li key={i} className="flex justify-between gap-2 border-b border-line/60 pb-1.5"><span>{RETAILERS[r.retailer].name} · {r.name} → <code>{r.ingredientId}</code>{r.match === 'approximate' ? ' ≈' : ''}</span><b>{eur(r.price)}</b></li>)}
            {!imported.length && <li className="text-muted">No imports yet.</li>}
          </ul>
        </Card>
      </div>
    </>
  );
}

export function AdminSupermarkets() {
  const { priceRecords } = useStore();
  const now = Date.now();
  return (
    <>
      <H sub="Each retailer has its own adapter. Barbora/Rimi: public e-shop catalogue snapshots collected by script (scripts are rate-limited and respect robots.txt). Maxima/Lidl/Iki: CSV import only until an authorised source exists. Never presented as real-time.">Supermarkets</H>
      <div className="grid gap-3 md:grid-cols-2">
        {RETAILER_ORDER.map((id) => {
          const r = RETAILERS[id];
          const recs = priceRecords.filter((x) => x.retailer === id);
          const last = latestRetrieval(recs);
          const stale = last ? (now - Date.parse(last)) / 86400000 > 7 : false;
          return (
            <Card key={id} className="p-5">
              <div className="flex items-center justify-between"><b className="text-[17px]">{r.name}</b><Badge tone={r.status === 'snapshot' ? 'leaf' : 'line'}>{r.status}</Badge></div>
              <dl className="mt-3 grid grid-cols-2 gap-1 text-[13px]">
                <dt className="text-muted">Method</dt><dd>{r.method ?? 'none'}</dd>
                <dt className="text-muted">Records</dt><dd>{recs.length} ({recs.filter((x) => x.match === 'approximate').length} approx.)</dd>
                <dt className="text-muted">Promotions</dt><dd>{recs.filter((x) => x.promo).length}</dd>
                <dt className="text-muted">Last retrieval</dt><dd className={stale ? 'font-semibold text-danger' : ''}>{last?.slice(0, 16).replace('T', ' ') ?? '—'}{stale ? ' (stale)' : ''}</dd>
              </dl>
              <p className="mt-3 text-[12.5px] text-muted">{r.note.lt}</p>
            </Card>
          );
        })}
      </div>
      <p className="mt-4 text-[12.5px] text-muted">Catalogue refresh runs from scripts (see README → Price data) and is disabled unless RETAILER_FETCH_ENABLED=true.</p>
    </>
  );
}

export function AdminUsers() {
  const store = useStore();
  const [data, setData] = useState<{ mode: string; users: { id: string; email: string; created_at: string; subscriptions?: { status: string; plan_id: string }[] }[] } | null>(null);
  useEffect(() => { fetch('/api/admin/users').then((r) => r.json()).then(setData).catch(() => setData({ mode: 'error', users: [] })); }, []);
  return (
    <>
      <H sub="Account and subscription fields only. Health answers are never shown in the admin panel.">Users</H>
      {data?.mode === 'dev' && (
        <Card className="p-5 text-[14px]">
          <p className="text-muted">Supabase is not configured, so there is no user database. In development mode data lives in each visitor&apos;s browser. This browser:</p>
          <p className="mt-3"><b>{store.session?.email ?? '—'}</b> · subscription: {store.subscription.status} ({store.subscription.mode}) · onboarded: {String(store.onboarded)}</p>
        </Card>
      )}
      {data?.mode === 'supabase' && (
        <Card className="overflow-x-auto">
          <table className="w-full text-[13px]"><thead className="bg-paper text-left text-muted"><tr><th className="px-3 py-2">Email</th><th className="px-3 py-2">Created</th><th className="px-3 py-2">Subscription</th></tr></thead>
            <tbody>{data.users.map((u) => <tr key={u.id} className="border-t border-line"><td className="px-3 py-2">{u.email}</td><td className="px-3 py-2">{u.created_at.slice(0, 10)}</td><td className="px-3 py-2">{u.subscriptions?.[0] ? `${u.subscriptions[0].status} · ${u.subscriptions[0].plan_id}` : '—'}</td></tr>)}</tbody></table>
        </Card>
      )}
      {!data && <p className="text-muted">Loading…</p>}
    </>
  );
}

export function AdminAnalytics() {
  const modes = useModes();
  const s = useStore();
  const byMeal = useMemo(() => (['breakfast', 'lunch', 'dinner', 'snack'] as const).map((m) => {
    const list = RECIPES.filter((r) => r.meal === m);
    return { meal: m, recipes: list.length, avgCost: +(list.reduce((x, r) => x + recipeFacts(r).cost, 0) / Math.max(1, list.length)).toFixed(2) };
  }), []);
  return (
    <>
      <H sub={modes.supabase ? 'Aggregates from the database.' : 'Supabase not connected: business metrics below are for this browser only. Recipe database metrics are real.'}>Analytics</H>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Subscription (this browser)" value={<span className="text-[18px]">{s.subscription.status}</span>} />
        <Stat label="Payments recorded" value={s.subscription.payments.length} />
        <Stat label="Purchases recorded" value={s.purchases.length} />
        <Stat label="AI provider" value={<span className="text-[18px]">{modes.ai ? 'anthropic' : 'rules'}</span>} />
      </div>
      <Card className="mt-6 p-4">
        <div className="mb-2 text-[13px] font-semibold text-muted">Recipes per meal type · average cost per serving (snapshot prices)</div>
        <div className="h-[260px]">
          <ResponsiveContainer>
            <BarChart data={byMeal} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#E3E2DA" />
              <XAxis dataKey="meal" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="recipes" fill="#31966A" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ul className="mt-3 flex flex-wrap gap-4 text-[13px]">{byMeal.map((b) => <li key={b.meal}>{b.meal}: avg {eur(b.avgCost)}</li>)}</ul>
      </Card>
    </>
  );
}

export function AdminAi() {
  const [data, setData] = useState<{ provider: string; logs: { at: string; provider: string; ok: boolean; fallback: boolean; actions: string[]; ms: number; error?: string }[] } | null>(null);
  const load = () => fetch('/api/admin/ai-logs').then((r) => r.json()).then(setData).catch(() => setData(null));
  useEffect(() => { load(); }, []);
  return (
    <>
      <H sub="Metadata of assistant requests (no message text is stored). AI output is only ever a structured intent; prices and nutrition are computed by code.">AI logs</H>
      <div className="mb-4 flex items-center gap-3"><Badge tone="sage">provider: {data?.provider ?? '…'}</Badge><Button size="sm" variant="secondary" onClick={load}>Refresh</Button></div>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-[13px]">
          <thead className="bg-paper text-left text-muted"><tr>{['Time', 'Provider', 'OK', 'Fallback', 'Actions', 'ms', 'Error'].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
          <tbody>
            {data?.logs.map((l, i) => <tr key={i} className="border-t border-line"><td className="px-3 py-2">{l.at.slice(11, 19)}</td><td className="px-3 py-2">{l.provider}</td><td className="px-3 py-2">{l.ok ? '✓' : '✗'}</td><td className="px-3 py-2">{l.fallback ? 'yes' : ''}</td><td className="px-3 py-2">{l.actions.join(', ') || '—'}</td><td className="px-3 py-2">{l.ms}</td><td className="px-3 py-2 text-danger">{l.error ?? ''}</td></tr>)}
            {!data?.logs.length && <tr><td colSpan={7} className="px-3 py-6 text-center text-muted">No requests since the server started.</td></tr>}
          </tbody>
        </table>
      </Card>
    </>
  );
}
