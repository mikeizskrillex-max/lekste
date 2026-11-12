'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useModes } from '@/app/providers';
import type { PlanId } from '@/config/plans';
import { useI18n } from '@/i18n/I18nProvider';
import type { MessageKey } from '@/i18n/messages';
import { recipeName } from '@/lib/view';
import { useStore } from '@/state/store';
import { devSignIn } from './auth';
import { Logo } from './site';
import { Badge, Button, ButtonLink, Card, Container, Field, inputCls, cx } from './ui';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function Checkout() {
  const { t, eur, lang } = useI18n();
  const modes = useModes();
  const store = useStore();
  const router = useRouter();
  const sp = useSearchParams();
  const plans = store.plans.filter((p) => p.active);
  const initial = (sp.get('plan') as PlanId) ?? 'intro2w';
  const [planId, setPlanId] = useState<PlanId>(plans.some((p) => p.id === initial) ? initial : plans[0].id);
  const [email, setEmail] = useState(store.answers.email);
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<'idle' | 'busy' | 'error'>('idle');
  useEffect(() => { if (store.ready && !email) setEmail(store.answers.email); }, [store.ready]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!store.ready) return null;
  if (!store.onboarded) return <Container className="py-24 text-center"><p>{t('checkoutRequiresOnboarding')}</p><ButtonLink href="/onboarding" className="mt-6">{t('startOnboarding')}</ButtonLink></Container>;
  const plan = plans.find((p) => p.id === planId)!;
  const renew = t('planRenews', { days: plan.periodDays, price: eur(plan.renewalPrice), period: plan.renewalDays });

  const pay = async () => {
    if (!EMAIL_RE.test(email) || !consent) { setState('error'); return; }
    setState('busy');
    store.setAnswers({ email });
    if (modes.stripe) {
      const r = await fetch('/api/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ planId, email, lang, withdrawalConsent: true }) });
      const j = await r.json().catch(() => ({}));
      if (j.url) { location.href = j.url; return; }
      setState('error');
      return;
    }
    // Test mode: no money moves. Sign in (dev session) and activate locally.
    if (!modes.supabase && !(await devSignIn(email))) { setState('error'); return; }
    store.login(email);
    store.subscribe(planId, 'test');
    router.push('/success');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-paper">
      <Container className="flex h-16 items-center"><Logo /></Container>
      <Container className="grid max-w-[980px] gap-6 py-6 md:grid-cols-[1.2fr_1fr]">
        <div>
          <h1 className="font-display text-[32px] font-extrabold">{t('checkoutTitle')}</h1>
          <div className="mt-6 space-y-3">
            {plans.map((p) => (
              <button key={p.id} type="button" onClick={() => setPlanId(p.id)} aria-pressed={planId === p.id}
                className={cx('flex w-full items-center justify-between gap-4 rounded-2xl bg-card p-4 text-left ring-1 transition', planId === p.id ? 'ring-2 ring-leaf' : 'ring-line hover:ring-leaf/50')}>
                <span>
                  <span className="flex items-center gap-2 font-bold">{t(`plan_${p.id}` as MessageKey)}{p.highlighted && <Badge tone="leaf">{t('popular2')}</Badge>}</span>
                  <span className="text-[12.5px] text-muted">{t('planRenews', { days: p.periodDays, price: eur(p.renewalPrice), period: p.renewalDays })}</span>
                </span>
                <span className="font-display text-[22px] font-extrabold">{eur(p.price)}</span>
              </button>
            ))}
          </div>
          <div className="mt-6"><Field label={t('emailField')}><input type="email" value={email} onChange={(e) => setEmail(e.target.value.trim())} className={inputCls} autoComplete="email" /></Field></div>
          <label className="mt-5 flex items-start gap-3 text-[13.5px]"><input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[#31966A]" checked={consent} onChange={(e) => setConsent(e.target.checked)} /><span>{t('withdrawalConsent')}</span></label>
          {state === 'error' && <p role="alert" className="mt-3 text-[13.5px] text-danger">{!EMAIL_RE.test(email) ? t('emailInvalid') : !consent ? '⚠ ' + t('withdrawalConsent') : t('checkoutError')}</p>}
        </div>
        <Card className="h-fit p-6 md:sticky md:top-6">
          <div className="text-[13px] font-semibold text-muted">{t(`plan_${plan.id}` as MessageKey)}</div>
          <div className="mt-1 font-display text-[40px] font-extrabold">{eur(plan.price)}</div>
          <p className="mt-3 text-[13.5px] leading-relaxed text-muted">{t('billingTerms', { price: eur(plan.price), renew })}</p>
          {store.plan && <p className="mt-3 text-[13px]">✓ {recipeName(store.plan.days[0].meals[0].recipeId, lang)} …</p>}
          <Button size="lg" className="mt-6 w-full" onClick={pay} disabled={state === 'busy'}>{state === 'busy' && modes.stripe ? t('stripeRedirect') : t('payNow', { price: eur(plan.price) })}</Button>
          <p className="mt-3 text-center text-[12px] text-muted">🔒 {t('securePay2')}</p>
          {!modes.stripe && <p className="mt-4 rounded-xl bg-gold/20 p-3 text-[12.5px]">◎ {t('testModeNotice')}</p>}
          <p className="mt-4 text-center text-[12px]"><Link href="/terms" className="text-leaf underline">{t('terms')}</Link> · <Link href="/privacy" className="text-leaf underline">{t('privacy')}</Link></p>
        </Card>
      </Container>
    </div>
  );
}

export function Success() {
  const { t, lang, eur } = useI18n();
  const modes = useModes();
  const store = useStore();
  const sp = useSearchParams();
  const sessionId = sp.get('session_id');
  useEffect(() => {
    // Returning from Stripe: the webhook is the source of truth; mirror locally for the UI.
    if (store.ready && sessionId && store.subscription.status !== 'active') store.subscribe(store.subscription.planId ?? 'intro2w', 'stripe');
  }, [store.ready, sessionId]); // eslint-disable-line react-hooks/exhaustive-deps
  const sub = store.subscription;
  return (
    <div className="min-h-screen bg-paper">
      <Container className="flex h-16 items-center"><Logo /></Container>
      <Container className="max-w-[640px] py-10 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-leaf text-[30px] text-white">✓</div>
        <h1 className="mt-5 font-display text-[34px] font-extrabold">{t('successTitle')}</h1>
        <p className="mt-2 text-[16px] text-muted">{t('successText')}</p>
        <ButtonLink href="/app" size="lg" className="mt-8">{t('openDashboard')} →</ButtonLink>
        {!modes.email && store.plan && (
          <Card className="mt-10 overflow-hidden text-left">
            <div className="border-b border-line bg-sage px-5 py-2.5 text-[12px] font-bold text-forest">✉ {t('emailPreview')}</div>
            <div className="space-y-3 p-5 text-[14px]">
              <p><b>{store.emails[0]?.subject ?? 'Lėkštė'}</b></p>
              <p>{t('successText')}</p>
              {sub.planId && <p>{t('planLabel')}: {t(`plan_${sub.planId}` as MessageKey)} · {eur(sub.payments[0]?.amount ?? 0)}{sub.mode === 'test' && <> · <Badge tone="gold">{t('testMode')}</Badge></>}</p>}
              <ul className="list-disc pl-5 text-muted">{store.plan.days[0].meals.map((m) => <li key={m.recipeId}>{recipeName(m.recipeId, lang)}</li>)}</ul>
            </div>
          </Card>
        )}
      </Container>
    </div>
  );
}
