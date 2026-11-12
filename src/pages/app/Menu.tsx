import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DishPhoto } from '../../components/site';
import { CountUp } from '../../components/ui';
import { INGREDIENT_BY_ID } from '../../data/ingredients';
import { PRICES, STORE_LABEL } from '../../data/prices';
import { formatEur, formatNum, useI18n } from '../../i18n/I18n';
import { ALLERGEN_LABEL, type StringKey } from '../../i18n/strings';
import { cheapest } from '../../lib/pricing';
import { recipeFacts } from '../../lib/recipes';
import { todayIndex, useStore } from '../../lib/store';
import { DAY_SHORT, dayMeals, MEAL_LABEL, type DayMeal } from './shared';

export function Menu() {
  const { t, lang, pick } = useI18n();
  const { plan, swaps, swap, targets, answers, feedback, rate } = useStore();
  const [params] = useSearchParams();
  const [day, setDay] = useState(() => { const d = Number(params.get('day')); return Number.isInteger(d) && d >= 0 && d < 7 && params.has('day') ? d : todayIndex(); });
  const [open, setOpen] = useState<DayMeal | null>(null);
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
                <button type="button" onClick={() => setOpen(m)} className="relative block text-left">
                  <DishPhoto id={m.recipe.id} alt={pick(m.recipe)} className="aspect-[4/3]" />
                  <span className="absolute left-2 top-2 rounded-lg bg-white/90 px-2 py-1 text-[11.5px] font-bold text-[#11261b]">{pick(MEAL_LABEL[m.meal])}</span>
                </button>
                <div className="flex flex-1 flex-col p-4">
                  <button type="button" onClick={() => setOpen(m)} className="text-left font-bold leading-snug hover:text-accent">{pick(m.recipe)}</button>
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

      <AnimatePresence>{open && <RecipeSheet meal={open} household={answers.household} onClose={() => setOpen(null)} />}</AnimatePresence>
    </div>
  );
}

function RecipeSheet({ meal, household, onClose }: { meal: DayMeal; household: number; onClose: () => void }) {
  const { t, lang, pick } = useI18n();
  const r = meal.recipe;
  const f = recipeFacts(r);
  const eur = (n: number) => formatEur(n, lang);
  return (
    <motion.div className="fixed inset-0 z-40 grid items-end bg-black/45 md:place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div role="dialog" aria-modal="true" aria-label={pick(r)}
        className="mx-auto max-h-[90vh] w-full max-w-[640px] overflow-y-auto rounded-t-[28px] bg-bg pb-[max(24px,env(safe-area-inset-bottom))] md:rounded-[28px]"
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <DishPhoto id={r.id} alt={pick(r)} className="aspect-[16/9] md:rounded-t-[28px]" eager />
          <span className="absolute bottom-2 right-3 rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-white">{t('illustration')}</span>
          <button type="button" onClick={onClose} aria-label="×" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-[18px] text-[#11261b]">×</button>
        </div>
        <div className="px-5 pt-4 md:px-7">
          <div className="text-[12.5px] text-muted">{pick(MEAL_LABEL[meal.meal])} · {r.minutes} {t('min')} · ×{meal.servings} {t('servings')}</div>
          <h2 className="font-display text-[22px] font-extrabold">{pick(r)}</h2>
          <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
            {[[eur(meal.cost * household), '€'], [meal.kcal, t('kcal')], [`${meal.protein} g`, t('protein')], [`${meal.fat} g`, t('fat')]].map(([v, l], i) => (
              <div key={i} className="rounded-xl bg-surface p-2"><div className="font-bold tabular">{v}</div><div className="text-[11px] text-muted">{l}</div></div>
            ))}
          </div>
          {f.allergens.length > 0 && <p className="mt-2 text-[12.5px] text-muted">⚠️ {f.allergens.map((a) => pick(ALLERGEN_LABEL[a])).join(', ')}</p>}
          <h3 className="mt-5 font-bold">{t('ingredients')}</h3>
          <ul className="mt-2 grid gap-2 text-[14px]">
            {r.items.map(([id, g]) => {
              const ing = INGREDIENT_BY_ID[id];
              const c = cheapest(id);
              const promo = c && PRICES[id]?.[c.store]?.promo;
              return (
                <li key={id} className="flex justify-between gap-2">
                  <span>{ing.emoji} {pick(ing)}
                    {c && <span className="ml-1.5 text-[11.5px] text-muted">{STORE_LABEL[c.store]}{promo ? '' : ''}</span>}
                    {promo && <span className="ml-1.5 rounded bg-warm px-1.5 py-0.5 text-[10px] font-bold text-[#4a3200]">{t('onPromo')}</span>}
                  </span>
                  <span className="text-muted tabular">{Math.round(g * meal.servings)} g</span>
                </li>
              );
            })}
          </ul>
          <h3 className="mt-5 font-bold">{t('steps')}</h3>
          <ol className="mt-2 grid list-decimal gap-1.5 pl-5 text-[14px]">
            {(lang === 'lt' ? r.stepsLt : r.stepsRu).map((s) => <li key={s}>{s}</li>)}
          </ol>
          <button type="button" className="btn-ghost mt-6" onClick={onClose}>OK</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
