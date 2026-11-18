'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useId } from 'react';
import { formatEur } from '@/lib/i18n/format';
import { LIMITS } from '@/lib/questionnaire/schema';
import { defaultBudget } from '@/lib/questionnaire/steps';
import { StepHeading } from '../fields';
import type { StepProps } from './types';

export function BudgetStep({ draft, update, headingId }: StepProps) {
  const t = useTranslations('questionnaire.budget');
  const id = useId();
  const { min, max, step } = LIMITS.budgetEur;
  const value = draft.budgetEur ?? defaultBudget(draft.adults ?? 1, draft.children?.length ?? 0);
  // the starting value counts as an answer, so "Toliau" works without touching the slider
  useEffect(() => {
    if (draft.budgetEur === undefined) update({ budgetEur: value });
  }, [draft.budgetEur, update, value]);
  return (
    <>
      <StepHeading id={headingId} title={t('title')} hint={t('hint')} />
      <div className="rounded-card bg-surface shadow-card ring-line p-6 ring-1 md:p-8">
        <p className="tabular text-center font-serif text-5xl font-semibold" aria-hidden>
          {formatEur(value)}
        </p>
        <label htmlFor={id} className="sr-only">
          {t('label')}
        </label>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-valuetext={t('perWeek', { amount: formatEur(value) })}
          onChange={(e) => update({ budgetEur: Number(e.target.value) })}
          className="accent-accent mt-6 h-11 w-full cursor-pointer"
        />
        <div className="tabular text-muted flex justify-between text-sm">
          <span>{formatEur(min)}</span>
          <span>{formatEur(max)}</span>
        </div>
      </div>
      <p className="text-muted mt-4 text-center text-sm">{t('note')}</p>
    </>
  );
}
