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
import { RECIPES } from '@/data/recipes';
import { DEFAULT_PLANS, planMonthlyEquivalent } from '@/config/plans';
import { RETAILERS } from '@/retail/retailers';

const RECIPE_COUNT = RECIPES.length;
import { EXCLUSIONS, exclusionOn, ingEmoji, ingName, recipeById, recipeName, shortDate, toggleExclusion } from '@/lib/view';
import { useStore } from '@/state/store';
import { Logo } from './site';
import { Button, ButtonLink, Card, Chip, Container, CountUp, DishImage, Field, Option, Ring, Stat, inputCls, cx } from './ui';
import { DayList, OverBudgetHelp, SavingsLine, StorePicker, StoreSummary, StoreTotals, useHomeBasket, useWeekNeed } from './basket';


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

const round5 = (n: number) => Math.round(n / 5) * 5;
/** Budget options scale with the household; the middle one is preselected. */
export function budgetOptions(household: number): number[] {
  return [round5(26 * household + 4), round5(36 * household + 4), round5(52 * household + 4)];
}

/** − value + control: one tap instead of typing on a phone. */
function Stepper({ id, label, value, min, max, step = 1, suffix, onChange }: { id: string; label: string; value: number; min: number; max: number; step?: number; suffix: string; onChange: (n: number) => void }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <button type="button" aria-label={`${label} −`} onClick={() => onChange(Math.max(min, Math.round((value - step) * 10) / 10))} className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-card text-[20px] ring-1 ring-line active:scale-95">−</button>
        <div className="flex-1"><NumberInput id={id} value={value} min={min} max={max} suffix={suffix} onChange={onChange} /></div>
        <button type="button" aria-label={`${label} +`} onClick={() => onChange(Math.min(max, Math.round((value + step) * 10) / 10))} className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-card text-[20px] ring-1 ring-line active:scale-95">+</button>
      </div>
    </Field>
  );
}

const STEPS = 4;

/**
 * Fast questionnaire: 4 screens with sensible defaults (≈ 1 minute).
 * 1 goal (tap = next) · 2 body & activity · 3 household, budget, store · 4 restrictions & consents.
 * Email and password are asked later, when the user saves the plan (account).
 */
export function Onboarding() {
  const { t, pick, eur } = useI18n();
  const { answers: a, setAnswers, completeOnboarding } = useStore();
  const router = useRouter();
  const sp = useSearchParams();
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [customBudget, setCustomBudget] = useState(false);
  const [more, setMore] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (p: Partial<QuizAnswers>) => { setErr(null); setAnswers(p); };
  const needsTarget = a.goal === 'lose' || a.goal === 'gain';
  const budgets = budgetOptions(a.household);

  const go = (n: number) => { setErr(null); setDir(n > step ? 1 : -1); setStep(n); window.scrollTo({ top: 0 }); };
  const valid = (): string | null => {
    if (step === 2) {
      if (a.age < 18 || a.age > 100) return t('under18');
      if (a.heightCm < 120 || a.heightCm > 230 || a.weightKg < 35 || a.weightKg > 250) return t('checkNumbers');
      if (needsTarget && (a.goal === 'lose' ? a.targetWeightKg >= a.weightKg : a.targetWeightKg <= a.weightKg)) return t('checkTarget');
    }
    if (step === 4 && (!a.consentHealth || !a.consentTerms)) return t('requiredConsent');
    return null;
  };
  const next = () => {
    const e = valid();
    if (e) { setErr(e); return; }
    if (step === STEPS) {
      completeOnboarding();
      const plan = sp.get('plan');
      router.push(`/onboarding/result${plan ? `?plan=${plan}` : ''}`);
      return;
    }
    go(step + 1);
  };
  const pickGoal = (g: Goal) => {
    const target = g === 'lose' ? Math.round(a.weightKg * 0.92) : g === 'gain' ? Math.round(a.weightKg * 1.06) : a.weightKg;
    set({ goal: g, targetWeightKg: target });
    setDir(1); setStep(2); window.scrollTo({ top: 0 });
  };
  const setHousehold = (n: number) => {
    const opts = budgetOptions(n);
    set({ household: n, ...(customBudget ? {} : { weeklyBudget: opts[1] }) });
  };

  const title = [t('q1'), t('oAbout'), t('oFamily'), t('q8')][step - 1];
  const body = () => {
    switch (step) {
      case 1: return (
        <div className="space-y-2.5">
          {(['lose', 'keep', 'gain', 'healthy'] as Goal[]).map((g) => <Option key={g} on={a.goal === g} onClick={() => pickGoal(g)}><span className="text-[22px]">{({ lose: '⚖️', keep: '🧘', gain: '💪', healthy: '🥗' })[g]}</span>{t(`goal_${g}` as MessageKey)}<span className="ml-auto text-muted">›</span></Option>)}
        </div>
      );
      case 2: return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5">{(['f', 'm'] as const).map((x) => <Option key={x} on={a.sex === x} onClick={() => set({ sex: x })} className="justify-center">{t(`sex_${x}` as MessageKey)}</Option>)}</div>
          <Stepper id="age" label={`${t('age')}, ${t('years')}`} value={a.age} min={14} max={100} suffix="" onChange={(n) => set({ age: Math.round(n) })} />
          <Stepper id="h" label={t('height')} value={a.heightCm} min={120} max={230} suffix={t('cm')} onChange={(n) => set({ heightCm: Math.round(n) })} />
          <Stepper id="w" label={t('weight')} value={a.weightKg} min={35} max={250} step={0.5} suffix={t('kg')} onChange={(n) => set({ weightKg: n })} />
          {needsTarget && <Stepper id="tw" label={t('targetWeight')} value={a.targetWeightKg} min={35} max={250} step={0.5} suffix={t('kg')} onChange={(n) => set({ targetWeightKg: n })} />}
          {needsTarget && (() => { const w = weeksToGoal(a); return w ? <p className="text-[13.5px] text-muted">{t('timeline')}: <b className="text-ink">≈ {w} {t('weeks')}</b></p> : null; })()}
          <div>
            <div className="mb-2 text-[13.5px] font-semibold">{t('q5')}</div>
            <div className="grid grid-cols-2 gap-2">{(['sedentary', 'light', 'moderate', 'high'] as Activity[]).map((x) => <Option key={x} on={a.activity === x} onClick={() => set({ activity: x })} className="px-3 py-2.5 text-[13px]">{t(`act_${x}` as MessageKey)}</Option>)}</div>
          </div>
        </div>
      );
      case 3: return (
        <div className="space-y-5">
          <div>
            <div className="mb-2 text-[13.5px] font-semibold">{t('q6')}</div>
            <div className="grid grid-cols-6 gap-2">{[1, 2, 3, 4, 5, 6].map((n) => <Option key={n} on={a.household === n} onClick={() => setHousehold(n)} className="justify-center px-0 text-[17px]">{n}</Option>)}</div>
          </div>
          <div>
            <div className="mb-2 text-[13.5px] font-semibold">{t('q7')}</div>
            <div className="grid grid-cols-3 gap-2">
              {budgets.map((v, i) => (
                <Option key={v} on={!customBudget && a.weeklyBudget === v} onClick={() => { setCustomBudget(false); set({ weeklyBudget: v }); }} className="flex-col items-start gap-0 px-3 py-2.5">
                  <span className="text-[17px]">{eur(v)}</span><span className="text-[11.5px] font-normal text-muted">{[t('budgetLow'), t('budgetMid'), t('budgetHigh')][i]}</span>
                </Option>
              ))}
            </div>
            <button type="button" className="mt-2 text-[13px] font-semibold text-leaf" onClick={() => setCustomBudget((c) => !c)}>{customBudget ? '✕' : '+'} {t('budgetCustom')}</button>
            {customBudget && <div className="mt-2"><NumberInput id="budget" value={a.weeklyBudget} min={15} max={500} suffix="€" onChange={(n) => set({ weeklyBudget: Math.round(n) })} /></div>}
            <p className="mt-1 text-[12.5px] text-muted">≈ {eur(a.weeklyBudget / a.household / 7)} {t('perPersonDayShort')}</p>
          </div>
          <div>
            <div className="mb-2 text-[13.5px] font-semibold">{t('storesLabel')}</div>
            <StorePicker compact />
          </div>
        </div>
      );
      case 4: return (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">{EXCLUSIONS.map((e) => <Chip key={e} on={exclusionOn(a, e)} onClick={() => set(toggleExclusion(a, e))}>{t(`ex_${e}` as MessageKey)}</Chip>)}</div>
          <div className="flex flex-wrap gap-2">{(['any', 'vegetarian', 'vegan', 'pescatarian', 'low_carb'] as DietType[]).map((d) => <Chip key={d} on={a.dietType === d} onClick={() => set({ dietType: d })}>{t(`diet_${d}` as MessageKey)}</Chip>)}</div>
          <button type="button" onClick={() => setMore((m) => !m)} aria-expanded={more} className="flex w-full items-center justify-between rounded-2xl bg-card px-4 py-3 text-left text-[14px] font-semibold ring-1 ring-line">
            <span>⚙ {t('moreOptions')}</span><span className="text-[12.5px] font-normal text-muted">{t('moreOptionsSub')}</span>
          </button>
          {more && (
            <div className="space-y-5 rounded-2xl bg-card p-4 ring-1 ring-line">
              <div>
                <div className="mb-2 text-[13.5px] font-semibold">{t('otherAllergies')}</div>
                <div className="flex flex-wrap gap-2">
                  {ALLERGENS.filter((x) => x !== 'milk' && x !== 'gluten').map((al) => (
                    <Chip key={al} on={a.allergens.includes(al)} onClick={() => set({ allergens: a.allergens.includes(al) ? a.allergens.filter((x) => x !== al) : [...a.allergens, al as Allergen] })}>{ALLERGEN_LABEL[al]?.emoji} {pick(ALLERGEN_LABEL[al])}</Chip>
                  ))}
                </div>
              </div>
              <div><div className="text-[13.5px] font-semibold">{t('dislikeTitle')}</div><DislikeChips /></div>
              <div>
                <div className="mb-2 text-[13.5px] font-semibold">{t('timePerDish')}</div>
                <div className="flex gap-2">{([15, 30, 60] as const).map((m) => <Chip key={m} on={a.cookingTimeMax === m} onClick={() => set({ cookingTimeMax: m })}>{t('upTo')} {m} {t('minutesShort')}</Chip>)}</div>
              </div>
              <Field label={t('otherRestrictions')}><input value={a.otherRestrictions ?? ''} maxLength={200} onChange={(e) => set({ otherRestrictions: e.target.value })} className={inputCls} /></Field>
              <label className="flex items-start gap-3 text-[13.5px]"><input type="checkbox" className="mt-0.5 h-5 w-5 accent-[#31966A]" checked={a.health.length > 0} onChange={(e) => set({ health: e.target.checked ? ['other'] : [] })} /><span>{t('healthLabel')}</span></label>
              {a.health.length > 0 && <p className="rounded-2xl bg-gold/20 p-3 text-[13.5px]">{t('healthStop2')}</p>}
            </div>
          )}
          <div className="space-y-3 rounded-2xl bg-card p-4 ring-1 ring-line">
            <label className="flex items-start gap-3 text-[13.5px]"><input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[#31966A]" checked={a.consentHealth && a.consentTerms} onChange={(e) => set({ consentHealth: e.target.checked, consentTerms: e.target.checked })} /><span>{t('consentBoth')} <Link href="/terms" className="text-leaf underline">{t('terms')}</Link> · <Link href="/privacy" className="text-leaf underline">{t('privacy')}</Link> <b className="text-danger">*</b></span></label>
            <label className="flex items-start gap-3 text-[13.5px]"><input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[#31966A]" checked={!!a.marketingConsent} onChange={(e) => set({ marketingConsent: e.target.checked })} /><span>{t('consentMarketing')}</span></label>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <Container className="flex h-16 items-center justify-between"><Logo /><span className="text-[13px] font-semibold text-muted">{t('stepOf', { n: step, of: STEPS })} · {t('aboutMinute')}</span></Container>
      <div className="h-1.5 bg-line/60"><motion.div className="h-full bg-leaf" animate={{ width: `${(step / STEPS) * 100}%` }} /></div>
      <Container className="max-w-[560px] py-6 md:py-12">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={step} initial={{ opacity: 0, x: 24 * dir }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 * dir }} transition={{ duration: 0.2 }}>
            <h1 className="mb-5 font-display text-[26px] font-extrabold leading-tight md:text-[32px]">{title}</h1>
            {body()}
          </motion.div>
        </AnimatePresence>
        {err && <p role="alert" className="mt-4 text-[14px] font-semibold text-danger">{err}</p>}
        {step > 1 && (
          <div className="sticky bottom-0 -mx-5 mt-6 flex gap-3 bg-paper/95 px-5 py-4 backdrop-blur pb-safe md:static md:mx-0 md:bg-transparent md:px-0">
            <Button variant="secondary" size="lg" onClick={() => go(step - 1)} aria-label={t('back2')}>←</Button>
            <Button size="lg" className="flex-1" onClick={next}>{step === STEPS ? t('seeMyResult') : t('next2')}</Button>
          </div>
        )}
        <p className="mt-4 text-center text-[12px] text-muted">{t('medicalDisclaimer')}</p>
      </Container>
    </div>
  );
}

/** Meal cards of one day; every dish opens its recipe. */
export function DayMeals({ day, hrefFor = (id) => `/recipe/${id}?back=/onboarding/result` }: { day: number; hrefFor?: (id: string) => string }) {
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
  const { t, lang } = useI18n();
  const { plan, dayDate } = useStore();
  const [day, setDay] = useState(0);
  if (!plan) return null;
  return (
    <div className="mt-4">
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1" role="tablist">
        {plan.days.map((_, i) => (
          <button key={i} role="tab" aria-selected={day === i} type="button" onClick={() => setDay(i)}
            className={cx('shrink-0 rounded-2xl px-4 py-2.5 text-[14px] font-bold transition', day === i ? 'bg-forest text-white' : 'bg-card ring-1 ring-line hover:ring-leaf')}>
            <span className="sm:hidden">{t(`dayS${i}` as MessageKey)}</span><span className="hidden sm:inline">{t(`day${i}` as MessageKey)}</span>
            <span className={cx('ml-1 text-[11.5px] font-semibold', day === i ? 'text-white/75' : 'text-muted')}>{shortDate(dayDate(i), lang)}</span>
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

/** 2.5-second "building your plan" moment, then the headline numbers. Shown once per plan. */
function Reveal() {
  const { t, eur, num } = useI18n();
  const { planCreatedAt, weekEconomics, homeStore, targets, plan } = useStore();
  const key = `lekste:revealed:${planCreatedAt}`;
  const [step, setStep] = useState<number>(() => { try { return sessionStorage.getItem(key) ? 4 : 0; } catch { return 4; } });
  useEffect(() => {
    if (step >= 4) return;
    const id = setTimeout(() => setStep((x) => x + 1), 650);
    if (step === 3) { try { sessionStorage.setItem(key, '1'); } catch { /* ignore */ } }
    return () => clearTimeout(id);
  }, [step, key]);
  const e = weekEconomics();
  const dishes = plan ? new Set(plan.days.flatMap((d) => d.meals.map((m) => m.recipeId))).size : 0;
  const lines = [t('reveal1', { kcal: num(targets.kcal) }), t('reveal2', { n: num(RECIPE_COUNT) }), t('reveal3'), t('reveal4', { store: RETAILERS[homeStore].name })];
  return (
    <>
      <AnimatePresence>
        {step < 4 && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-forest px-6 text-white" initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.35 } }}>
            <div className="w-full max-w-sm">
              <div className="mb-6 font-display text-[26px] font-extrabold">{t('revealTitle')}</div>
              <ul className="space-y-3">
                {lines.map((l, i) => (
                  <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: i <= step ? 1 : 0.25, x: 0 }} className="flex items-center gap-3 text-[16px]">
                    <span className={cx('grid h-6 w-6 place-items-center rounded-full text-[13px]', i < step ? 'bg-leaf' : 'bg-white/15')}>{i < step ? '✓' : i === step ? '…' : ''}</span>{l}
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6 overflow-hidden rounded-xl3 bg-forest p-6 text-white md:p-8">
        <div className="text-[13px] font-bold uppercase tracking-wider text-white/60">{t('revealHeadline')}</div>
        <div className="mt-2 flex flex-wrap items-end gap-x-6 gap-y-2">
          <span className="font-display text-[44px] font-extrabold leading-none md:text-[56px]"><CountUp value={e.best} format={(n) => eur(n)} /></span>
          <span className="pb-1 text-[16px] text-white/80">{t('perWeek')} · {RETAILERS[homeStore].name} · {dishes} {t('dishesWord')}</span>
        </div>
        {e.saving > 0.5 && e.refStore && <div className="mt-3 inline-block rounded-full bg-gold px-3 py-1 text-[14px] font-bold text-ink">{t('savedVs', { n: eur(e.saving), store: RETAILERS[e.refStore].name })}</div>}
      </motion.div>
    </>
  );
}

export function Result() {
  const { t, eur, num } = useI18n();
  const { ready, plan, targets, answers: a, weekEconomics, onboarded, session } = useStore();
  const sp = useSearchParams();
  const checkoutHref = `/checkout${sp.get('plan') ? `?plan=${sp.get('plan')}` : ''}`;
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
        <Reveal />

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
        <div className="mt-12 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-[24px] font-extrabold">{t('weekMenuTitle')}</h2>
          <ButtonLink href="/onboarding/taste?next=/onboarding/result" variant="secondary" size="sm">👅 {t('tasteCtaResult')}</ButtonLink>
        </div>
        <WeekByDay />

        <h2 className="mt-12 font-display text-[24px] font-extrabold">{t('weeklySavingPreview')}</h2>
        <WeekStore />
        <p className="mt-3 text-[14px]"><SavingsLine /></p>
        <p className="mt-6 text-[12px] text-muted">{t('medicalDisclaimer')}</p>
      </Container>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 py-3 backdrop-blur pb-safe">
        <Container className="flex max-w-[980px] items-center justify-between gap-3">
          <span className="hidden text-[14px] text-muted sm:block">{t('resultBarNote', { price: eur(Math.min(...DEFAULT_PLANS.filter((x) => !x.oneTime).map(planMonthlyEquivalent))) })}</span>
          <ButtonLink href={session ? checkoutHref : `/register?next=${encodeURIComponent(checkoutHref)}`} size="lg" className="flex-1 sm:flex-none" data-track="cta_month" data-track-place="result">{t('getFullPlan')} →</ButtonLink>
        </Container>
      </div>
    </div>
  );
}
