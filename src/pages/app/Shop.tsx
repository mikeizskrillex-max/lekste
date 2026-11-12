import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { CountUp } from '../../components/ui';
import { INGREDIENT_BY_ID } from '../../data/ingredients';
import { formatEur, useI18n } from '../../i18n/I18n';
import { shoppingList } from '../../lib/planner';
import { useStore } from '../../lib/store';
import { effectivePlan } from './shared';

export function Shop() {
  const { t, lang, pick } = useI18n();
  const { plan, swaps, answers, checked, toggleChecked } = useStore();
  const [copied, setCopied] = useState(false);
  const [burst, setBurst] = useState<string | null>(null);
  const list = useMemo(() => shoppingList(effectivePlan(plan!, swaps), answers.household), [plan, swaps, answers.household]);
  const stores = [...new Set(list.map((x) => x.store))];
  const eur = (n: number) => formatEur(n, lang);
  const inCart = list.filter((x) => checked.includes(x.ingredientId)).reduce((s, x) => s + x.cost, 0);
  const saved = list.filter((x) => checked.includes(x.ingredientId)).reduce((s, x) => s + x.saving, 0);

  async function copy() {
    const text = stores.map((s) => `${s}:\n` + list.filter((x) => x.store === s).map((x) => `• ${pick(INGREDIENT_BY_ID[x.ingredientId])} — ${x.grams} g`).join('\n')).join('\n\n');
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked */ }
  }

  return (
    <div className="pt-2">
      <h1 className="font-display text-[22px] font-extrabold">{t('shopTitle')}</h1>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <div className="card p-3"><div className="text-[12px] text-muted">{t('inCart')}</div><div className="font-display text-[20px] font-extrabold"><CountUp value={inCart} format={eur} /></div></div>
        <div className="card p-3"><div className="text-[12px] text-muted">{t('saved')}</div><div className="font-display text-[20px] font-extrabold text-accent"><CountUp value={saved} format={eur} /></div></div>
      </div>

      {stores.map((s) => {
        const items = list.filter((x) => x.store === s);
        return (
          <section key={s}>
            <div className="mb-1.5 mt-4 flex justify-between rounded-xl bg-deep px-3 py-2.5 text-[13.5px] font-bold text-white">
              <span>{s} · {items.length} {t('items')}</span><span className="tabular">{eur(items.reduce((a, x) => a + x.cost, 0))}</span>
            </div>
            {items.map((x) => {
              const ing = INGREDIENT_BY_ID[x.ingredientId];
              const on = checked.includes(x.ingredientId);
              return (
                <label key={x.ingredientId} className="relative flex cursor-pointer items-center gap-3 border-b border-line px-1 py-2.5">
                  <input type="checkbox" checked={on} className="h-5 w-5 shrink-0 accent-[rgb(var(--accent))]"
                    onChange={() => { toggleChecked(x.ingredientId); if (!on && x.saving > 0) { setBurst(x.ingredientId); setTimeout(() => setBurst(null), 900); } }} />
                  <span className={`min-w-0 flex-1 ${on ? 'text-muted line-through' : ''}`}>
                    {ing.emoji} {pick(ing)} <span className="text-[12px] text-muted">{x.grams} g</span>
                    {x.saving > 0 && <span className="ml-1.5 rounded bg-warm px-1.5 py-0.5 text-[10px] font-bold text-[#4a3200]">−{eur(x.saving)}</span>}
                  </span>
                  <span className="font-bold tabular">{eur(x.cost)}</span>
                  {burst === x.ingredientId && ['💚', '✨', '€', '🥦', '✨'].map((c, i) => (
                    <motion.span key={i} className="pointer-events-none absolute left-2 top-2 text-[18px]" aria-hidden
                      initial={{ x: 0, y: 0, opacity: 1 }} animate={{ x: Math.cos((i / 5) * 6.28) * 50, y: Math.sin((i / 5) * 6.28) * 50 - 20, opacity: 0, rotate: i * 70 }}
                      transition={{ duration: 0.9 }}>{c}</motion.span>
                  ))}
                </label>
              );
            })}
          </section>
        );
      })}

      <button type="button" className="btn-ghost mt-5" onClick={copy}>{copied ? `✓ ${t('copied')}` : `📋 ${t('copyList')}`}</button>
      <p className="mt-3 text-center text-[11px] text-muted">{t('demoNote')}</p>
    </div>
  );
}
