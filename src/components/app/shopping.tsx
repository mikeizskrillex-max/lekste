'use client';

import { useMemo, useState } from 'react';
import type { RetailerId } from '@/config/markets';
import { useI18n } from '@/i18n/I18nProvider';
import type { MessageKey } from '@/i18n/messages';
import { fmtGrams, ingName, retailerName } from '@/lib/view';
import { RETAILER_ORDER, RETAILERS } from '@/retail/retailers';
import { todayIndex, useStore } from '@/state/store';
import { PageTitle } from '../appshell';
import { DayList, StoreList, StorePicker, StoreSummary, useHomeBasket, useWeekNeed } from '../basket';
import { Button, Card, Chip, Field, inputCls, cx } from '../ui';
import { useToast } from './meal';

export { categoryLabel } from '../basket';

/** Shopping list for the user's ONE store: whole week or a single day. */
export function ShoppingPage() {
  const { t, lang, eur, date } = useI18n();
  const { plan, homeStore, recordPurchase, purchases, purchased } = useStore();
  const { show, node } = useToast();
  const [view, setView] = useState<'week' | number>('week');
  const [paid, setPaid] = useState('');
  const [store, setStore] = useState<RetailerId | 'mixed'>(homeStore);
  const need = useWeekNeed();
  const basket = useHomeBasket(need);
  const got = useMemo(() => basket.lines.filter((l) => purchased.includes(l.ingredientId)).length, [basket, purchased]);
  if (!plan) return null;

  const copy = async () => {
    const txt = `${RETAILERS[homeStore].name} — ${eur(basket.total)}\n` + basket.lines.map((l) => `☐ ${ingName(l.ingredientId, lang)} — ${l.record.name}, ${l.pantry ? fmtGrams(l.grams, lang) : `${l.packs} × ${eur(l.record.price)}`}${l.record.promo ? ` (${t('promo2')})` : ''}`).join('\n');
    try { await navigator.clipboard.writeText(txt); show(t('copied')); } catch { show(t('copyList'), true); }
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(paid.replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0 || n > 2000) return;
    recordPurchase(store, n); setPaid(''); show(t('purchaseSaved'));
  };

  return (
    <>
      <PageTitle title={t('shoppingTitle')} sub={`${RETAILERS[homeStore].name} · ${t('ofItems', { a: got, b: basket.lines.length })}`} right={<Button variant="secondary" size="sm" onClick={copy}>{t('copyList')}</Button>} />
      <div className="mb-5"><StorePicker onChanged={(r) => { setStore(r); show(t('storeChanged', { store: RETAILERS[r].name })); }} /></div>
      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1">
        <Chip on={view === 'week'} onClick={() => setView('week')}>{t('allDays')}</Chip>
        {plan.days.map((_, i) => <Chip key={i} on={view === i} onClick={() => setView(i)}>{t(`dayS${i}` as MessageKey)}{i === todayIndex() ? ' •' : ''}</Chip>)}
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          {view === 'week' ? (<><StoreSummary basket={basket} /><StoreList basket={basket} checkable /></>) : <DayList day={view} checkable />}
        </div>
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="text-[17px] font-extrabold">{t('recordPurchase')}</h2>
            <p className="mt-1 text-[13px] text-muted">{t('recordPurchaseSub')}</p>
            <form onSubmit={submit} className="mt-4 space-y-3">
              <Field label={t('storeVisited')}>
                <select value={store} onChange={(e) => setStore(e.target.value as RetailerId | 'mixed')} className={inputCls}>
                  {RETAILER_ORDER.map((r) => <option key={r} value={r}>{RETAILERS[r].name}</option>)}
                </select>
              </Field>
              <Field label={t('amountPaid')}><input inputMode="decimal" value={paid} onChange={(e) => setPaid(e.target.value)} className={inputCls} placeholder={basket.total.toFixed(2)} /></Field>
              <Button type="submit" className="w-full">{t('save')}</Button>
            </form>
          </Card>
          {purchases.length > 0 && (
            <Card className="p-5">
              <ul className="space-y-2 text-[13.5px]">
                {[...purchases].reverse().slice(0, 8).map((p) => (
                  <li key={p.id} className={cx('flex justify-between gap-2')}><span>{date(p.date, { day: 'numeric', month: 'short' })} · {retailerName(p.retailer)}</span><b className="tabular-nums">{eur(p.paid)}</b></li>
                ))}
              </ul>
            </Card>
          )}
          <p className="text-[12px] text-muted">{t('noOrdering')} {t('snapshotNote')}</p>
        </div>
      </div>
      {node}
    </>
  );
}
