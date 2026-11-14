'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { RECIPE_BY_ID } from '@/data/recipeIndex';
import { getDetail } from '@/data/recipeDetails';
import type { PlanMeal } from '@/domain/planner';
import { effectiveRecord } from '@/domain/pricing';
import { passesHardRules } from '@/domain/recipeFacts';
import { kitchenMeasure } from '@/domain/units';
import { useI18n } from '@/i18n/I18nProvider';
import type { MessageKey } from '@/i18n/messages';
import { fmtGrams, ingEmoji, ingName, shortDate } from '@/lib/view';
import { RETAILERS } from '@/retail/retailers';
import { todayIndex, useStore } from '@/state/store';
import { PageTitle } from '../appshell';
import { SavingsLine } from '../basket';
import { InstallApp } from '../install';
import { Badge, Button, ButtonLink, Card, DishImage, Ring, Stat, cx } from '../ui';
import { MealRow, useToast } from './meal';
import { NewWeekBanner } from './menu';

/** Which meal is "next" at this time of day. */
function slotNow(meals: PlanMeal[], doneIds: string[]): number {
  const h = new Date().getHours() + new Date().getMinutes() / 60;
  const want = h < 10.5 ? 'breakfast' : h < 15 ? 'lunch' : h < 17.5 ? 'snack' : 'dinner';
  const order = ['breakfast', 'lunch', 'snack', 'dinner'];
  const notDone = meals.map((m, i) => ({ m, i })).filter(({ m }) => !doneIds.includes(m.recipeId));
  const hit = notDone.find(({ m }) => order.indexOf(m.meal) >= order.indexOf(want));
  return (hit ?? notDone[0])?.i ?? -1;
}

/** Consecutive days (ending today or yesterday) on which at least 3 meals were marked cooked. */
export function useStreak(): number {
  const { done } = useStore();
  return useMemo(() => {
    const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const ok = (d: Date) => (done[key(d)]?.length ?? 0) >= 3;
    const day = new Date();
    if (!ok(day)) day.setDate(day.getDate() - 1);
    let n = 0;
    while (ok(day) && n < 366) { n++; day.setDate(day.getDate() - 1); }
    return n;
  }, [done]);
}

function NextMeal({ toast }: { toast: (s: string) => void }) {
  const { t, lang, num, eur } = useI18n();
  const { plan, done, toggleDone, dayDate, answers, allocation } = useStore();
  if (!plan) return null;
  const today = todayIndex();
  const date = dayDate(today);
  const doneIds = done[date] ?? [];
  const slot = slotNow(plan.days[today].meals, doneIds);
  if (slot < 0) {
    return <Card className="p-6 text-center"><div className="text-[34px]">🎉</div><p className="mt-2 text-[16px] font-bold">{t('allDoneToday')}</p><ButtonLink href={`/app/menu/${(today + 1) % 7}`} variant="secondary" className="mt-4">{t('tomorrowMenu')} →</ButtonLink></Card>;
  }
  const m = plan.days[today].meals[slot];
  const r = RECIPE_BY_ID[m.recipeId];
  const d = getDetail(m.recipeId);
  const mult = m.servings * answers.household;
  return (
    <Card className="overflow-hidden">
      <div className="grid md:grid-cols-[1.1fr_1fr]">
        <DishImage id={m.recipeId} alt={r[lang]} className="aspect-[16/10] md:aspect-auto md:min-h-[300px]" priority sizes="(max-width: 768px) 100vw, 560px" />
        <div className="p-5 md:p-6">
          <Badge tone="leaf">{t('nextMeal')} · {t(`meal_${m.meal}` as MessageKey)}</Badge>
          <h2 className="mt-2 font-display text-[24px] font-extrabold leading-tight">{r[lang]}</h2>
          <p className="mt-1 text-[13.5px] text-muted">⏱ {d ? d.prep + d.cook : r.minutes} {t('minutesShort')} · {num(m.kcal)} kcal · {num(m.protein)} g {t('protein')} · {eur(allocation?.meal[today]?.[slot] ?? 0)}</p>
          <div className="mt-4 text-[12.5px] font-bold uppercase tracking-wide text-muted">{t('takeOut')}</div>
          <ul className="mt-1.5 grid grid-cols-1 gap-1 text-[14px] sm:grid-cols-2">
            {r.items.map(([id, g]) => (
              <li key={id} className="flex items-center gap-2"><span aria-hidden>{ingEmoji(id)}</span><span className="min-w-0 flex-1 truncate">{ingName(id, lang)}</span><span className="shrink-0 text-muted tabular-nums">{kitchenMeasure(id, g * mult, lang) ?? fmtGrams(g * mult, lang)}</span></li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            <ButtonLink href={`/app/recipe/${m.recipeId}?cook=1`} size="lg" className="flex-1">▶ {t('cookNow')}</ButtonLink>
            <Button size="lg" variant="secondary" onClick={() => { toggleDone(date, m.recipeId); toast(t('markedCooked')); }}>✓ {t('markDone')}</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

/** This week's promotions at the user's store for ingredients they use — with dishes to cook. */
export function PromoAlerts({ toast }: { toast: (s: string, bad?: boolean) => void }) {
  const { t, lang, eur, date } = useI18n();
  const { catalog, homeStore, answers, placeRecipe } = useStore();
  const promos = useMemo(() => {
    const liked = new Set([...answers.likedProteins, ...(answers.favorites ?? []).flatMap((id) => RECIPE_BY_ID[id]?.items.map(([i]) => i) ?? [])]);
    return Object.entries(catalog)
      .map(([id, by]) => ({ id, r: by[homeStore] ? effectiveRecord(by[homeStore]!) : null }))
      .filter((x): x is { id: string; r: NonNullable<typeof x.r> } => !!x.r && x.r.promo && !!x.r.regular && !answers.never.includes(x.id))
      .map((x) => ({ ...x, pct: Math.round((1 - x.r.price / x.r.regular!) * 100), liked: liked.has(x.id) }))
      .sort((a, b) => Number(b.liked) - Number(a.liked) || b.pct - a.pct)
      .slice(0, 4);
  }, [catalog, homeStore, answers]);
  if (!promos.length) return null;
  const add = (id: string) => {
    const pick = Object.values(RECIPE_BY_ID).filter((r) => r.items.some(([i]) => i === id) && passesHardRules(r, answers) && (r.meal === 'lunch' || r.meal === 'dinner')).sort((a, b) => Number(!a.id.startsWith('g_')) - Number(!b.id.startsWith('g_')))[0]
      ?? Object.values(RECIPE_BY_ID).find((r) => r.items.some(([i]) => i === id) && passesHardRules(r, answers));
    if (!pick) { toast(t('replaceNone'), true); return; }
    const at = placeRecipe(pick.id);
    toast(at ? t('addedToMenu', { dish: pick[lang], day: t(`day${at.day}` as MessageKey) }) : t('replaceNone'), !at);
  };
  return (
    <Card className="p-5">
      <div className="flex items-baseline justify-between gap-2"><h2 className="text-[17px] font-extrabold">🏷 {t('promosForYou', { store: RETAILERS[homeStore].name })}</h2></div>
      <ul className="mt-3 divide-y divide-line">
        {promos.map(({ id, r, pct, liked }) => (
          <li key={id} className="flex flex-wrap items-center gap-3 py-2.5">
            <span className="text-[20px]" aria-hidden>{ingEmoji(id)}</span>
            <span className="min-w-0 flex-1">
              <b className="block text-[14.5px]">{ingName(id, lang)} {liked && <span className="text-danger">♥</span>} <span className="rounded bg-gold/40 px-1.5 text-[12px] text-[#6b4a0c]">−{pct}%</span></b>
              <span className="block truncate text-[12px] text-muted">{r.name} · {eur(r.price)} <s>{eur(r.regular!)}</s>{r.loyalty ? ` · ${t('loyaltyCard')}` : ''}{r.promoValidTo ? ` · ${t('promoUntil', { d: date(r.promoValidTo, { day: 'numeric', month: 'short' }) })}` : ''}</span>
            </span>
            <span className="flex w-full gap-1.5 pl-9 sm:w-auto sm:pl-0">
              <ButtonLink href={`/app/recipes?ing=${id}`} size="sm" variant="secondary">{t('recipesWith')}</ButtonLink>
              <Button size="sm" onClick={() => add(id)}>+ {t('toMenu')}</Button>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function HomePage() {
  const { t, eur, num, lang } = useI18n();
  const { plan, answers, done, targets, weekEconomics, purchases, session, dayDate } = useStore();
  const { show, node } = useToast();
  const streak = useStreak();
  if (!plan) return null;
  const today = todayIndex();
  const d = plan.days[today];
  const econ = weekEconomics();
  const doneToday = done[dayDate(today)] ?? [];
  const eaten = d.meals.filter((m) => doneToday.includes(m.recipeId)).reduce((s, m) => s + m.kcal, 0);
  const verified = purchases.reduce((s, p) => s + Math.max(0, p.reference - p.paid), 0);
  return (
    <>
      <PageTitle title={`${t('goodMorning')}${session?.email ? `, ${session.email.split('@')[0]}` : ''} 👋`} sub={`${t(`day${today}` as MessageKey)}, ${shortDate(dayDate(today), lang)}`} />
      <NewWeekBanner />
      <NextMeal toast={show} />
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="flex items-center gap-3 p-4 md:p-5">
          <Ring frac={eaten / Math.max(1, targets.kcal)} size={58} stroke={6}><span className="text-[11px] font-bold">{Math.round((eaten / Math.max(1, targets.kcal)) * 100)}%</span></Ring>
          <div><div className="text-[12.5px] font-semibold text-muted">{t('eatenToday')}</div><div className="font-display text-[19px] font-extrabold tabular-nums">{num(eaten)}<span className="text-[13px] font-semibold text-muted"> / {num(targets.kcal)}</span></div></div>
        </Card>
        <Stat label={t('streak')} value={<span>{streak > 0 ? '🔥' : '·'} {streak}</span>} sub={t('streakSub')} />
        <Stat label={t('bestBasket')} value={eur(econ.best)} sub={<SavingsLine compact />} />
        <Stat label={t('weekBudget')} value={eur(answers.weeklyBudget)} sub={answers.household > 1 ? t('personsN', { n: answers.household }) : t('person1')} />
      </div>
      <div className="mt-6"><PromoAlerts toast={show} /></div>
      <div className="mt-8 flex items-baseline justify-between"><h2 className="text-[20px] font-extrabold">{t('todayLabel')}</h2><Link href={`/app/menu/${today}`} className="text-[13.5px] font-semibold text-leaf">{t('openDay')} →</Link></div>
      <div className="mt-3 grid gap-2.5 md:grid-cols-2">{d.meals.map((m, slot) => <MealRow key={`${m.recipeId}-${slot}`} meal={m} day={today} slot={slot} toast={show} />)}</div>
      <div className="mt-8 grid gap-3 md:grid-cols-3">
        {[['/app/shopping', '🧺', 'shoppingTitle'], ['/app/recipes', '📖', 'navRecipes'], ['/app/assistant', '✦', 'tabAssistant']].map(([h, i, k]) => (
          <Link key={h} href={h}><Card className={cx('flex items-center gap-3 p-5 transition hover:ring-leaf')}><span className="text-[24px]">{i}</span><b>{t(k as MessageKey)}</b><span className="ml-auto text-leaf">→</span></Card></Link>
        ))}
      </div>
      <div className="mt-6"><InstallApp /></div>
      {verified > 0 && <p className="mt-6 text-[14px]">{t('verifiedSavings')}: <b className="text-leaf">{eur(verified)}</b></p>}
      {node}
    </>
  );
}
