import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { DishPhoto } from '../../components/site';
import { CountUp, Rise } from '../../components/ui';
import { STORE_LABEL } from '../../data/prices';
import { formatEur, useI18n } from '../../i18n/I18n';
import { todayIndex, useStore } from '../../lib/store';
import { DAY_SHORT, dayMeals, weekBaskets } from './shared';

export function Week() {
  const { t, lang, pick } = useI18n();
  const { plan, swaps, answers } = useStore();
  const eur = (n: number) => formatEur(n, lang);
  const b = weekBaskets(plan!, swaps, answers.household);
  const singles = [b.barbora, b.rimi].map((x, i) => ({ k: (['barbora', 'rimi'] as const)[i], total: x.total }));
  const worst = Math.max(...singles.map((s) => s.total));
  const used = Math.min(1, b.mix.total / answers.weeklyBudget);
  const ti = todayIndex();

  return (
    <div>
      <h1 className="font-display text-[26px] font-extrabold md:text-[32px]">{t('weekOverview')}</h1>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <Rise>
          <div className="rounded-[20px] bg-deep p-5 text-white">
            <div className="text-[12px] opacity-75">{t('basketCost')} · {t('mixBasket')}</div>
            <div className="mt-1 font-display text-[34px] font-extrabold"><CountUp value={b.mix.total} format={(n) => eur(n)} /></div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
              <motion.div className={`h-full rounded-full ${used < 1 ? 'bg-[#8fe0b0]' : 'bg-warm'}`} initial={{ width: 0 }} animate={{ width: `${used * 100}%` }} transition={{ duration: 1 }} />
            </div>
            <div className="mt-1.5 text-[12px] opacity-80">{t('budgetUse')}: {eur(answers.weeklyBudget)}</div>
          </div>
        </Rise>
        <Rise i={1}>
          <div className="card h-full p-5">
            <div className="text-[12px] text-muted">{t('compareStores')}</div>
            <div className="mt-2 grid gap-2">
              {singles.map((s) => (
                <div key={s.k} className="flex justify-between text-[14px]"><span>{STORE_LABEL[s.k]}</span><span className="font-bold tabular">{eur(s.total)}</span></div>
              ))}
              <div className="flex justify-between border-t border-line pt-2 text-[14px] font-bold text-accent"><span>{t('mixBasket')}</span><span className="tabular">{eur(b.mix.total)}</span></div>
            </div>
          </div>
        </Rise>
        <Rise i={2}>
          <div className="card h-full p-5">
            <div className="text-[12px] text-muted">{t('promoSaved')}</div>
            <div className="mt-1 font-display text-[30px] font-extrabold text-accent"><CountUp value={worst - b.mix.total + b.mix.saving} format={(n) => eur(n)} /></div>
            <Link to="/app/basket" className="mt-3 inline-block text-[14px] font-bold text-accent">{t('openBasket')} →</Link>
          </div>
        </Rise>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-display text-[20px] font-extrabold">{t('tabMenu')}</h2>
        <Link to="/app/menu" className="text-[14px] font-bold text-accent">{t('openMenu')} →</Link>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {DAY_SHORT[lang].map((d, i) => {
          const meals = dayMeals(plan!, swaps, i);
          const main = meals.find((m) => m.recipe.meal === 'dinner') ?? meals[meals.length - 1];
          return (
            <Rise key={d} i={i}>
              <Link to={`/app/menu?day=${i}`} className={`card block overflow-hidden transition hover:-translate-y-0.5 ${i === ti ? 'ring-2 ring-accent' : ''}`}>
                <DishPhoto id={main.recipe.id} alt={pick(main.recipe)} className="aspect-[4/3]" />
                <div className="p-3">
                  <div className="text-[12px] font-bold text-accent">{d}{i === ti ? ` · ${t('todayMenu')}` : ''}</div>
                  <div className="line-clamp-2 text-[13px] font-semibold leading-snug">{pick(main.recipe)}</div>
                  <div className="mt-1 text-[11.5px] text-muted">{meals.length} · {eur(meals.reduce((s, m) => s + m.cost, 0) * answers.household)}</div>
                </div>
              </Link>
            </Rise>
          );
        })}
      </div>
    </div>
  );
}
