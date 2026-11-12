'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getDetail } from '@/data/recipeDetails';
import { cheapest } from '@/domain/pricing';
import { recipeFacts } from '@/domain/recipeFacts';
import { kitchenMeasure } from '@/domain/units';
import { ALLERGEN_LABEL, type MessageKey } from '@/i18n/messages';
import { useI18n } from '@/i18n/I18nProvider';
import { fmtGrams, ingEmoji, ingName, recipeById } from '@/lib/view';
import { RETAILERS } from '@/retail/retailers';
import { useStore } from '@/state/store';
import { Badge, Button, Card, DishImage, cx } from '../ui';

function Timer({ minutes }: { minutes: number }) {
  const { t } = useI18n();
  const [left, setLeft] = useState(minutes * 60);
  const [run, setRun] = useState(false);
  useEffect(() => {
    if (!run || left <= 0) return;
    const id = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => clearInterval(id);
  }, [run, left]);
  const mm = String(Math.floor(Math.max(0, left) / 60)).padStart(2, '0');
  const ss = String(Math.max(0, left) % 60).padStart(2, '0');
  return (
    <button type="button" onClick={() => (left <= 0 ? (setLeft(minutes * 60), setRun(false)) : setRun((r) => !r))}
      className={cx('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] font-bold tabular-nums ring-1', left <= 0 ? 'bg-gold text-ink ring-gold' : run ? 'bg-leaf text-white ring-leaf' : 'ring-line')}>
      ⏱ {mm}:{ss} {left <= 0 ? t('done') : run ? t('pause') : t('start')}
    </button>
  );
}

export function RecipePage({ id }: { id: string }) {
  const { t, lang, pick, eur, num } = useI18n();
  const { answers, catalog } = useStore();
  const r = recipeById(id);
  const [servings, setServings] = useState(Math.max(1, answers.household));
  const [cook, setCook] = useState<number | null>(null);
  if (!r) return <Card className="p-8 text-center">{t('recipeNotFound')} <Link href="/app/menu" className="text-leaf">{t('back2')}</Link></Card>;
  const f = recipeFacts(r);
  const d = getDetail(id);
  const steps: [number, string][] = d ? d.steps.map(([m, ru, lt]) => [m, lang === 'lt' ? lt : ru]) : (lang === 'lt' ? r.stepsLt : r.stepsRu).map((s) => [0, s]);
  const total = d ? d.prep + d.cook : r.minutes;

  return (
    <article>
      <Link href="/app/menu" className="text-[14px] font-semibold text-leaf">{t('back2')}</Link>
      <div className="mt-3 grid gap-6 md:grid-cols-[1.1fr_1fr]">
        <div className="relative">
          <DishImage id={id} alt={r[lang]} className="aspect-[4/3] rounded-xl3" priority sizes="(max-width: 768px) 100vw, 560px" />
          <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-muted">{t('illustration')}</span>
        </div>
        <div>
          <div className="text-[12px] font-bold uppercase tracking-wide text-leaf">{t(`meal_${r.meal}` as MessageKey)}</div>
          <h1 className="mt-1 font-display text-[30px] font-extrabold leading-tight md:text-[36px]">{r[lang]}</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="sage">⏱ {total} {t('minutesShort')}</Badge>
            {d && <Badge tone="sage">{t(`level${d.level}` as MessageKey)}</Badge>}
            <Badge tone="gold">{eur(f.cost)} / {t('perPortion')}</Badge>
          </div>
          <div className="mt-5 grid grid-cols-4 gap-2 text-center">
            {([['kcal', f.kcal], [t('protein'), f.protein], [t('fat'), f.fat], [t('carbs'), f.carbs]] as const).map(([l, v]) => (
              <div key={l} className="rounded-2xl bg-card p-3 ring-1 ring-line"><div className="font-display text-[20px] font-extrabold">{num(v)}</div><div className="text-[11.5px] text-muted">{l === 'kcal' ? 'kcal' : `${l}, g`}</div></div>
            ))}
          </div>
          <div className="mt-4 text-[13px]">
            {f.allergens.length ? <><b>{t('containsAllergens')}:</b> {f.allergens.map((a) => `${ALLERGEN_LABEL[a]?.emoji ?? ''} ${pick(ALLERGEN_LABEL[a] ?? { lt: a, ru: a })}`).join(', ')}</> : <span className="text-muted">{t('noAllergensListed')}</span>}
          </div>
          <Button size="lg" className="mt-5 w-full" onClick={() => setCook(0)}>▶ {t('startCooking')}</Button>
        </div>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-[1fr_1.4fr]">
        <Card className="h-fit p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[19px] font-extrabold">{t('ingredientsTitle')}</h2>
            <div className="flex items-center gap-2">
              <button type="button" aria-label="−" className="h-8 w-8 rounded-full ring-1 ring-line" onClick={() => setServings((s) => Math.max(1, s - 1))}>−</button>
              <span className="w-14 text-center text-[13.5px] font-semibold">{t('forPeople', { n: servings })}</span>
              <button type="button" aria-label="+" className="h-8 w-8 rounded-full ring-1 ring-line" onClick={() => setServings((s) => Math.min(10, s + 1))}>+</button>
            </div>
          </div>
          <ul className="mt-4 divide-y divide-line">
            {r.items.map(([ing, g]) => {
              const grams = g * servings;
              const c = cheapest(ing, catalog);
              return (
                <li key={ing} className="flex items-center gap-3 py-2.5">
                  <span aria-hidden className="text-[18px]">{ingEmoji(ing)}</span>
                  <span className="min-w-0 flex-1"><span className="block text-[14.5px] font-semibold">{ingName(ing, lang)}</span>
                    {c && <span className="block truncate text-[11.5px] text-muted">{t('buyAt')} {RETAILERS[c.retailer].name} · {eur(c.price)}{c.promo ? ` · ${t('promo2')}` : ''}</span>}</span>
                  <span className="text-right text-[13.5px] tabular-nums"><b>{fmtGrams(grams, lang)}</b>{kitchenMeasure(ing, grams, lang) && <span className="block text-[11.5px] text-muted">{kitchenMeasure(ing, grams, lang)}</span>}</span>
                </li>
              );
            })}
          </ul>
        </Card>
        <div>
          <h2 className="text-[19px] font-extrabold">{t('stepsTitle2')}</h2>
          <ol className="mt-4 space-y-3">
            {steps.map(([m, s], i) => (
              <li key={i} className="flex gap-3 rounded-2xl bg-card p-4 ring-1 ring-line/70">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-forest text-[13px] font-bold text-white">{i + 1}</span>
                <div className="flex-1"><p className="text-[15px] leading-relaxed">{s}</p>{m > 0 && <div className="mt-2"><Timer minutes={m} /></div>}</div>
              </li>
            ))}
          </ol>
          {d && <p className="mt-4 rounded-2xl bg-sage p-4 text-[14px]">💡 <b>{t('chefTip')}:</b> {lang === 'lt' ? d.tip[1] : d.tip[0]}</p>}
        </div>
      </div>

      {cook !== null && (
        <div className="fixed inset-0 z-50 flex flex-col bg-forest text-white" role="dialog" aria-modal="true" aria-label={t('cookMode')}>
          <div className="flex items-center justify-between p-4"><span className="text-[14px] font-semibold text-white/70">{t('cookMode')} · {cook + 1}/{steps.length}</span><button type="button" onClick={() => setCook(null)} className="rounded-full bg-white/15 px-3 py-1.5 text-[14px] font-semibold">{t('close')}</button></div>
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <p className="max-w-2xl font-display text-[26px] font-bold leading-snug md:text-[34px]">{steps[cook][1]}</p>
            {steps[cook][0] > 0 && <div className="mt-6 [&_button]:bg-white [&_button]:text-ink"><Timer key={cook} minutes={steps[cook][0]} /></div>}
          </div>
          <div className="grid grid-cols-2 gap-3 p-4 pb-safe">
            <Button variant="secondary" size="lg" disabled={cook === 0} onClick={() => setCook((c) => (c ?? 1) - 1)}>{t('prev')}</Button>
            {cook < steps.length - 1 ? <Button variant="gold" size="lg" onClick={() => setCook((c) => (c ?? 0) + 1)}>{t('nextStep')}</Button> : <Button variant="gold" size="lg" onClick={() => setCook(null)}>{t('finish')}</Button>}
          </div>
        </div>
      )}
    </article>
  );
}
