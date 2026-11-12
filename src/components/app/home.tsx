'use client';

import Link from 'next/link';
import { useI18n } from '@/i18n/I18nProvider';
import type { MessageKey } from '@/i18n/messages';
import { planAvgKcal } from '@/lib/view';
import { todayIndex, useStore } from '@/state/store';
import { PageTitle } from '../appshell';
import { Card, Ring, Stat } from '../ui';
import { dateOfDay, MealRow, useToast } from './meal';

export function HomePage() {
  const { t, eur, num } = useI18n();
  const { plan, answers, done, targets, weekEconomics, purchases, session } = useStore();
  const { show, node } = useToast();
  if (!plan) return null;
  const today = todayIndex();
  const d = plan.days[today];
  const econ = weekEconomics();
  const cooked = Object.entries(done).filter(([date]) => plan.days.some((_, i) => dateOfDay(i) === date)).reduce((s, [, l]) => s + l.length, 0);
  const totalMeals = plan.days.reduce((s, x) => s + x.meals.length, 0);
  const verified = purchases.reduce((s, p) => s + Math.max(0, p.reference - p.paid), 0);
  return (
    <>
      <PageTitle title={`${t('goodMorning')}${session?.email ? `, ${session.email.split('@')[0]}` : ''} 👋`} sub={`${t(`day${today}` as MessageKey)} · ${num(targets.kcal)} kcal`} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={t('weekBudget')} value={eur(answers.weeklyBudget)} sub={answers.household > 1 ? t('personsN', { n: answers.household }) : t('person1')} />
        <Stat label={t('bestBasket')} value={eur(econ.best)} sub={econ.saving > 0 ? <span className="text-leaf">−{eur(econ.saving)} ({t('estimatedSavings').toLowerCase()})</span> : undefined} />
        <Stat label={t('avgKcal')} value={num(planAvgKcal(plan))} sub={`${t('targetLine')}: ${num(targets.kcal)}`} />
        <Card className="flex items-center gap-3 p-4 md:p-5">
          <Ring frac={cooked / Math.max(1, totalMeals)} size={56} stroke={6}><span className="text-[12px] font-bold">{cooked}</span></Ring>
          <div><div className="text-[12.5px] font-semibold text-muted">{t('mealsDone')}</div><div className="font-display text-[20px] font-extrabold">{cooked}/{totalMeals}</div></div>
        </Card>
      </div>
      <div className="mt-8 flex items-baseline justify-between"><h2 className="text-[20px] font-extrabold">{t('todayLabel')}</h2><Link href={`/app/menu/${today}`} className="text-[13.5px] font-semibold text-leaf">{t('openDay')} →</Link></div>
      <div className="mt-3 grid gap-2.5 md:grid-cols-2">{d.meals.map((m, slot) => <MealRow key={`${m.recipeId}-${slot}`} meal={m} day={today} slot={slot} toast={show} />)}</div>
      <div className="mt-8 grid gap-3 md:grid-cols-3">
        {[['/app/shopping', '🧺', 'shoppingTitle'], ['/app/basket', '🛒', 'tabBasket2'], ['/app/assistant', '✦', 'tabAssistant']].map(([h, i, k]) => (
          <Link key={h} href={h}><Card className="flex items-center gap-3 p-5 transition hover:ring-leaf"><span className="text-[24px]">{i}</span><b>{t(k as MessageKey)}</b><span className="ml-auto text-leaf">→</span></Card></Link>
        ))}
      </div>
      {verified > 0 && <p className="mt-6 text-[14px]">{t('verifiedSavings')}: <b className="text-leaf">{eur(verified)}</b></p>}
      {node}
    </>
  );
}
