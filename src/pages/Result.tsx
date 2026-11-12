import { motion } from 'framer-motion';
import { Navigate, useNavigate } from 'react-router-dom';
import { DishPhoto, SiteFooter, SiteHeader } from '../components/site';
import { CountUp, Rise, Ring } from '../components/ui';
import { STORE_LABEL } from '../data/prices';
import { formatEur, formatNum, useI18n } from '../i18n/I18n';
import { weeksToGoal } from '../lib/nutrition';
import { useStore } from '../lib/store';
import type { StringKey } from '../i18n/strings';
import { dayMeals, MEAL_LABEL, weekBaskets } from './app/shared';
import { Plans } from './Landing';

export function Result() {
  const { t, lang, pick } = useI18n();
  const { answers: a, targets: tg, plan, quizDone, swaps, startTrial } = useStore();
  const nav = useNavigate();
  if (!quizDone || !plan) return <Navigate to="/quiz" replace />;

  const eur = (n: number) => formatEur(n, lang);
  const weeks = weeksToGoal(a);
  const meals = dayMeals(plan, swaps, 0);
  const fewRecipes = plan.issues.some((x) => x.startsWith('not_enough'));
  const b = weekBaskets(plan, swaps, a.household);
  const single = [{ k: 'barbora' as const, total: b.barbora.total }, { k: 'rimi' as const, total: b.rimi.total }].sort((x, y) => x.total - y.total);
  const worst = single[1];
  const fits = b.mix.total <= a.weeklyBudget;
  const begin = () => { startTrial(); nav('/welcome'); };

  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader />
      <main className="container-site py-8 md:py-14">
        <h1 className="h1 !text-[30px] md:!text-[42px]">{t('planReady')}</h1>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {/* Basket first: this is the product */}
          <Rise>
            <section className="rounded-[24px] bg-deep p-6 text-white md:p-8">
              <div className="text-[12px] font-bold uppercase tracking-[.1em] text-leaf">{t('yourBasket')}</div>
              <div className="mt-2 flex items-end gap-3">
                <span className="font-display text-[44px] font-extrabold leading-none"><CountUp value={b.mix.total} format={eur} /></span>
                <span className={`mb-1 rounded-full px-2.5 py-1 text-[12px] font-bold ${fits ? 'bg-[#8fe0b0] text-[#0e2a1d]' : 'bg-warm text-[#4a3200]'}`}>
                  {fits ? `✓ ${t('withinBudget')}` : t('overBudget', { n: eur(b.mix.total - a.weeklyBudget) })}
                </span>
              </div>
              <div className="mt-1 text-[13px] opacity-75">{t('budget')}: {eur(a.weeklyBudget)} · {a.household} 👤</div>
              <div className="mt-6 grid gap-2.5">
                {single.map((s) => (
                  <div key={s.k} className="flex items-center gap-3 text-[14px]">
                    <span className="w-[120px] opacity-85">{STORE_LABEL[s.k]}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/15"><motion.div className="h-full rounded-full bg-white/50" initial={{ width: 0 }} animate={{ width: `${(s.total / worst.total) * 100}%` }} transition={{ duration: 1 }} /></div>
                    <span className="w-[72px] text-right font-bold tabular">{eur(s.total)}</span>
                  </div>
                ))}
                <div className="flex items-center gap-3 text-[14px]">
                  <span className="w-[120px] font-bold text-leaf">{t('mixBasket')}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/15"><motion.div className="h-full rounded-full bg-[#8fe0b0]" initial={{ width: 0 }} animate={{ width: `${(b.mix.total / worst.total) * 100}%` }} transition={{ duration: 1, delay: 0.2 }} /></div>
                  <span className="w-[72px] text-right font-bold text-leaf tabular">{eur(b.mix.total)}</span>
                </div>
              </div>
              {worst.total > b.mix.total && (
                <div className="mt-5 rounded-xl bg-white/10 px-3 py-2.5 text-[13.5px]">💚 {t('saveVs', { store: STORE_LABEL[worst.k], n: eur(worst.total - b.mix.total) })}</div>
              )}
            </section>
          </Rise>

          <Rise i={1}>
            <section className="card h-full p-6 md:p-8">
              <div className="text-[12px] font-bold uppercase tracking-[.1em] text-muted">{t('dailyNorm')}</div>
              <div className="mt-1 font-display text-[36px] font-extrabold"><CountUp value={tg.kcal} format={(n) => formatNum(n, lang)} /> <span className="text-[16px]">{t('kcal')}</span></div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[12px]">
                {([['protein', tg.protein, 0.4, tg.protein * 4, '#2a8c57'], ['fat', tg.fat, 0.4, tg.fat * 9, '#e3a72f'], ['carbs', tg.carbs, 0.6, tg.carbs * 4, '#f08a6b']] as const).map(([k, g, max, kcal, color]) => (
                  <div key={k}><Ring frac={kcal / tg.kcal / max} color={color} track="rgb(var(--line))"><span className="text-[14px] font-bold"><CountUp value={g} />g</span></Ring><div className="mt-1 text-muted">{t(k)}</div></div>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-[14px]">
                <div className="rounded-xl bg-bg p-3"><div className="text-[12px] text-muted">{t('pace')}</div><div className="font-bold">{a.goal === 'lose' ? t('paceLose') : a.goal === 'gain' ? t('paceGain') : t('paceKeep')}</div></div>
                <div className="rounded-xl bg-bg p-3"><div className="text-[12px] text-muted">{t('qGoal')}</div><div className="font-bold">{weeks ? t('weeksToGoal', { n: weeks }) : t(`goal_${a.goal}` as StringKey)}</div></div>
              </div>
              <p className="mt-4 text-[12px] text-muted">{t('formulaNote')} {t('notMedical')}</p>
            </section>
          </Rise>
        </div>

        {fewRecipes && <p className="mt-4 rounded-xl bg-warm/40 p-3 text-[13px]">{t('fewRecipes')}</p>}

        <h2 className="h2 mt-12">{t('exampleDay')}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {meals.map((m, i) => (
            <Rise key={i} i={i}>
              <div className="card overflow-hidden">
                <DishPhoto id={m.recipe.id} alt={pick(m.recipe)} className="aspect-[4/3]" />
                <div className="p-4">
                  <div className="text-[12px] text-muted">{pick(MEAL_LABEL[m.recipe.meal])} · {m.kcal} {t('kcal')}</div>
                  <div className="font-bold leading-snug">{pick(m.recipe)}</div>
                  <div className="mt-1.5 text-[13px] font-bold text-accent">{eur(m.cost * a.household)}</div>
                </div>
              </div>
            </Rise>
          ))}
        </div>
      </main>
      <Plans onStart={begin} />
      <SiteFooter />
    </div>
  );
}
