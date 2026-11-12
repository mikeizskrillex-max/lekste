import { AnimatePresence, motion } from 'framer-motion';
import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LangSwitch, Logo } from '../components/ui';
import { DISLIKE_OPTIONS, INGREDIENT_BY_ID } from '../data/ingredients';
import { formatEur, useI18n } from '../i18n/I18n';
import { ALLERGEN_LABEL, type StringKey } from '../i18n/strings';
import { useStore } from '../lib/store';
import { ALLERGENS, type Activity, type Allergen, type DietType, type Equipment, type Goal, type HealthFlag, type QuizAnswers } from '../lib/types';

const PROTEIN_GROUPS: { emoji: string; lt: string; ru: string; ids: string[] }[] = [
  { emoji: '🍗', lt: 'Vištiena', ru: 'Курица', ids: ['chicken_breast'] },
  { emoji: '🦃', lt: 'Kalakutiena', ru: 'Индейка', ids: ['turkey_mince'] },
  { emoji: '🥩', lt: 'Jautiena', ru: 'Говядина', ids: ['beef_mince'] },
  { emoji: '🥓', lt: 'Kiauliena', ru: 'Свинина', ids: ['pork_loin'] },
  { emoji: '🐟', lt: 'Žuvis', ru: 'Рыба', ids: ['cod', 'salmon', 'tuna_can'] },
  { emoji: '🥚', lt: 'Kiaušiniai', ru: 'Яйца', ids: ['eggs'] },
  { emoji: '🧀', lt: 'Varškė ir sūris', ru: 'Творог и сыр', ids: ['cottage_cheese', 'cheese', 'greek_yogurt'] },
  { emoji: '🫘', lt: 'Ankštiniai', ru: 'Бобовые', ids: ['beans', 'chickpeas', 'lentils'] },
  { emoji: '⬜', lt: 'Tofu', ru: 'Тофу', ids: ['tofu'] },
];

type StepId = 'goal' | 'sex' | 'body' | 'activity' | 'budget' | 'inter' | 'allergens' | 'diet' | 'dislikes' | 'likes' | 'meals' | 'cooking' | 'spice' | 'health' | 'summary';
const STEPS: StepId[] = ['goal', 'sex', 'body', 'activity', 'budget', 'inter', 'allergens', 'diet', 'dislikes', 'likes', 'meals', 'cooking', 'spice', 'health', 'summary'];
const SKIPPABLE: StepId[] = ['dislikes', 'likes', 'meals', 'cooking', 'spice'];

export function Quiz() {
  const { t, lang, pick } = useI18n();
  const { answers: a, setAnswers, finishQuiz } = useStore();
  const nav = useNavigate();
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const step = STEPS[i];
  const go = (d: number) => { setDir(d); setI((x) => Math.max(0, Math.min(STEPS.length - 1, x + d))); };
  const healthStop = a.health.length > 0;
  const under18 = a.age < 18;

  const toggle = <T,>(list: T[], v: T): T[] => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const canNext = (() => {
    if (step === 'body') return !under18;
    if (step === 'summary') return a.consentHealth && a.consentTerms && /\S+@\S+\.\S+/.test(a.email);
    if (step === 'health') return !healthStop;
    return true;
  })();

  function body(): ReactNode {
    switch (step) {
      case 'goal':
        return (<><Q>{t('qGoal')}</Q><div className="grid gap-2">
          {(['lose', 'keep', 'gain', 'healthy'] as Goal[]).map((g, k) => (
            <Opt key={g} on={a.goal === g} onClick={() => setAnswers({ goal: g })}><span className="text-[22px]">{['🔥', '⚖️', '💪', '🥦'][k]}</span>{t(`goal_${g}` as StringKey)}</Opt>
          ))}</div></>);
      case 'sex':
        return (<><Q>{t('qSex')}</Q><div className="grid grid-cols-2 gap-2">
          {(['f', 'm'] as const).map((s) => <Opt key={s} on={a.sex === s} onClick={() => setAnswers({ sex: s })}>{t(`sex_${s}` as StringKey)}</Opt>)}
        </div></>);
      case 'body':
        return (<><Q>{t('qBody')}</Q>
          <Slider id="age" label={t('age')} value={a.age} min={16} max={80} unit="" onChange={(v) => setAnswers({ age: v })} />
          {under18 && <p className="-mt-2 mb-4 rounded-xl bg-rose/60 p-3 text-[14px]">{t('under18')}</p>}
          <Slider id="height" label={t('height')} value={a.heightCm} min={145} max={210} unit=" cm" onChange={(v) => setAnswers({ heightCm: v })} />
          <Slider id="weight" label={t('weight')} value={a.weightKg} min={40} max={160} unit=" kg" onChange={(v) => setAnswers({ weightKg: v, targetWeightKg: a.goal === 'lose' ? Math.min(a.targetWeightKg, v) : Math.max(a.targetWeightKg, v) })} />
          {(a.goal === 'lose' || a.goal === 'gain') && (
            <Slider id="target" label={t('targetWeight')} value={a.targetWeightKg}
              min={a.goal === 'lose' ? 40 : a.weightKg} max={a.goal === 'lose' ? a.weightKg : 160} unit=" kg" onChange={(v) => setAnswers({ targetWeightKg: v })} />
          )}
        </>);
      case 'activity':
        return (<><Q>{t('qActivity')}</Q><div className="grid gap-2">
          {(['sedentary', 'light', 'moderate', 'high'] as Activity[]).map((x) => <Opt key={x} on={a.activity === x} onClick={() => setAnswers({ activity: x })}>{t(`act_${x}` as StringKey)}</Opt>)}
        </div></>);
      case 'budget':
        return (<><Q>{t('qHousehold')}</Q><div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((n) => <Opt key={n} on={a.household === n} onClick={() => setAnswers({ household: n, weeklyBudget: Math.max(a.weeklyBudget, n * 30) })}><span className="w-full text-center">{n}{n === 4 ? '+' : ''}</span></Opt>)}
        </div>
          <div className="mt-6"><Slider id="budget" label={t('qBudget')} value={a.weeklyBudget} min={25} max={200} step={5} unit=" €" onChange={(v) => setAnswers({ weeklyBudget: v })} /></div>
          <p className="text-[13px] text-muted">≈ {formatEur(a.weeklyBudget / 7 / a.household, lang)} {t('perDay')}</p>
        </>);
      case 'inter':
        return (<div className="grid place-items-center pt-16 text-center">
          <motion.div className="text-[72px]" animate={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>🥗</motion.div>
          <h1 className="mt-4 font-display text-[22px] font-extrabold">{t('interTitle')}</h1>
          <p className="mt-2 text-muted">{t('interSub')}</p>
        </div>);
      case 'allergens':
        return (<><Q>{t('qAllergens')}</Q>
          <div className="flex flex-wrap gap-2">
            {ALLERGENS.map((al: Allergen) => (
              <Chip key={al} on={a.allergens.includes(al)} onClick={() => setAnswers({ allergens: toggle(a.allergens, al) })}>
                {ALLERGEN_LABEL[al].emoji} {pick(ALLERGEN_LABEL[al])}
              </Chip>
            ))}
            <Chip on={a.allergens.length === 0} onClick={() => setAnswers({ allergens: [] })}>✓ {t('noAllergies')}</Chip>
          </div>
          <Label>&nbsp;</Label>
          <Opt on={a.lactoseIntolerant} onClick={() => setAnswers({ lactoseIntolerant: !a.lactoseIntolerant })}>🥛 {t('lactose')}</Opt>
          {(a.allergens.length > 0 || a.lactoseIntolerant) && <p className="mt-4 rounded-xl bg-warm/40 p-3 text-[13px] leading-snug">⚠️ {t('allergyWarn')}</p>}
        </>);
      case 'diet':
        return (<><Q>{t('qDiet')}</Q><div className="grid gap-2">
          {(['any', 'vegetarian', 'vegan', 'pescatarian', 'no_pork', 'no_beef', 'low_carb'] as DietType[]).map((d) => <Opt key={d} on={a.dietType === d} onClick={() => setAnswers({ dietType: d })}>{t(`diet_${d}` as StringKey)}</Opt>)}
        </div></>);
      case 'dislikes':
        return (<><Q>{t('qDislikes')}</Q>
          <p className="-mt-2 mb-3 text-[13px] text-muted">{t('dislikesHint')}</p>
          <div className="flex flex-wrap gap-2">
            {DISLIKE_OPTIONS.map((id) => {
              const ing = INGREDIENT_BY_ID[id];
              const state = a.never.includes(id) ? 2 : a.avoid.includes(id) ? 1 : 0;
              const cycle = () => {
                const avoid = a.avoid.filter((x) => x !== id);
                const never = a.never.filter((x) => x !== id);
                if (state === 0) avoid.push(id);
                if (state === 1) never.push(id);
                setAnswers({ avoid, never });
              };
              return (
                <button key={id} type="button" onClick={cycle} aria-pressed={state > 0}
                  className={`chip ${state === 2 ? '!border-[#c0392b] !bg-rose/50 !text-ink' : ''}`}>
                  {ing.emoji} {pick(ing)}{state === 1 && <small className="text-accent">· {t('less')}</small>}{state === 2 && <small className="font-bold">· {t('never')}</small>}
                </button>
              );
            })}
          </div></>);
      case 'likes':
        return (<><Q>{t('qLikes')}</Q>
          <Label>{t('likedProteins')}</Label>
          <div className="flex flex-wrap gap-2">
            {PROTEIN_GROUPS.map((g) => {
              const on = g.ids.every((id) => a.likedProteins.includes(id));
              return <Chip key={g.emoji} on={on} onClick={() => setAnswers({ likedProteins: on ? a.likedProteins.filter((x) => !g.ids.includes(x)) : [...a.likedProteins, ...g.ids] })}>{g.emoji} {pick(g)}</Chip>;
            })}
          </div>
          <Label>{t('likedCuisines')}</Label>
          <div className="flex flex-wrap gap-2">
            {['home', 'mediterranean', 'italian', 'asian', 'georgian'].map((c) => <Chip key={c} on={a.likedCuisines.includes(c)} onClick={() => setAnswers({ likedCuisines: toggle(a.likedCuisines, c) })}>{t(`cuisine_${c}` as StringKey)}</Chip>)}
          </div></>);
      case 'meals':
        return (<><Q>{t('qMeals')}</Q><div className="grid gap-2">
          {([3, 4, 5] as const).map((n) => <Opt key={n} on={a.mealsPerDay === n} onClick={() => setAnswers({ mealsPerDay: n })}>{t(`meals_${n}` as StringKey)}</Opt>)}
        </div>
          <Label>{t('breakfast')}</Label>
          <div className="grid grid-cols-3 gap-2">
            {(['sweet', 'savory', 'none'] as const).map((b) => <Opt key={b} on={a.breakfastStyle === b} onClick={() => setAnswers({ breakfastStyle: b })}><span className="w-full text-center text-[14px]">{t(`bf_${b}` as StringKey)}</span></Opt>)}
          </div></>);
      case 'cooking':
        return (<><Q>{t('qCooking')}</Q>
          <Label>{t('timePerDish')}</Label>
          <div className="grid grid-cols-3 gap-2">
            {([15, 30, 60] as const).map((m) => <Opt key={m} on={a.cookingTimeMax === m} onClick={() => setAnswers({ cookingTimeMax: m })}><span className="w-full text-center">{t('upTo')} {m} {t('min')}</span></Opt>)}
          </div>
          <Label>{t('equipment')}</Label>
          <div className="flex flex-wrap gap-2">
            {(['oven', 'airfryer', 'multicooker', 'blender'] as Equipment[]).map((e) => <Chip key={e} on={a.equipment.includes(e)} onClick={() => setAnswers({ equipment: toggle(a.equipment, e) })}>{t(`eq_${e}` as StringKey)}</Chip>)}
          </div>
          <Label>&nbsp;</Label>
          <Opt on={a.batchCooking} onClick={() => setAnswers({ batchCooking: !a.batchCooking })}>
            <span><span className="block">🍱 {t('batch')}</span><span className="block text-[12px] font-normal text-muted">{t('batchHint')}</span></span>
          </Opt>
        </>);
      case 'spice':
        return (<><Q>{t('qSpice')}</Q><div className="grid gap-2">
          {([0, 1, 2] as const).map((s) => <Opt key={s} on={a.spice === s} onClick={() => setAnswers({ spice: s })}>{['🙂', '🌶️', '🌶️🌶️'][s]} {t(`spice_${s}` as StringKey)}</Opt>)}
        </div></>);
      case 'health':
        return (<><Q>{t('qHealth')}</Q><div className="grid gap-2">
          {(['pregnancy', 'breastfeeding', 'diabetes', 'eating_disorder', 'other'] as HealthFlag[]).map((h) => <Opt key={h} on={a.health.includes(h)} onClick={() => setAnswers({ health: toggle(a.health, h) })}>{t(`h_${h}` as StringKey)}</Opt>)}
          <Opt on={a.health.length === 0} onClick={() => setAnswers({ health: [] })}>✓ {t('h_none')}</Opt>
        </div>
          {healthStop && (
            <div className="mt-5 rounded-card bg-soft p-4">
              <div className="font-bold">🩺 {t('healthStopTitle')}</div>
              <p className="mt-1 text-[14px] text-muted">{t('healthStopText')}</p>
            </div>
          )}
        </>);
      case 'summary':
        return <Summary a={a} goTo={(s) => { setDir(-1); setI(STEPS.indexOf(s)); }} />;
    }
  }

  function finish() {
    finishQuiz();
    nav('/result');
  }

  const progress = (i + 1) / STEPS.length;
  return (
    <div className="flex min-h-screen flex-col bg-bg md:bg-field">
      <header className="container-app flex items-center justify-between pb-2 pt-4 md:max-w-[640px]">
        <button type="button" onClick={() => (i === 0 ? nav('/') : go(-1))} className="text-[14px] font-semibold text-muted">← {t('back')}</button>
        <Logo />
        <LangSwitch />
      </header>
      <div className="container-app md:max-w-[640px]">
        <div className="flex items-center justify-between text-[11px] text-muted"><span>{i + 1} / {STEPS.length}</span><span>{t('quizTime')}</span></div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
          <motion.div className="h-full rounded-full bg-accent" animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.4 }} />
        </div>
      </div>

      <main className="container-app flex-1 overflow-x-hidden pb-32 md:my-6 md:max-w-[640px] md:flex-none md:rounded-[28px] md:bg-bg md:px-10 md:pb-10 md:shadow-[0_30px_80px_-40px_rgba(20,61,43,.4)]">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={step} custom={dir}
            initial={{ opacity: 0, x: dir * 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.22 }}>
            {body()}
          </motion.div>
        </AnimatePresence>
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-bg/95 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <div className="container-app grid gap-2 md:max-w-[640px]">
          {step === 'summary'
            ? <button type="button" className="btn" disabled={!canNext} onClick={finish}>{t('seeResult')}</button>
            : <button type="button" className="btn" disabled={!canNext} onClick={() => go(1)}>{t('next')}</button>}
          {SKIPPABLE.includes(step) && <button type="button" className="text-[13px] font-semibold text-muted" onClick={() => go(1)}>{t('skip')}</button>}
          {step === 'health' && healthStop && <Link to="/" className="text-center text-[13px] font-semibold text-muted">← Lėkštė</Link>}
        </div>
      </div>
    </div>
  );
}

function Opt({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" className="opt" aria-pressed={on} onClick={onClick}>{children}</button>;
}
function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" className="chip" aria-pressed={on} onClick={onClick}>{children}</button>;
}
function Q({ children }: { children: ReactNode }) {
  return <h1 className="mb-4 mt-6 font-display text-[22px] font-extrabold leading-tight">{children}</h1>;
}
function Label({ children }: { children: ReactNode }) {
  return <p className="mb-2 mt-5 font-bold">{children}</p>;
}
function Slider({ id, label, value, min, max, step = 1, unit, onChange }: { id: string; label: string; value: number; min: number; max: number; step?: number; unit: string; onChange: (v: number) => void }) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1.5 flex justify-between font-semibold">
        {label}<output className="font-display font-bold text-accent tabular">{value}{unit}</output>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[rgb(var(--accent))]" />
    </div>
  );
}

function Summary({ a, goTo }: { a: QuizAnswers; goTo: (s: StepId) => void }) {
  const { t, pick } = useI18n();
  const { setAnswers } = useStore();
  const rows: [StepId, string, string][] = [
    ['goal', t('qGoal'), t(`goal_${a.goal}` as StringKey)],
    ['body', t('qBody'), `${a.age} · ${a.heightCm} cm · ${a.weightKg} kg`],
    ['budget', t('qBudget'), `${a.weeklyBudget} € · ${a.household} 👤`],
    ['allergens', t('qAllergens'), a.allergens.length ? a.allergens.map((x) => pick(ALLERGEN_LABEL[x])).join(', ') : t('noAllergies')],
    ['diet', t('qDiet'), t(`diet_${a.dietType}` as StringKey)],
    ['dislikes', t('qDislikes'), [...a.never, ...a.avoid].map((id) => pick(INGREDIENT_BY_ID[id])).join(', ') || '—'],
  ];
  return (
    <>
      <h1 className="mb-4 mt-6 font-display text-[22px] font-extrabold">{t('qSummary')}</h1>
      <div className="grid gap-2">
        {rows.map(([s, label, value]) => (
          <div key={s} className="card flex items-center gap-3 p-3">
            <div className="min-w-0 flex-1"><div className="text-[12px] text-muted">{label}</div><div className="truncate font-semibold">{value}</div></div>
            <button type="button" onClick={() => goTo(s)} className="text-[13px] font-bold text-accent">{t('edit')}</button>
          </div>
        ))}
      </div>
      <label htmlFor="email" className="mb-1.5 mt-6 block font-bold">{t('email')}</label>
      <input id="email" type="email" inputMode="email" autoComplete="email" value={a.email} onChange={(e) => setAnswers({ email: e.target.value })}
        className="w-full rounded-btn border-2 border-line bg-surface px-4 py-3 text-[16px] outline-none focus:border-accent" placeholder="vardas@pastas.lt" />
      <label className="mt-4 flex gap-3 text-[13px]"><input type="checkbox" checked={a.consentHealth} onChange={(e) => setAnswers({ consentHealth: e.target.checked })} className="mt-0.5 h-5 w-5 shrink-0 accent-[rgb(var(--accent))]" />{t('consentHealth')}</label>
      <label className="mt-3 flex gap-3 text-[13px]"><input type="checkbox" checked={a.consentTerms} onChange={(e) => setAnswers({ consentTerms: e.target.checked })} className="mt-0.5 h-5 w-5 shrink-0 accent-[rgb(var(--accent))]" /><span>{t('consentTerms')} <Link to="/privacy" className="text-accent underline">{t('privacy')}</Link></span></label>
    </>
  );
}
