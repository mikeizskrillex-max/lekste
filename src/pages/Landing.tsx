import { motion, useReducedMotion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DishPhoto, SiteFooter, SiteHeader } from '../components/site';
import { CountUp, Rise } from '../components/ui';
import { INGREDIENT_BY_ID } from '../data/ingredients';
import { PRICES, PRICES_DATE, STORE_LABEL } from '../data/prices';
import { RECIPE_BY_ID } from '../data/recipeIndex';
import { formatEur, useI18n } from '../i18n/I18n';
import type { StringKey } from '../i18n/strings';
import { demo } from '../lib/demo';
import { DAY_SHORT } from './app/shared';

function dateLabel(lang: 'lt' | 'ru') {
  return new Date(PRICES_DATE).toLocaleDateString(lang === 'lt' ? 'lt-LT' : 'ru-RU', { day: 'numeric', month: 'long' });
}

export function Landing() {
  const { t, lang, pick } = useI18n();
  const nav = useNavigate();
  const reduce = useReducedMotion();
  const d = demo();
  const eur = (n: number) => formatEur(n, lang);
  const baskets = [
    { label: STORE_LABEL.barbora, total: d.barbora.total },
    { label: STORE_LABEL.rimi, total: d.rimi.total },
  ];
  const worst = Math.max(...baskets.map((b) => b.total));
  const heroDishes = ['chicken_buckwheat', 'oat_berries', 'salmon_rice', 'tuna_salad'];

  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader />

      {/* HERO */}
      <section className="overflow-hidden">
        <div className="container-site grid items-center gap-10 py-10 md:py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:py-20">
          <div>
            <div className="eyebrow">{t('heroKicker')}</div>
            <h1 className="h1">{t('heroTitle2')}</h1>
            <p className="lead mt-5 max-w-[560px]">{t('heroSub2')}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {(['pill1', 'pill2', 'pill3'] as StringKey[]).map((k, i) => (
                <span key={k} className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3.5 py-2 text-[13px] font-semibold shadow-sm ring-1 ring-line">
                  <span aria-hidden>{['🎯', '💶', '🏷️'][i]}</span>{t(k)}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button type="button" onClick={() => nav('/quiz')} className="btn-lg">{t('startTrial')}</button>
              <span className="text-[13px] text-muted">✓ {t('heroNote')}</span>
            </div>
          </div>

          {/* Visual: real dishes + real basket comparison */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-3">
              {heroDishes.map((id, i) => (
                <motion.div key={id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i, duration: 0.5 }}
                  className={`relative overflow-hidden rounded-[22px] shadow-[0_20px_40px_-24px_rgba(20,61,43,.6)] ${i % 2 ? 'translate-y-6' : ''}`}>
                  <DishPhoto id={id} alt={pick(RECIPE_BY_ID[id])} className="aspect-[4/3.3]" eager />
                  <div className="absolute bottom-2 left-2 right-2 rounded-xl bg-white/90 px-2.5 py-1.5 text-[11.5px] font-semibold text-[#11261b] backdrop-blur">
                    {pick(RECIPE_BY_ID[id])}
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }}
              className="relative z-10 -mt-10 ml-auto w-[92%] rounded-[22px] bg-deep p-5 text-white shadow-[0_30px_60px_-25px_rgba(20,61,43,.8)] sm:w-[78%]">
              <div className="flex items-center justify-between text-[12px]">
                <span className="font-bold uppercase tracking-[.1em] text-[#8fe0b0]">{t('basketCardTitle')}</span>
                <span className="opacity-70">{t('realPrices', { date: dateLabel(lang) })}</span>
              </div>
              <div className="mt-3 grid gap-2">
                {baskets.map((b) => (
                  <div key={b.label} className="flex items-center gap-3">
                    <span className="w-[110px] shrink-0 text-[13px] opacity-85">{b.label}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/15">
                      <motion.div className="h-full rounded-full bg-white/50" initial={{ width: 0 }} animate={{ width: `${(b.total / worst) * 100}%` }} transition={{ duration: 1, delay: 0.8 }} />
                    </div>
                    <span className="w-[70px] text-right font-bold tabular">{eur(b.total)}</span>
                  </div>
                ))}
                <div className="flex items-center gap-3">
                  <span className="w-[110px] shrink-0 text-[13px] font-bold text-[#8fe0b0]">{t('mixBasket')}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/15">
                    <motion.div className="h-full rounded-full bg-[#8fe0b0]" initial={{ width: 0 }} animate={{ width: `${(d.mix.total / worst) * 100}%` }} transition={{ duration: 1, delay: 1 }} />
                  </div>
                  <span className="w-[70px] text-right font-display text-[18px] font-extrabold text-[#8fe0b0] tabular"><CountUp value={d.mix.total} format={eur} /></span>
                </div>
              </div>
              <div className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-[12.5px]">
                💚 −{eur(worst - d.mix.total)} · {d.plan.days.reduce((s, x) => s + x.meals.length, 0)} {t('dishesWeek')}
              </div>
            </motion.div>
            {!reduce && <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 -z-10 h-[420px] w-[420px] rounded-full bg-leaf/60 blur-3xl" />}
          </div>
        </div>
      </section>

      {/* NOT A CALORIE COUNTER */}
      <section className="section bg-surface">
        <div className="container-site">
          <div className="max-w-[720px]">
            <h2 className="h2">{t('notCounterTitle')}</h2>
            <p className="lead mt-3">{t('notCounterSub')}</p>
          </div>
          <div className="mt-10 overflow-hidden rounded-[22px] border border-line">
            <div className="grid grid-cols-2 bg-bg text-[13px] font-bold uppercase tracking-[.08em] text-muted">
              <div className="px-4 py-3 md:px-6">{t('them')}</div>
              <div className="bg-soft px-4 py-3 text-accent md:px-6">{t('us')}</div>
            </div>
            {(['1', '2', '3', '4'] as const).map((n) => (
              <div key={n} className="grid grid-cols-2 border-t border-line text-[14px] md:text-[16px]">
                <div className="px-4 py-4 text-muted md:px-6">✕ {t(`cmp${n}a` as StringKey)}</div>
                <div className="bg-soft/50 px-4 py-4 font-semibold md:px-6">✓ {t(`cmp${n}b` as StringKey)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="section scroll-mt-16">
        <div className="container-site">
          <h2 className="h2 max-w-[720px]">{t('stepsTitle')}</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(['1', '2', '3', '4'] as const).map((n, i) => (
              <Rise key={n} i={i}>
                <div className="card h-full overflow-hidden">
                  <DishPhoto id={['tofu_scramble', 'curd_honey', 'turkey_pasta', 'chickpea_curry'][i]} alt="" className="aspect-[16/10]" />
                  <div className="p-5">
                    <div className="font-display text-[13px] font-bold text-accent">0{n}</div>
                    <div className="mt-1 text-[18px] font-bold">{t(`st${n}t` as StringKey)}</div>
                    <p className="mt-1.5 text-[14px] text-muted">{t(`st${n}d` as StringKey)}</p>
                  </div>
                </div>
              </Rise>
            ))}
          </div>
        </div>
      </section>

      {/* WEEK */}
      <WeekPreview />

      {/* REAL PRICES */}
      <section id="prices" className="section scroll-mt-16">
        <div className="container-site grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:items-start">
          <div>
            <h2 className="h2">{t('pricesTitle2')}</h2>
            <p className="lead mt-3">{t('pricesSub2')}</p>
            <img src="/img/site/produce.jpg" alt="" loading="lazy" className="mt-8 hidden aspect-[4/3] w-full rounded-[22px] object-cover lg:block" />
          </div>
          <PriceTable />
        </div>
      </section>

      {/* FOR WHOM */}
      <section className="section bg-surface">
        <div className="container-site">
          <h2 className="h2">{t('forWhom')}</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {(['1', '2', '3'] as const).map((n, i) => (
              <div key={n} className="card overflow-hidden">
                <img src={['/img/site/bowl.jpg', '/img/site/mealbowl.jpg', '/img/site/veggies.jpg'][i]} alt="" loading="lazy" className="aspect-[16/10] w-full object-cover" />
                <div className="p-5"><div className="text-[18px] font-bold">{t(`fw${n}t` as StringKey)}</div><p className="mt-1.5 text-[14px] text-muted">{t(`fw${n}d` as StringKey)}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Reviews />
      <Plans />

      {/* FAQ */}
      <section id="faq" className="section scroll-mt-16 bg-surface">
        <div className="container-site max-w-[860px]">
          <h2 className="h2">{t('faqTitle')}</h2>
          <div className="mt-8 grid gap-2.5">
            {(['1', '2', '3', '4', '5'] as const).map((n) => (
              <details key={n} className="card group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between font-semibold marker:hidden">
                  {t(`faq${n}q` as StringKey)}<span className="text-accent transition group-open:rotate-45">＋</span>
                </summary>
                <p className="mt-3 text-[15px] text-muted">{t(`faq${n}a` as StringKey)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="section">
        <div className="container-site">
          <div className="relative overflow-hidden rounded-[28px] bg-deep px-6 py-12 text-center text-white md:px-12 md:py-16">
            <img src="/img/site/supermarket.jpg" alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-20" />
            <div className="relative">
              <h2 className="h2 mx-auto max-w-[720px]">{t('heroTitle2')}</h2>
              <p className="mx-auto mt-3 max-w-[560px] opacity-85">{t('trialSub')}</p>
              <button type="button" onClick={() => nav('/quiz')} className="btn-lg mx-auto mt-7 !bg-white !text-[#143d2b]">{t('startTrial')}</button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function WeekPreview() {
  const { t, lang, pick } = useI18n();
  const d = demo();
  const [day, setDay] = useState(0);
  const meals = d.plan.days[day].meals;
  return (
    <section id="week" className="section scroll-mt-16 bg-surface">
      <div className="container-site">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div><h2 className="h2">{t('weekTitle')}</h2><p className="lead mt-2">{t('weekSub')}</p></div>
          <div className="flex gap-1.5" role="group">
            {DAY_SHORT[lang].map((x, i) => (
              <button key={x} type="button" aria-pressed={day === i} onClick={() => setDay(i)}
                className={`h-10 w-10 rounded-xl text-[13px] font-semibold transition ${day === i ? 'bg-deep text-white' : 'border border-line bg-bg'}`}>{x}</button>
            ))}
          </div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {meals.map((m, i) => {
            const r = RECIPE_BY_ID[m.recipeId];
            return (
              <motion.div key={`${day}-${i}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
               <Link to={`/recipe/${r.id}?s=${m.servings}`} className="card block h-full overflow-hidden transition hover:-translate-y-0.5">
                <DishPhoto id={r.id} alt={pick(r)} className="aspect-[4/3]" />
                <div className="p-4">
                  <div className="text-[12px] text-muted">{r.minutes} {t('min')} · {m.kcal} {t('kcal')}</div>
                  <div className="mt-0.5 font-bold leading-snug">{pick(r)}</div>
                  <div className="mt-2 inline-block rounded-lg bg-soft px-2 py-1 text-[12.5px] font-bold text-accent">{formatEur(m.cost, lang)} / {t('servings')}</div>
                  <div className="mt-2 text-[13px] font-bold text-accent">{t('openRecipe')} →</div>
                </div>
               </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const TABLE_ITEMS = ['chicken_breast', 'turkey_mince', 'cod', 'eggs', 'cottage_cheese', 'buckwheat', 'broccoli', 'tomato', 'berries', 'olive_oil'];

function PriceTable() {
  const { t, lang, pick } = useI18n();
  const rows = useMemo(() => TABLE_ITEMS.map((id) => ({ id, b: PRICES[id]?.barbora, r: PRICES[id]?.rimi })), []);
  const eur = (n: number) => formatEur(n, lang);
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-[14px]">
          <thead>
            <tr className="bg-bg text-left text-[12px] uppercase tracking-[.08em] text-muted">
              <th className="px-4 py-3">{t('product')}</th><th className="px-4 py-3">Barbora</th><th className="px-4 py-3">Rimi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ id, b, r }) => {
              const best = b && r ? (b.perKg <= r.perKg ? 'b' : 'r') : b ? 'b' : 'r';
              const cell = (o: typeof b, isBest: boolean) => o ? (
                <a href={o.url ?? undefined} target="_blank" rel="noreferrer" className={`block rounded-lg px-2 py-1 ${isBest ? 'bg-soft' : ''}`}>
                  <div className={`font-bold tabular ${isBest ? 'text-accent' : ''}`}>{eur(o.perKg)}/kg {isBest && <span className="text-[10px] uppercase">· {t('cheapestTag')}</span>}</div>
                  <div className="line-clamp-1 text-[11.5px] text-muted">{o.name}</div>
                </a>
              ) : <span className="text-muted">—</span>;
              return (
                <tr key={id} className="border-t border-line align-top">
                  <td className="px-4 py-3 font-semibold">{INGREDIENT_BY_ID[id].emoji} {pick(INGREDIENT_BY_ID[id])}</td>
                  <td className="px-2 py-2">{cell(b, best === 'b')}</td>
                  <td className="px-2 py-2">{cell(r, best === 'r')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="border-t border-line px-4 py-3 text-[12px] text-muted">{t('pricesFrom', { date: dateLabel(lang) })}</p>
    </div>
  );
}

const REVIEWS = [
  { name: { lt: 'Ieva, 29', ru: 'Ева, 29' }, text: { lt: 'Pirmą kartą laikausi meniu ilgiau nei savaitę. Ir išleidžiu mažiau nei anksčiau.', ru: 'Впервые держусь меню дольше недели. И трачу меньше, чем раньше.' }, img: 'oat_berries' },
  { name: { lt: 'Tomas, 34', ru: 'Томас, 34' }, text: { lt: 'Sportuoju 4 kartus per savaitę — baltymų užtenka, o krepšelis telpa į 60 €.', ru: 'Тренируюсь 4 раза в неделю — белка хватает, а корзина укладывается в 60 €.' }, img: 'chicken_buckwheat' },
  { name: { lt: 'Olga, 41', ru: 'Ольга, 41' }, text: { lt: 'Vaikas alergiškas riešutams — meniu tai atsižvelgia automatiškai.', ru: 'У ребёнка аллергия на орехи — меню учитывает это автоматически.' }, img: 'cod_veg' },
];

function Reviews() {
  const { t, pick } = useI18n();
  return (
    <section className="section">
      <div className="container-site">
        <h2 className="h2">{t('reviewsTitle')}</h2>
        <p className="mt-2 inline-block rounded-lg bg-warm/40 px-3 py-1.5 text-[12.5px] font-semibold">{t('reviewsNote')}</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {REVIEWS.map((r) => (
            <figure key={r.img} className="card relative p-6">
              <span className="absolute right-4 top-4 rounded-full bg-warm/50 px-2 py-0.5 text-[10px] font-bold uppercase">{t('reviewSample')}</span>
              <div className="text-[#e3a72f]" aria-hidden>★★★★★</div>
              <blockquote className="mt-3 text-[16px] leading-relaxed">“{pick(r.text)}”</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <DishPhoto id={r.img} alt="" className="h-10 w-10 rounded-full" />
                <span className="font-semibold">{pick(r.name)}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Plans({ onStart }: { onStart?: () => void }) {
  const { t, lang } = useI18n();
  const nav = useNavigate();
  const eur = (n: number) => formatEur(n, lang);
  const plans = [
    { name: t('plan2w'), note: t('plan2wNote'), price: 9.99 },
    { name: t('plan1m'), note: t('plan1mNote'), price: 12.99, popular: true },
    { name: t('plan3m'), note: t('plan3mNote'), price: 29.99 },
  ];
  return (
    <section id="plans" className="section scroll-mt-16 bg-surface">
      <div className="container-site">
        <div className="mx-auto max-w-[720px] text-center">
          <div className="eyebrow">{t('navPlans')}</div>
          <h2 className="h2">{t('trialTitle')}</h2>
          <p className="lead mt-3">{t('trialSub')}</p>
          <button type="button" onClick={() => (onStart ? onStart() : nav('/quiz'))} className="btn-lg mx-auto mt-7">{t('startTrial')}</button>
        </div>
        <div className="mx-auto mt-12 max-w-[900px]">
          <div className="mb-3 text-center text-[13px] font-semibold uppercase tracking-[.1em] text-muted">{t('afterTrial')}</div>
          <div className="grid gap-3 md:grid-cols-3">
            {plans.map((p) => (
              <div key={p.name} className={`relative rounded-[20px] border-2 bg-bg p-5 ${p.popular ? 'border-accent' : 'border-line'}`}>
                {p.popular && <span className="absolute -top-3 left-5 rounded-full bg-warm px-2.5 py-0.5 text-[10.5px] font-extrabold text-[#4a3200]">{t('popular')}</span>}
                <div className="font-bold">{p.name}</div>
                <div className="mt-2 font-display text-[30px] font-extrabold tabular">{eur(p.price)}</div>
                <div className="text-[13px] text-muted">{p.note}</div>
              </div>
            ))}
          </div>
          <ul className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-1 text-[14px]"><li>✓ {t('g1')}</li><li>✓ {t('g2')}</li><li>✓ {t('g3')}</li></ul>
        </div>
      </div>
    </section>
  );
}

