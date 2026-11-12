import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { CountUp, Thumb } from '../../components/ui';
import { INGREDIENT_BY_ID } from '../../data/ingredients';
import { formatEur, formatNum, useI18n } from '../../i18n/I18n';
import { ALLERGEN_LABEL, type StringKey } from '../../i18n/strings';
import { recipeFacts } from '../../lib/recipes';
import { today, todayIndex, useStore } from '../../lib/store';
import { DAY_SHORT, dayMeals, MEAL_LABEL, type DayMeal } from './shared';

export function Menu() {
  const { t, lang, pick } = useI18n();
  const { plan, swaps, swap, targets, answers, feedback, rate } = useStore();
  const [day, setDay] = useState(todayIndex());
  const [open, setOpen] = useState<DayMeal | null>(null);
  const [askWhy, setAskWhy] = useState<string | null>(null);
  const [spin, setSpin] = useState<string>('');
  const meals = dayMeals(plan!, swaps, day);
  const kcal = meals.reduce((s, m) => s + m.kcal, 0);
  const cost = meals.reduce((s, m) => s + m.cost, 0);
  const without = [...answers.allergens, ...(answers.lactoseIntolerant ? ['milk'] : [])];

  return (
    <div className="pt-2">
      <div className="text-[12px] text-muted">{t('week')} · {today()}</div>
      <h1 className="font-display text-[22px] font-extrabold">{t('tabMenu')}</h1>

      <div className="my-3 grid grid-cols-7 gap-1.5" role="group">
        {DAY_SHORT[lang].map((d, i) => (
          <button key={d} type="button" aria-pressed={day === i} onClick={() => setDay(i)}
            className={`rounded-xl border py-2 text-[12px] font-semibold transition ${day === i ? 'border-deep bg-deep text-white' : 'border-line bg-surface'}`}>{d}</button>
        ))}
      </div>

      {without.length > 0 && (
        <div className="mb-2 text-[12px] text-muted">✓ {t('without')}: {without.map((a) => pick(ALLERGEN_LABEL[a])).join(', ')}</div>
      )}

      <div className="grid gap-2">
        <AnimatePresence mode="popLayout">
          {meals.map((m, i) => {
            const fb = feedback.find((f) => f.recipeId === m.recipe.id);
            const key = `${day}-${m.slot}-${m.recipe.id}`;
            return (
              <motion.div key={key} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.35, delay: i * 0.06 }} className="card p-2.5">
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setOpen(m)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <Thumb emoji={m.recipe.emoji} i={i} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11.5px] text-muted">{pick(MEAL_LABEL[m.recipe.meal])} · {m.recipe.minutes} {t('min')} · {formatEur(m.cost, lang)}</div>
                      <div className="font-bold leading-snug">{pick(m.recipe)}</div>
                      <div className="text-[12px] font-semibold text-accent tabular">{m.kcal} {t('kcal')} · {m.protein} g {t('protein')}</div>
                    </div>
                  </button>
                  <motion.button type="button" aria-label={t('swap')} animate={{ rotate: spin === key ? 360 : 0 }} transition={{ duration: 0.4 }}
                    onClick={() => { setSpin(key); swap(day, m.slot); }}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-soft text-[15px]">🔄</motion.button>
                </div>
                <div className="mt-2 flex items-center gap-2 pl-[68px] text-[13px]">
                  <button type="button" aria-pressed={fb?.rating === 'up'} onClick={() => rate({ recipeId: m.recipe.id, rating: 'up' })}
                    className={`rounded-lg px-2 py-1 ${fb?.rating === 'up' ? 'bg-soft' : ''}`}>👍</button>
                  <button type="button" aria-pressed={fb?.rating === 'down'} onClick={() => setAskWhy(m.recipe.id)}
                    className={`rounded-lg px-2 py-1 ${fb?.rating === 'down' ? 'bg-rose/60' : ''}`}>👎</button>
                  {askWhy === m.recipe.id && (
                    <div className="flex flex-wrap gap-1.5">
                      {(['taste', 'time', 'price', 'ingredient'] as const).map((r) => (
                        <button key={r} type="button" className="chip !px-2 !py-1 !text-[11px]"
                          onClick={() => { rate({ recipeId: m.recipe.id, rating: 'down', reason: r }); setAskWhy(null); swap(day, m.slot); }}>
                          {t(`r_${r}` as StringKey)}
                        </button>
                      ))}
                    </div>
                  )}
                  {fb?.rating === 'down' && askWhy !== m.recipe.id && <span className="text-[11px] text-muted">{t('thanksFeedback')}</span>}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-btn bg-soft px-3.5 py-2.5 font-bold">
        <span>{t('forDay')}</span>
        <span className="text-accent tabular"><CountUp value={kcal} format={(n) => formatNum(n, lang)} /> {t('kcal')} · {formatEur(cost, lang)}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
        <motion.div className="h-full rounded-full bg-accent" animate={{ width: `${Math.min(100, (kcal / targets.kcal) * 100)}%` }} transition={{ duration: 0.8 }} />
      </div>
      <p className="mt-1 text-[12px] text-muted">{Math.round((kcal / targets.kcal) * 100)}% {t('ofNorm')}</p>

      <AnimatePresence>{open && <RecipeSheet meal={open} onClose={() => setOpen(null)} />}</AnimatePresence>
    </div>
  );
}

function RecipeSheet({ meal, onClose }: { meal: DayMeal; onClose: () => void }) {
  const { t, lang, pick } = useI18n();
  const r = meal.recipe;
  const f = recipeFacts(r);
  return (
    <motion.div className="fixed inset-0 z-30 bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div role="dialog" aria-modal="true" aria-label={pick(r)}
        className="absolute inset-x-0 bottom-0 mx-auto max-h-[88vh] max-w-[480px] overflow-y-auto rounded-t-[28px] bg-bg pb-[max(24px,env(safe-area-inset-bottom))]"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}>
        <div className="grid h-44 place-items-center rounded-t-[28px] bg-peach text-[72px]">{r.emoji}</div>
        <div className="px-5">
          <div className="mt-1 text-right text-[10px] text-muted">{t('illustration')}</div>
          <div className="text-[12px] text-muted">{pick(MEAL_LABEL[r.meal])} · {r.minutes} {t('min')} · ×{meal.servings} {t('servings')}</div>
          <h2 className="font-display text-[21px] font-extrabold">{pick(r)}</h2>
          <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
            {[[meal.kcal, t('kcal')], [`${meal.protein} g`, t('protein')], [`${meal.fat} g`, t('fat')], [formatEur(meal.cost, lang), '€']].map(([v, l], i) => (
              <div key={i} className="rounded-xl bg-surface p-2"><div className="font-bold tabular">{v}</div><div className="text-[11px] text-muted">{l}</div></div>
            ))}
          </div>
          {f.allergens.length > 0 && <p className="mt-2 text-[12px] text-muted">⚠️ {f.allergens.map((a) => pick(ALLERGEN_LABEL[a])).join(', ')}</p>}
          <h3 className="mt-5 font-bold">{t('ingredients')}</h3>
          <ul className="mt-2 grid gap-1.5 text-[14px]">
            {r.items.map(([id, g]) => {
              const ing = INGREDIENT_BY_ID[id];
              return (
                <li key={id} className="flex justify-between gap-2">
                  <span>{ing.emoji} {pick(ing)}{ing.promo && <span className="ml-1.5 rounded bg-warm px-1.5 py-0.5 text-[10px] font-bold text-[#4a3200]">{t('onPromo')} {ing.store}</span>}</span>
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
