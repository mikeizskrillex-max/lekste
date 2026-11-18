'use client';

import { animate, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { formatNumber } from '@/lib/i18n/format';
import type { Macros } from '@/lib/nutrition/targets';

const R = 86;
const C = 2 * Math.PI * R;
const SEGMENTS = [
  { key: 'protein', kcalPerG: 4, color: 'var(--accent)' },
  { key: 'fat', kcalPerG: 9, color: 'var(--promo)' },
  { key: 'carbs', kcalPerG: 4, color: 'var(--savings)' },
] as const;

/** The plate: kcal in the middle, protein / fat / carbs as rim segments (share of energy). */
export function NormPlate({ kcal, macros }: { kcal: number; macros: Macros }) {
  const t = useTranslations('questionnaire.result');
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? kcal : 0);
  useEffect(() => {
    if (reduce) return setShown(kcal);
    const c = animate(0, kcal, { duration: 0.9, ease: [0.2, 0.8, 0.2, 1], onUpdate: (v) => setShown(Math.round(v)) });
    return () => c.stop();
  }, [kcal, reduce]);

  const energy = SEGMENTS.map((s) => macros[s.key] * s.kcalPerG);
  const sum = energy.reduce((a, b) => a + b, 0) || 1;
  let offset = 0;
  const gap = 6;

  return (
    <figure className="flex flex-col items-center gap-6 md:flex-row md:gap-10">
      <div className="relative size-60 shrink-0 md:size-72">
        <svg viewBox="0 0 200 200" className="size-full -rotate-90" aria-hidden>
          <circle cx="100" cy="100" r="97" fill="var(--surface)" stroke="var(--line)" strokeWidth="2" />
          {SEGMENTS.map((s, i) => {
            const len = Math.max(((energy[i] ?? 0) / sum) * C - gap, 0);
            const el = (
              <circle
                key={s.key}
                cx="100"
                cy="100"
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-offset}
              />
            );
            offset += ((energy[i] ?? 0) / sum) * C;
            return el;
          })}
          <circle cx="100" cy="100" r="66" fill="var(--bg)" stroke="var(--line)" strokeWidth="1" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="tabular font-serif text-5xl font-semibold md:text-6xl">{formatNumber(shown)}</span>
          <span className="text-muted text-sm">{t('perDay')}</span>
        </div>
      </div>
      <figcaption className="w-full max-w-xs space-y-3">
        {SEGMENTS.map((s) => (
          <div key={s.key} className="flex items-center gap-3">
            <span className="size-3 shrink-0 rounded-full" style={{ background: s.color }} aria-hidden />
            <span className="flex-1">{t(s.key)}</span>
            <span className="tabular font-semibold">{t('grams', { value: formatNumber(macros[s.key]) })}</span>
          </div>
        ))}
      </figcaption>
    </figure>
  );
}
