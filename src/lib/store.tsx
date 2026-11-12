import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { calcTargets } from './nutrition';
import { buildPlan, regenerateDay, type Plan } from './planner';
import { RECIPES } from '../data/recipes';
import { passesHardRules } from './recipes';
import { load, save, clearAll } from './storage';
import type { QuizAnswers, Targets } from './types';

export const DEFAULT_ANSWERS: QuizAnswers = {
  goal: 'lose', sex: 'f', age: 30, heightCm: 168, weightKg: 72, targetWeightKg: 67, activity: 'light',
  household: 1, weeklyBudget: 60, allergens: [], lactoseIntolerant: false, dietType: 'any', never: [], avoid: [],
  likedProteins: [], likedCuisines: [], mealsPerDay: 4, breakfastStyle: 'sweet', cookingTimeMax: 30,
  equipment: ['oven'], batchCooking: false, spice: 1, stores: ['Barbora'], health: [], email: '',
  consentHealth: false, consentTerms: false,
};

export const TRIAL_DAYS = 7;

export interface Feedback { recipeId: string; rating: 'up' | 'down'; reason?: string }

interface State {
  answers: QuizAnswers;
  quizDone: boolean;
  /** ISO date the free trial started; null = not started */
  trialStart: string | null;
  plan: Plan | null;
  /** "day-slotIndex" -> replacement recipe id */
  swaps: Record<string, string>;
  /** "yyyy-mm-dd" -> recipe ids eaten */
  eaten: Record<string, string[]>;
  water: Record<string, number>;
  weights: { date: string; kg: number }[];
  checked: string[];
  feedback: Feedback[];
}

interface Ctx extends State {
  targets: Targets;
  setAnswers: (a: Partial<QuizAnswers>) => void;
  finishQuiz: () => void;
  startTrial: () => void;
  trialDaysLeft: number | null;
  swap: (day: number, slot: number) => void;
  regenerate: (day: number) => void;
  toggleEaten: (date: string, recipeId: string) => void;
  setWater: (date: string, n: number) => void;
  addWeight: (kg: number) => void;
  toggleChecked: (id: string) => void;
  rate: (f: Feedback) => void;
  reset: () => void;
}

const StoreCtx = createContext<Ctx | null>(null);

const initial = (): State => ({
  answers: DEFAULT_ANSWERS,
  quizDone: false,
  trialStart: null,
  plan: null,
  swaps: {},
  eaten: {},
  water: {},
  weights: [],
  checked: [],
  feedback: [],
  ...load<Partial<State>>('state', {}),
});

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<State>(initial);
  useEffect(() => { save('state', s); }, [s]);
  const targets = useMemo(() => calcTargets(s.answers), [s.answers]);

  const value = useMemo<Ctx>(() => ({
    ...s,
    targets,
    setAnswers: (a) => setS((p) => ({ ...p, answers: { ...p.answers, ...a } })),
    finishQuiz: () => setS((p) => {
      const t = calcTargets(p.answers);
      return {
        ...p, quizDone: true, plan: buildPlan(p.answers, t), swaps: {}, checked: [],
        weights: p.weights.length ? p.weights : [{ date: today(), kg: p.answers.weightKg }],
      };
    }),
    startTrial: () => setS((p) => ({ ...p, trialStart: p.trialStart ?? today() })),
    trialDaysLeft: s.trialStart ? Math.max(0, TRIAL_DAYS - Math.floor((Date.now() - Date.parse(s.trialStart)) / 86400000)) : null,
    swap: (day, slot) => setS((p) => {
      if (!p.plan) return p;
      const key = `${day}-${slot}`;
      const current = p.swaps[key] ?? p.plan.days[day].meals[slot].recipeId;
      const slotMeal = p.plan.days[day].meals[slot].meal;
      const main = (m: string) => m === 'lunch' || m === 'dinner';
      const options = RECIPES.filter((r) => (r.meal === slotMeal || (main(r.meal) && main(slotMeal))) && passesHardRules(r, p.answers)
        && !p.feedback.some((f) => f.recipeId === r.id && f.rating === 'down'));
      if (options.length < 2) return p;
      const idx = options.findIndex((r) => r.id === current);
      const next = options[(idx + 1) % options.length];
      return { ...p, swaps: { ...p.swaps, [key]: next.id } };
    }),
    regenerate: (day) => setS((p) => {
      if (!p.plan) return p;
      const seed = Date.now() % 100000;
      const disliked = p.feedback.filter((f) => f.rating === 'down').map((f) => f.recipeId);
      const plan = regenerateDay(p.plan, p.answers, calcTargets(p.answers), day, seed, disliked);
      const swaps = Object.fromEntries(Object.entries(p.swaps).filter(([k]) => !k.startsWith(`${day}-`)));
      return { ...p, plan, swaps };
    }),
    toggleEaten: (date, id) => setS((p) => {
      const list = p.eaten[date] ?? [];
      return { ...p, eaten: { ...p.eaten, [date]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] } };
    }),
    setWater: (date, n) => setS((p) => ({ ...p, water: { ...p.water, [date]: n } })),
    addWeight: (kg) => setS((p) => ({ ...p, weights: [...p.weights.filter((w) => w.date !== today()), { date: today(), kg }] })),
    toggleChecked: (id) => setS((p) => ({ ...p, checked: p.checked.includes(id) ? p.checked.filter((x) => x !== id) : [...p.checked, id] })),
    rate: (f) => setS((p) => ({ ...p, feedback: [...p.feedback.filter((x) => x.recipeId !== f.recipeId), f] })),
    reset: () => { clearAll(); setS({ ...initial(), answers: DEFAULT_ANSWERS, quizDone: false, trialStart: null, plan: null }); },
  }), [s, targets]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): Ctx {
  const c = useContext(StoreCtx);
  if (!c) throw new Error('useStore outside StoreProvider');
  return c;
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Monday = 0 … Sunday = 6 */
export function todayIndex(): number {
  return (new Date().getDay() + 6) % 7;
}
