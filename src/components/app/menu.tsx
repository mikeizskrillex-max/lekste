'use client';

import Link from 'next/link';
import { useState } from 'react';
import { calcTargets } from '@/domain/nutrition';
import type { DietType, QuizAnswers, Targets } from '@/domain/types';
import { useI18n } from '@/i18n/I18nProvider';
import type { MessageKey } from '@/i18n/messages';
import { EXCLUSIONS, exclusionOn, planAvgKcal, recipeName, shortDate, toggleExclusion } from '@/lib/view';
import { RETAILERS } from '@/retail/retailers';
import { addDaysIso2, todayIndex, useStore } from '@/state/store';
import { PageTitle } from '../appshell';
import { DayList, OverBudgetHelp, StorePicker } from '../basket';
import { DislikeChips } from '../onboarding';
import { Badge, Button, ButtonLink, Card, Chip, Slider, cx } from '../ui';
import { MealRow, useToast } from './meal';

function Personalize() {
  const { t } = useI18n();
  const { answers: a, targets, setAnswers } = useStore();
  const [open, setOpen] = useState(false);
  const base = calcTargets(a);
  const setT = (k: keyof Targets, v: number) => setAnswers({ overrides: { ...(a.overrides ?? {}), [k]: v } }, true);
  const set = (p: Partial<QuizAnswers>, rebuild = true) => setAnswers(p, rebuild);
  return (
    <Card className="p-5">
      <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span><span className="block text-[17px] font-extrabold">{t('personalize')}</span><span className="text-[13px] text-muted">{t('personalizeSub')}</span></span>
        <span className="text-[20px] text-leaf">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Slider id="kcal" label={t('calories')} value={targets.kcal} min={1200} max={4000} step={50} onChange={(v) => setT('kcal', v)} />
          <Slider id="protein" label={t('proteinG')} value={targets.protein} min={40} max={250} step={5} onChange={(v) => setT('protein', v)} />
          <Slider id="carbs" label={t('carbsG')} value={targets.carbs} min={30} max={500} step={5} onChange={(v) => setT('carbs', v)} />
          <Slider id="fat" label={t('fatG')} value={targets.fat} min={20} max={200} step={5} onChange={(v) => setT('fat', v)} />
          <Slider id="budget" label={t('weeklyBudgetLabel')} value={a.weeklyBudget} min={20} max={250} step={5} suffix=" €" onChange={(v) => set({ weeklyBudget: v })} />
          <Slider id="hh" label={t('household')} value={a.household} min={1} max={8} onChange={(v) => set({ household: v }, false)} />
          <div>
            <div className="mb-2 text-[13.5px] font-semibold">{t('mealsPerDay')}</div>
            <div className="flex gap-2">{([3, 4, 5] as const).map((n) => <Chip key={n} on={a.mealsPerDay === n} onClick={() => set({ mealsPerDay: n })}>{n}</Chip>)}</div>
          </div>
          <div>
            <div className="mb-2 text-[13.5px] font-semibold">{t('maxCooking')}</div>
            <div className="flex gap-2">{([15, 30, 60] as const).map((n) => <Chip key={n} on={a.cookingTimeMax === n} onClick={() => set({ cookingTimeMax: n })}>{n} {t('minutesShort')}</Chip>)}</div>
          </div>
          <div>
            <div className="mb-2 text-[13.5px] font-semibold">{t('dietType')}</div>
            <div className="flex flex-wrap gap-2">{(['any', 'vegetarian', 'vegan', 'pescatarian', 'low_carb'] as DietType[]).map((d) => <Chip key={d} on={a.dietType === d} onClick={() => set({ dietType: d })}>{t(`diet_${d}` as MessageKey)}</Chip>)}</div>
          </div>
          <div>
            <div className="mb-2 text-[13.5px] font-semibold">{t('q8')}</div>
            <div className="flex flex-wrap gap-2">{EXCLUSIONS.map((e) => <Chip key={e} on={exclusionOn(a, e)} onClick={() => set(toggleExclusion(a, e))}>{t(`ex_${e}` as MessageKey)}</Chip>)}</div>
          </div>
          <div className="md:col-span-2">
            <div className="text-[13.5px] font-semibold">{t('dislikeTitle')}</div>
            <DislikeChips />
          </div>
          <div className="md:col-span-2">
            <div className="mb-2 text-[13.5px] font-semibold">{t('yourStore')}</div>
            <StorePicker compact />
          </div>
          <div className="flex flex-wrap items-center gap-3 md:col-span-2">
            {targets.overridden && <Button variant="secondary" size="sm" onClick={() => setAnswers({ overrides: {} }, true)}>{t('resetTargets')} ({base.kcal} kcal)</Button>}
          </div>
        </div>
      )}
    </Card>
  );
}

export function MenuPage() {
  const { t, eur, num, lang } = useI18n();
  const { plan, regenerate, weekEconomics, answers, targets, homeStore, allocation, newWeek, weekStart, dayDate } = useStore();
  const { show, node } = useToast();
  if (!plan) return null;
  const econ = weekEconomics();
  const today = todayIndex();
  return (
    <>
      <PageTitle title={t('tabMenu2')} sub={<>{num(targets.kcal)} kcal · {num(targets.protein)} g {t('protein')} · {t('avgKcal')}: {num(planAvgKcal(plan))}</>}
        right={<div className="flex flex-wrap items-center gap-2"><Badge tone={econ.best > answers.weeklyBudget ? 'danger' : 'leaf'}>{RETAILERS[homeStore].name}: {eur(econ.best)} / {eur(answers.weeklyBudget)}</Badge>
          <ButtonLink href="/onboarding/taste?next=/app/menu" size="sm" variant="secondary">👅 {t('tasteCta')}</ButtonLink>
          <Button size="sm" variant="dark" onClick={() => { if (window.confirm(t('newWeekConfirm'))) { newWeek(); show(t('newWeekDone')); window.scrollTo({ top: 0 }); } }}>🗓 {t('newWeek')}</Button></div>} />
      {weekStart && <p className="-mt-3 mb-4 text-[13px] text-muted">🗓 {shortDate(dayDate(0), lang)} – {shortDate(dayDate(6), lang)}</p>}
      <NewWeekBanner />
      <Personalize />
      <div className="mt-4"><OverBudgetHelp /></div>
      {plan.issues.length > 0 && <p className="mt-4 rounded-2xl bg-gold/20 p-3 text-[13.5px]">{t('infeasibleRecipes')}</p>}
      <div className="mt-6 space-y-8">
        {plan.days.map((d, day) => (
          <section key={day} aria-labelledby={`day-${day}`}>
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h2 id={`day-${day}`} className="text-[19px] font-extrabold">{t(`day${day}` as MessageKey)} <span className="text-[14px] font-semibold text-muted">{shortDate(dayDate(day), lang)}</span> {day === today && <Badge tone="leaf" className="ml-1 align-middle">{t('todayLabel')}</Badge>}</h2>
              <Link href={`/app/menu/${day}`} className="text-[13px] font-semibold text-leaf hover:underline">{num(d.kcal)} kcal · {eur(allocation?.day[day] ?? 0)} →</Link>
            </div>
            <div className="grid gap-2.5 md:grid-cols-2">{d.meals.map((m, slot) => <MealRow key={`${m.recipeId}-${slot}`} meal={m} day={day} slot={slot} toast={show} />)}</div>
            <button type="button" onClick={() => { regenerate(day); show(t('regenerated')); }} className={cx('mt-3 w-full rounded-2xl border-2 border-dashed border-leaf/40 py-3 text-[14px] font-bold text-forest transition hover:bg-sage')}>↻ {t('regenDay2')}</button>
          </section>
        ))}
      </div>
      <PastWeeks />
      {node}
    </>
  );
}

/** Shown when the calendar week has moved on since the menu was made. */
export function NewWeekBanner() {
  const { t } = useI18n();
  const { weekIsOld, newWeek } = useStore();
  if (!weekIsOld) return null;
  return (
    <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 border-l-4 border-leaf p-4">
      <span className="text-[14.5px] font-semibold">🗓 {t('newWeekBanner')}</span>
      <Button size="sm" onClick={newWeek}>{t('newWeek')} →</Button>
    </Card>
  );
}

function PastWeeks() {
  const { t, eur, lang } = useI18n();
  const { history, restoreWeek } = useStore();
  if (!history?.length) return null;
  return (
    <details className="mt-10 rounded-xl2 bg-card p-5 ring-1 ring-line/70">
      <summary className="cursor-pointer text-[16px] font-extrabold">{t('pastWeeks')} ({history.length})</summary>
      <ul className="mt-3 divide-y divide-line">
        {history.map((h) => (
          <li key={h.weekStart + h.basket} className="flex flex-wrap items-center gap-3 py-3 text-[14px]">
            <b className="min-w-[150px]">{shortDate(h.weekStart, lang)} – {shortDate(addDaysIso2(h.weekStart, 6), lang)}</b>
            <span className="text-muted">{t('dishesN', { n: h.plan.days.reduce((s, d) => s + d.meals.length, 0) })}{h.basket ? ` · ${eur(h.basket)}` : ''}</span>
            <span className="min-w-0 flex-1 truncate text-[12.5px] text-muted">{h.plan.days[0].meals.map((m) => recipeName(m.recipeId, lang)).join(' · ')}</span>
            <Button size="sm" variant="secondary" onClick={() => restoreWeek(h.weekStart)}>{t('restore')}</Button>
          </li>
        ))}
      </ul>
    </details>
  );
}

export function DayPage({ day }: { day: number }) {
  const { t, eur, num, lang } = useI18n();
  const { plan, regenerate, targets, allocation, dayDate } = useStore();
  const { show, node } = useToast();
  if (!plan || !plan.days[day]) return <p>{t('notFound')}</p>;
  const d = plan.days[day];
  return (
    <>
      <Link href="/app/menu" className="text-[14px] font-semibold text-leaf">{t('back2')}</Link>
      <PageTitle title={`${t(`day${day}` as MessageKey)}, ${shortDate(dayDate(day), lang)}`} sub={`${num(d.kcal)} / ${num(targets.kcal)} kcal · ${num(d.protein)} g ${t('protein')} · ${eur(allocation?.day[day] ?? 0)}`} />
      <div className="no-scrollbar -mt-2 mb-5 flex gap-2 overflow-x-auto">{plan.days.map((_, i) => <Link key={i} href={`/app/menu/${i}`} className={cx('shrink-0 rounded-full px-3.5 py-2 text-[13.5px] font-bold ring-1', i === day ? 'bg-forest text-white ring-forest' : 'bg-card ring-line')}>{t(`dayS${i}` as MessageKey)}</Link>)}</div>
      <div className="space-y-2.5">{d.meals.map((m, slot) => <MealRow key={`${m.recipeId}-${slot}`} meal={m} day={day} slot={slot} toast={show} />)}</div>
      <Button variant="dark" size="lg" className="mt-5 w-full" onClick={() => { regenerate(day); show(t('regenerated')); }}>↻ {t('regenDay2')}</Button>
      <div className="mt-8"><DayList day={day} checkable /></div>
      {node}
    </>
  );
}
