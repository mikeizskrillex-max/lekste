import { motion } from 'framer-motion';
import { CountUp, Rise, Ring, Thumb } from '../../components/ui';
import { formatEur, formatNum, useI18n } from '../../i18n/I18n';
import { today, todayIndex, useStore } from '../../lib/store';
import { dayMeals, MEAL_LABEL } from './shared';

export function Today() {
  const { t, lang, pick } = useI18n();
  const { plan, swaps, targets, eaten, toggleEaten, water, setWater } = useStore();
  const date = today();
  const meals = dayMeals(plan!, swaps, todayIndex());
  const eatenIds = eaten[date] ?? [];
  const done = meals.filter((m) => eatenIds.includes(m.recipe.id));
  const sum = (k: 'kcal' | 'protein' | 'fat' | 'carbs') => done.reduce((s, m) => s + m[k], 0);
  const left = Math.max(0, targets.kcal - sum('kcal'));
  const glasses = water[date] ?? 0;

  return (
    <div className="pt-2">
      <h1 className="font-display text-[22px] font-extrabold">{t('hello')}</h1>

      <section className="mt-4 flex items-center gap-5 rounded-card bg-deep p-5 text-white">
        <Ring frac={sum('kcal') / targets.kcal} size={120} stroke={11} color="#8fe0b0">
          <div className="text-center leading-tight">
            <div className="font-display text-[24px] font-extrabold"><CountUp value={left} format={(n) => formatNum(n, lang)} /></div>
            <div className="text-[11px] opacity-75">{t('left')} {t('kcal')}</div>
          </div>
        </Ring>
        <div className="grid flex-1 gap-2.5 text-[12px]">
          {([['protein', targets.protein, '#8fe0b0'], ['fat', targets.fat, '#f6c46a'], ['carbs', targets.carbs, '#ffb59a']] as const).map(([k, goal, color]) => (
            <div key={k}>
              <div className="flex justify-between opacity-85"><span>{t(k)}</span><span className="tabular">{sum(k)} / {goal} g</span></div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/15">
                <motion.div className="h-full rounded-full" style={{ background: color }} animate={{ width: `${Math.min(100, (sum(k) / goal) * 100)}%` }} transition={{ duration: 0.8 }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 grid gap-2">
        {meals.map((m, i) => {
          const isDone = eatenIds.includes(m.recipe.id);
          return (
            <Rise key={m.slot} i={i}>
              <div className={`card flex items-center gap-3 p-2.5 transition ${isDone ? 'opacity-60' : ''}`}>
                <Thumb emoji={m.recipe.emoji} i={i} />
                <div className="min-w-0 flex-1">
                  <div className="text-[11.5px] text-muted">{pick(MEAL_LABEL[m.recipe.meal])} · {m.recipe.minutes} {t('min')} · {formatEur(m.cost, lang)}</div>
                  <div className="font-bold leading-snug">{pick(m.recipe)}</div>
                  <div className="text-[12px] font-semibold text-accent tabular">{m.kcal} {t('kcal')}</div>
                </div>
                <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={() => toggleEaten(date, m.recipe.id)} aria-pressed={isDone}
                  className={`shrink-0 rounded-xl px-3 py-2 text-[12px] font-bold ${isDone ? 'bg-accent text-onaccent' : 'bg-soft text-accent'}`}>
                  {isDone ? '✓' : t('eaten')}
                </motion.button>
              </div>
            </Rise>
          );
        })}
      </section>

      <section className="card mt-4 p-4">
        <div className="mb-2 flex justify-between font-bold"><span>💧 {t('water')}</span><span className="text-muted tabular">{glasses} / 8</span></div>
        <div className="grid grid-cols-8 gap-1.5">
          {Array.from({ length: 8 }, (_, i) => (
            <motion.button key={i} type="button" whileTap={{ scale: 0.85 }} aria-label={`${i + 1}`}
              onClick={() => setWater(date, glasses === i + 1 ? i : i + 1)}
              className={`h-10 rounded-lg border-2 transition ${i < glasses ? 'border-[#5aa9e6] bg-[#5aa9e6]/70' : 'border-line bg-surface'}`} />
          ))}
        </div>
      </section>
      <p className="mt-4 text-center text-[11px] text-muted">{t('demoNote')}</p>
    </div>
  );
}
