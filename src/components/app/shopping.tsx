'use client';

import { useMemo, useState } from 'react';
import type { RetailerId } from '@/config/markets';
import { weeklyNeed } from '@/domain/planner';
import { cheapest, PANTRY } from '@/domain/pricing';
import { kitchenMeasure } from '@/domain/units';
import { useI18n } from '@/i18n/I18nProvider';
import { fmtGrams, ingEmoji, ingName, recipeById, retailerName } from '@/lib/view';
import { categoryOf } from '@/retail/matching';
import { RETAILER_ORDER, RETAILERS } from '@/retail/retailers';
import type { ProductCategory } from '@/retail/types';
import { useStore } from '@/state/store';
import { PageTitle } from '../appshell';
import { Badge, Button, Card, Field, inputCls, cx } from '../ui';
import { useToast } from './meal';

const CAT: Record<ProductCategory, { lt: string; ru: string }> = {
  meat: { lt: 'Mėsa', ru: 'Мясо' }, fish: { lt: 'Žuvis', ru: 'Рыба' }, dairy: { lt: 'Pieno produktai', ru: 'Молочное' }, eggs: { lt: 'Kiaušiniai', ru: 'Яйца' },
  vegetables: { lt: 'Daržovės', ru: 'Овощи' }, fruits: { lt: 'Vaisiai ir uogos', ru: 'Фрукты и ягоды' }, grains: { lt: 'Kruopos', ru: 'Крупы' }, pasta: { lt: 'Makaronai', ru: 'Макароны' },
  bread: { lt: 'Duona', ru: 'Хлеб' }, oils: { lt: 'Aliejai ir padažai', ru: 'Масла и соусы' }, nuts: { lt: 'Riešutai ir sėklos', ru: 'Орехи и семечки' }, frozen: { lt: 'Šaldyti', ru: 'Заморозка' }, other: { lt: 'Kita', ru: 'Другое' },
};
export const categoryLabel = (c: ProductCategory, lang: 'lt' | 'ru') => CAT[c][lang];

export function ShoppingPage() {
  const { t, lang, eur, date } = useI18n();
  const { plan, answers, purchased, togglePurchased, recordPurchase, purchases, catalog } = useStore();
  const { show, node } = useToast();
  const [store, setStore] = useState<RetailerId | 'mixed'>((answers.stores[0] as RetailerId) ?? 'mixed');
  const [paid, setPaid] = useState('');
  const data = useMemo(() => {
    if (!plan) return null;
    const need = weeklyNeed(plan, answers.household);
    const uses = new Map<string, number>();
    plan.days.forEach((d) => d.meals.forEach((m) => recipeById(m.recipeId)?.items.forEach(([id]) => uses.set(id, (uses.get(id) ?? 0) + 1))));
    const groups = new Map<ProductCategory, [string, number][]>();
    for (const [id, g] of [...need].sort((a, b) => ingName(a[0], lang).localeCompare(ingName(b[0], lang)))) {
      const c = categoryOf(id);
      groups.set(c, [...(groups.get(c) ?? []), [id, g]]);
    }
    return { need, uses, groups };
  }, [plan, answers.household, lang]);
  if (!plan || !data) return null;
  const pref = answers.stores as RetailerId[];
  const copy = async () => {
    const txt = [...data.groups].map(([c, items]) => `${categoryLabel(c, lang)}\n${items.map(([id, g]) => `- ${ingName(id, lang)} — ${fmtGrams(g, lang)}`).join('\n')}`).join('\n\n');
    try { await navigator.clipboard.writeText(txt); show(t('copied')); } catch { show(t('copyList')); }
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(paid.replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0 || n > 2000) return;
    recordPurchase(store, n); setPaid(''); show(t('purchaseSaved'));
  };
  const total = data.need.size;
  const got = [...data.need.keys()].filter((id) => purchased.includes(id)).length;
  return (
    <>
      <PageTitle title={t('shoppingTitle')} sub={`${t('consolidated')} · ${t('ofItems', { a: got, b: total })}`} right={<Button variant="secondary" size="sm" onClick={copy}>{t('copyList')}</Button>} />
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          {[...data.groups].map(([c, items]) => (
            <Card key={c} className="overflow-hidden">
              <div className="border-b border-line bg-paper/60 px-5 py-2.5 text-[12.5px] font-bold uppercase tracking-wide text-muted">{categoryLabel(c, lang)}</div>
              {items.map(([id, g]) => {
                const on = purchased.includes(id);
                const best = cheapest(id, catalog, pref.length ? pref : undefined) ?? cheapest(id, catalog);
                return (
                  <label key={id} className={cx('flex cursor-pointer items-center gap-3 border-b border-line/60 px-5 py-3 last:border-0', on && 'opacity-55')}>
                    <input type="checkbox" checked={on} onChange={() => togglePurchased(id)} className="h-5 w-5 shrink-0 accent-[#31966A]" />
                    <span aria-hidden className="text-[18px]">{ingEmoji(id)}</span>
                    <span className="min-w-0 flex-1">
                      <span className={cx('block text-[14.5px] font-semibold', on && 'line-through')}>{ingName(id, lang)}</span>
                      <span className="block text-[12px] text-muted">{t('usedIn', { n: data.uses.get(id) ?? 0 })}{PANTRY.has(id) ? ` · ${t('pantry')}` : ''}</span>
                    </span>
                    <span className="text-right text-[13.5px]"><b className="tabular-nums">{fmtGrams(g, lang)}</b>
                      <span className="block text-[11.5px] text-muted">{kitchenMeasure(id, g, lang) ?? (best ? `${RETAILERS[best.retailer].name} ${eur(best.price)}` : '')}</span></span>
                  </label>
                );
              })}
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="text-[17px] font-extrabold">{t('recordPurchase')}</h2>
            <p className="mt-1 text-[13px] text-muted">{t('recordPurchaseSub')}</p>
            <form onSubmit={submit} className="mt-4 space-y-3">
              <Field label={t('storeVisited')}>
                <select value={store} onChange={(e) => setStore(e.target.value as RetailerId | 'mixed')} className={inputCls}>
                  {RETAILER_ORDER.map((r) => <option key={r} value={r}>{RETAILERS[r].name}</option>)}
                  <option value="mixed">{t('allStores')}</option>
                </select>
              </Field>
              <Field label={t('amountPaid')}><input inputMode="decimal" value={paid} onChange={(e) => setPaid(e.target.value)} className={inputCls} placeholder="42.80" /></Field>
              <Button type="submit" className="w-full">{t('save')}</Button>
            </form>
          </Card>
          {purchases.length > 0 && (
            <Card className="p-5">
              <ul className="space-y-2 text-[13.5px]">
                {[...purchases].reverse().slice(0, 8).map((p) => (
                  <li key={p.id} className="flex justify-between gap-2"><span>{date(p.date, { day: 'numeric', month: 'short' })} · {retailerName(p.retailer)}</span><b className="tabular-nums">{eur(p.paid)}</b></li>
                ))}
              </ul>
            </Card>
          )}
          <p className="text-[12px] text-muted">{t('noOrdering')}</p>
          <Badge tone="line">{t('snapshotNote')}</Badge>
        </div>
      </div>
      {node}
    </>
  );
}
