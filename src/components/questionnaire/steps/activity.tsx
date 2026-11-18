'use client';

import { Armchair, Bike, Flame, Footprints, PersonStanding, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ACTIVITY_LEVELS } from '@/lib/questionnaire/schema';
import { Group, StepHeading } from '../fields';
import { OptionCard } from '../option-card';
import type { StepProps } from './types';

const ICONS: readonly LucideIcon[] = [Armchair, Footprints, PersonStanding, Bike, Flame];

export function ActivityStep({ draft, update, headingId }: StepProps) {
  const t = useTranslations('questionnaire.activity');
  return (
    <>
      <StepHeading id={headingId} title={t('title')} hint={t('hint')} />
      <Group label={t('title')}>
        {ACTIVITY_LEVELS.map((n) => (
          <OptionCard
            key={n}
            icon={ICONS[n - 1]}
            label={t(`${n}`)}
            description={t(`${n}Desc`)}
            selected={draft.activity === n}
            onSelect={() => update({ activity: n })}
          />
        ))}
      </Group>
    </>
  );
}
