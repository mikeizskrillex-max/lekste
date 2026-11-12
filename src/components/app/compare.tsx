'use client';

import { useMemo, useState } from 'react';
import type { RetailerId } from '@/config/markets';
import { useI18n } from '@/i18n/I18nProvider';
import { fmtGrams, ingName } from '@/lib/view';
import { categoryOf } from '@/retail/matching';
import { RETAILER_ORDER, RETAILERS } from '@/retail/retailers';
import type { PriceRecord, ProductCategory } from '@/retail/types';
import { useStore } from '@/state/store';
import { PageTitle } from '../appshell';
import { Badge, Card, Chip, inputCls, cx } from '../ui';
import { categoryLabel } from './shopping';

const CATS: ProductCategory[] = ['vegetables', 'fruits', 'meat', 'fish', 'dairy', 'eggs', 'grains', 'pasta', 'bread', 'oils', 'nuts', 'frozen', 'other'];

export function ComparePage() {
  const { t, lang, eur, date } = useI18n();
  const { catalog, priceRecords } = useStore();
  const [store, setStore] = useState<RetailerId | 'all'>('all');
  const [cat, setCat] = useState<ProductCategory | 'all'>('all');
  const [promo, setPromo] = useState(false);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const rows = useMemo(() => {
    const out: { id: string; recs: PriceRecord[] }[] = [];
    for (const [id, by] of Object.entries(catalog)) {
      if (cat !== 'all' && categoryOf(id) !== cat) continue;
      let recs = Object.values(by).filter((r): r is PriceRecord => !!r);
      if (store !== 'all') recs = recs.filter((r) => r.retailer === store);
      if (promo) recs = recs.filter((r) => r.promo);
      const needle = q.trim().toLowerCase();
      if (needle && !ingName(id, lang).toLowerCase().includes(needle) && !recs.some((r) => r.name.toLowerCase().includes(needle) || (r.brand ?? '').toLowerCase().includes(needle))) continue;
      if (recs.length) out.push({ id, recs: recs.sort((a, b) => a.perKg - b.perKg) });
    }
    return out.sort((a, b) => ingName(a.id, lang).localeCompare(ingName(b.id, lang)));
  }, [catalog, store, cat, promo, q, lang]);
  const history = (id: string, r: RetailerId) => priceRecords.filter((x) => x.ingredientId === id && x.retailer === r).sort((a, b) => b.retrievedAt.localeCompare(a.retrievedAt));
  return (
    <>
      <PageTitle title={t('compareTitle2')} sub={t('snapshotNote')} />
      <Card className="space-y-3 p-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('searchProduct')} aria-label={t('searchProduct')} className={inputCls} />
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          <Chip on={store === 'all'} onClick={() => setStore('all')}>{t('allStores')}</Chip>
          {RETAILER_ORDER.map((r) => <Chip key={r} on={store === r} onClick={() => setStore(r)}>{RETAILERS[r].name}</Chip>)}
          <Chip on={promo} onClick={() => setPromo((p) => !p)}>🏷 {t('filterPromo')}</Chip>
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value as ProductCategory | 'all')} className={inputCls} aria-label={t('filterCategory')}>
          <option value="all">{t('allCategories')}</option>
          {CATS.map((c) => <option key={c} value={c}>{categoryLabel(c, lang)}</option>)}
        </select>
      </Card>
      <p className="mt-4 text-[13px] text-muted">{t('results', { n: rows.length })} · {t('sortPrice')}</p>
      <div className="mt-2 space-y-3">
        {rows.map(({ id, recs }) => (
          <Card key={id} className="overflow-hidden">
            <div className="border-b border-line bg-paper/60 px-4 py-2.5 text-[14.5px] font-bold">{ingName(id, lang)} <span className="text-[12px] font-semibold text-muted">· {categoryLabel(categoryOf(id), lang)}</span></div>
            {recs.map((r, i) => {
              const key = `${id}:${r.retailer}`;
              const hist = history(id, r.retailer);
              return (
                <div key={key} className={cx('border-b border-line/60 px-4 py-3 last:border-0', i === 0 && recs.length > 1 && 'bg-sage/50')}>
                  <div className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: RETAILERS[r.retailer].color }} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-semibold">{RETAILERS[r.retailer].name} {i === 0 && recs.length > 1 && <Badge tone="leaf">{t('cheapest')}</Badge>} {r.promo && <Badge tone="gold">{t('promo2')}</Badge>} {r.match === 'approximate' && <Badge tone="line">{t('approx')}</Badge>}</div>
                      <div className="truncate text-[12.5px] text-muted">{r.name}{r.brand ? ` · ${r.brand}` : ''} · {t('packSize')}: {fmtGrams(r.grams, lang)}</div>
                      <div className="mt-0.5 text-[11.5px] text-muted">{t('source')}: {r.source === 'csv_import' ? t('srcCsv') : t('srcPublic')} · {t('verifiedAt')}: {date(r.retrievedAt, { day: 'numeric', month: 'short', year: 'numeric' })}{r.promoValidTo ? ` · ${t('validUntil')} ${date(r.promoValidTo, { day: 'numeric', month: 'short' })}` : ''}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-[17px] font-extrabold tabular-nums">{eur(r.price)}</div>
                      {r.promo && r.regular && <div className="text-[11.5px] text-muted line-through">{eur(r.regular)}</div>}
                      <div className="text-[11.5px] text-muted">{eur(r.perKg)}/kg</div>
                    </div>
                  </div>
                  <div className="mt-1.5 flex gap-3 pl-5 text-[12px]">
                    {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-leaf hover:underline">{t('openInStore')} ↗</a>}
                    {hist.length > 1 && <button type="button" className="font-semibold text-forest" onClick={() => setOpen(open === key ? null : key)}>{t('priceHistory')} ({hist.length})</button>}
                  </div>
                  {open === key && <ul className="mt-2 space-y-1 pl-5 text-[12px] text-muted">{hist.map((h, j) => <li key={j}>{date(h.retrievedAt, { day: 'numeric', month: 'short', year: 'numeric' })}: <b className="text-ink">{eur(h.price)}</b> ({eur(h.perKg)}/kg) · {h.source}</li>)}</ul>}
                </div>
              );
            })}
          </Card>
        ))}
      </div>
      <p className="mt-6 text-[12px] text-muted">{t('noOrdering')}</p>
    </>
  );
}
