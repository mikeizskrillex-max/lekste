'use client';

import { useTranslations } from 'next-intl';
import { useId } from 'react';
import { HEALTH, LIMITS, SEXES, type Draft } from '@/lib/questionnaire/schema';
import { Group, NumberField, StepHeading } from '../fields';
import { OptionCard } from '../option-card';
import { OtherAdults } from './other-adults';
import type { StepProps } from './types';

export function BodyStep({ draft, update, headingId }: StepProps) {
  const t = useTranslations('questionnaire.body');
  const consentId = useId();
  const consented = draft.consentAt !== undefined;
  const me = draft.me ?? {};
  const setMe = (patch: NonNullable<Draft['me']>) => update({ me: { ...me, ...patch } });
  const healthOptions = HEALTH.filter((h) => me.sex !== 'male' || (h !== 'pregnant' && h !== 'breastfeeding'));

  return (
    <>
      <StepHeading id={headingId} title={t('title')} hint={t('hint')} />
      <div className="rounded-card bg-surface-2 ring-line mb-6 p-4 ring-1">
        <label htmlFor={consentId} className="flex cursor-pointer items-start gap-3">
          <input
            id={consentId}
            type="checkbox"
            className="accent-accent mt-1 size-5 shrink-0"
            checked={consented}
            onChange={(e) => update({ consentAt: e.target.checked ? new Date().toISOString() : undefined })}
          />
          <span className="text-[15px] leading-snug font-semibold">{t('consent')}</span>
        </label>
        <p className="text-muted mt-2 pl-8 text-sm">{t('consentNote')}</p>
      </div>

      <fieldset disabled={!consented} className="space-y-6 disabled:opacity-60">
        {!consented && <p className="text-muted text-center text-sm">{t('consentFirst')}</p>}
        <Group label={t('sex')} className="grid-cols-2">
          {SEXES.map((s) => (
            <OptionCard
              key={s}
              compact
              label={t(s)}
              selected={me.sex === s}
              onSelect={() =>
                consented &&
                update({
                  me: { ...me, sex: s },
                  // pregnancy and breastfeeding only apply to women
                  ...(s === 'male' && (draft.health === 'pregnant' || draft.health === 'breastfeeding')
                    ? { health: undefined }
                    : {}),
                })
              }
            />
          ))}
        </Group>
        <div className="grid grid-cols-3 gap-3">
          <NumberField
            label={t('age')}
            unit={t('unitYears')}
            value={me.age}
            min={LIMITS.age.min}
            max={LIMITS.age.max}
            hint={t('range', LIMITS.age)}
            disabled={!consented}
            onChange={(age) => setMe({ age })}
          />
          <NumberField
            label={t('height')}
            unit={t('unitCm')}
            value={me.heightCm}
            min={LIMITS.heightCm.min}
            max={LIMITS.heightCm.max}
            hint={t('range', LIMITS.heightCm)}
            disabled={!consented}
            onChange={(heightCm) => setMe({ heightCm })}
          />
          <NumberField
            label={t('weight')}
            unit={t('unitKg')}
            decimal
            value={me.weightKg}
            min={LIMITS.weightKg.min}
            max={LIMITS.weightKg.max}
            hint={t('range', LIMITS.weightKg)}
            disabled={!consented}
            onChange={(weightKg) => setMe({ weightKg })}
          />
        </div>
        <div>
          <h2 className="mb-3 text-lg font-semibold">{t('health')}</h2>
          <Group label={t('health')} className="sm:grid-cols-2">
            {healthOptions.map((h) => (
              <OptionCard
                key={h}
                compact
                label={t(`health_${h}`)}
                selected={draft.health === h}
                onSelect={() => consented && update({ health: h })}
              />
            ))}
          </Group>
          {draft.health && draft.health !== 'none' && <p className="text-muted mt-3 text-sm">{t('healthNote')}</p>}
        </div>
        {(draft.adults ?? 1) > 1 && <OtherAdults draft={draft} update={update} />}
      </fieldset>
    </>
  );
}
