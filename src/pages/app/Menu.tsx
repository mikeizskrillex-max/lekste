import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DishPhoto } from '../../components/site';
import { CountUp } from '../../components/ui';
import { formatEur, formatNum, useI18n } from '../../i18n/I18n';
import { ALLERGEN_LABEL, type StringKey } from '../../i18n/strings';
import { todayIndex, useStore } from '../../lib/store';
import { DAY_SHORT, dayMeals, MEAL_LABEL, type DayMeal } from './shared';

export function Menu() {
  const { t, lang, pick } = useI18n();
  const { plan, swaps, swap, targets, answers, feedback, rate } = useStore();
  const [params] = useSearchParams();
  const [day, setDay] = useState(() => { const d = Number(params.get('day')); return Number.isInteger(d) && d >= 0 && d < 7 && params.has('day') ? d : todayIndex(); });
  const nav = useNavigate();
  const open = (m: DayMeal) => nav(`/app/recipe/${m.recipe.id}?s=${m.servings}`);
  const [askWhy, setAskWhy] = useState<string | null>(null);
  const meals = dayMeals(plan!, swaps, day);
  const kcal = meals.reduce((s, m) => s + m.kcal, 0);
  const cost = meals.reduce((s, m) => s + m.cost, 0) * answers.household;
  const without = [...answers.allergens, ...(answers.lactoseIntolerant ? ['milk'] : [])];
  const eur = (n: number) => formatEur(n, lang);

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-[26px] font-extrabold md:text-[32px]">{t('tabMenu')}</h1>
          {without.length > 0 && <div className="mt-1 text-[13px] text-muted">✓ {t('without')}: {without.map((a) => pick(ALLERGEN_LABEL[a])).join(', ')}</div>}
        </div>
        <div className="grid grid-cols-7 gap-1.5" role="group">
          {DAY_SHORT[lang].map((d, i) => (
            <button key={d} type="button" aria-pressed={day === i} onClick={() => setDay(i)}
              className={`h-10 min-w-10 rounded-xl px-2 text-[13px] font-semibold transition ${day === i ? 'bg-deep text-white' : 'border border-line bg-surface'}`}>{d}</button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {meals.map((m, i) => {
            const fb = feedback.find((f) => f.recipeId === m.recipe.id);
            const key = `${day}-${m.slot}-${m.recipe.id}`;
            return (
              <motion.div key={key} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.35, delay: i * 0.06 }} className="card flex flex-col overflow-hidden">
                <button type="button" onClick={() => open(m)} className="relative block text-left">
                  <DishPhoto id={m.recipe.id} alt={pick(m.recipe)} className="aspect-[4/3]" />
                  <span className="absolute left-2 top-2 rounded-lg bg-white/90 px-2 py-1 text-[11.5px] font-bold text-[#11261b]">{pick(MEAL_LABEL[m.meal])}</span>
                </button>
                <div className="flex flex-1 flex-col p-4">
                  <button type="button" onClick={() => open(m)} className="text-left font-bold leading-snug hover:text-accent">{pick(m.recipe)}</button>
                  <div className="mt-1 text-[12.5px] text-muted">{m.recipe.minutes} {t('min')} · {m.kcal} {t('kcal')} · {m.protein} g {t('protein')}</div>
                  <div className="mt-auto flex items-center gap-1.5 pt-3">
                    <span className="mr-auto rounded-lg bg-soft px-2 py-1 text-[12.5px] font-bold text-accent">{eur(m.cost * answers.household)}</span>
                    <button type="button" aria-label="👍" aria-pressed={fb?.rating === 'up'} onClick={() => rate({ recipeId: m.recipe.id, rating: 'up' })} className={`rounded-lg px-2 py-1 ${fb?.rating === 'up' ? 'bg-soft' : ''}`}>👍</button>
                    <button type="button" aria-label="👎" aria-pressed={fb?.rating === 'down'} onClick={() => setAskWhy(askWhy === m.recipe.id ? null : m.recipe.id)} className={`rounded-lg px-2 py-1 ${fb?.rating === 'down' ? 'bg-rose/60' : ''}`}>👎</button>
                    <button type="button" aria-label={t('swap')} onClick={() => swap(day, m.slot)} className="rounded-lg bg-soft px-2 py-1 text-[13px] font-bold text-accent">🔄 {t('swap')}</button>
                  </div>
                  {askWhy === m.recipe.id && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="w-full text-[12px] text-muted">{t('whyDown')}</span>
                      {(['taste', 'time', 'price', 'ingredient'] as const).map((r) => (
                        <button key={r} type="button" className="chip !px-2.5 !py-1 !text-[12px]"
                          onClick={() => { rate({ recipeId: m.recipe.id, rating: 'down', reason: r }); setAskWhy(null); swap(day, m.slot); }}>
                          {t(`r_${r}` as StringKey)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="mt-5 grid gap-3 rounded-[18px] bg-soft p-4 sm:grid-cols-2">
        <div className="flex items-center justify-between font-bold sm:block">
          <div className="text-[13px] font-semibold text-muted">{t('forDay')}</div>
          <div className="text-[20px] text-accent tabular">{eur(cost)}</div>
        </div>
        <div>
          <div className="flex justify-between text-[13px] font-semibold text-muted"><span>{t('calSecondary')}</span><span className="tabular"><CountUp value={kcal} format={(n) => formatNum(n, lang)} /> / {formatNum(targets.kcal, lang)} {t('kcal')}</span></div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-line"><motion.div className="h-full rounded-full bg-accent" animate={{ width: `${Math.min(100, (kcal / targets.kcal) * 100)}%` }} transition={{ duration: 0.8 }} /></div>
        </div>
      </div>

    </div>
  );
}
