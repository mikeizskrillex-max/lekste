'use client';

import { ShieldAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ALLERGENS, type Allergen } from '@/lib/allergens';
import type { ALLERGY_LEVELS, Draft } from '@/lib/questionnaire/schema';
import { cn } from '@/lib/utils';
import { StepHeading } from '../fields';
import type { StepProps } from './types';

type Level = (typeof ALLERGY_LEVELS)[number];

/** Each allergen: none / intolerance (avoid) / allergy (exclude completely). */
export function AllergiesStep({ draft, update, headingId }: StepProps) {
  const t = useTranslations('questionnaire.allergies');
  const chosen = draft.allergies ?? [];
  const levelOf = (code: Allergen) => chosen.find((a) => a.code === code)?.level;
  const set = (code: Allergen, level: Level | undefined) => {
    const rest: NonNullable<Draft['allergies']> = chosen.filter((a) => a.code !== code);
    update({ allergies: level ? [...rest, { code, level }] : rest });
  };
  const levels: (Level | undefined)[] = [undefined, 'intolerance', 'allergy'];

  return (
    <>
      <StepHeading id={headingId} title={t('title')} hint={t('hint')} />
      <p className="text-muted mb-4 text-sm">
        <strong className="text-ink">{t('allergy')}</strong> — {t('allergyDesc')} ·{' '}
        <strong className="text-ink">{t('intolerance')}</strong> — {t('intoleranceDesc')}
      </p>
      <ul className="grid gap-2 md:grid-cols-2">
        {ALLERGENS.map((code) => {
          const current = levelOf(code);
          const name = t(`names.${code}`);
          return (
            <li
              key={code}
              className={cn(
                'bg-surface ring-line flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2.5 ring-1',
                current === 'allergy' && 'ring-accent ring-2',
              )}
            >
              <span className="flex items-center gap-2 font-semibold">
                {current === 'allergy' && <ShieldAlert className="text-accent size-4" aria-hidden />}
                {name}
              </span>
              <div role="radiogroup" aria-label={name} className="bg-surface-2 flex rounded-full p-0.5">
                {levels.map((level) => (
                  <button
                    key={level ?? 'none'}
                    type="button"
                    role="radio"
                    aria-checked={current === level}
                    onClick={() => set(code, level)}
                    className={cn(
                      'h-9 rounded-full px-3 text-xs font-semibold transition-colors',
                      current === level
                        ? level === 'allergy'
                          ? 'bg-accent text-accent-ink'
                          : 'bg-ink text-bg'
                        : 'text-muted hover:text-ink',
                    )}
                  >
                    {t(level ?? 'none')}
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="text-muted mt-5 space-y-1 text-sm">
        <p>{t('strictNote')}</p>
        <p className="font-semibold">{t('packageNote')}</p>
      </div>
    </>
  );
}
