'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { weeksToGoal } from '@/domain/nutrition';
import { ALLERGENS, type Activity, type Allergen, type DietType, type Goal, type QuizAnswers } from '@/domain/types';
import { ALLERGEN_LABEL, type MessageKey } from '@/i18n/messages';
import { useI18n } from '@/i18n/I18nProvider';
import { getDetail } from '@/data/recipeDetails';
import { DISLIKE_OPTIONS } from '@/data/ingredients';
import { EXCLUSIONS, exclusionOn, ingEmoji, ingName, recipeById, recipeName, toggleExclusion } from '@/lib/view';
import { useStore } from '@/state/store';
import { Logo } from './site';
import { Button, ButtonLink, Card, Chip, Container, CountUp, DishImage, Field, Option, Ring, Stat, inputCls, cx } from './ui';
import { DayList, OverBudgetHelp, StorePicker, StoreSummary, StoreTotals, useHomeBasket, useWeekNeed } from './basket';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const BUDGETS = [{ v: 35, l: '30–40 €' }, { v: 50, l: '40–60 €' }, { v: 75, l: '60–90 €' }];

function NumberInput({ value, onChange, min, max, suffix, id }: { value: number; onChange: (n: number) => void; min: number; max: number; suffix: string; id: string }) {
  const [raw, setRaw] = useState(String(value));
  useEffect(() => setRaw(String(value)), [value]);
  return (
    <div className="relative">
      <input id={id} inputMode="decimal" value={raw} className={cx(inputCls, 'pr-12 text-[18px] font-semibold')}
        onChange={(e) => { setRaw(e.target.value); const n = Number(e.target.value.replace(',', '.')); if (Number.isFinite(n) && n >= min && n <= max) onChange(n); }} />
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted">{suffix}</span>
    </div>
  );
}

/** Ingredient chips: tap to never get dishes with it (hard rule). */
export function DislikeChips() {
  const { lang } = useI18n();
  const { answers: a, setAnswers } = useStore();
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {DISLIKE_OPTIONS.map((id) => {
        const on = a.never.includes(id);
        return <Chip key={id} on={on} onClick={() => setAnswers({ never: on ? a.never.filter((x) => x !== id) : [...a.never, id] }, true)}>{ingEmoji(id)} {ingName(id, lang)}</Chip>;
      })}
    </div>
  );
}

export function Onboarding() {
  const { t, pick } = useI18n();
  const { answers: a, setAnswers, completeOnboarding } = useStore();
  const router = useRouter();
  const sp = useSearchParams();
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [customBudget, setCustomBudget] = useState(!BUDGETS.some((b) => b.v === a.weeklyBudget));
  const [err, setErr] = useState<string | null>(null);
  const set = (p: Partial<QuizAnswers>) => { setErr(null); setAnswers(p); };
  const needsTarget = a.goal === 'lose' || a.goal === 'gain';

  const valid = (): string | null => {
    if (step === 2 && (a.age < 18 || a.age > 100)) return t('under18');
    if (step === 3 && (a.heightCm < 120 || a.heightCm > 230 || a.weightKg < 35 || a.weightKg > 250)) return '!';
    if (step === 4 && needsTarget && (a.goal === 'lose' ? a.targetWeightKg >= a.weightKg : a.targetWeightKg <= a.weightKg)) return '!';
    if (step === 9) {
      if (!EMAIL_RE.test(a.email)) return t('emailInvalid');
      if (!a.consentHealth || !a.consentTerms) return t('requiredConsent');
    }
    return null;
  };
  const next = () => {
    const e = valid();
    if (e) { setErr(e); return; }
    if (step === 9) {
      completeOnboarding();
      const plan = sp.get('plan');
      router.push(`/onboarding/taste?next=${encodeURIComponent(`/onboarding/result${plan ? `?plan=${plan}` : ''}`)}`);
      return;
    }
    setDir(1); setStep((s) => s + 1);
  };
  const back = () => { setErr(null); setDir(-1); setStep((s) => Math.max(1, s - 1)); };

  const body = () => {
    switch (step) {
      case 1: return (
        <div className="space-y-2.5">
          {(['lose', 'keep', 'gain', 'healthy'] as Goal[]).map((g) => <Option key={g} on={a.goal === g} onClick={() => set({ goal: g })}><span className="text-[22px]">{({ lose: '⚖️', keep: '🧘', gain: '💪', healthy: '🥗' })[g]}</span>{t(`goal_${g}` as MessageKey)}</Option>)}
        </div>
      );
      case 2: return (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-2.5">{(['f', 'm'] as const).map((s) => <Option key={s} on={a.sex === s} onClick={() => set({ sex: s })}>{t(`sex_${s}` as MessageKey)}</Option>)}</div>
          <Field label={`${t('age')}, ${t('years')}`}><NumberInput id="age" value={a.age} min={1} max={110} suffix="" onChange={(n) => set({ age: Math.round(n) })} /></Field>
        </div>
      );
      case 3: return (
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('height')}><NumberInput id="h" value={a.heightCm} min={100} max={240} suffix={t('cm')} onChange={(n) => set({ heightCm: Math.round(n) })} /></Field>
          <Field label={t('weight')}><NumberInput id="w" value={a.weightKg} min={30} max={300} suffix={t('kg')} onChange={(n) => set({ weightKg: n, targetWeightKg: a.goal === 'lose' ? Math.min(a.targetWeightKg, n - 1) : a.goal === 'gain' ? Math.max(a.targetWeightKg, n + 1) : n })} /></Field>
        </div>
      );
      case 4: return needsTarget ? (
        <div className="space-y-3">
          <Field label={t('targetWeight')}><NumberInput id="tw" value={a.targetWeightKg} min={35} max={250} suffix={t('kg')} onChange={(n) => set({ targetWeightKg: n })} /></Field>
          {(() => { const w = weeksToGoal(a); return w ? <p className="text-[14px] text-muted">{t('timeline')}: <b className="text-ink">≈ {w} {t('weeks')}</b></p> : null; })()}
        </div>
      ) : <p className="rounded-2xl bg-sage p-4 text-[15px]">{a.goal === 'keep' ? t('q4keep') : t('goalHealthyNote')}</p>;
      case 5: return (
        <div className="space-y-2.5">{(['sedentary', 'light', 'moderate', 'high'] as Activity[]).map((x) => <Option key={x} on={a.activity === x} onClick={() => set({ activity: x })}>{t(`act_${x}` as MessageKey)}</Option>)}</div>
      );
      case 6: return (
        <div className="grid grid-cols-3 gap-2.5">{[1, 2, 3, 4, 5, 6].map((n) => <Option key={n} on={a.household === n} onClick={() => set({ household: n })} className="justify-center text-[18px]">{n}</Option>)}</div>
      );
      case 7: return (
        <div className="space-y-2.5">
          {BUDGETS.map((b) => <Option key={b.v} on={!customBudget && a.weeklyBudget === b.v} onClick={() => { setCustomBudget(false); set({ weeklyBudget: b.v }); }}>{b.l} <span className="ml-auto text-[13px] font-normal text-muted">{t('perWeek')}</span></Option>)}
          <Option on={customBudget} onClick={() => setCustomBudget(true)}>{t('budgetCustom')}</Option>
          {customBudget && <NumberInput id="budget" value={a.weeklyBudget} min={15} max={500} suffix="€" onChange={(n) => set({ weeklyBudget: Math.round(n) })} />}
          <p className="text-[13px] text-muted">{a.household > 1 ? t('personsN', { n: a.household }) : t('person1')}</p>
        </div>
      );
      case 8: return (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">{EXCLUSIONS.map((e) => <Chip key={e} on={exclusionOn(a, e)} onClick={() => set(toggleExclusion(a, e))}>{t(`ex_${e}` as MessageKey)}</Chip>)}</div>
          <div>
            <div className="mb-2 text-[13.5px] font-semibold">{t('dietTypeLabel')}</div>
            <div className="flex flex-wrap gap-2">{(['any', 'vegetarian', 'vegan', 'pescatarian', 'low_carb'] as DietType[]).map((d) => <Chip key={d} on={a.dietType === d} onClick={() => set({ dietType: d })}>{t(`diet_${d}` as MessageKey)}</Chip>)}</div>
          </div>
          <details className="rounded-2xl bg-card p-4 ring-1 ring-line">
            <summary className="cursor-pointer text-[14px] font-semibold">{t('otherAllergies')}</summary>
            <div className="mt-3 flex flex-wrap gap-2">
              {ALLERGENS.filter((x) => x !== 'milk' && x !== 'gluten').map((al) => (
                <Chip key={al} on={a.allergens.includes(al)} onClick={() => set({ allergens: a.allergens.includes(al) ? a.allergens.filter((x) => x !== al) : [...a.allergens, al as Allergen] })}>{ALLERGEN_LABEL[al]?.emoji} {pick(ALLERGEN_LABEL[al])}</Chip>
              ))}
            </div>
          </details>
          <details className="rounded-2xl bg-card p-4 ring-1 ring-line" open>
            <summary className="cursor-pointer text-[14px] font-semibold">{t('dislikeTitle')}</summary>
            <p className="mt-1 text-[12.5px] text-muted">{t('dislikeHint')}</p>
            <DislikeChips />
          </details>
          <Field label={t('otherRestrictions')}><input value={a.otherRestrictions ?? ''} maxLength={200} onChange={(e) => set({ otherRestrictions: e.target.value })} className={inputCls} /></Field>
        </div>
      );
      case 9: return (
        <div className="space-y-5">
          <div>
            <div className="mb-2 text-[13.5px] font-semibold">{t('timePerDish')}</div>
            <div className="flex gap-2">{([15, 30, 60] as const).map((m) => <Chip key={m} on={a.cookingTimeMax === m} onClick={() => set({ cookingTimeMax: m })}>{t('upTo')} {m} {t('minutesShort')}</Chip>)}</div>
          </div>
          <div>
            <div className="mb-2 text-[13.5px] font-semibold">{t('storesLabel')}</div>
            <StorePicker />
          </div>
          <Field label={t('emailField')}><input type="email" autoComplete="email" value={a.email} onChange={(e) => set({ email: e.target.value.trim() })} className={inputCls} /></Field>
          <label className="flex items-start gap-3 text-[13.5px]"><input type="checkbox" className="mt-0.5 h-5 w-5 accent-[#31966A]" checked={a.health.length > 0} onChange={(e) => set({ health: e.target.checked ? ['other'] : [] })} /><span>{t('healthLabel')}</span></label>
          {a.health.length > 0 && <p className="rounded-2xl bg-gold/20 p-3 text-[13.5px]">{t('healthStop2')}</p>}
          <div className="space-y-3 rounded-2xl bg-card p-4 ring-1 ring-line">
            <label className="flex items-start gap-3 text-[13.5px]"><input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[#31966A]" checked={a.consentHealth} onChange={(e) => set({ consentHealth: e.target.checked })} /><span>{t('consentHealth2')} <b className="text-danger">*</b></span></label>
            <label className="flex items-start gap-3 text-[13.5px]"><input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[#31966A]" checked={a.consentTerms} onChange={(e) => set({ consentTerms: e.target.checked })} /><span>{t('consentTerms2')} <Link href="/terms" className="text-leaf underline">{t('terms')}</Link> · <Link href="/privacy" className="text-leaf underline">{t('privacy')}</Link> <b className="text-danger">*</b></span></label>
            <label className="flex items-start gap-3 text-[13.5px]"><input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[#31966A]" checked={!!a.marketingConsent} onChange={(e) => set({ marketingConsent: e.target.checked })} /><span>{t('consentMarketing')}</span></label>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <Container className="flex h-16 items-center justify-between"><Logo /><span className="text-[13px] font-semibold text-muted">{t('step', { n: step })}</span></Container>
      <div className="h-1.5 bg-line/60"><motion.div className="h-full bg-leaf" animate={{ width: `${(step / 9) * 100}%` }} /></div>
      <Container className="max-w-[560px] py-8 md:py-14">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={step} initial={{ opacity: 0, x: 24 * dir }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 * dir }} transition={{ duration: 0.22 }}>
            <h1 className="mb-6 font-display text-[28px] font-extrabold leading-tight md:text-[34px]">{t(`q${step}` as MessageKey)}</h1>
            {body()}
          </motion.div>
        </AnimatePresence>
        {err && err !== '!' && <p role="alert" className="mt-4 text-[14px] font-semibold text-danger">{err}</p>}
        {err === '!' && <p role="alert" className="mt-4 text-[14px] font-semibold text-danger">⚠</p>}
        <div className="sticky bottom-0 -mx-5 mt-8 flex gap-3 bg-paper/95 px-5 py-4 backdrop-blur pb-safe md:static md:mx-0 md:bg-transparent md:px-0">
          {step > 1 && <Button variant="secondary" size="lg" onClick={back}>{t('back2')}</Button>}
          <Button size="lg" className="flex-1" onClick={next}>{step === 9 ? t('seeMyResult') : t('next2')}</Button>
        </div>
        <p className="mt-4 text-center text-[12px] text-muted">{t('medicalDisclaimer')}</p>
      </Container>
    </div>
  );
}

/** Meal cards of one day; every dish opens its recipe. */
export function DayMeals({ day, hrefFor = (id) => `/recipe/${id}` }: { day: number; hrefFor?: (id: string) => string }) {
  const { t, lang, eur, num } = useI18n();
  const { plan, allocation } = useStore();
  const d0 = plan?.days[day];
  if (!d0) return null;
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {d0.meals.map((m, i) => {
          const r = recipeById(m.recipeId);
          const d = getDetail(m.recipeId);
          const first = d ? (lang === 'lt' ? d.steps[0]?.[2] : d.steps[0]?.[1]) : r && (lang === 'lt' ? r.stepsLt[0] : r.stepsRu[0]);
          return (
            <Link key={`${m.recipeId}-${i}`} href={hrefFor(m.recipeId)} className="group">
              <Card className="flex h-full gap-3 overflow-hidden p-2.5 transition group-hover:ring-leaf">
                <DishImage id={m.recipeId} alt={recipeName(m.recipeId, lang)} className="h-28 w-28 shrink-0 rounded-xl" sizes="112px" />
                <div className="min-w-0 flex-1 py-1">
                  <div className="text-[11px] font-bold uppercase text-leaf">{t(`meal_${m.meal}` as MessageKey)}</div>
                  <div className="line-clamp-2 text-[15px] font-bold leading-snug group-hover:text-leaf">{recipeName(m.recipeId, lang)}</div>
                  <div className="mt-1 text-[12.5px] text-muted">{num(m.kcal)} kcal · {num(m.protein)} g {t('protein')} · {eur(allocation?.meal[day][i] ?? 0)} · ⏱ {d ? d.prep + d.cook : r?.minutes} {t('minutesShort')}</div>
                  {first && <p className="mt-1 line-clamp-2 text-[12.5px] text-ink/70">1. {first}</p>}
                  <span className="mt-1.5 inline-block text-[13px] font-bold text-leaf">{t('openRecipeCta')} →</span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
      <p className="mt-3 text-[14px]">{t('dayTotals')}: <b>{num(d0.kcal)} kcal</b> · {num(d0.protein)} g {t('protein')} · {t('dayCost')}: <b>{eur(allocation?.day[day] ?? 0)}</b></p>
    </>
  );
}

/** Day tabs Mon–Sun: each day's menu and what to buy for it. */
export function WeekByDay({ hrefFor }: { hrefFor?: (id: string) => string }) {
  const { t } = useI18n();
  const { plan } = useStore();
  const [day, setDay] = useState(0);
  if (!plan) return null;
  return (
    <div className="mt-4">
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1" role="tablist">
        {plan.days.map((_, i) => (
          <button key={i} role="tab" aria-selected={day === i} type="button" onClick={() => setDay(i)}
            className={cx('shrink-0 rounded-2xl px-4 py-2.5 text-[14px] font-bold transition', day === i ? 'bg-forest text-white' : 'bg-card ring-1 ring-line hover:ring-leaf')}>
            <span className="sm:hidden">{t(`dayS${i}` as MessageKey)}</span><span className="hidden sm:inline">{t(`day${i}` as MessageKey)}</span>
          </button>
        ))}
      </div>
      <DayMeals day={day} hrefFor={hrefFor} />
      <div className="mt-6"><DayList day={day} /></div>
    </div>
  );
}

function WeekStore() {
  const need = useWeekNeed();
  const basket = useHomeBasket(need);
  return <div className="mt-4 space-y-4"><StoreSummary basket={basket} /><StoreTotals need={need} /></div>;
}

export function Result() {
  const { t, eur, num } = useI18n();
  const { ready, plan, targets, answers: a, weekEconomics, onboarded } = useStore();
  const sp = useSearchParams();
  if (!ready) return <div className="grid min-h-screen place-items-center text-muted">{t('loading')}</div>;
  if (!onboarded || !plan) return <Container className="py-20 text-center"><p>{t('noPlanYet')}</p><ButtonLink href="/onboarding" className="mt-6">{t('startOnboarding')}</ButtonLink></Container>;
  const econ = weekEconomics();
  const weeks = weeksToGoal(a);
  const kcalP = targets.protein * 4, kcalF = targets.fat * 9, kcalC = targets.carbs * 4;
  const total = kcalP + kcalF + kcalC;
  return (
    <div className="min-h-screen bg-paper pb-28">
      <Container className="flex h-16 items-center"><Logo /></Container>
      <Container className="max-w-[980px] py-6">
        <h1 className="font-display text-[34px] font-extrabold leading-tight md:text-[46px]">{t('resultTitle')}</h1>
        <p className="mt-2 text-[16px] text-muted">{t('resultSub')}</p>

        <div className="mt-8 grid gap-4 md:grid-cols-[1.1fr_1fr]">
          <Card className="flex items-center gap-6 p-6">
            <Ring frac={1} size={128} stroke={12}>
              <div className="text-center"><div className="font-display text-[28px] font-extrabold"><CountUp value={targets.kcal} /></div><div className="text-[12px] text-muted">kcal / {t('perDay')}</div></div>
            </Ring>
            <div className="flex-1 space-y-2.5">
              {([['proteinG', targets.protein, kcalP, '#31966A'], ['carbsG', targets.carbs, kcalC, '#F0B95B'], ['fatG', targets.fat, kcalF, '#174B35']] as const).map(([k, g, kc, c]) => (
                <div key={k}>
                  <div className="flex justify-between text-[13.5px]"><span>{t(k)}</span><b>{num(g)} g</b></div>
                  <div className="mt-1 h-2 rounded-full bg-line/60"><div className="h-2 rounded-full" style={{ width: `${(kc / total) * 100}%`, background: c }} /></div>
                </div>
              ))}
            </div>
          </Card>
          <div className="grid grid-cols-2 gap-3">
            <Stat label={t('objective')} value={<span className="text-[17px]">{t(`goal_${a.goal}` as MessageKey)}</span>} />
            <Stat label={t('timeline')} value={weeks ? `≈ ${weeks} ${t('weeks')}` : <span className="text-[16px]">{t('noTimeline')}</span>} />
            <Stat label={t('weeklyBudgetLabel')} value={eur(a.weeklyBudget)} sub={a.household > 1 ? t('personsN', { n: a.household }) : t('person1')} />
            <Stat label={t('estBasket')} value={econ.best ? eur(econ.best) : '—'} sub={econ.best > a.weeklyBudget ? <span className="text-danger">{t('overBudgetWarn', { n: eur(econ.best - a.weeklyBudget) }).split('.')[0]}</span> : '✓'} />
          </div>
        </div>

        <div className="mt-6"><OverBudgetHelp /></div>
        <h2 className="mt-12 font-display text-[24px] font-extrabold">{t('weekMenuTitle')}</h2>
        <WeekByDay />

        <h2 className="mt-12 font-display text-[24px] font-extrabold">{t('weeklySavingPreview')}</h2>
        <WeekStore />
        {econ.saving > 0 && <p className="mt-3 text-[14px]">{t('estimatedSavings')}: <b className="text-leaf">{eur(econ.saving)}</b> {t('perWeek')} <span className="text-muted">({t('referenceLabel')}: {eur(econ.reference)})</span></p>}
        <p className="mt-6 text-[12px] text-muted">{t('medicalDisclaimer')}</p>
      </Container>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 py-3 backdrop-blur pb-safe">
        <Container className="flex max-w-[980px] items-center justify-between gap-3">
          <span className="hidden text-[14px] text-muted sm:block">{t('subscriptionNeeded')}</span>
          <ButtonLink href={`/checkout${sp.get('plan') ? `?plan=${sp.get('plan')}` : ''}`} size="lg" className="flex-1 sm:flex-none">{t('getFullPlan')} →</ButtonLink>
        </Container>
      </div>
    </div>
  );
}
