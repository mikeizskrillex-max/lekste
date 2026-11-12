import { Navigate, useNavigate } from 'react-router-dom';
import { CountUp, Rise, Ring, Thumb, TopBar } from '../components/ui';
import { RECIPE_BY_ID } from '../data/recipeIndex';
import { formatEur, formatNum, useI18n } from '../i18n/I18n';
import { weeksToGoal } from '../lib/nutrition';
import { useStore } from '../lib/store';
import { Pricing } from './Landing';

export function Result() {
  const { t, lang, pick } = useI18n();
  const { answers: a, targets: tg, plan, quizDone, subscribe } = useStore();
  const nav = useNavigate();
  if (!quizDone || !plan) return <Navigate to="/quiz" replace />;

  const weeks = weeksToGoal(a);
  const day = plan.days[0];
  const fewRecipes = plan.issues.some((x) => x.startsWith('not_enough'));

  return (
    <div className="min-h-screen bg-bg">
      <TopBar />
      <main className="container-app pb-16">
        <h1 className="mt-4 font-display text-[24px] font-extrabold">{t('planReady')}</h1>

        <Rise>
          <div className="mt-4 rounded-card bg-deep p-5 text-white">
            <div className="text-[12px] opacity-75">{t('dailyNorm')}</div>
            <div className="font-display text-[42px] font-extrabold leading-none"><CountUp value={tg.kcal} format={(n) => formatNum(n, lang)} /> <span className="text-[18px]">{t('kcal')}</span></div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[12px]">
              {([['protein', tg.protein, 0.4, tg.protein * 4, '#8fe0b0'], ['fat', tg.fat, 0.4, tg.fat * 9, '#f6c46a'], ['carbs', tg.carbs, 0.6, tg.carbs * 4, '#ffb59a']] as const).map(([k, g, max, kcal, color]) => (
                <div key={k}>
                  <Ring frac={kcal / tg.kcal / max} color={color}><span className="text-[14px] font-bold"><CountUp value={g} />g</span></Ring>
                  <div className="mt-1 opacity-80">{t(k)}</div>
                </div>
              ))}
            </div>
          </div>
        </Rise>

        <div className="mt-2.5 grid grid-cols-2 gap-2.5">
          <div className="card p-3"><div className="text-[12px] text-muted">{t('budget')}</div><div className="font-bold tabular">{formatEur(a.weeklyBudget / 7 / a.household, lang)} {t('perDay')}</div></div>
          <div className="card p-3"><div className="text-[12px] text-muted">{t('pace')}</div>
            <div className="font-bold">{a.goal === 'lose' ? t('paceLose') : a.goal === 'gain' ? t('paceGain') : t('paceKeep')}</div>
            {weeks && <div className="text-[12px] text-muted">{t('weeksToGoal', { n: weeks })}</div>}
          </div>
        </div>

        {fewRecipes && <p className="mt-3 rounded-xl bg-warm/40 p-3 text-[13px]">{t('fewRecipes')}</p>}

        <h2 className="h2 mb-3 mt-8">{t('exampleDay')}</h2>
        <div className="grid gap-2">
          {day.meals.map((m, i) => {
            const r = RECIPE_BY_ID[m.recipeId];
            return (
              <Rise key={i} i={i}>
                <div className={`card flex items-center gap-3 p-2.5 ${i > 0 ? 'select-none blur-[3.5px]' : ''}`} aria-hidden={i > 0}>
                  <Thumb emoji={r.emoji} i={i} size="h-12 w-12 text-[24px]" />
                  <div className="min-w-0 flex-1"><div className="font-semibold">{pick(r)}</div><div className="text-[12px] text-muted">{m.kcal} {t('kcal')} · {formatEur(m.cost, lang)}</div></div>
                </div>
              </Rise>
            );
          })}
        </div>
        <p className="mt-3 text-[12px] text-muted">{t('formulaNote')} {t('notMedical')}</p>

        <Pricing onPick={() => { subscribe(); nav('/welcome'); }} />
        <label className="mt-3 flex gap-3 text-[12px] text-muted"><input type="checkbox" defaultChecked className="mt-0.5 h-4 w-4 shrink-0 accent-[rgb(var(--accent))]" />{t('immediateConsent')}</label>
        <p className="mt-3 text-center text-[12px] text-muted">{t('securePay')}</p>
        <p className="mt-1 text-center text-[12px] font-semibold text-accent">{t('demoPay')}</p>
      </main>
    </div>
  );
}
