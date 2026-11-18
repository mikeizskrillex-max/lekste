'use client';

import { Plus, Utensils, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { LIMITS, MEALS, SEXES, type Draft } from '@/lib/questionnaire/schema';
import { cn } from '@/lib/utils';
import { Counter, Group, StepHeading } from '../fields';
import { OptionCard } from '../option-card';
import type { StepProps } from './types';

const MEAL_KEY = { '2': 'meals_2', '3': 'meals_3', '3+1': 'meals_3p1', '3+2': 'meals_3p2' } as const;

export function HouseholdStep({ draft, update, headingId }: StepProps) {
  const t = useTranslations('questionnaire.household');
  const adults = draft.adults ?? 1;
  const children = draft.children ?? [];
  const setChildren = (next: NonNullable<Draft['children']>) => update({ children: next });

  return (
    <>
      <StepHeading id={headingId} title={t('title')} hint={t('hint')} />
      <div className="rounded-card bg-surface shadow-card ring-line space-y-5 p-5 ring-1 md:p-6">
        <Counter
          label={t('adults')}
          value={adults}
          min={LIMITS.adults.min}
          max={LIMITS.adults.max}
          lessLabel={t('less')}
          moreLabel={t('more')}
          onChange={(n) => update({ adults: n, others: (draft.others ?? []).slice(0, n - 1) })}
        />
        <div className="border-line border-t pt-5">
          <p className="font-semibold">{t('children')}</p>
          <ul className="mt-3 space-y-3">
            {children.map((c, i) => (
              <li key={i} className="bg-surface-2 rounded-xl p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold">{t('child', { n: i + 1 })}</span>
                  <button
                    type="button"
                    className="text-muted hover:text-ink flex size-9 items-center justify-center rounded-full"
                    aria-label={`${t('removeChild')} ${i + 1}`}
                    onClick={() => setChildren(children.filter((_, k) => k !== i))}
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </div>
                <Counter
                  label={t('childAge')}
                  value={c.age}
                  min={LIMITS.childAge.min}
                  max={LIMITS.childAge.max}
                  suffix={t('years')}
                  lessLabel={t('less')}
                  moreLabel={t('more')}
                  onChange={(age) => setChildren(children.map((x, k) => (k === i ? { ...x, age } : x)))}
                />
                <div role="radiogroup" aria-label={t('child', { n: i + 1 })} className="mt-3 grid grid-cols-2 gap-2">
                  {SEXES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      role="radio"
                      aria-checked={c.sex === s}
                      onClick={() => setChildren(children.map((x, k) => (k === i ? { ...x, sex: s } : x)))}
                      className={cn(
                        'h-10 rounded-full text-sm font-semibold ring-1',
                        c.sex === s ? 'bg-accent text-accent-ink ring-accent' : 'bg-surface ring-line',
                      )}
                    >
                      {t(s === 'female' ? 'girl' : 'boy')}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          {children.length < LIMITS.children.max && (
            <Button
              type="button"
              variant="secondary"
              className="mt-3 w-full"
              onClick={() => setChildren([...children, { age: 6, sex: 'female' }])}
            >
              <Plus className="size-4" aria-hidden />
              {t('addChild')}
            </Button>
          )}
        </div>
      </div>

      <h2 className="mt-8 mb-3 text-lg font-semibold">{t('meals')}</h2>
      <Group label={t('meals')} className="sm:grid-cols-2">
        {MEALS.map((m) => (
          <OptionCard
            key={m}
            compact
            icon={Utensils}
            label={t(MEAL_KEY[m])}
            description={t(`${MEAL_KEY[m]}Desc`)}
            selected={draft.meals === m}
            onSelect={() => update({ meals: m, adults })}
          />
        ))}
      </Group>
    </>
  );
}
