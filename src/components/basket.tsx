'use client';

import { useMemo, useState } from 'react';
import { INGREDIENT_BY_ID } from '@/data/ingredients';
import type { RetailerId } from '@/config/markets';
import { weeklyNeed, type Plan } from '@/domain/planner';
import { recipeById } from '@/lib/view';
import { basketFor, cheapest, compareStores, PANTRY, type Basket, type BasketLine } from '@/domain/pricing';
import { kitchenMeasure } from '@/domain/units';
import { useI18n } from '@/i18n/I18nProvider';
import { fmtGrams, ingEmoji, ingName } from '@/lib/view';

import { categoryOf } from '@/retail/matching';
import { RETAILER_ORDER, RETAILERS } from '@/retail/retailers';
import type { ProductCategory } from '@/retail/types';
import { useStore } from '@/state/store';
import { Badge, Button, Card, cx, inputCls } from './ui';

const CAT: Record<ProductCategory, { lt: string; ru: string }> = {
  meat: { lt: 'Mėsa', ru: 'Мясо' }, fish: { lt: 'Žuvis', ru: 'Рыба' }, dairy: { lt: 'Pieno produktai', ru: 'Молочное' }, eggs: { lt: 'Kiaušiniai', ru: 'Яйца' },
  vegetables: { lt: 'Daržovės', ru: 'Овощи' }, fruits: { lt: 'Vaisiai ir uogos', ru: 'Фрукты и ягоды' }, grains: { lt: 'Kruopos ir ankštiniai', ru: 'Крупы и бобовые' }, pasta: { lt: 'Makaronai', ru: 'Макароны' },
  bread: { lt: 'Duona', ru: 'Хлеб' }, oils: { lt: 'Aliejai ir padažai', ru: 'Масла и соусы' }, nuts: { lt: 'Riešutai ir sėklos', ru: 'Орехи и семечки' }, frozen: { lt: 'Šaldyti', ru: 'Заморозка' }, other: { lt: 'Kita', ru: 'Другое' },
};
export const categoryLabel = (c: ProductCategory, lang: 'lt' | 'ru') => CAT[c][lang];
const CAT_ORDER: ProductCategory[] = ['vegetables', 'fruits', 'meat', 'fish', 'dairy', 'eggs', 'bread', 'grains', 'pasta', 'frozen', 'oils', 'nuts', 'other'];

/** Opens the product page in the store's e-shop (there the user taps "add to cart"); marks it as bought here. */
export function StoreLink({ ingredientId, url, store, compact = false }: { ingredientId: string; url: string | null; store: RetailerId; compact?: boolean }) {
  const { t } = useI18n();
  const { purchased, togglePurchased } = useStore();
  if (!url) return null;
  const done = purchased.includes(ingredientId);
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      onClick={(e) => { e.stopPropagation(); if (!done) togglePurchased(ingredientId); }}
      className={cx('inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold text-white transition hover:brightness-110', done && 'opacity-60')}
      style={{ background: RETAILERS[store].color }} title={t('buyAtTitle', { store: RETAILERS[store].name })}>
      {done ? '✓' : '🛒'} {compact ? '' : t('buyAt2', { store: RETAILERS[store].name })} ↗
    </a>
  );
}

/** One-supermarket choice: menu, prices and lists are built for this store only. */
export function StorePicker({ compact = false, onChanged }: { compact?: boolean; onChanged?: (r: RetailerId) => void }) {
  const { t } = useI18n();
  const { homeStore, availableStores, setHomeStore } = useStore();
  return (
    <div>
      {!compact && <p className="mb-3 text-[13.5px] text-muted">{t('storePickerSub')}</p>}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {RETAILER_ORDER.map((r) => {
          const has = availableStores.includes(r);
          const on = homeStore === r;
          return (
            <button key={r} type="button" disabled={!has} aria-pressed={on} onClick={() => { setHomeStore(r); onChanged?.(r); }}
              className={cx('flex flex-col items-start rounded-2xl px-3.5 py-3 text-left ring-1 transition', on ? 'bg-sage ring-2 ring-leaf' : 'bg-card ring-line hover:ring-leaf/60', !has && 'cursor-not-allowed opacity-50 hover:ring-line')}>
              <span className="flex items-center gap-2 text-[15px] font-bold"><span className="h-2.5 w-2.5 rounded-full" style={{ background: RETAILERS[r].color }} />{RETAILERS[r].name}{on && <span className="text-leaf">✓</span>}</span>
              <span className="mt-0.5 text-[11.5px] text-muted">{!has ? t('noPricesYet') : r === 'barbora' ? t('barboraSub') : ' '}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function useWeekNeed() {
  const { plan, answers } = useStore();
  return useMemo(() => (plan ? weeklyNeed(plan, answers.household) : new Map<string, number>()), [plan, answers.household]);
}

export function useHomeBasket(need: Map<string, number>): Basket {
  const { homeStore, catalog } = useStore();
  return useMemo(() => basketFor(need, [homeStore], catalog), [need, homeStore, catalog]);
}

/** Shopping list for ONE store: whole packages, its promotions, items it doesn't sell. */
export function StoreList({ basket, checkable = false }: { basket: Basket; checkable?: boolean }) {
  const { t, lang, eur, date } = useI18n();
  const { purchased, togglePurchased, catalog } = useStore();
  const groups = new Map<ProductCategory, BasketLine[]>();
  basket.lines.forEach((l) => { const c = categoryOf(l.ingredientId); groups.set(c, [...(groups.get(c) ?? []), l]); });
  return (
    <div className="space-y-4">
      {CAT_ORDER.filter((c) => groups.has(c)).map((c) => (
        <Card key={c} className="overflow-hidden">
          <div className="border-b border-line bg-paper/60 px-4 py-2 text-[12px] font-bold uppercase tracking-wide text-muted md:px-5">{categoryLabel(c, lang)}</div>
          {groups.get(c)!.sort((a, b) => ingName(a.ingredientId, lang).localeCompare(ingName(b.ingredientId, lang))).map((l) => {
            const done = checkable && purchased.includes(l.ingredientId);
            const Row = checkable ? 'label' : 'div';
            return (
              <Row key={l.ingredientId} className={cx('flex items-center gap-3 border-b border-line/60 px-4 py-3 last:border-0 md:px-5', checkable && 'cursor-pointer', done && 'opacity-50')}>
                {checkable && <input type="checkbox" checked={done} onChange={() => togglePurchased(l.ingredientId)} className="h-5 w-5 shrink-0 accent-[#31966A]" />}
                <span aria-hidden className="text-[19px]">{ingEmoji(l.ingredientId)}</span>
                <span className="min-w-0 flex-1">
                  <span className={cx('block text-[14.5px] font-semibold', done && 'line-through')}>{ingName(l.ingredientId, lang)} <span className="font-normal text-muted">· {fmtGrams(l.grams, lang)}{kitchenMeasure(l.ingredientId, l.grams, lang) ? ` (${kitchenMeasure(l.ingredientId, l.grams, lang)})` : ''}</span></span>
                  <span className="block truncate text-[12px] text-muted">
                    {l.record.url ? <a href={l.record.url} target="_blank" rel="noopener noreferrer" className="hover:text-leaf hover:underline" onClick={(e) => e.stopPropagation()}>{l.record.name}</a> : l.record.name}
                    {l.record.match === 'approximate' && <span className="text-[#8a6410]"> · {t('approx')}</span>}
                  </span>
                </span>
                <span className="hidden sm:block"><StoreLink ingredientId={l.ingredientId} url={l.record.url} store={l.record.retailer} /></span>
                <span className="shrink-0 text-right">
                  <span className="block font-semibold tabular-nums">{eur(l.cost)}</span>
                  <span className="block text-[11.5px] text-muted">{l.pantry ? t('pantry') : `${l.packs} × ${eur(l.record.price)}`}</span>
                    <span className="mt-1 block sm:hidden"><StoreLink ingredientId={l.ingredientId} url={l.record.url} store={l.record.retailer} compact /></span>
                  {l.record.promo && (
                    <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-gold/30 px-1.5 py-0.5 text-[10.5px] font-bold text-[#6b4a0c]">
                      {t('promo2')}{l.record.regular && <s className="font-normal">{eur(l.record.regular)}</s>}{l.record.loyalty && ` · ${t('loyaltyCard')}`}{l.record.promoValidTo && ` · ${t('promoUntil', { d: date(l.record.promoValidTo, { day: 'numeric', month: 'short' }) })}`}
                    </span>
                  )}
                </span>
              </Row>
            );
          })}
        </Card>
      ))}
      {basket.missing.length > 0 && (
        <Card className="p-4 md:p-5">
          <b className="text-[14px]">{t('notInStore')} ({basket.missing.length})</b>
          <ul className="mt-2 space-y-1 text-[13px]">
            {basket.missing.map((id) => { const alt = cheapest(id, catalog); return (
              <li key={id} className="flex justify-between gap-3"><span>{ingEmoji(id)} {ingName(id, lang)}</span><span className="text-muted">{alt ? t('elsewhere', { store: RETAILERS[alt.retailer].name, price: eur(alt.price) }) : t('noData')}</span></li>
            ); })}
          </ul>
        </Card>
      )}
    </div>
  );
}

/** Same list priced at every store with data — to help choose, not to split the trip. */
export function StoreTotals({ need }: { need: Map<string, number> }) {
  const { t, eur } = useI18n();
  const { homeStore, catalog, availableStores, setHomeStore } = useStore();
  const rows = useMemo(() => compareStores(need, RETAILER_ORDER, catalog), [need, catalog]);
  const withData = rows.filter((r) => availableStores.includes(r.retailer) && r.covered > 0).sort((a, b) => a.missing - b.missing || a.total - b.total);
  const min = withData.length ? Math.min(...withData.filter((r) => r.missing === withData[0].missing).map((r) => r.total)) : 0;
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-line px-4 py-3 text-[14px] font-extrabold md:px-5">{t('sameListElsewhere')}</div>
      {withData.map((r) => {
        const on = r.retailer === homeStore;
        return (
          <div key={r.retailer} className={cx('flex flex-wrap items-center gap-3 border-b border-line/60 px-4 py-3 last:border-0 md:px-5', on && 'bg-sage/60')}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: RETAILERS[r.retailer].color }} />
            <b className="min-w-[90px]">{RETAILERS[r.retailer].name}</b>
            {r.total === min && <Badge tone="leaf">{t('cheapest')}</Badge>}
            {r.missing > 0 && <span className="text-[12px] text-danger">{t('missingItems', { n: r.missing })}</span>}
            <span className="ml-auto font-display text-[17px] font-extrabold tabular-nums">{eur(r.total)}</span>
            {on ? <Badge tone="sage">✓ {t('yourStore')}</Badge> : <Button size="sm" variant="secondary" onClick={() => setHomeStore(r.retailer)}>{t('shopHere')}</Button>}
          </div>
        );
      })}
      {RETAILER_ORDER.filter((r) => !availableStores.includes(r)).length > 0 && (
        <p className="px-4 py-3 text-[12px] text-muted md:px-5">{RETAILER_ORDER.filter((r) => !availableStores.includes(r)).map((r) => RETAILERS[r].name).join(', ')}: {t('noPricesYet')}</p>
      )}
    </Card>
  );
}

/** Summary header: store, total, promo savings. */
export function StoreSummary({ basket }: { basket: Basket }) {
  const { t, eur } = useI18n();
  const { homeStore } = useStore();
  return (
    <Card className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 md:p-5" style={{ borderLeft: `5px solid ${RETAILERS[homeStore].color}` }}>
      <div><div className="text-[12px] font-semibold text-muted">{t('yourStore')}</div><div className="text-[18px] font-extrabold">{RETAILERS[homeStore].name}</div></div>
      <div><div className="text-[12px] font-semibold text-muted">{t('listTotal')}</div><div className="font-display text-[24px] font-extrabold tabular-nums">{eur(basket.total)}</div></div>
      {basket.saving > 0 && <Badge tone="gold">🏷 {t('promoSavingTotal', { n: eur(basket.saving) })}</Badge>}
      <span className="text-[12px] text-muted md:ml-auto">{basket.lines.length} {t('items')}</span>
      <p className="w-full text-[12.5px] text-muted">🛒 {t('storeLinkHint', { store: RETAILERS[homeStore].name })}</p>
    </Card>
  );
}

export function BasketView() {
  const { t } = useI18n();
  const need = useWeekNeed();
  const fallback = useHomeBasket(need);
  const { allocation } = useStore();
  const basket = allocation?.week ?? fallback;
  return (
    <div className="space-y-5">
      <StorePicker />
      <StoreSummary basket={basket} />
      <StoreTotals need={need} />
      <p className="text-[12.5px] text-muted">{t('noOrdering')} {t('snapshotNote')}</p>
    </div>
  );
}

/** Grams of each ingredient for ONE day of the plan (whole household). */
export function dayNeed(plan: Plan, day: number, household: number): Map<string, number> {
  const need = new Map<string, number>();
  plan.days[day]?.meals.forEach((m) => recipeById(m.recipeId)?.items.forEach(([id, g]) => need.set(id, (need.get(id) ?? 0) + g * m.servings * household)));
  return need;
}

/** One day of the week: what is used, its share of the weekly basket, and what to buy first that day. */
export function DayList({ day, checkable = false }: { day: number; checkable?: boolean }) {
  const { t, lang, eur } = useI18n();
  const { allocation, homeStore, purchased, togglePurchased } = useStore();
  if (!allocation) return null;
  const items = [...allocation.items[day]].sort((a, b) => Number(b.buyToday) - Number(a.buyToday) || ingName(a.ingredientId, lang).localeCompare(ingName(b.ingredientId, lang)));
  const toBuy = items.filter((i) => i.buyToday && i.line);
  const buyCost = toBuy.reduce((s, i) => s + i.line!.cost, 0);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <b className="text-[17px]">🛒 {t('whatToBuyDay')} · {RETAILERS[homeStore].name}</b>
          <div className="text-[12.5px] text-muted">{t('dayShareOf', { week: eur(allocation.week.total) })}</div>
        </div>
        <span className="flex items-center gap-2">
          {allocation.daySaving[day] > 0.005 && <Badge tone="gold">🏷 {t('promoSavingTotal', { n: eur(allocation.daySaving[day]) })}</Badge>}
          <span className="font-display text-[22px] font-extrabold tabular-nums">{eur(allocation.day[day])}</span>
        </span>
      </div>
      <Card className="overflow-hidden">
        {items.map((it) => {
          const done = checkable && purchased.includes(it.ingredientId);
          const Row = checkable ? 'label' : 'div';
          return (
            <Row key={it.ingredientId} className={cx('flex items-center gap-3 border-b border-line/60 px-4 py-3 last:border-0 md:px-5', checkable && 'cursor-pointer', done && 'opacity-50')}>
              {checkable && <input type="checkbox" checked={done} onChange={() => togglePurchased(it.ingredientId)} className="h-5 w-5 shrink-0 accent-[#31966A]" />}
              <span aria-hidden className="text-[19px]">{ingEmoji(it.ingredientId)}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14.5px] font-semibold">{ingName(it.ingredientId, lang)} <span className="font-normal text-muted">· {fmtGrams(it.grams, lang)}</span></span>
                {it.line ? (
                  it.buyToday
                    ? <span className="block truncate text-[12px] text-forest">🛒 {t('buyNow')}: {it.line.pantry ? it.line.record.name : `${it.line.packs} × ${it.line.record.name}`}{it.line.record.promo ? ` · ${t('promo2')}${it.line.record.loyalty ? ` (${t('loyaltyCard')})` : ''}` : ''}</span>
                    : <span className="block text-[12px] text-muted">✓ {t('alreadyBought')}</span>
                ) : it.fromStock ? <span className="block text-[12px] text-leaf">🏠 {t('fromHome')}</span> : <span className="block text-[12px] text-danger">{t('notInStore')}</span>}
              </span>
              {it.buyToday && it.line && <StoreLink ingredientId={it.ingredientId} url={it.line.record.url} store={it.line.record.retailer} compact />}
              <span className="shrink-0 text-right">
                <span className="block font-semibold tabular-nums">{eur(it.share)}</span>
                {it.buyToday && it.line && !it.line.pantry && <span className="block text-[11px] text-muted">{t('packPrice', { p: eur(it.line.cost) })}</span>}
              </span>
            </Row>
          );
        })}
      </Card>
      <p className="text-[12px] text-muted">{t('dayMathNote', { buy: eur(buyCost) })} {t('snapshotNote')}</p>
    </div>
  );
}

/** When the menu can't fit the budget: say so plainly and offer the two real options. */
export function OverBudgetHelp() {
  const { t, eur } = useI18n();
  const { answers, weekEconomics, setAnswers, homeStore } = useStore();
  const e = weekEconomics();
  if (!e.best || e.best <= answers.weeklyBudget + 0.01) return null;
  const need = Math.ceil(e.best);
  return (
    <Card className="border-l-4 border-gold p-4 md:p-5">
      <b className="text-[15px]">{t('overTitle', { n: eur(e.best - answers.weeklyBudget) })}</b>
      <p className="mt-1 text-[13.5px] text-muted">{t('overExplain', { store: RETAILERS[homeStore].name, min: eur(e.best) })}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => setAnswers({ weeklyBudget: need }, true)}>{t('raiseBudgetTo', { n: `${need} €` })}</Button>
        <Button size="sm" variant="secondary" onClick={() => setAnswers({ mealsPerDay: 3 }, true)} disabled={answers.mealsPerDay === 3}>{t('fewerMeals')}</Button>
      </div>
    </Card>
  );
}

/** Honest savings line: same items vs the most expensive other store; promotions part; cheaper store hint. */
export function SavingsLine({ compact = false }: { compact?: boolean }) {
  const { t, eur } = useI18n();
  const { weekEconomics, setHomeStore } = useStore();
  const e = weekEconomics();
  if (e.saving > 0.01 && e.refStore) {
    return (
      <span className="text-leaf">
        {t('savedVs', { n: eur(e.saving), store: RETAILERS[e.refStore].name })}
        {e.promo > 0.01 && !compact && <span className="text-muted"> · {t('ofWhichPromo', { n: eur(e.promo) })}</span>}
      </span>
    );
  }
  if (e.cheaperStore && e.cheaperBy > 0.5) {
    return (
      <span className="text-[#8a6410]">
        {t('cheaperElsewhere', { store: RETAILERS[e.cheaperStore].name, n: eur(e.cheaperBy) })}
        {!compact && <> · <button type="button" className="font-bold underline" onClick={() => setHomeStore(e.cheaperStore!)}>{t('switchTo', { store: RETAILERS[e.cheaperStore].name })}</button></>}
      </span>
    );
  }
  return <span className="text-muted">{t('youAlreadyCheapest')}</span>;
}

/** Leftovers at home (rice, pasta, oil…): the basket only buys what is missing. */
export function HomeStock() {
  const { t, lang } = useI18n();
  const { stock, setStock, allocation } = useStore();
  const [adding, setAdding] = useState(false);
  const [id, setId] = useState('rice');
  const [g, setG] = useState('500');
  const entries = Object.entries(stock ?? {});
  const options = Object.keys(INGREDIENT_BY_ID).filter((x) => !PANTRY.has(x)).sort((a, b) => ingName(a, lang).localeCompare(ingName(b, lang)));
  return (
    <Card className="p-4 md:p-5">
      <div className="flex items-center justify-between gap-2">
        <b className="text-[15px]">🏠 {t('atHome')}</b>
        <button type="button" className="text-[13px] font-semibold text-leaf" onClick={() => setAdding((x) => !x)}>{adding ? t('close2') : `+ ${t('addItem')}`}</button>
      </div>
      <p className="mt-1 text-[12.5px] text-muted">{t('atHomeSub')}</p>
      {entries.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {entries.map(([k, v]) => (
            <li key={k} className="inline-flex items-center gap-1.5 rounded-full bg-sage px-3 py-1.5 text-[13px] font-semibold">
              {ingEmoji(k)} {ingName(k, lang)} · {fmtGrams(v, lang)}{(allocation?.usedStock.get(k) ?? 0) > 0 && <span className="text-leaf"> ✓</span>}
              <button type="button" aria-label="✕" className="ml-1 text-muted hover:text-danger" onClick={() => setStock(k, 0)}>✕</button>
            </li>
          ))}
        </ul>
      )}
      {adding && (
        <form className="mt-3 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); const n = Number(g.replace(',', '.')); if (n > 0) { setStock(id, (stock?.[id] ?? 0) + n); setAdding(false); } }}>
          <select value={id} onChange={(e) => setId(e.target.value)} className={cx(inputCls, 'min-w-0 flex-1')} aria-label={t('addItem')}>
            {options.map((o) => <option key={o} value={o}>{ingName(o, lang)}</option>)}
          </select>
          <input inputMode="numeric" value={g} onChange={(e) => setG(e.target.value)} className={cx(inputCls, 'w-28')} aria-label="g" />
          <Button type="submit">{t('save')}</Button>
        </form>
      )}
    </Card>
  );
}

const BASICS: { id: string; lt: string; ru: string; q: string; e: string }[] = [
  { id: 'salt', lt: 'Druska', ru: 'Соль', q: 'druska', e: '🧂' },
  { id: 'pepper', lt: 'Juodieji pipirai', ru: 'Чёрный перец', q: 'juodieji pipirai', e: '🌶️' },
  { id: 'frying_oil', lt: 'Aliejus kepimui', ru: 'Масло для жарки', q: 'saulėgrąžų aliejus', e: '🫗' },
  { id: 'paprika', lt: 'Malta paprika', ru: 'Молотая паприка', q: 'malta paprika', e: '🟥' },
  { id: 'herbs', lt: 'Džiovintos žolelės', ru: 'Сушёные травы', q: 'prieskoniai žolelės', e: '🌿' },
  { id: 'bay', lt: 'Lauro lapai', ru: 'Лавровый лист', q: 'lauro lapai', e: '🍃' },
  { id: 'vinegar', lt: 'Actas', ru: 'Уксус', q: 'actas', e: '🍶' },
  { id: 'stock', lt: 'Sultinio kubeliai', ru: 'Бульонные кубики', q: 'sultinio kubeliai', e: '🧊' },
];

/** Basics every recipe assumes (salt, pepper, frying oil…): a checklist with store search links. */
export function BasicsChecklist() {
  const { t, lang } = useI18n();
  const { basics, toggleBasic, homeStore } = useStore();
  const have = basics ?? [];
  const missing = BASICS.filter((b) => !have.includes(b.id)).length;
  const search = (q: string) => (homeStore === 'rimi' ? `https://www.rimi.lt/e-parduotuve/lt/paieska?query=${encodeURIComponent(q)}` : `https://barbora.lt/search?q=${encodeURIComponent(q)}`);
  return (
    <details className="rounded-xl2 bg-card p-4 shadow-soft ring-1 ring-line/70 md:p-5" open={missing > 0 && have.length === 0}>
      <summary className="flex cursor-pointer items-center justify-between gap-2 text-[15px] font-bold">
        <span>🧂 {t('basicsTitle')}</span>
        {missing > 0 ? <Badge tone="gold">{t('basicsMissing', { n: missing })}</Badge> : <Badge tone="leaf">✓</Badge>}
      </summary>
      <p className="mt-1 text-[12.5px] text-muted">{t('basicsSub')}</p>
      <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
        {BASICS.map((b) => {
          const on = have.includes(b.id);
          return (
            <li key={b.id} className="flex items-center gap-2 text-[14px]">
              <label className="flex flex-1 cursor-pointer items-center gap-2"><input type="checkbox" checked={on} onChange={() => toggleBasic(b.id)} className="h-5 w-5 accent-[#31966A]" /><span aria-hidden>{b.e}</span><span className={cx(on && 'text-muted line-through')}>{b[lang]}</span></label>
              {!on && <a href={search(b.q)} target="_blank" rel="noopener noreferrer" className="text-[12px] font-semibold text-leaf hover:underline">{RETAILERS[homeStore].name} ↗</a>}
            </li>
          );
        })}
      </ul>
    </details>
  );
}

/** Send the list to WhatsApp / Messenger / anywhere (native share sheet when available). */
export function ShareList({ text }: { text: string }) {
  const { t } = useI18n();
  const share = async () => {
    if (navigator.share) { try { await navigator.share({ title: 'Lėkštė', text }); return; } catch { /* cancelled */ } }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };
  return (
    <span className="flex gap-1.5">
      <Button size="sm" onClick={share}>📤 {t('shareList')}</Button>
      <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center rounded-2xl bg-[#25D366] px-3 text-[13px] font-semibold text-white" aria-label="WhatsApp">WhatsApp</a>
    </span>
  );
}
