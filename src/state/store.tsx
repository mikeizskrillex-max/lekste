'use client';

/**
 * Client application state.
 *
 * Development mode (no Supabase keys): everything is stored in this browser's
 * localStorage — clearly labelled in the UI. With Supabase configured the
 * same shapes map 1:1 to the tables in supabase/migrations (profiles,
 * user_preferences, meal_plans, purchase_records, weight_entries …); the
 * repository layer in src/server/repository.ts documents the mapping.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { applyIntent, type Note } from '@/ai/apply';
import type { Intent } from '@/ai/intent';
import type { RetailerId } from '@/config/markets';
import { DEFAULT_PLANS, type Plan as SubPlan, type PlanId } from '@/config/plans';
import { effectiveTargets } from '@/domain/nutrition';
import { buildPlan, regenerateDay, replaceMeal, weeklyNeed, type Plan, type ReplaceMode } from '@/domain/planner';
import { allocate, type Allocation } from '@/domain/allocation';
import { basketFor, compareStores, setActiveCatalog } from '@/domain/pricing';
import type { QuizAnswers, Targets } from '@/domain/types';
import { buildCatalog, retailersWithData, SNAPSHOT_RECORDS } from '@/retail/catalog';
import { RETAILER_ORDER } from '@/retail/retailers';
import type { Catalog, PriceRecord } from '@/retail/types';

export const DEFAULT_ANSWERS: QuizAnswers = {
  goal: 'lose', sex: 'f', age: 30, heightCm: 168, weightKg: 72, targetWeightKg: 67, activity: 'light',
  household: 1, weeklyBudget: 50, allergens: [], lactoseIntolerant: false, dietType: 'any', never: [], avoid: [],
  likedProteins: [], likedCuisines: [], mealsPerDay: 4, breakfastStyle: 'sweet', cookingTimeMax: 30,
  equipment: ['oven', 'blender'], batchCooking: false, spice: 1, stores: ['barbora'], homeStore: 'barbora', health: [], email: '',
  consentHealth: false, consentTerms: false, marketingConsent: false, otherRestrictions: '', travelCost: 1.5,
};

export type SubStatus = 'none' | 'active' | 'canceled' | 'past_due';
export interface Payment { id: string; date: string; amount: number; status: 'paid' | 'failed' | 'refund_requested' | 'refunded'; planId: PlanId }
export interface Subscription { planId: PlanId | null; status: SubStatus; startedAt: string | null; currentPeriodEnd: string | null; mode: 'test' | 'stripe'; payments: Payment[] }
export interface PurchaseRecord { id: string; date: string; retailer: RetailerId | 'mixed'; paid: number; reference: number; estimated: number }
export interface Session { email: string; role: 'user' | 'admin' }

interface State {
  answers: QuizAnswers;
  onboarded: boolean;
  plan: Plan | null;
  planCreatedAt: string | null;
  feedback: { recipeId: string; rating: 'up' | 'down' }[];
  done: Record<string, string[]>;
  purchased: string[];
  purchases: PurchaseRecord[];
  weights: { date: string; kg: number }[];
  trackWeight: boolean;
  subscription: Subscription;
  session: Session | null;
  emails: { date: string; subject: string; to: string }[];
}

const KEY = 'lekste:v2';
const PRICE_KEY = 'lekste:prices';
const PLANS_KEY = 'lekste:plans';

const EMPTY: State = {
  answers: DEFAULT_ANSWERS, onboarded: false, plan: null, planCreatedAt: null, feedback: [], done: {}, purchased: [],
  purchases: [], weights: [], trackWeight: true,
  subscription: { planId: null, status: 'none', startedAt: null, currentPeriodEnd: null, mode: 'test', payments: [] },
  session: null, emails: [],
};

function read<T>(k: string, fallback: T): T {
  try { const raw = localStorage.getItem(k); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
}
function write(k: string, v: unknown) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked: keep in memory */ }
}

export const today = () => new Date().toISOString().slice(0, 10);
export const todayIndex = () => (new Date().getDay() + 6) % 7;
const addDays = (iso: string, d: number) => new Date(Date.parse(iso) + d * 86400000).toISOString();
const uid = () => Math.random().toString(36).slice(2, 10);

interface Ctx extends State {
  ready: boolean;
  targets: Targets & { overridden: boolean };
  catalog: Catalog;
  priceRecords: PriceRecord[];
  plans: SubPlan[];
  setAnswers: (a: Partial<QuizAnswers>, rebuild?: boolean) => void;
  completeOnboarding: () => void;
  replace: (day: number, slot: number, mode: ReplaceMode) => boolean;
  regenerate: (day: number) => void;
  rate: (recipeId: string, rating: 'up' | 'down') => void;
  toggleDone: (date: string, recipeId: string) => void;
  togglePurchased: (id: string) => void;
  recordPurchase: (retailer: PurchaseRecord['retailer'], paid: number) => void;
  addWeight: (kg: number) => void;
  setTrackWeight: (on: boolean) => void;
  subscribe: (planId: PlanId, mode?: 'test' | 'stripe') => void;
  cancelSubscription: () => void;
  resumeSubscription: () => void;
  requestRefund: (paymentId: string) => void;
  login: (email: string, role?: Session['role']) => void;
  logout: () => void;
  deleteAccount: () => void;
  exportData: () => string;
  importPrices: (records: PriceRecord[]) => void;
  resetPrices: () => void;
  setPlans: (p: SubPlan[]) => void;
  /** weekly basket economics for the current plan (used by dashboard, progress, savings) */
  weekEconomics: () => { best: number; reference: number; saving: number; promo: number; missing: number };
  /** the supermarket all lists are built for */
  homeStore: RetailerId;
  /** supermarkets that have prices (snapshot or CSV) */
  availableStores: RetailerId[];
  setHomeStore: (r: RetailerId) => void;
  /** weekly basket at the home store split by day and meal (all money shown comes from here) */
  allocation: Allocation | null;
  /** apply a structured assistant intent with the deterministic planner */
  applyAssistant: (intent: Intent) => Note[];
  /** withdraw health-data consent: deletes the plan and health answers */
  withdrawHealthConsent: () => void;
}

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<State>(EMPTY);
  const [imports, setImports] = useState<PriceRecord[]>([]);
  const [plans, setPlansState] = useState<SubPlan[]>(DEFAULT_PLANS);
  const [ready, setReady] = useState(false);
  const sRef = useRef(s);
  sRef.current = s;

  useEffect(() => {
    setS({ ...EMPTY, ...read<Partial<State>>(KEY, {}) });
    setImports(read<PriceRecord[]>(PRICE_KEY, []));
    setPlansState(read<SubPlan[]>(PLANS_KEY, DEFAULT_PLANS));
    setReady(true);
  }, []);
  useEffect(() => { if (ready) write(KEY, s); }, [s, ready]);

  const priceRecords = useMemo(() => [...SNAPSHOT_RECORDS, ...imports], [imports]);
  const catalog = useMemo(() => { const c = buildCatalog(priceRecords); setActiveCatalog(c); return c; }, [priceRecords]);
  const availableStores = useMemo(() => RETAILER_ORDER.filter((r) => retailersWithData(catalog).includes(r)), [catalog]);
  const homeStore = homeOf(s.answers, availableStores);
  const allocation = useMemo(() => (s.plan ? allocate(s.plan, s.answers.household, homeStore, catalog) : null), [s.plan, s.answers.household, homeStore, catalog]);
  const targets = useMemo(() => effectiveTargets(s.answers), [s.answers]);
  const disliked = s.feedback.filter((f) => f.rating === 'down').map((f) => f.recipeId);

  const email = useCallback((subject: string) => setS((p) => ({ ...p, emails: [{ date: new Date().toISOString(), subject, to: p.answers.email || p.session?.email || '' }, ...p.emails].slice(0, 20) })), []);

  const value: Ctx = {
    ...s, ready, targets, catalog, priceRecords, plans, homeStore, availableStores, allocation,
    setHomeStore: (r) => setS((p) => {
      const answers = { ...p.answers, homeStore: r, stores: [r] };
      return { ...p, answers, plan: p.plan ? buildPlan(answers, effectiveTargets(answers)) : p.plan };
    }),
    setAnswers: (a, rebuild = false) => setS((p) => {
      const answers = { ...p.answers, ...a };
      if (!rebuild || !p.plan) return { ...p, answers };
      return { ...p, answers, plan: buildPlan(answers, effectiveTargets(answers)) };
    }),
    completeOnboarding: () => setS((p) => ({
      ...p, onboarded: true, plan: buildPlan(p.answers, effectiveTargets(p.answers)), planCreatedAt: new Date().toISOString(),
      purchased: [], weights: p.weights.length ? p.weights : [{ date: today(), kg: p.answers.weightKg }],
    })),
    replace: (day, slot, mode) => {
      const cur = sRef.current;
      if (!cur.plan) return false;
      const next = replaceMeal(cur.plan, cur.answers, effectiveTargets(cur.answers), day, slot, mode, Date.now() % 9973, disliked);
      if (!next) return false;
      sRef.current = { ...cur, plan: next };
      setS((p) => ({ ...p, plan: next }));
      return true;
    },
    applyAssistant: (intent) => {
      const cur = sRef.current;
      const r = applyIntent(cur.answers, cur.plan, intent, disliked);
      sRef.current = { ...cur, answers: r.answers, plan: r.plan };
      setS((p) => ({ ...p, answers: r.answers, plan: r.plan }));
      return r.notes;
    },
    withdrawHealthConsent: () => setS((p) => ({ ...p, plan: null, onboarded: false, weights: [], answers: { ...DEFAULT_ANSWERS, email: p.answers.email, consentHealth: false, consentTerms: p.answers.consentTerms } })),
    regenerate: (day) => setS((p) => (p.plan ? { ...p, plan: regenerateDay(p.plan, p.answers, effectiveTargets(p.answers), day, Date.now() % 9973, disliked) } : p)),
    rate: (recipeId, rating) => setS((p) => ({ ...p, feedback: [...p.feedback.filter((f) => f.recipeId !== recipeId), { recipeId, rating }] })),
    toggleDone: (date, id) => setS((p) => {
      const l = p.done[date] ?? [];
      return { ...p, done: { ...p.done, [date]: l.includes(id) ? l.filter((x) => x !== id) : [...l, id] } };
    }),
    togglePurchased: (id) => setS((p) => ({ ...p, purchased: p.purchased.includes(id) ? p.purchased.filter((x) => x !== id) : [...p.purchased, id] })),
    recordPurchase: (retailer, paid) => setS((p) => {
      const e = econ(p.plan, p.answers, catalog, homeOf(p.answers, availableStores));
      return { ...p, purchases: [...p.purchases, { id: uid(), date: new Date().toISOString(), retailer, paid, reference: e.reference, estimated: e.best }] };
    }),
    addWeight: (kg) => setS((p) => ({ ...p, weights: [...p.weights.filter((w) => w.date !== today()), { date: today(), kg }].sort((a, b) => a.date.localeCompare(b.date)) })),
    setTrackWeight: (on) => setS((p) => ({ ...p, trackWeight: on })),
    subscribe: (planId, mode = 'test') => {
      const plan = plans.find((x) => x.id === planId)!;
      const now = new Date().toISOString();
      setS((p) => ({
        ...p,
        subscription: {
          planId, status: 'active', startedAt: now, currentPeriodEnd: addDays(now, plan.periodDays), mode,
          payments: [{ id: `${mode}_${uid()}`, date: now, amount: plan.price, status: 'paid', planId }, ...p.subscription.payments],
        },
      }));
      email('Lėkštė: prenumerata patvirtinta / подписка подтверждена');
      email('Lėkštė: jūsų savaitės meniu / ваше меню на неделю');
    },
    cancelSubscription: () => { setS((p) => ({ ...p, subscription: { ...p.subscription, status: 'canceled' } })); email('Lėkštė: prenumerata atšaukta / подписка отменена'); },
    resumeSubscription: () => setS((p) => ({ ...p, subscription: { ...p.subscription, status: 'active' } })),
    requestRefund: (id) => setS((p) => ({ ...p, subscription: { ...p.subscription, payments: p.subscription.payments.map((x) => (x.id === id ? { ...x, status: 'refund_requested' } : x)) } })),
    login: (mail, role = 'user') => setS((p) => ({ ...p, session: { email: mail, role }, answers: { ...p.answers, email: p.answers.email || mail } })),
    logout: () => setS((p) => ({ ...p, session: null })),
    deleteAccount: () => { try { localStorage.removeItem(KEY); } catch { /* ignore */ } setS(EMPTY); },
    exportData: () => JSON.stringify({ exportedAt: new Date().toISOString(), ...s }, null, 2),
    importPrices: (records) => setImports((cur) => { const next = [...cur, ...records]; write(PRICE_KEY, next); return next; }),
    resetPrices: () => { write(PRICE_KEY, []); setImports([]); },
    setPlans: (p) => { write(PLANS_KEY, p); setPlansState(p); },
    weekEconomics: () => econ(s.plan, s.answers, catalog, homeStore),
  };

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

/** The user's supermarket; falls back to the first one with prices. */
export function homeOf(a: QuizAnswers, available: RetailerId[]): RetailerId {
  const want = a.homeStore ?? (a.stores[0] as RetailerId | undefined);
  if (want && available.includes(want)) return want;
  return available[0] ?? 'barbora';
}

/** Weekly list priced at the user's store vs the priciest store with data (= estimated saving). */
function econ(plan: Plan | null, a: QuizAnswers, catalog: Catalog, home: RetailerId) {
  if (!plan) return { best: 0, reference: 0, saving: 0, promo: 0, missing: 0 };
  const need = weeklyNeed(plan, a.household);
  const b = basketFor(need, [home], catalog);
  const rows = compareStores(need, RETAILER_ORDER, catalog).filter((r) => r.covered > 0 && r.missing <= b.missing.length);
  const reference = rows.length ? Math.max(...rows.map((r) => r.total)) : b.total;
  return { best: b.total, reference, saving: Math.max(0, reference - b.total), promo: b.saving, missing: b.missing.length };
}

export function useStore(): Ctx {
  const c = useContext(StoreCtx);
  if (!c) throw new Error('useStore outside StoreProvider');
  return c;
}
