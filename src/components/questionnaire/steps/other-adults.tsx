'use client';

import { useTranslations } from 'next-intl';
import { GOALS, LIMITS, SEXES, type Draft, type OtherAdult } from '@/lib/questionnaire/schema';
import { cn } from '@/lib/utils';
import { NumberField } from '../fields';

/** Optional data for the other adults. Anything skipped falls back to EFSA reference values. */
export function OtherAdults({ draft, update }: { draft: Draft; update: (patch: Partial<Draft>) => void }) {
  const t = useTranslations('questionnaire.body');
  const tg = useTranslations('questionnaire.goal');
  const count = (draft.adults ?? 1) - 1;
  const others = Array.from({ length: count }, (_, i) => draft.others?.[i] ?? {});
  const set = (i: number, patch: Partial<OtherAdult>) =>
    update({ others: others.map((o, k) => (k === i ? { ...o, ...patch } : o)) });

  return (
    <details className="rounded-card bg-surface ring-line p-4 ring-1">
      <summary className="cursor-pointer font-semibold">{t('others')}</summary>
      <p className="text-muted mt-1 text-sm">{t('othersHint')}</p>
      {others.map((o, i) => (
        <div key={i} className="border-line mt-4 space-y-3 border-t pt-4">
          <p className="text-sm font-semibold">{t('adult', { n: i + 2 })}</p>
          <div
            role="radiogroup"
            aria-label={`${t('adult', { n: i + 2 })} — ${t('sex')}`}
            className="grid grid-cols-2 gap-2"
          >
            {SEXES.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={o.sex === s}
                onClick={() => set(i, { sex: o.sex === s ? undefined : s })}
                className={cn(
                  'h-10 rounded-full text-sm font-semibold ring-1',
                  o.sex === s ? 'bg-accent text-accent-ink ring-accent' : 'bg-surface ring-line',
                )}
              >
                {t(s)}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <NumberField
              label={t('age')}
              unit={t('unitYears')}
              value={o.age}
              min={18}
              max={LIMITS.age.max}
              hint={t('range', { min: 18, max: LIMITS.age.max })}
              onChange={(age) => set(i, { age })}
            />
            <NumberField
              label={t('height')}
              unit={t('unitCm')}
              value={o.heightCm}
              min={LIMITS.heightCm.min}
              max={LIMITS.heightCm.max}
              hint={t('range', LIMITS.heightCm)}
              onChange={(heightCm) => set(i, { heightCm })}
            />
            <NumberField
              label={t('weight')}
              unit={t('unitKg')}
              decimal
              value={o.weightKg}
              min={LIMITS.weightKg.min}
              max={LIMITS.weightKg.max}
              hint={t('range', LIMITS.weightKg)}
              onChange={(weightKg) => set(i, { weightKg })}
            />
          </div>
          <label className="block text-sm font-semibold">
            {t('goalLabel')}
            <select
              className="bg-surface ring-line mt-1.5 block h-12 w-full rounded-xl px-3 ring-1"
              value={o.goal ?? 'maintain'}
              onChange={(e) => set(i, { goal: GOALS.find((g) => g === e.target.value) })}
            >
              {GOALS.map((g) => (
                <option key={g} value={g}>
                  {tg(g)}
                </option>
              ))}
            </select>
          </label>
        </div>
      ))}
    </details>
  );
}
