'use client';

import { Clock, Scale, ShoppingBasket } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { COOK_TIMES, STORE_CHOICES } from '@/lib/questionnaire/schema';
import { Group, StepHeading } from '../fields';
import { OptionCard } from '../option-card';
import type { StepProps } from './types';

export function StoreStep({ draft, update, headingId }: StepProps) {
  const t = useTranslations('questionnaire.store');
  return (
    <>
      <StepHeading id={headingId} title={t('title')} hint={t('hint')} />
      <Group label={t('title')}>
        {STORE_CHOICES.map((s) => (
          <OptionCard
            key={s}
            icon={s === 'cheapest' ? Scale : ShoppingBasket}
            label={t(s)}
            description={t(`${s}Desc`)}
            selected={draft.store === s}
            onSelect={() => update({ store: s })}
          />
        ))}
      </Group>
      <h2 className="mt-8 mb-3 text-lg font-semibold">{t('cook')}</h2>
      <Group label={t('cook')} className="grid-cols-1 sm:grid-cols-3">
        {COOK_TIMES.map((c) => (
          <OptionCard
            key={c}
            compact
            icon={Clock}
            label={t(`cook_${c}`)}
            selected={draft.cookTime === c}
            onSelect={() => update({ cookTime: c })}
          />
        ))}
      </Group>
    </>
  );
}
