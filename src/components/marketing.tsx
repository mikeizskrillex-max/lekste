'use client';

import { useMemo, useState } from 'react';
import type { RetailerId } from '@/config/markets';
import { planMonthlyEquivalent } from '@/config/plans';
import { effectiveTargets } from '@/domain/nutrition';
import { buildPlan, weeklyNeed } from '@/domain/planner';
import { allocate } from '@/domain/allocation';
import { compareStores } from '@/domain/pricing';
import { useI18n } from '@/i18n/I18nProvider';
import type { MessageKey } from '@/i18n/messages';
import { SAMPLE_ANSWERS } from '@/lib/view';
import type { QuizAnswers } from '@/domain/types';
import { DEFAULT_CATALOG, latestRetrieval, SNAPSHOT_RECORDS } from '@/retail/catalog';
import { RETAILER_ORDER, RETAILERS } from '@/retail/retailers';
import { useStore } from '@/state/store';
import { Badge, ButtonLink, Card, cx } from './ui';

/** The illustrative sample week used on public pages (real recipes, real snapshot prices). */
export function useSamplePlan() {
  return useMemo(() => {
    const t = effectiveTargets(SAMPLE_ANSWERS);
    const plan = buildPlan(SAMPLE_ANSWERS, t, 11);
    const need = weeklyNeed(plan, SAMPLE_ANSWERS.household);
    const rows = compareStores(need, RETAILER_ORDER);
    // the sample is priced at the cheapest store that has the whole list; day and meal prices are its shares
    const best = rows.filter((r) => r.covered > 0).sort((a, b) => a.missing - b.missing || a.total - b.total)[0];
    const alloc = allocate(plan, SAMPLE_ANSWERS.household, best?.retailer ?? 'barbora', DEFAULT_CATALOG);
    return { t, plan, need, rows, alloc };
  }, []);
}

export function useStoreRows() {
  const { rows } = useSamplePlan();
  const withData = rows.filter((r) => r.covered > 0);
  const min = withData.length ? Math.min(...withData.map((r) => r.total)) : 0;
  const max = withData.length ? Math.max(...withData.map((r) => r.total)) : 0;
  return { rows, withData, min, max };
}

export function PricesChecked() {
  const { t, date } = useI18n();
  const at = latestRetrieval(SNAPSHOT_RECORDS);
  return <span className="text-[12px] text-muted">{at ? t('pricesChecked', { date: date(at, { day: 'numeric', month: 'long', year: 'numeric' }) }) : t('noData')}</span>;
}

export function StoreComparisonTable({ compact = false }: { compact?: boolean }) {
  const { t, eur, pick } = useI18n();
  const { rows, min } = useStoreRows();
  const sorted = [...rows].sort((a, b) => (a.covered ? 0 : 1) - (b.covered ? 0 : 1) || a.total - b.total);
  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-[1.3fr_1fr_1fr] gap-2 border-b border-line bg-paper/60 px-4 py-3 text-[12px] font-bold uppercase tracking-wide text-muted md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-6">
        <span>{t('supermarketCol')}</span><span className="text-right">{t('basketCostCol')}</span><span className="text-right">{t('differenceCol')}</span><span className="hidden text-right md:block">{t('coverageCol')}</span>
      </div>
      {sorted.map((r) => {
        const info = RETAILERS[r.retailer as RetailerId];
        const cheapest = r.covered > 0 && r.total === min;
        return (
          <div key={r.retailer} className={cx('grid grid-cols-[1.3fr_1fr_1fr] items-center gap-2 border-b border-line/60 px-4 py-3.5 last:border-0 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-6', cheapest && 'bg-sage/60')}>
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: info.color }} />
              <span className="font-semibold">{info.name}</span>
              {cheapest && <Badge tone="leaf">{t('cheapest')}</Badge>}
            </div>
            {r.covered > 0 ? (
              <>
                <span className="text-right font-display text-[17px] font-bold tabular-nums">{eur(r.total)}</span>
                <span className={cx('text-right tabular-nums', cheapest ? 'text-leaf' : 'text-danger')}>{cheapest ? '—' : `+${eur(r.total - min)}`}</span>
                <span className="hidden text-right text-[13px] text-muted md:block">{r.covered}/{r.covered + r.missing}</span>
              </>
            ) : (
              <span className="col-span-2 text-right text-[12.5px] text-muted md:col-span-3">{compact ? t('noData') : pick(info.note)}</span>
            )}
          </div>
        );
      })}
    </Card>
  );
}

export function PricingCards() {
  const { t, eur } = useI18n();
  const { plans } = useStore();
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {plans.filter((p) => p.active).map((p) => (
        <Card key={p.id} className={cx('relative flex flex-col p-6', p.highlighted && 'ring-2 ring-leaf')}>
          {p.highlighted && <Badge tone="leaf" className="absolute -top-3 left-6 bg-leaf text-white">{t('popular2')}</Badge>}
          <div className="text-[15px] font-bold text-muted">{t(`plan_${p.id}` as MessageKey)}</div>
          <div className="mt-2 font-display text-[40px] font-extrabold tracking-tight">{eur(p.price)}</div>
          <div className="text-[13px] text-muted">
            {t('vatIncluded')} · {p.oneTime ? t('planOnce') : <>{p.id !== 'monthly' && <>{t('planEquivalent', { price: eur(planMonthlyEquivalent(p)) })} · </>}{t('planEvery', { n: p.renewalDays })}</>}
          </div>
          <ul className="mt-5 flex-1 space-y-2 text-[14px]">
            {(['b1', 'b2', 'b3', 'b4'] as const).map((k) => <li key={k} className="flex gap-2"><span className="text-leaf">✓</span>{t(k)}</li>)}
          </ul>
          <ButtonLink href={`/onboarding?plan=${p.id}`} variant={p.highlighted ? 'primary' : 'secondary'} className="mt-6 w-full">{t('choose')}</ButtonLink>
        </Card>
      ))}
    </div>
  );
}

export const FAQ_KEYS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
export function Faq({ limit }: { limit?: number }) {
  const { t } = useI18n();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-line rounded-xl2 bg-card ring-1 ring-line/70">
      {FAQ_KEYS.slice(0, limit).map((n, i) => (
        <div key={n}>
          <button type="button" className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[16px] font-semibold md:px-6" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
            {t(`faq${n}q` as MessageKey)}<span className={cx('text-leaf transition', open === i && 'rotate-45')}>＋</span>
          </button>
          {open === i && <p className="px-5 pb-5 text-[15px] leading-relaxed text-muted md:px-6">{t(`faq${n}a` as MessageKey)}</p>}
        </div>
      ))}
    </div>
  );
}

export type Persona = 'student' | 'couple' | 'family';
export const PERSONAS: Record<Persona, Partial<QuizAnswers>> = {
  student: { household: 1, weeklyBudget: 30, goal: 'healthy', sex: 'm', age: 21, weightKg: 72, targetWeightKg: 72, mealsPerDay: 4 },
  couple: { household: 2, weeklyBudget: 60, goal: 'lose', sex: 'f', age: 32, weightKg: 70, targetWeightKg: 64, mealsPerDay: 4 },
  family: { household: 4, weeklyBudget: 100, goal: 'keep', sex: 'f', age: 38, weightKg: 68, targetWeightKg: 68, mealsPerDay: 4 },
};

/** A week for a typical person, priced at the cheapest store that sells the whole list. */
export function usePersonaPlan(p: Persona) {
  return useMemo(() => {
    const a = { ...SAMPLE_ANSWERS, ...PERSONAS[p] } as QuizAnswers;
    const plan = buildPlan(a, effectiveTargets(a), 11);
    const need = weeklyNeed(plan, a.household);
    const rows = compareStores(need, RETAILER_ORDER).filter((r) => r.covered > 0).sort((x, y) => x.missing - y.missing || x.total - y.total);
    const store = rows[0]?.retailer ?? 'barbora';
    const alloc = allocate(plan, a.household, store, DEFAULT_CATALOG);
    const other = rows.find((r) => r.retailer !== store);
    return { a, plan, alloc, store, saving: other ? Math.max(0, other.total - rows[0].total) : 0, otherStore: other?.retailer ?? null };
  }, [p]);
}
