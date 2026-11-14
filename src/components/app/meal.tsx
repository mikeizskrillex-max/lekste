'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { PlanMeal } from '@/domain/planner';
import type { ReplaceMode } from '@/domain/planner';
import { useI18n } from '@/i18n/I18nProvider';
import type { MessageKey } from '@/i18n/messages';
import { recipeName } from '@/lib/view';
import { useStore } from '@/state/store';
import { DishImage, cx } from '../ui';


export function useToast() {
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  const show = (text: string, bad = false) => { setMsg({ text, bad }); clearTimeout(timer.current); timer.current = setTimeout(() => setMsg(null), 3200); };
  const node = msg ? <div role="status" className={cx('fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-2xl px-4 py-3 text-[14px] font-semibold text-white shadow-lift lg:bottom-8', msg.bad ? 'bg-danger' : 'bg-forest')}>{msg.text}</div> : null;
  return { show, node };
}

const MODES: { mode: ReplaceMode; key: MessageKey }[] = [
  { mode: 'any', key: 'replace' }, { mode: 'cheaper', key: 'replaceCheaper' }, { mode: 'protein', key: 'replaceProtein' }, { mode: 'vegetarian', key: 'replaceVeg' },
];

export function MealRow({ meal, day, slot, toast }: { meal: PlanMeal; day: number; slot: number; toast: (s: string, bad?: boolean) => void }) {
  const { t, lang, eur, num } = useI18n();
  const { replace, done, toggleDone, rate, feedback, allocation, dayDate } = useStore();
  const [menu, setMenu] = useState(false);
  const date = dayDate(day);
  const isDone = (done[date] ?? []).includes(meal.recipeId);
  const r = feedback.find((f) => f.recipeId === meal.recipeId)?.rating;
  return (
    <div className={cx('relative flex gap-3 rounded-2xl bg-card p-2.5 ring-1 ring-line/70', isDone && 'opacity-70')}>
      <Link href={`/app/recipe/${meal.recipeId}`} className="shrink-0"><DishImage id={meal.recipeId} alt={recipeName(meal.recipeId, lang)} className="h-[84px] w-[84px] rounded-xl" sizes="84px" /></Link>
      <div className="min-w-0 flex-1 py-0.5">
        <div className="text-[11px] font-bold uppercase tracking-wide text-leaf">{t(`meal_${meal.meal}` as MessageKey)}</div>
        <Link href={`/app/recipe/${meal.recipeId}`} className="line-clamp-2 text-[15px] font-bold leading-snug hover:text-leaf">{recipeName(meal.recipeId, lang)}</Link>
        <div className="mt-1 text-[12.5px] text-muted">{num(meal.kcal)} kcal · {num(meal.protein)} g · {eur(allocation?.meal[day]?.[slot] ?? 0)}</div>
        <div className="mt-2 flex items-center gap-1">
          <button type="button" onClick={() => toggleDone(date, meal.recipeId)} aria-pressed={isDone} aria-label={t('markDone')} className={cx('inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-[12px] font-semibold ring-1', isDone ? 'bg-leaf text-white ring-leaf' : 'ring-line hover:ring-leaf')}>✓<span className="hidden min-[400px]:inline"> {t('markDone')}</span></button>
          <button type="button" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-label={t('replace')} className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-[12px] font-semibold ring-1 ring-line hover:ring-leaf">⇄<span className="hidden min-[400px]:inline"> {t('replace')}</span></button>
          <span className="ml-auto flex gap-1">
            <button type="button" aria-label={t('rateUp')} aria-pressed={r === 'up'} onClick={() => rate(meal.recipeId, 'up')} className={cx('grid h-8 w-8 place-items-center rounded-full text-[13px] ring-1', r === 'up' ? 'bg-sage ring-leaf' : 'ring-line')}>👍</button>
            <button type="button" aria-label={t('rateDown')} aria-pressed={r === 'down'} onClick={() => { rate(meal.recipeId, 'down'); if (replace(day, slot, 'any')) toast(t('replaced')); }} className={cx('grid h-8 w-8 place-items-center rounded-full text-[13px] ring-1', r === 'down' ? 'bg-danger/10 ring-danger' : 'ring-line')}>👎</button>
          </span>
        </div>
      </div>
      {menu && (
        <div className="absolute right-2 top-full z-20 mt-1 w-52 overflow-hidden rounded-2xl bg-card shadow-lift ring-1 ring-line">
          {MODES.map((m) => (
            <button key={m.mode} type="button" className="block w-full px-4 py-2.5 text-left text-[14px] font-semibold hover:bg-sage"
              onClick={() => { setMenu(false); const ok = replace(day, slot, m.mode); toast(ok ? t('replaced') : t('replaceNone'), !ok); }}>{t(m.key)}</button>
          ))}
        </div>
      )}
    </div>
  );
}
