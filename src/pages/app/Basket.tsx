import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { CountUp } from '../../components/ui';
import { INGREDIENT_BY_ID } from '../../data/ingredients';
import { PRICES_DATE, STORE_LABEL, type StoreId } from '../../data/prices';
import { formatEur, useI18n } from '../../i18n/I18n';
import { useStore } from '../../lib/store';
import { weekBaskets } from './shared';

type Mode = StoreId | 'mix';

export function Basket() {
  const { t, lang, pick } = useI18n();
  const { plan, swaps, answers, checked, toggleChecked } = useStore();
  const all = useMemo(() => weekBaskets(plan!, swaps, answers.household), [plan, swaps, answers.household]);
  const [mode, setMode] = useState<Mode>('mix');
  const [copied, setCopied] = useState(false);
  const eur = (n: number) => formatEur(n, lang);
  const cur = all[mode];
  const stores = [...new Set(cur.lines.map((l) => l.store))];
  const worst = Math.max(all.barbora.total, all.rimi.total);
  const inCart = cur.lines.filter((l) => checked.includes(l.ingredientId)).reduce((s, l) => s + l.cost, 0);
  const date = new Date(PRICES_DATE).toLocaleDateString(lang === 'lt' ? 'lt-LT' : 'ru-RU', { day: 'numeric', month: 'long' });

  async function copy() {
    const text = stores.map((s) => `${STORE_LABEL[s]}:\n` + cur.lines.filter((l) => l.store === s).map((l) => `• ${l.offer.name} × ${l.packs}`).join('\n')).join('\n\n');
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked */ }
  }

  const options: { m: Mode; label: string; total: number }[] = [
    { m: 'mix', label: t('bestMix'), total: all.mix.total },
    { m: 'barbora', label: STORE_LABEL.barbora, total: all.barbora.total },
    { m: 'rimi', label: STORE_LABEL.rimi, total: all.rimi.total },
  ];

  return (
    <div>
      <h1 className="font-display text-[26px] font-extrabold md:text-[32px]">{t('shopTitle')}</h1>
      <p className="mt-1 text-[13px] text-muted">{t('pricesFrom', { date })}</p>

      <div className="mt-5 grid gap-3 md:grid-cols-3" role="group" aria-label={t('compareStores')}>
        {options.map((o) => (
          <button key={o.m} type="button" aria-pressed={mode === o.m} onClick={() => setMode(o.m)}
            className={`rounded-[18px] border-2 p-4 text-left transition ${mode === o.m ? 'border-accent bg-soft' : 'border-line bg-surface hover:border-accent/50'}`}>
            <div className="text-[13px] font-semibold text-muted">{o.m === 'mix' ? `⭐ ${o.label}` : `${t('oneStore')}: ${o.label}`}</div>
            <div className="mt-1 font-display text-[26px] font-extrabold tabular"><CountUp value={o.total} format={eur} /></div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
              <motion.div className={`h-full rounded-full ${o.m === 'mix' ? 'bg-accent' : 'bg-muted/50'}`} animate={{ width: `${(o.total / worst) * 100}%` }} transition={{ duration: 0.8 }} />
            </div>
            {o.m === 'mix' && worst > o.total && <div className="mt-2 text-[12.5px] font-bold text-accent">−{eur(worst - o.total)}</div>}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_300px] lg:items-start">
        <div>
          {stores.map((s) => {
            const lines = cur.lines.filter((l) => l.store === s);
            return (
              <section key={s} className="card mb-4 overflow-hidden">
                <div className="flex justify-between bg-deep px-4 py-3 text-[14px] font-bold text-white">
                  <span>{STORE_LABEL[s]} · {lines.length} {t('items')}</span><span className="tabular">{eur(lines.reduce((a, l) => a + l.cost, 0))}</span>
                </div>
                {lines.map((l) => {
                  const ing = INGREDIENT_BY_ID[l.ingredientId];
                  const on = checked.includes(l.ingredientId);
                  return (
                    <label key={l.ingredientId} className="flex cursor-pointer items-center gap-3 border-t border-line px-4 py-3 first:border-t-0">
                      <input type="checkbox" checked={on} onChange={() => toggleChecked(l.ingredientId)} className="h-5 w-5 shrink-0 accent-[rgb(var(--accent))]" />
                      <span className="text-[22px]" aria-hidden>{ing.emoji}</span>
                      <span className={`min-w-0 flex-1 ${on ? 'text-muted line-through' : ''}`}>
                        <span className="block font-semibold">{pick(ing)} <span className="font-normal text-muted">· {t('needed')} {Math.round(l.grams)} g</span></span>
                        <span className="block truncate text-[12.5px] text-muted">
                          {l.offer.url ? <a href={l.offer.url} target="_blank" rel="noreferrer" className="underline decoration-line underline-offset-2 hover:text-accent">{l.offer.name}</a> : l.offer.name}
                          {' '}{l.pantry ? `· ${t('pantry')}` : `× ${l.packs} ${t('packs')}`}
                          {l.offer.promo && <span className="ml-1.5 rounded bg-warm px-1.5 py-0.5 text-[10px] font-bold text-[#4a3200]">{t('onPromo')}</span>}
                        </span>
                      </span>
                      <span className="font-bold tabular">{eur(l.cost)}</span>
                    </label>
                  );
                })}
              </section>
            );
          })}
        </div>
        <aside className="card sticky top-6 p-5">
          <div className="text-[13px] text-muted">{t('inCart')}</div>
          <div className="font-display text-[26px] font-extrabold tabular"><CountUp value={inCart} format={eur} /> <span className="text-[14px] text-muted">/ {eur(cur.total)}</span></div>
          <div className="mt-3 text-[13px] text-muted">{t('budgetUse')}: {eur(answers.weeklyBudget)}</div>
          <button type="button" className="btn-ghost mt-4" onClick={copy}>{copied ? `✓ ${t('copied')}` : `📋 ${t('copyList')}`}</button>
        </aside>
      </div>
    </div>
  );
}
