'use client';

import { Dumbbell, Equal, PiggyBank, Salad, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { GOALS, type Answers } from '@/lib/questionnaire/schema';
import { Group, StepHeading } from '../fields';
import { OptionCard } from '../option-card';
import type { StepProps } from './types';

const ICONS: Record<Answers['goal'], LucideIcon> = {
  lose: TrendingDown,
  maintain: Equal,
  gain: TrendingUp,
  protein: Dumbbell,
  healthier: Salad,
  cheaper: PiggyBank,
};

export function GoalStep({ draft, update, headingId }: StepProps) {
  const t = useTranslations('questionnaire.goal');
  return (
    <>
      <StepHeading id={headingId} title={t('title')} hint={t('hint')} />
      <Group label={t('title')} className="md:grid-cols-2">
        {GOALS.map((g) => (
          <OptionCard
            key={g}
            icon={ICONS[g]}
            label={t(g)}
            description={t(`${g}Desc`)}
            selected={draft.goal === g}
            onSelect={() => update({ goal: g })}
          />
        ))}
      </Group>
    </>
  );
}
