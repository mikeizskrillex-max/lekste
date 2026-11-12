'use client';

import { useMemo, useState } from 'react';
import type { RetailerId } from '@/config/markets';
import { weeklyNeed } from '@/domain/planner';
import { strategies, type Strategy, type StrategyResult } from '@/domain/pricing';
import { useI18n } from '@/i18n/I18nProvider';
import { fmtGrams, ingEmoji, ingName } from '@/lib/view';
import { RETAILER_ORDER, RETAILERS } from '@/retail/retailers';
import { useStore } from '@/state/store';
import { Badge, Card, Slider, cx } from './ui';

export function useStrategies() {
  const { plan, answers, catalog } = useStore();
  return useMemo(() => {
    if (!plan) return null;
    return strategies(weeklyNeed(plan, answers.household), RETAILER_ORDER, answers.stores as RetailerId[], answers.travelCost ?? 0, catalog);
  }, [plan, answers.household, answers.stores, answers.travelCost, catalog]);
}

const LABEL: Record<Strategy, 'strategyA' | 'strategyB' | 'strategyC'> = { single: 'strategyA', multi: 'strategyB', preferred: 'strategyC' };

function StrategyCard({ s, kind, active, onPick, best }: { s: StrategyResult | null; kind: Strategy; active: boolean; onPick: () => void; best: boolean }) {
  const { t, eur } = useI18n();
  const stores = s ? Array.from(new Set(s.lines.map((l) => l.record.retailer))) : [];
  return (
    <button type="button" onClick={onPick} aria-pressed={active}
      className={cx('flex flex-col rounded-xl2 bg-card p-4 text-left shadow-soft ring-1 transition md:p-5', active ? 'ring-2 ring-leaf' : 'ring-line/70 hover:ring-leaf/50')}>
      <div className="flex items-center justify-between gap-2"><span className="text-[13.5px] font-bold">{t(LABEL[kind])}</span>{best && <Badge tone="leaf">{t('bestValue')}</Badge>}</div>
      {s ? (
        <>
          <div className="mt-2 font-display text-[28px] font-extrabold tabular-nums">{eur(s.total)}</div>
          <div className="text-[12.5px] text-muted">{t('visits', { n: s.visits })}{s.travelCost > 0 ? ` · ${t('totalWithTravel')} ${eur(s.effective)}` : ''}</div>
          <div className="mt-3 flex flex-wrap gap-1.5">{stores.map((r) => <span key={r} className="rounded-full px-2 py-0.5 text-[11.5px] font-bold text-white" style={{ background: RETAILERS[r].color }}>{RETAILERS[r].name}</span>)}</div>
          {s.missing.length > 0 && <div className="mt-2 text-[12px] text-danger">{t('missingItems', { n: s.missing.length })}</div>}
        </>
      ) : <div className="mt-3 text-[13px] text-muted">{t('noPreferred')}</div>}
    </button>
  );
}

export function StrategySummary({ value, onChange }: { value?: Strategy; onChange?: (s: Strategy) => void }) {
  const st = useStrategies();
  const [local, setLocal] = useState<Strategy>('multi');
  const sel = value ?? local;
  if (!st) return null;
  const effs = (['single', 'multi', 'preferred'] as Strategy[]).map((k) => st[k]?.effective ?? Infinity);
  const min = Math.min(...effs);
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {(['single', 'multi', 'preferred'] as Strategy[]).map((k, i) => (
        <StrategyCard key={k} kind={k} s={st[k]} active={sel === k} best={effs[i] === min && min < Infinity} onPick={() => (onChange ?? setLocal)(k)} />
      ))}
    </div>
  );
}

export function BasketView() {
  const { t, lang, eur } = useI18n();
  const { answers, setAnswers } = useStore();
  const st = useStrategies();
  const [sel, setSel] = useState<Strategy>('multi');
  if (!st) return null;
  const s = st[sel];
  const groups = new Map<RetailerId, NonNullable<typeof s>['lines']>();
  s?.lines.forEach((l) => groups.set(l.record.retailer, [...(groups.get(l.record.retailer) ?? []), l]));
  return (
    <div className="space-y-6">
      <StrategySummary value={sel} onChange={setSel} />
      <Card className="p-5">
        <Slider id="travel" label={t('travelCost')} value={answers.travelCost ?? 0} min={0} max={5} step={0.5} suffix=" €" onChange={(v) => setAnswers({ travelCost: v })} />
        <p className="mt-2 text-[12.5px] text-muted">{t('travelHint')}</p>
      </Card>
      {s && [...groups].map(([r, lines]) => (
        <Card key={r} className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-3" style={{ borderLeft: `4px solid ${RETAILERS[r].color}` }}>
            <b>{t('itemsAt', { store: RETAILERS[r].name })}</b>
            <span className="font-display font-extrabold tabular-nums">{eur(lines.reduce((x, l) => x + l.cost, 0))}</span>
          </div>
          {lines.map((l) => (
            <div key={l.ingredientId} className="flex items-center gap-3 border-b border-line/60 px-5 py-3 last:border-0">
              <span className="text-[20px]" aria-hidden>{ingEmoji(l.ingredientId)}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[14.5px] font-semibold">{ingName(l.ingredientId, lang)}</div>
                <div className="truncate text-[12px] text-muted">
                  {l.record.name} · {fmtGrams(l.record.grams, lang)} · {t('needG', { g: fmtGrams(l.grams, lang) })}
                  {l.record.match === 'approximate' && <> · <span className="text-gold">{t('approx')}</span></>}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold tabular-nums">{eur(l.cost)}</div>
                <div className="text-[11.5px] text-muted">{l.pantry ? t('pantry') : t('packsN', { n: l.packs })}{l.record.promo && <span className="ml-1 font-bold text-leaf">{t('promo2')}</span>}</div>
              </div>
              {l.record.url && <a href={l.record.url} target="_blank" rel="noopener noreferrer" className="hidden text-[12px] font-semibold text-leaf hover:underline sm:block">↗</a>}
            </div>
          ))}
        </Card>
      ))}
      {s && s.missing.length > 0 && (
        <Card className="p-5"><b className="text-[14px]">{t('missingItems', { n: s.missing.length })}</b><p className="mt-1 text-[13px] text-muted">{s.missing.map((id) => ingName(id, lang)).join(', ')}</p></Card>
      )}
      <p className="text-[12.5px] text-muted">{t('noOrdering')} {t('snapshotNote')}</p>
    </div>
  );
}
