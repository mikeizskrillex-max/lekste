'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useModes } from '@/app/providers';
import { signOut } from '@/lib/account';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { useI18n } from '@/i18n/I18nProvider';
import type { MessageKey } from '@/i18n/messages';
import { download } from '@/lib/view';
import { useStore } from '@/state/store';
import { PageTitle } from '../appshell';
import { InstallApp } from '../install';
import { LangSwitch } from '../site';
import { Badge, Button, ButtonLink, Card, inputCls } from '../ui';

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between gap-4 py-2 text-[14.5px]">
      <span>{label}</span>
      <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className={`relative h-7 w-12 rounded-full transition ${on ? 'bg-leaf' : 'bg-line'}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${on ? 'left-6' : 'left-1'}`} />
      </button>
    </label>
  );
}

/** GDPR delete: stop billing in Stripe, delete the saved account data, sign out. */
async function deleteEverything() {
  await fetch('/api/subscription', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'cancel' }) }).catch(() => null);
  const sb = supabaseBrowser();
  if (sb) {
    const { data } = await sb.auth.getUser();
    if (data.user) await sb.from('app_state').delete().eq('user_id', data.user.id);
  }
  await signOut();
}

export function SettingsPage() {
  const { t, date } = useI18n();
  const s = useStore();
  const router = useRouter();
  const [confirm, setConfirm] = useState('');
  const word = t('confirmDelete').split(' ').pop()!;
  const a = s.answers;
  return (
    <>
      <PageTitle title={t('tabSettings2')} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-[17px] font-extrabold">{t('profile')}</h2>
          <div className="mt-3 space-y-2 text-[14.5px]">
            <div className="flex justify-between"><span className="text-muted">{t('emailField')}</span><b>{s.session?.email || a.email || '—'}</b></div>
            <div className="flex items-center justify-between"><span className="text-muted">{t('languageLabel')}</span><LangSwitch /></div>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-[17px] font-extrabold">{t('nutritionPrefs')}</h2>
          <p className="mt-2 text-[14px] text-muted">{t(`goal_${a.goal}` as MessageKey)} · {t(`diet_${a.dietType}` as MessageKey)} · {a.household} {t('people2')} · {a.weeklyBudget} €</p>
          <div className="mt-4 flex flex-wrap gap-2"><ButtonLink href="/app/menu" variant="secondary" size="sm">{t('personalize')}</ButtonLink><ButtonLink href="/onboarding/taste?next=/app/menu" variant="secondary" size="sm">👅 {t('tasteCta')}</ButtonLink><ButtonLink href="/onboarding" variant="ghost" size="sm">{t('redoOnboarding')}</ButtonLink></div>
        </Card>
        <Card className="p-5 lg:col-span-2">
          <h2 className="text-[17px] font-extrabold">{t('privacyData')}</h2>
          <div className="mt-2 divide-y divide-line">
            <Toggle on={s.trackWeight} onChange={s.setTrackWeight} label={t('enableWeight')} />
            <Toggle on={!!a.marketingConsent} onChange={(v) => s.setAnswers({ marketingConsent: v })} label={t('marketingToggle')} />
            <div className="py-3 text-[13.5px]">{a.consentHealth ? <Badge tone="leaf">✓ {t('healthConsentGiven')}</Badge> : <Badge tone="line">—</Badge>}</div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => download(`lekste-data-${new Date().toISOString().slice(0, 10)}.json`, s.exportData())}>⬇ {t('downloadData')}</Button>
            {a.consentHealth && <Button variant="ghost" size="sm" onClick={() => { if (window.confirm(t('withdrawHealth'))) { s.withdrawHealthConsent(); router.push('/app'); } }}>{t('withdrawHealth')}</Button>}
          </div>
          <div className="mt-6 rounded-2xl bg-danger/5 p-4 ring-1 ring-danger/20">
            <div className="text-[14px] font-bold text-danger">{t('deleteAccount2')}</div>
            <p className="mt-1 text-[12.5px] text-muted">{t('confirmDelete')}</p>
            <div className="mt-2 flex gap-2">
              <input value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} aria-label={t('confirmDelete')} />
              <Button variant="dark" className="bg-danger hover:bg-danger" disabled={confirm.trim().toUpperCase() !== word.toUpperCase()}
                onClick={async () => { await deleteEverything(); s.deleteAccount(); router.push('/'); router.refresh(); }}>{t('deleteAccount2')}</Button>
            </div>
          </div>
        </Card>
        <Card className="p-5 lg:col-span-2">
          <h2 className="text-[17px] font-extrabold">{t('emailsSent')}</h2>
          {s.emails.length ? (
            <ul className="mt-3 space-y-1.5 text-[13.5px]">{s.emails.map((e, i) => <li key={i} className="flex justify-between gap-3"><span>{e.subject}</span><span className="shrink-0 text-muted">{date(e.date, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></li>)}</ul>
          ) : <p className="mt-2 text-[13.5px] text-muted">{t('noEmails')}</p>}
        </Card>
        <div className="lg:col-span-2"><InstallApp /></div>
        <p className="text-[12px] text-muted lg:col-span-2">{t('medicalDisclaimer')} <Link href="/privacy" className="text-leaf underline">{t('privacy')}</Link></p>
      </div>
    </>
  );
}

export function SubscriptionPage() {
  const { t, eur, date } = useI18n();
  const modes = useModes();
  const s = useStore();
  const sub = s.subscription;
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const d = (iso: string | null | undefined) => (iso ? date(iso, { day: 'numeric', month: 'long', year: 'numeric' }) : '—');
  const plan = s.plans.find((p) => p.id === sub.planId);
  const lifetime = sub.planId === 'lifetime';
  const endsAt = sub.status === 'trialing' ? sub.trialEnd : sub.currentPeriodEnd;
  const portal = async () => {
    setBusy(true);
    const r = await fetch('/api/portal', { method: 'POST' });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (j.url) location.href = j.url; else setMsg(t('checkoutError'));
  };
  const act = async (fn: () => void) => { setBusy(true); fn(); setTimeout(() => setBusy(false), 1500); };
  return (
    <>
      <PageTitle title={t('tabSubscription')} right={sub.mode === 'test' && sub.status !== 'none' ? <Badge tone="gold">◎ {t('testMode')}</Badge> : undefined} />
      <Card className="p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div><div className="text-[12.5px] text-muted">{t('subStatus')}</div><div className="mt-1 text-[18px] font-extrabold">{t(`st_${sub.status}` as MessageKey)}</div></div>
          <div><div className="text-[12.5px] text-muted">{t('planLabel')}</div><div className="mt-1 text-[18px] font-extrabold">{sub.planId ? t(`plan_${sub.planId}` as MessageKey) : '—'}{plan && !lifetime && <span className="ml-1 text-[13px] font-semibold text-muted">· {eur(plan.price)}</span>}</div></div>
          <div>
            <div className="text-[12.5px] text-muted">{lifetime || sub.cancelAtPeriodEnd || sub.status === 'canceled' ? t('accessUntil') : t('nextBilling')}</div>
            <div className="mt-1 text-[18px] font-extrabold">{lifetime && sub.status !== 'none' ? `♾ ${t('lifetimeAccess')}` : d(endsAt)}</div>
          </div>
        </div>
        {sub.status === 'trialing' && !sub.cancelAtPeriodEnd && plan && <p className="mt-4 rounded-xl bg-sage p-3 text-[13.5px] text-forest">🎁 {t('trialUntil', { date: d(sub.trialEnd) })} · {t('trialThen', { price: eur(plan.price), n: plan.renewalDays })}</p>}
        {sub.cancelAtPeriodEnd && <p className="mt-4 rounded-xl bg-gold/20 p-3 text-[13.5px]">{t('cancelledUntil', { date: d(endsAt) })}</p>}
        {sub.status === 'past_due' && <p className="mt-4 rounded-xl bg-danger/10 p-3 text-[13.5px] text-danger">{t('paymentFailed')}</p>}
        <div className="mt-5 flex flex-wrap gap-2">
          {sub.status === 'none' && <ButtonLink href="/checkout">{t('startTrial')}</ButtonLink>}
          {!lifetime && (sub.status === 'active' || sub.status === 'trialing' || sub.status === 'past_due') && !sub.cancelAtPeriodEnd && (
            <Button variant="secondary" disabled={busy} onClick={() => { if (window.confirm(t('cancelConfirm'))) void act(s.cancelSubscription); }}>{t('cancelSub')}</Button>
          )}
          {!lifetime && sub.cancelAtPeriodEnd && <Button disabled={busy} onClick={() => void act(s.resumeSubscription)}>{t('resumeSub')}</Button>}
          {sub.status !== 'none' && !lifetime && <ButtonLink href="/checkout" variant="ghost">{t('changePlan')}</ButtonLink>}
          {modes.stripe && sub.mode === 'stripe' && <Button variant="ghost" disabled={busy} onClick={portal}>💳 {t('manageBilling')}</Button>}
        </div>
        {msg && <p className="mt-3 text-[13px] text-danger">{msg}</p>}
        {!modes.stripe && <p className="mt-4 rounded-xl bg-gold/20 p-3 text-[12.5px]">◎ {t('testModeNotice')}</p>}
      </Card>
      <Card className="mt-4 overflow-hidden">
        <div className="border-b border-line px-5 py-3 font-extrabold">{t('paymentHistory')}</div>
        {sub.payments.length === 0 && <p className="px-5 py-6 text-[14px] text-muted">—</p>}
        {sub.payments.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-3 border-b border-line/60 px-5 py-3 text-[14px] last:border-0">
            <span className="w-32 text-muted">{d(p.date)}</span>
            <span className="flex-1">{p.planId ? t(`plan_${p.planId}` as MessageKey) : 'Lėkštė'}</span>
            <b className="tabular-nums">{eur(p.amount)}</b>
            <Badge tone={p.status === 'paid' ? 'leaf' : p.status === 'failed' ? 'danger' : 'gold'}>{t(`pay_${p.status}` as MessageKey)}</Badge>
            {p.receiptUrl && <a href={p.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-[12.5px] font-semibold text-leaf hover:underline">{t('receipt')} ↗</a>}
            {sub.mode === 'test' && p.status === 'paid' && <button type="button" className="text-[12.5px] font-semibold text-leaf hover:underline" onClick={() => { s.requestRefund(p.id); setMsg(t('refundRequested')); }}>{t('refundRequest')}</button>}
          </div>
        ))}
      </Card>
      <p className="mt-4 text-[12.5px] text-muted">{t('pricingSub2')}</p>
    </>
  );
}
