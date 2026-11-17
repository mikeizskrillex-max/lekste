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
import { DEFAULT_PLANS, TRIAL_DAYS, type Plan as SubPlan, type PlanId } from '@/config/plans';
import { effectiveTargets } from '@/domain/nutrition';
import { buildPlan, regenerateDay, replaceMeal, type Plan, type ReplaceMode } from '@/domain/planner';
import { allocate, type Allocation } from '@/domain/allocation';
import { learnTaste } from '@/domain/taste';
import { RECIPE_BY_ID } from '@/data/recipeIndex';
import { recipeFacts } from '@/domain/recipeFacts';
import { categoryOf } from '@/retail/matching';
import type { ProductCategory } from '@/retail/types';

const SHELF_STABLE = new Set<ProductCategory>(['grains', 'pasta', 'oils', 'nuts', 'frozen', 'other']);
import { basketFor, setActiveCatalog } from '@/domain/pricing';
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

export type SubStatus = 'none' | 'trialing' | 'active' | 'canceled' | 'past_due';
export interface Payment { id: string; date: string; amount: number; status: 'paid' | 'failed' | 'refund_requested' | 'refunded' | 'open' | 'trial'; planId: PlanId | null; receiptUrl?: string | null }
export interface Subscription {
  planId: PlanId | null; status: SubStatus; startedAt: string | null; currentPeriodEnd: string | null; mode: 'test' | 'stripe'; payments: Payment[];
  /** end of the free week */
  trialEnd?: string | null;
  /** cancelled: access stays until currentPeriodEnd / trialEnd, no more charges */
  cancelAtPeriodEnd?: boolean;
}

/** Can the user use the app right now? */
export function hasAccess(sub: Subscription): boolean {
  if (sub.status === 'active' || sub.status === 'trialing' || sub.status === 'past_due') return true;
  const until = sub.currentPeriodEnd ?? sub.trialEnd;
  return sub.status === 'canceled' && !!until && Date.parse(until) > Date.now();
}
export interface PurchaseRecord { id: string; date: string; retailer: RetailerId | 'mixed'; paid: number; reference: number; estimated: number }
export interface Session { email: string; role: 'user' | 'admin' }

interface State {
  answers: QuizAnswers;
  onboarded: boolean;
  plan: Plan | null;
  planCreatedAt: string | null;
  /** Monday (YYYY-MM-DD) of the week the current plan is for */
  weekStart?: string;
  /** previous weeks, newest first */
  history?: { weekStart: string; plan: Plan; basket: number }[];
  feedback: { recipeId: string; rating: 'up' | 'down' }[];
  done: Record<string, string[]>;
  purchased: string[];
  purchases: PurchaseRecord[];
  weights: { date: string; kg: number }[];
  trackWeight: boolean;
  subscription: Subscription;
  session: Session | null;
  emails: { date: string; subject: string; to: string }[];
  /** shelf-stable leftovers at home, grams by ingredient (rice, pasta, oil…) */
  stock?: Record<string, number>;
  /** basic items the user confirmed they have at home (salt, oil for frying…) */
  basics?: string[];
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
/** Monday of the given date's week, YYYY-MM-DD (local time). */
export function mondayOf(d: Date): string {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}
/** date n days after an ISO date */
export const addDaysIso2 = (iso: string, n: number) => { const [y, m, d] = iso.split('-').map(Number); const x = new Date(y, m - 1, d + n); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
const addDaysIso = (iso: string, n: number) => { const [y, m, d] = iso.split('-').map(Number); return mondayOf(new Date(y, m - 1, d + n)); };
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
  /** archive this week and build next week's menu with different dishes */
  newWeek: () => void;
  restoreWeek: (weekStart: string) => void;
  toggleFavorite: (recipeId: string) => void;
  /** apply the taste swipe and rebuild the menu */
  applyTaste: (liked: string[], disliked: string[]) => void;
  /** account sync: current persistable state and replacing it with the saved one */
  snapshot: () => Omit<State, 'session'>;
  importState: (data: Partial<State>) => void;
  /** true when the calendar week moved on since the plan was made */
  weekIsOld: boolean;
  /** ISO date (YYYY-MM-DD) of a plan day */
  dayDate: (day: number) => string;
  setStock: (id: string, grams: number) => void;
  toggleBasic: (id: string) => void;
  /** put a recipe into the menu (next matching meal from today) */
  placeRecipe: (recipeId: string) => { day: number; slot: number } | null;
  rate: (recipeId: string, rating: 'up' | 'down') => void;
  toggleDone: (date: string, recipeId: string) => void;
  togglePurchased: (id: string) => void;
  recordPurchase: (retailer: PurchaseRecord['retailer'], paid: number) => void;
  addWeight: (kg: number) => void;
  setTrackWeight: (on: boolean) => void;
  subscribe: (planId: PlanId, mode?: 'test' | 'stripe') => void;
  /** reload the subscription from the server (Stripe is the source of truth) */
  refreshSubscription: () => Promise<void>;
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
  weekEconomics: () => { best: number; reference: number; saving: number; promo: number; missing: number; cheaperStore: RetailerId | null; cheaperBy: number; refStore: RetailerId | null };
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
    const saved = read<SubPlan[]>(PLANS_KEY, DEFAULT_PLANS);
    setPlansState(saved.length === DEFAULT_PLANS.length && saved.every((x) => DEFAULT_PLANS.some((d) => d.id === x.id)) ? saved : DEFAULT_PLANS);
    setReady(true);
  }, []);
  useEffect(() => { if (ready) write(KEY, s); }, [s, ready]);

  const priceRecords = useMemo(() => [...SNAPSHOT_RECORDS, ...imports], [imports]);
  const catalog = useMemo(() => { const c = buildCatalog(priceRecords); setActiveCatalog(c); return c; }, [priceRecords]);
  const availableStores = useMemo(() => RETAILER_ORDER.filter((r) => retailersWithData(catalog).includes(r)), [catalog]);
  const homeStore = homeOf(s.answers, availableStores);
  const allocation = useMemo(() => (s.plan ? allocate(s.plan, s.answers.household, homeStore, catalog, s.stock ?? {}) : null), [s.plan, s.answers.household, homeStore, catalog, s.stock]);
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
      // a freshly made plan is always for the current week (an older weekStart must not survive a redo)
      weekStart: mondayOf(new Date()),
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
    newWeek: () => setS((p) => {
      if (!p.plan) return p;
      const prev = { weekStart: p.weekStart ?? mondayOf(new Date(p.planCreatedAt ?? Date.now())), plan: p.plan, basket: allocation?.week.total ?? 0 };
      const last = p.plan.days.flatMap((d) => d.meals.map((m) => m.recipeId));
      const nextStart = p.weekStart && p.weekStart >= mondayOf(new Date()) ? addDaysIso(p.weekStart, 7) : mondayOf(new Date());
      // shelf-stable leftovers of this week's packages stay at home for the next week
      const stock: Record<string, number> = {};
      if (allocation) {
        for (const l of allocation.week.lines) {
          if (l.pantry || !SHELF_STABLE.has(categoryOf(l.ingredientId))) continue;
          const left = l.packs * l.record.grams - l.grams;
          if (left >= 40) stock[l.ingredientId] = Math.round(left);
        }
        for (const [id, g] of Object.entries(p.stock ?? {})) {
          const used = allocation.usedStock.get(id) ?? 0;
          if (g - used >= 40) stock[id] = Math.round((stock[id] ?? 0) + g - used);
        }
      }
      return {
        ...p, plan: buildPlan(p.answers, effectiveTargets(p.answers), Date.now() % 9973, last), planCreatedAt: new Date().toISOString(),
        weekStart: nextStart, history: [prev, ...(p.history ?? [])].slice(0, 12), purchased: [], stock,
      };
    }),
    restoreWeek: (ws) => setS((p) => {
      const h = (p.history ?? []).find((x) => x.weekStart === ws);
      if (!h || !p.plan) return p;
      const cur = { weekStart: p.weekStart ?? mondayOf(new Date()), plan: p.plan, basket: allocation?.week.total ?? 0 };
      return { ...p, plan: h.plan, history: [cur, ...(p.history ?? []).filter((x) => x.weekStart !== ws)].slice(0, 12), purchased: [] };
    }),
    snapshot: () => { const { session: _s, ...rest } = sRef.current; void _s; return rest; },
    importState: (data) => setS((p) => ({ ...EMPTY, ...data, session: p.session })),
    applyTaste: (liked, disliked) => setS((p) => {
      const answers = { ...p.answers, ...learnTaste(p.answers, liked, disliked) };
      const feedback = [...p.feedback.filter((f) => !liked.includes(f.recipeId) && !disliked.includes(f.recipeId)), ...liked.map((recipeId) => ({ recipeId, rating: 'up' as const })), ...disliked.map((recipeId) => ({ recipeId, rating: 'down' as const }))];
      return { ...p, answers, feedback, plan: p.plan ? buildPlan(answers, effectiveTargets(answers)) : p.plan };
    }),
    toggleFavorite: (id) => setS((p) => {
      const f = p.answers.favorites ?? [];
      return { ...p, answers: { ...p.answers, favorites: f.includes(id) ? f.filter((x) => x !== id) : [...f, id] } };
    }),
    dayDate: (day) => addDaysIso2(s.weekStart ?? mondayOf(new Date(s.planCreatedAt ?? Date.now())), day),
    setStock: (id, grams) => setS((p) => { const st = { ...(p.stock ?? {}) }; if (grams > 0) st[id] = Math.round(grams); else delete st[id]; return { ...p, stock: st }; }),
    toggleBasic: (id) => setS((p) => { const b = p.basics ?? []; return { ...p, basics: b.includes(id) ? b.filter((x) => x !== id) : [...b, id] }; }),
    placeRecipe: (recipeId) => {
      const cur = sRef.current;
      if (!cur.plan) return null;
      const r = RECIPE_BY_ID[recipeId];
      if (!r) return null;
      const main = (m: string) => m === 'lunch' || m === 'dinner';
      const t0 = todayIndex();
      for (let k = 0; k < 7; k++) {
        const d = (t0 + k) % 7;
        const slot = cur.plan.days[d].meals.findIndex((m) => m.meal === r.meal || (main(m.meal) && main(r.meal)));
        if (slot < 0) continue;
        const f = recipeFacts(r);
        const days = cur.plan.days.map((day, i) => {
          if (i !== d) return day;
          const meals = day.meals.map((m, j) => (j === slot ? { ...m, recipeId, kcal: Math.round(f.kcal * m.servings), protein: Math.round(f.protein * m.servings), cost: f.cost * m.servings } : m));
          return { ...day, meals, kcal: meals.reduce((a, m) => a + m.kcal, 0), protein: meals.reduce((a, m) => a + m.protein, 0), cost: meals.reduce((a, m) => a + m.cost, 0) };
        });
        const plan = { ...cur.plan, days };
        sRef.current = { ...cur, plan };
        setS((p) => ({ ...p, plan }));
        return { day: d, slot };
      }
      return null;
    },
    weekIsOld: !!s.plan && (s.weekStart ?? mondayOf(new Date(s.planCreatedAt ?? Date.now()))) < mondayOf(new Date()),
    regenerate: (day) => setS((p) => (p.plan ? { ...p, plan: regenerateDay(p.plan, p.answers, effectiveTargets(p.answers), day, Date.now() % 9973, disliked) } : p)),
    rate: (recipeId, rating) => setS((p) => ({ ...p, feedback: [...p.feedback.filter((f) => f.recipeId !== recipeId), { recipeId, rating }] })),
    toggleDone: (date, id) => setS((p) => {
      const l = p.done[date] ?? [];
      return { ...p, done: { ...p.done, [date]: l.includes(id) ? l.filter((x) => x !== id) : [...l, id] } };
    }),
    togglePurchased: (id) => setS((p) => ({ ...p, purchased: p.purchased.includes(id) ? p.purchased.filter((x) => x !== id) : [...p.purchased, id] })),
    recordPurchase: (retailer, paid) => setS((p) => {
      const e = econ(allocation, catalog, homeStore);
      return { ...p, purchases: [...p.purchases, { id: uid(), date: new Date().toISOString(), retailer, paid, reference: e.reference, estimated: e.best }] };
    }),
    addWeight: (kg) => setS((p) => ({ ...p, weights: [...p.weights.filter((w) => w.date !== today()), { date: today(), kg }].sort((a, b) => a.date.localeCompare(b.date)) })),
    setTrackWeight: (on) => setS((p) => ({ ...p, trackWeight: on })),
    subscribe: (planId, mode = 'test') => {
      const plan = plans.find((x) => x.id === planId)!;
      const now = new Date().toISOString();
      const trial = !plan.oneTime;
      const trialEnd = trial ? addDays(now, TRIAL_DAYS) : null;
      setS((p) => ({
        ...p,
        subscription: {
          planId, status: trial ? 'trialing' : 'active', startedAt: now, trialEnd, cancelAtPeriodEnd: false,
          currentPeriodEnd: plan.oneTime ? null : trialEnd, mode,
          payments: [{ id: `${mode}_${uid()}`, date: now, amount: trial ? 0 : plan.price, status: trial ? 'trial' : 'paid', planId }, ...p.subscription.payments],
        },
      }));
      email('Lėkštė: prenumerata patvirtinta / подписка подтверждена');
      email('Lėkštė: jūsų savaitės meniu / ваше меню на неделю');
    },
    refreshSubscription: async () => {
      const r = await fetch('/api/subscription').catch(() => null);
      if (!r?.ok) return;
      const j = await r.json();
      if (j.mode !== 'stripe' || !j.subscription) return;
      const x = j.subscription;
      setS((p) => ({ ...p, subscription: { planId: x.planId, status: x.status, startedAt: x.startedAt, currentPeriodEnd: x.currentPeriodEnd, trialEnd: x.trialEnd, cancelAtPeriodEnd: x.cancelAtPeriodEnd, mode: 'stripe', payments: x.payments } }));
    },
    cancelSubscription: () => {
      if (s.subscription.mode === 'stripe') { void fetch('/api/subscription', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'cancel' }) }).then(() => value.refreshSubscription()); return; }
      setS((p) => ({ ...p, subscription: { ...p.subscription, cancelAtPeriodEnd: true } })); email('Lėkštė: prenumerata atšaukta / подписка отменена');
    },
    resumeSubscription: () => {
      if (s.subscription.mode === 'stripe') { void fetch('/api/subscription', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'resume' }) }).then(() => value.refreshSubscription()); return; }
      setS((p) => ({ ...p, subscription: { ...p.subscription, cancelAtPeriodEnd: false, status: p.subscription.status === 'canceled' ? 'active' : p.subscription.status } }));
    },
    requestRefund: (id) => setS((p) => ({ ...p, subscription: { ...p.subscription, payments: p.subscription.payments.map((x) => (x.id === id ? { ...x, status: 'refund_requested' } : x)) } })),
    login: (mail, role = 'user') => setS((p) => ({ ...p, session: { email: mail, role }, answers: { ...p.answers, email: p.answers.email || mail } })),
    logout: () => setS((p) => ({ ...p, session: null })),
    deleteAccount: () => { try { localStorage.removeItem(KEY); } catch { /* ignore */ } setS(EMPTY); },
    exportData: () => JSON.stringify({ exportedAt: new Date().toISOString(), ...s }, null, 2),
    importPrices: (records) => setImports((cur) => { const next = [...cur, ...records]; write(PRICE_KEY, next); return next; }),
    resetPrices: () => { write(PRICE_KEY, []); setImports([]); },
    setPlans: (p) => { write(PLANS_KEY, p); setPlansState(p); },
    weekEconomics: () => econ(allocation, catalog, homeStore),
  };

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

/** The user's supermarket; falls back to the first one with prices. */
export function homeOf(a: QuizAnswers, available: RetailerId[]): RetailerId {
  const want = a.homeStore ?? (a.stores[0] as RetailerId | undefined);
  if (want && available.includes(want)) return want;
  return available[0] ?? 'barbora';
}

/**
 * Weekly economics at the user's store. `best` is what they pay (whole packages,
 * promotions, minus leftovers at home). The saving compares the SAME items at the
 * most expensive other store with prices (items both stores sell), so it is never
 * an apples-to-oranges number; `promo` is the part that comes from promotions.
 */
function econ(alloc: Allocation | null, catalog: Catalog, home: RetailerId) {
  if (!alloc) return { best: 0, reference: 0, saving: 0, promo: 0, missing: 0, cheaperStore: null as RetailerId | null, cheaperBy: 0, refStore: null as RetailerId | null };
  const b = alloc.week;
  const need = new Map(b.lines.map((l) => [l.ingredientId, l.grams]));
  let reference = b.total;
  let refStore: RetailerId | null = null;
  let cheaperStore: RetailerId | null = null;
  let cheaperBy = 0;
  for (const r of RETAILER_ORDER) {
    if (r === home) continue;
    const common = new Map([...need].filter(([id]) => catalog[id]?.[r]));
    if (common.size < need.size * 0.8) continue;
    const other = basketFor(common, [r], catalog).total;
    const mine = b.lines.filter((l) => common.has(l.ingredientId)).reduce((s, l) => s + l.cost, 0);
    if (other - mine > reference - b.total) { reference = b.total + (other - mine); refStore = r; }
    if (mine - other > cheaperBy) { cheaperBy = mine - other; cheaperStore = r; }
  }
  return { best: b.total, reference, saving: Math.max(0, reference - b.total), promo: b.saving, missing: b.missing.length, cheaperStore, cheaperBy, refStore };
}

export function useStore(): Ctx {
  const c = useContext(StoreCtx);
  if (!c) throw new Error('useStore outside StoreProvider');
  return c;
}
