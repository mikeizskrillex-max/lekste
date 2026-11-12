import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { DishPhoto, SiteFooter, SiteHeader } from '../components/site';
import { INGREDIENT_BY_ID } from '../data/ingredients';
import { PRICES, STORE_LABEL } from '../data/prices';
import { DETAILS, type Step } from '../data/recipeDetails';
import { RECIPE_BY_ID } from '../data/recipeIndex';
import { formatEur, useI18n } from '../i18n/I18n';
import { ALLERGEN_LABEL, type StringKey } from '../i18n/strings';
import { cheapest } from '../lib/pricing';
import { recipeFacts } from '../lib/recipes';
import { useStore } from '../lib/store';
import { kitchenMeasure } from '../lib/units';

/** Public recipe page (/recipe/:id) with site header and footer. */
export function PublicRecipe() {
  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader />
      <main className="container-site py-6 md:py-10"><RecipeView /></main>
      <SiteFooter />
    </div>
  );
}

/** Full recipe: photo, facts, servings, ingredients checklist, steps with timers, cook mode. */
export function RecipeView() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const { t, lang, pick } = useI18n();
  const { answers, quizDone } = useStore();
  const nav = useNavigate();
  const r = RECIPE_BY_ID[id];
  const det = DETAILS[id];
  const portion = Number(params.get('s')) > 0 ? Number(params.get('s')) : 1;
  const [people, setPeople] = useState(quizDone ? answers.household : 2);
  const [have, setHave] = useState<string[]>([]);
  const [cook, setCook] = useState(false);
  if (!r || !det) return <p className="py-20 text-center font-semibold">{t('recipeNotFound')}</p>;

  const f = recipeFacts(r);
  const k = portion * people;
  const eur = (n: number) => formatEur(n, lang);
  const steps = det.steps;
  const per = (x: number) => Math.round(x * portion);
  const allEquipment = ['stove', ...r.equipment.filter((e) => e !== 'stove')];

  return (
    <article className="pb-10">
      <button type="button" onClick={() => nav(-1)} className="mb-3 text-[14px] font-semibold text-muted hover:text-ink">← {t('back')}</button>

      {/* Hero */}
      <header className="relative overflow-hidden rounded-[26px]">
        <DishPhoto id={r.id} alt={pick(r)} className="aspect-[4/3] sm:aspect-[16/8] md:aspect-[16/7]" eager />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white md:p-8">
          <div className="text-[12px] font-bold uppercase tracking-[.12em] text-[#8fe0b0]">{t(`cuisine_${r.cuisine}` as StringKey)}</div>
          <h1 className="mt-1 max-w-[760px] font-display text-[26px] font-extrabold leading-tight md:text-[42px]">{pick(r)}</h1>
          <div className="mt-3 flex flex-wrap gap-2 text-[13px] font-semibold">
            <span className="rounded-full bg-white/20 px-3 py-1.5 backdrop-blur">⏱ {det.prep + det.cook} {t('min')}</span>
            <span className="rounded-full bg-white/20 px-3 py-1.5 backdrop-blur">🔥 {per(f.kcal)} {t('kcal')}</span>
            <span className="rounded-full bg-white/20 px-3 py-1.5 backdrop-blur">💪 {per(f.protein)} g {t('protein')}</span>
            <span className="rounded-full bg-white/20 px-3 py-1.5 backdrop-blur">💶 {eur(f.cost * portion)} / {t('perPortion')}</span>
            <span className="rounded-full bg-white/20 px-3 py-1.5 backdrop-blur">{'●'.repeat(det.level)}{'○'.repeat(3 - det.level)} {t(`level${det.level}` as StringKey)}</span>
          </div>
        </div>
        <span className="absolute right-3 top-3 rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-white">{t('illustration')}</span>
      </header>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center sm:max-w-[520px]">
        {[[t('prepTime'), det.prep], [t('cookTime'), det.cook], [t('totalTime'), det.prep + det.cook]].map(([l, v]) => (
          <div key={String(l)} className="card p-3"><div className="text-[12px] text-muted">{l}</div><div className="font-display text-[20px] font-extrabold">{v} <span className="text-[12px] font-semibold">{t('min')}</span></div></div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr] lg:items-start">
        {/* Ingredients */}
        <aside className="card p-5 lg:sticky lg:top-20">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-[20px] font-extrabold">{t('youNeed')}</h2>
            <div className="flex items-center gap-1 rounded-xl border border-line p-1" role="group" aria-label={t('people')}>
              <button type="button" onClick={() => setPeople(Math.max(1, people - 1))} className="h-8 w-8 rounded-lg font-bold hover:bg-soft" aria-label="−">−</button>
              <span className="min-w-[64px] text-center text-[13px] font-bold">{people} 👤</span>
              <button type="button" onClick={() => setPeople(Math.min(8, people + 1))} className="h-8 w-8 rounded-lg font-bold hover:bg-soft" aria-label="+">+</button>
            </div>
          </div>
          <ul className="mt-4 grid gap-1">
            {r.items.map(([ing, g]) => {
              const i = INGREDIENT_BY_ID[ing];
              const grams = Math.round(g * k);
              const measure = kitchenMeasure(ing, grams, lang);
              const c = cheapest(ing);
              const offer = c ? PRICES[ing]?.[c.store] : undefined;
              const on = have.includes(ing);
              return (
                <li key={ing}>
                  <label className={`flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2.5 transition hover:bg-bg ${on ? 'opacity-55' : ''}`}>
                    <input type="checkbox" checked={on} onChange={() => setHave(on ? have.filter((x) => x !== ing) : [...have, ing])} className="mt-1 h-5 w-5 shrink-0 accent-[rgb(var(--accent))]" />
                    <span className="text-[22px] leading-none" aria-hidden>{i.emoji}</span>
                    <span className="min-w-0 flex-1">
                      <span className={`block font-semibold ${on ? 'line-through' : ''}`}>{pick(i)}</span>
                      {c && offer && (
                        <span className="block truncate text-[12px] text-muted">
                          {t('buyAt')}: {offer.url ? <a href={offer.url} target="_blank" rel="noreferrer" className="underline decoration-line underline-offset-2 hover:text-accent">{STORE_LABEL[c.store]}</a> : STORE_LABEL[c.store]}
                          {offer.promo && <span className="ml-1.5 rounded bg-warm px-1.5 py-0.5 text-[10px] font-bold text-[#4a3200]">{t('onPromo')}</span>}
                        </span>
                      )}
                    </span>
                    <span className="text-right">
                      <span className="block font-bold tabular">{grams} g</span>
                      {measure && <span className="block text-[12px] text-muted">{measure}</span>}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 border-t border-line pt-4">
            <div className="text-[13px] font-bold text-muted">{t('equipmentNeeded')}</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {allEquipment.map((e) => <span key={e} className="rounded-full bg-soft px-3 py-1 text-[12.5px] font-semibold">{t(`eq_${e}` as StringKey)}</span>)}
            </div>
          </div>
          <button type="button" onClick={() => setCook(true)} className="btn mt-5">👩‍🍳 {t('startCooking')}</button>
        </aside>

        {/* Steps */}
        <section>
          <h2 className="font-display text-[22px] font-extrabold">{t('howToCook')}</h2>
          <ol className="mt-4 grid gap-3">
            {steps.map((s, i) => (
              <motion.li key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}
                className="card flex gap-4 p-4 md:p-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent font-display text-[16px] font-extrabold text-onaccent">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15.5px] leading-relaxed md:text-[16.5px]">{lang === 'lt' ? s[2] : s[1]}</p>
                  {s[0] > 0 && <div className="mt-3"><Timer minutes={s[0]} /></div>}
                </div>
              </motion.li>
            ))}
          </ol>

          <div className="mt-5 flex gap-3 rounded-[20px] bg-warm/30 p-5">
            <span className="text-[26px]" aria-hidden>💡</span>
            <div><div className="font-bold">{t('chefTip')}</div><p className="mt-1 text-[15px]">{lang === 'lt' ? det.tip[1] : det.tip[0]}</p></div>
          </div>

          <div className="card mt-5 p-5">
            <div className="font-bold">{t('nutrition')}</div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
              {([[per(f.kcal), t('kcal')], [`${per(f.protein)} g`, t('protein')], [`${per(f.fat)} g`, t('fat')], [`${per(f.carbs)} g`, t('carbs')], [`${per(f.fiber)} g`, t('fiber')], [`${per(f.sugar)} g`, t('sugar')]] as const).map(([v, l]) => (
                <div key={l} className="rounded-xl bg-bg p-2.5"><div className="font-bold tabular">{v}</div><div className="text-[11.5px] text-muted">{l}</div></div>
              ))}
            </div>
            <p className="mt-3 text-[13px] text-muted">
              {f.allergens.length ? `⚠️ ${t('containsAllergens')}: ${f.allergens.map((a) => pick(ALLERGEN_LABEL[a])).join(', ')}` : `✓ ${t('noAllergensListed')}`}
            </p>
          </div>
          {!quizDone && <Link to="/quiz" className="btn mt-6 sm:w-auto sm:px-7">{t('startTrial')}</Link>}
        </section>
      </div>

      <AnimatePresence>{cook && <CookMode title={pick(r)} steps={steps} onClose={() => setCook(false)} />}</AnimatePresence>
    </article>
  );
}

/** Countdown timer for a cooking step. */
function Timer({ minutes, big = false }: { minutes: number; big?: boolean }) {
  const { t } = useI18n();
  const [left, setLeft] = useState(minutes * 60);
  const [running, setRunning] = useState(false);
  const ref = useRef<number | null>(null);
  useEffect(() => { setLeft(minutes * 60); setRunning(false); }, [minutes]);
  useEffect(() => {
    if (!running) return;
    ref.current = window.setInterval(() => setLeft((x) => {
      if (x <= 1) { setRunning(false); try { navigator.vibrate?.([200, 100, 200]); } catch { /* not supported */ } return 0; }
      return x - 1;
    }), 1000);
    return () => { if (ref.current) window.clearInterval(ref.current); };
  }, [running]);
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  const doneNow = left === 0;
  const frac = 1 - left / (minutes * 60);
  return (
    <div className={`inline-flex items-center gap-3 rounded-2xl ${big ? 'bg-white/10 px-5 py-3' : 'bg-soft px-3 py-2'}`}>
      <span className={`relative grid place-items-center ${big ? 'h-14 w-14' : 'h-9 w-9'}`}>
        <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
          <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeOpacity=".15" strokeWidth="3" />
          <circle cx="18" cy="18" r="15" fill="none" stroke="rgb(var(--accent))" strokeWidth="3" strokeLinecap="round" strokeDasharray={94.2} strokeDashoffset={94.2 * (1 - frac)} />
        </svg>
        <span className={big ? 'text-[20px]' : 'text-[13px]'} aria-hidden>⏱</span>
      </span>
      <span className={`font-display font-extrabold tabular ${big ? 'text-[34px]' : 'text-[18px]'} ${doneNow ? 'text-accent' : ''}`} aria-live="polite">{doneNow ? t('done') : `${mm}:${ss}`}</span>
      {!doneNow && (
        <button type="button" onClick={() => setRunning(!running)} className={`rounded-xl bg-accent font-bold text-onaccent ${big ? 'px-5 py-2.5 text-[16px]' : 'px-3 py-1.5 text-[13px]'}`}>
          {running ? `❚❚ ${t('pause')}` : `▶ ${t('start')}`}
        </button>
      )}
      {(doneNow || left !== minutes * 60) && (
        <button type="button" onClick={() => { setLeft(minutes * 60); setRunning(false); }} className="text-[13px] font-semibold opacity-70" aria-label="Reset">↺</button>
      )}
    </div>
  );
}

/** Full-screen step-by-step mode with large text, for cooking with wet hands. */
function CookMode({ title, steps, onClose }: { title: string; steps: Step[]; onClose: () => void }) {
  const { t, lang } = useI18n();
  const [i, setI] = useState(0);
  const last = i === steps.length - 1;
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } };
    nav.wakeLock?.request('screen').then((l) => { lock = l; }).catch(() => { /* not available */ });
    const key = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setI((x) => Math.min(steps.length - 1, x + 1));
      if (e.key === 'ArrowLeft') setI((x) => Math.max(0, x - 1));
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('keydown', key); lock?.release().catch(() => {}); };
  }, [steps.length, onClose]);
  const s = steps[i];
  return (
    <motion.div role="dialog" aria-modal="true" aria-label={t('cookMode')} className="fixed inset-0 z-50 flex flex-col bg-deep text-white"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-[max(16px,env(safe-area-inset-top))]">
        <div className="min-w-0"><div className="text-[12px] font-bold uppercase tracking-[.12em] text-[#8fe0b0]">{t('cookMode')}</div><div className="truncate font-semibold">{title}</div></div>
        <button type="button" onClick={onClose} className="rounded-xl bg-white/10 px-4 py-2 font-semibold">✕ {t('close')}</button>
      </div>
      <div className="flex gap-1.5 px-5">
        {steps.map((_, j) => <span key={j} className={`h-1.5 flex-1 rounded-full transition ${j <= i ? 'bg-[#8fe0b0]' : 'bg-white/15'}`} />)}
      </div>
      <div className="mx-auto flex w-full max-w-[860px] flex-1 flex-col justify-center px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
            <div className="font-display text-[15px] font-bold text-[#8fe0b0]">{t('step')} {i + 1} / {steps.length}</div>
            <p className="mt-4 text-[26px] font-semibold leading-snug md:text-[38px]">{lang === 'lt' ? s[2] : s[1]}</p>
            {s[0] > 0 && <div className="mt-8"><Timer key={i} minutes={s[0]} big /></div>}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="grid grid-cols-2 gap-3 px-5 pb-[max(20px,env(safe-area-inset-bottom))]">
        <button type="button" disabled={i === 0} onClick={() => setI(i - 1)} className="rounded-2xl bg-white/10 py-4 text-[17px] font-bold disabled:opacity-30">← {t('prev')}</button>
        <button type="button" onClick={() => (last ? onClose() : setI(i + 1))} className="rounded-2xl bg-[#8fe0b0] py-4 text-[17px] font-bold text-[#0e2a1d]">
          {last ? `🎉 ${t('finish')}` : `${t('nextStep')} →`}
        </button>
      </div>
    </motion.div>
  );
}
