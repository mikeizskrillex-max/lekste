'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { AdminAnalytics, AdminUserRow, SiteStats } from '@/server/analytics';
import { download } from '@/lib/view';
import { Badge, Button, Card, cx, inputCls } from './ui';

/** Owner dashboard (Russian): who registered and when, the funnel to payment, money. */
const eur = (n: number) => `${n.toFixed(2).replace('.', ',')} €`;
const dt = (s: string | null) => (s ? new Date(s).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—');
const d = (s: string | null) => (s ? new Date(s).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) : '—');
const STATUS: Record<AdminUserRow['status'], [string, 'leaf' | 'gold' | 'danger' | 'line' | 'sage']> = {
  none: ['не оформил', 'line'], trialing: ['пробная неделя', 'gold'], active: ['платит', 'leaf'], past_due: ['оплата не прошла', 'danger'], canceled: ['отменил', 'sage'],
};
const PLAN: Record<string, string> = { monthly: '1 мес.', quarterly: '3 мес.', lifetime: 'навсегда' };

const PLACE: Record<string, string> = { hero: 'главный экран', header: 'шапка сайта', menu: 'мобильное меню', bottom: 'низ главной', page: 'страницы «как работает»/«демо»', pricing: 'страница цен', result: 'страница плана' };

function SiteSection({ s, daily }: { s: SiteStats; daily: AdminAnalytics['daily'] }) {
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)} %` : '—');
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-muted">Сайт <span className="rounded-full bg-sage px-2 py-0.5 text-[11px] normal-case text-forest">обновляется каждые 30 с</span></div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Сейчас на сайте" value={<span className="flex items-center gap-2"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-leaf" />{s.onlineNow}</span>} sub="за последние 5 минут" tone="good" />
        <Kpi label="Посетители сегодня" value={s.visitors.today} sub={`${s.visitors.d7} за 7 дн. · ${s.visitors.d30} за 30 дн.`} />
        <Kpi label="Нажали «Sudaryti planą»" value={s.ctaPlan.today} sub={`сегодня · ${s.ctaPlan.d7} за 7 дн. · ${s.ctaPlan.d30} за 30 дн.`} />
        <Kpi label="Нажали «Gauti mėnesio planą»" value={s.ctaMonth.today} sub={`сегодня · ${s.ctaMonth.d7} за 7 дн. · ${s.ctaMonth.d30} за 30 дн.`} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card className="p-5">
          <div className="text-[13px] font-bold uppercase tracking-wide text-muted">Путь посетителя · 30 дней</div>
          <ul className="mt-4 space-y-3">
            {s.funnel.map((f, i) => (
              <li key={f.label}>
                <div className="flex justify-between gap-2 text-[14px]"><span className="font-semibold">{f.label}</span><span className="shrink-0 tabular-nums"><b>{f.n}</b>{i > 0 && <span className="text-muted"> · {pct(f.n, s.funnel[0].n)}</span>}</span></div>
                <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-sage"><div className="h-full rounded-full bg-leaf" style={{ width: `${s.funnel[0].n ? Math.max(2, (f.n / s.funnel[0].n) * 100) : 0}%` }} /></div>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <div className="text-[13px] font-bold uppercase tracking-wide text-muted">Посетители и клики по дням</div>
          <div className="mt-3 h-[240px]">
            <ResponsiveContainer>
              <BarChart data={daily.map((x) => ({ ...x, day: x.date.slice(8, 10) + '.' + x.date.slice(5, 7) }))} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#E3E2DA" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} interval={4} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="visitors" name="посетители" fill="#B9D7C4" radius={[4, 4, 0, 0]} maxBarSize={18} />
                <Bar dataKey="ctaPlan" name="«Sudaryti planą»" fill="#31966A" radius={[4, 4, 0, 0]} maxBarSize={18} />
                <Bar dataKey="ctaMonth" name="«Mėnesio planą»" fill="#F0B95B" radius={[4, 4, 0, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Card className="p-5"><div className="text-[13px] font-bold uppercase tracking-wide text-muted">Откуда приходят</div>
          <ul className="mt-3 space-y-1.5 text-[13.5px]">{s.referrers.length ? s.referrers.map((r) => <li key={r.ref} className="flex justify-between gap-2"><span className="truncate">{r.ref}</span><b className="tabular-nums">{r.visitors}</b></li>) : <li className="text-muted">пока нет данных</li>}</ul>
          <p className="mt-3 text-[12.5px] text-muted">{s.devices.map((d) => `${d.device === 'mobile' ? 'телефон' : d.device === 'desktop' ? 'компьютер' : d.device} — ${d.visitors}`).join(' · ')}</p>
        </Card>
        <Card className="p-5"><div className="text-[13px] font-bold uppercase tracking-wide text-muted">Популярные страницы</div>
          <ul className="mt-3 space-y-1.5 text-[13.5px]">{s.topPages.length ? s.topPages.map((p) => <li key={p.path} className="flex justify-between gap-2"><span className="truncate">{p.path}</span><b className="tabular-nums">{p.views}</b></li>) : <li className="text-muted">пока нет данных</li>}</ul>
        </Card>
        <Card className="p-5"><div className="text-[13px] font-bold uppercase tracking-wide text-muted">Где жмут «Sudaryti planą»</div>
          <ul className="mt-3 space-y-1.5 text-[13.5px]">{s.ctaPlaces.length ? s.ctaPlaces.map((c) => <li key={c.place} className="flex justify-between gap-2"><span>{PLACE[c.place] ?? c.place}</span><b className="tabular-nums">{c.clicks}</b></li>) : <li className="text-muted">пока нет кликов</li>}</ul>
        </Card>
      </div>
      <p className="mt-2 text-[12px] text-muted">Без cookies и личных данных: посетитель считается по анонимному коду, который меняется каждый день, поэтому «за 7/30 дней» — это сумма уникальных посетителей по дням.</p>
    </section>
  );
}

type Filter = 'all' | 'new7' | 'noOnboarding' | 'noTrial' | 'trialing' | 'paying' | 'problem';

function Kpi({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: 'good' | 'bad' }) {
  return (
    <Card className="p-4">
      <div className="text-[12.5px] font-semibold text-muted">{label}</div>
      <div className={cx('mt-1 font-display text-[26px] font-extrabold tabular-nums', tone === 'good' && 'text-leaf', tone === 'bad' && 'text-danger')}>{value}</div>
      {sub && <div className="mt-0.5 text-[12px] text-muted">{sub}</div>}
    </Card>
  );
}

export function AdminDashboard() {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(() => {
    setLoading(true); setErr(null);
    fetch('/api/admin/analytics', { cache: 'no-store' })
      .then(async (r) => { if (r.status === 403) throw new Error('Нет прав администратора. Войдите под аккаунтом с ролью admin.'); if (!r.ok) throw new Error(`Ошибка сервера ${r.status}`); return r.json(); })
      .then((j: AdminAnalytics) => setData(j))
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);
  // live numbers (who is on the site now) refresh on their own
  useEffect(() => { const id = setInterval(() => { fetch('/api/admin/analytics', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).then((j) => { if (j) setData(j); }).catch(() => {}); }, 30000); return () => clearInterval(id); }, []);

  const rows = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    const week = Date.now() - 7 * 86400000;
    return data.users.filter((u) => {
      if (needle && !u.email.includes(needle)) return false;
      switch (filter) {
        case 'new7': return Date.parse(u.registeredAt) >= week;
        case 'noOnboarding': return !u.onboarded;
        case 'noTrial': return u.onboarded && u.status === 'none';
        case 'trialing': return u.status === 'trialing';
        case 'paying': return u.paidTotal > 0 || u.status === 'active';
        case 'problem': return u.status === 'past_due' || !u.confirmed;
        default: return true;
      }
    });
  }, [data, q, filter]);

  const exportCsv = () => {
    if (!data) return;
    const head = ['email', 'registered', 'email_confirmed', 'last_sign_in', 'questionnaire', 'store', 'household', 'budget', 'status', 'plan', 'cancelling', 'trial_end', 'period_end', 'paid_eur'];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = data.users.map((u) => [u.email, u.registeredAt, u.confirmed, u.lastSignInAt, u.onboarded, u.store, u.household, u.budget, u.status, u.plan, u.cancelAtPeriodEnd, u.trialEnd, u.periodEnd, u.paidTotal].map(esc).join(','));
    download(`lekste-clients-${new Date().toISOString().slice(0, 10)}.csv`, [head.join(','), ...lines].join('\n'), 'text/csv');
  };

  if (loading && !data) return <p className="text-muted">Загружаю данные из Supabase и Stripe…</p>;
  if (err) return <Card className="p-6"><p className="font-semibold text-danger">{err}</p><Button className="mt-4" onClick={load}>Повторить</Button></Card>;
  if (!data) return null;
  const t = data.totals;
  const funnel = [
    ['Зарегистрировались', t.users],
    ['Заполнили анкету', t.onboarded],
    ['Начали пробную неделю', t.trialsEver],
    ['Заплатили хотя бы раз', t.paying],
  ] as const;
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)} %` : '—');

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[28px] font-extrabold">Клиенты и аналитика</h1>
          <p className="mt-1 text-[13.5px] text-muted">Аккаунты — из Supabase, подписки и деньги — из Stripe{data.config.stripe ? (data.config.stripeLive ? ' (боевой режим)' : ' (тестовый режим)') : ''}. Обновлено {dt(data.generatedAt)}.</p>
        </div>
        <div className="flex gap-2"><Button variant="secondary" size="sm" onClick={load} disabled={loading}>{loading ? 'Обновляю…' : '↻ Обновить'}</Button><Button variant="secondary" size="sm" onClick={exportCsv}>⬇ CSV</Button></div>
      </div>

      {data.problems.length > 0 && (
        <Card className="mb-6 border-l-4 border-danger p-5">
          <p className="font-bold text-danger">Почему данных может не хватать:</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[14px]">{data.problems.map((p) => <li key={p}>{p}</li>)}</ul>
        </Card>
      )}

      {data.site && <SiteSection s={data.site} daily={data.daily} />}

      <div className="mb-3 text-[13px] font-bold uppercase tracking-wide text-muted">Клиенты и деньги</div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Всего регистраций" value={t.users} sub={`+${t.new24h} за сутки · +${t.new7d} за 7 дн. · +${t.new30d} за 30 дн.`} />
        <Kpi label="Сейчас на пробной неделе" value={t.trialing} sub={t.cancelling ? `${t.cancelling} уже отменили продление` : 'никто не отменил'} />
        <Kpi label="Платящие сейчас" value={t.active} tone="good" sub={`MRR ≈ ${eur(t.mrr)} в месяц`} />
        <Kpi label="Выручка" value={eur(t.revenue)} tone="good" sub={`${eur(t.revenue30d)} за 30 дней`} />
        <Kpi label="Подтвердили e-mail" value={t.confirmed} sub={pct(t.confirmed, t.users)} />
        <Kpi label="Заполнили анкету" value={t.onboarded} sub={pct(t.onboarded, t.users)} />
        <Kpi label="Оплата не прошла" value={t.pastDue} tone={t.pastDue ? 'bad' : undefined} sub="Stripe повторяет списание" />
        <Kpi label="Отменили" value={t.canceled} sub="подписка закончилась" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card className="p-5">
          <div className="text-[13px] font-bold uppercase tracking-wide text-muted">Воронка</div>
          <ul className="mt-4 space-y-3">
            {funnel.map(([label, n], i) => (
              <li key={label}>
                <div className="flex justify-between text-[14px]"><span className="font-semibold">{label}</span><span className="tabular-nums"><b>{n}</b>{i > 0 && <span className="text-muted"> · {pct(n, funnel[i - 1][1])} от пред.</span>}</span></div>
                <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-sage"><div className="h-full rounded-full bg-leaf" style={{ width: `${t.users ? Math.max(2, (n / t.users) * 100) : 0}%` }} /></div>
              </li>
            ))}
          </ul>
          {data.stores.length > 0 && <p className="mt-5 text-[13px] text-muted">Магазин: {data.stores.map((s) => `${s.store} — ${s.users}`).join(' · ')}</p>}
        </Card>
        <Card className="p-5">
          <div className="text-[13px] font-bold uppercase tracking-wide text-muted">Последние 30 дней</div>
          <div className="mt-3 h-[240px]">
            <ResponsiveContainer>
              <BarChart data={data.daily.map((x) => ({ ...x, day: x.date.slice(8, 10) + '.' + x.date.slice(5, 7) }))} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#E3E2DA" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} interval={4} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number, n: string) => [v, n]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="signups" name="регистрации" fill="#31966A" radius={[4, 4, 0, 0]} maxBarSize={18} />
                <Bar dataKey="trials" name="пробные недели" fill="#F0B95B" radius={[4, 4, 0, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-4">
          <input className={cx(inputCls, 'max-w-[260px] py-2')} placeholder="Поиск по e-mail" value={q} onChange={(e) => setQ(e.target.value)} />
          {([['all', 'Все'], ['new7', 'Новые 7 дн.'], ['noOnboarding', 'Без анкеты'], ['noTrial', 'Анкета, но без пробной'], ['trialing', 'На пробной'], ['paying', 'Платят'], ['problem', 'Проблемы']] as [Filter, string][]).map(([f, l]) => (
            <button key={f} type="button" onClick={() => setFilter(f)} className={cx('rounded-full px-3 py-1.5 text-[12.5px] font-semibold ring-1', filter === f ? 'bg-forest text-white ring-forest' : 'bg-card ring-line')}>{l}</button>
          ))}
          <span className="ml-auto text-[12.5px] text-muted">{rows.length} из {data.users.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-[13px]">
            <thead className="bg-paper text-left text-[12px] text-muted">
              <tr>{['E-mail', 'Регистрация', 'E-mail подтв.', 'Последний вход', 'Анкета', 'Магазин', 'Подписка', 'Пробная до / период до', 'Оплачено'].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((u) => {
                const [label, tone] = STATUS[u.status];
                return (
                  <tr key={u.id} className="border-t border-line align-top">
                    <td className="px-3 py-2.5 font-semibold">{u.email}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{dt(u.registeredAt)}</td>
                    <td className="px-3 py-2.5">{u.confirmed ? '✓' : <span className="text-danger">нет</span>}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{dt(u.lastSignInAt)}</td>
                    <td className="px-3 py-2.5">{u.onboarded ? '✓' : <span className="text-muted">нет</span>}</td>
                    <td className="px-3 py-2.5">{u.store ?? '—'}{u.household ? <span className="text-muted"> · {u.household} чел.</span> : null}</td>
                    <td className="px-3 py-2.5"><Badge tone={tone}>{label}</Badge>{u.plan && <span className="ml-1 text-muted">{PLAN[u.plan] ?? u.plan}</span>}{u.cancelAtPeriodEnd && <div className="mt-1 text-[11.5px] text-danger">продление отменено</div>}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{u.status === 'trialing' ? d(u.trialEnd) : d(u.periodEnd)}</td>
                    <td className="px-3 py-2.5 tabular-nums font-semibold">{u.paidTotal ? eur(u.paidTotal) : '—'}</td>
                  </tr>
                );
              })}
              {!rows.length && <tr><td colSpan={9} className="px-3 py-8 text-center text-muted">{data.users.length ? 'Никого под этот фильтр.' : 'Пока нет данных о регистрациях — см. красный блок выше.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {data.stripeOnly.length > 0 && (
        <Card className="mt-6 p-5">
          <div className="font-bold">Оплаты в Stripe без аккаунта на сайте ({data.stripeOnly.length})</div>
          <p className="mt-1 text-[13px] text-muted">Обычно это удалённые аккаунты или оплата с другим e-mail.</p>
          <ul className="mt-3 space-y-1 text-[13.5px]">{data.stripeOnly.map((x) => <li key={x.email}>{x.email} · {STATUS[x.status as AdminUserRow['status']]?.[0] ?? x.status} · {x.plan ? PLAN[x.plan] ?? x.plan : '—'} · {eur(x.paidTotal)}</li>)}</ul>
        </Card>
      )}
      <p className="mt-6 text-[12px] text-muted">Ответы анкеты о здоровье (цель, вес, аллергии) в админке не показываются.</p>
    </>
  );
}
