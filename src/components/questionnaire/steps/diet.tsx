'use client';

import { Ban, Beef, Fish, Leaf, Sprout, Wheat, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DIET_CHOICES, type Answers } from '@/lib/questionnaire/schema';
import { Group, StepHeading } from '../fields';
import { OptionCard } from '../option-card';
import type { StepProps } from './types';

const ICONS: Record<Answers['diet'], LucideIcon> = {
  omnivore: Beef,
  vegetarian: Leaf,
  vegan: Sprout,
  pescatarian: Fish,
  no_pork: Ban,
  low_carb: Wheat,
};

export function DietStep({ draft, update, headingId }: StepProps) {
  const t = useTranslations('questionnaire.diet');
  return (
    <>
      <StepHeading id={headingId} title={t('title')} hint={t('hint')} />
      <Group label={t('title')} className="md:grid-cols-2">
        {DIET_CHOICES.map((d) => (
          <OptionCard
            key={d}
            icon={ICONS[d]}
            label={t(d)}
            description={t(`${d}Desc`)}
            selected={draft.diet === d}
            onSelect={() => update({ diet: d })}
          />
        ))}
      </Group>
    </>
  );
}
