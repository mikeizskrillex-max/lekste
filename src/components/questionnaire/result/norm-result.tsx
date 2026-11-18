'use client';

import { Info, Stethoscope } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { formatEur, formatNumber } from '@/lib/i18n/format';
import { needsDoctor } from '@/lib/nutrition/safety';
import { householdTargets, totals, type PersonTarget } from '@/lib/nutrition/targets';
import type { Answers } from '@/lib/questionnaire/schema';
import { NormPlate } from './norm-plate';

export function NormResult({
  answers,
  onEdit,
  headingId,
}: {
  answers: Answers;
  onEdit: () => void;
  headingId: string;
}) {
  const t = useTranslations('questionnaire');
  const people = householdTargets(answers);
  const me = people[0];
  if (!me) return null;
  const all = totals(people);
  const notes = [...new Set(people.flatMap((p) => p.notes))];
  const restrictions = [
    ...(answers.diet !== 'omnivore' ? [t(`diet.${answers.diet}`)] : []),
    ...answers.allergies.map((a) => `${t(`allergies.names.${a.code}`)} (${t(`allergies.${a.level}`).toLowerCase()})`),
  ];
  const who = (p: PersonTarget) =>
    p.kind === 'me'
      ? t('result.me')
      : p.kind === 'adult'
        ? t('result.adult', { n: p.index })
        : t('result.child', { age: p.age ?? 0 });

  return (
    <div>
      <h1 id={headingId} tabIndex={-1} className="mb-8 text-center text-4xl font-semibold outline-none md:text-5xl">
        {t('result.title')}
      </h1>
      <div className="rounded-card bg-surface shadow-card ring-line flex justify-center p-6 ring-1 md:p-10">
        <NormPlate kcal={me.kcal} macros={me} />
      </div>

      {notes.length > 0 && (
        <div className="rounded-card bg-surface-2 mt-4 space-y-2 p-4 text-sm">
          {notes.map((n) => (
            <p key={n} className="flex gap-2">
              <Info className="text-muted mt-0.5 size-4 shrink-0" aria-hidden />
              {t(`result.notes.${n}`)}
            </p>
          ))}
          {needsDoctor(notes) && (
            <p className="flex gap-2 font-semibold">
              <Stethoscope className="mt-0.5 size-4 shrink-0" aria-hidden />
              {t('result.doctor')}
            </p>
          )}
        </div>
      )}

      {people.length > 1 && (
        <section className="mt-8">
          <h2 className="mb-3 text-xl font-semibold">{t('result.household')}</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {people.map((p) => (
              <li key={`${p.kind}-${p.index}`} className="bg-surface ring-line rounded-xl p-4 ring-1">
                <p className="font-semibold">{who(p)}</p>
                <p className="tabular mt-1 font-serif text-2xl">{t('result.kcal', { value: formatNumber(p.kcal) })}</p>
                <p className="tabular text-muted text-sm">
                  {(['protein', 'fat', 'carbs'] as const)
                    .map((k) => `${t(`result.${k}`)} ${t('result.grams', { value: formatNumber(p[k]) })}`)
                    .join(' · ')}
                </p>
                {p.approximate && <p className="text-muted mt-1 text-xs">{t('result.approx')}</p>}
              </li>
            ))}
          </ul>
          <p className="tabular mt-3 font-semibold">
            {t('result.household')}: {t('result.kcal', { value: formatNumber(all.kcal) })}
          </p>
        </section>
      )}

      <dl className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="bg-surface ring-line rounded-xl p-4 ring-1">
          <dt className="text-muted text-sm">{t('result.budget')}</dt>
          <dd className="tabular font-semibold">{t('result.budgetValue', { amount: formatEur(answers.budgetEur) })}</dd>
        </div>
        <div className="bg-surface ring-line rounded-xl p-4 ring-1">
          <dt className="text-muted text-sm">{t('result.store')}</dt>
          <dd className="font-semibold">{t(`store.${answers.store}`)}</dd>
        </div>
        <div className="bg-surface ring-line rounded-xl p-4 ring-1">
          <dt className="text-muted text-sm">{t('result.restrictions')}</dt>
          <dd className="font-semibold">
            {restrictions.length ? restrictions.join(', ') : t('result.noRestrictions')}
          </dd>
        </div>
      </dl>

      <div className="mt-10 flex flex-col items-center gap-3 text-center">
        <Button size="lg" disabled aria-describedby="build-soon">
          {t('result.build')}
        </Button>
        <p id="build-soon" className="text-muted max-w-md text-sm">
          {t('result.buildSoon')}
        </p>
        <Button variant="ghost" onClick={onEdit}>
          {t('result.edit')}
        </Button>
        <p className="text-muted mt-4 text-xs">
          {t('result.method')} {t('allergies.packageNote')}
        </p>
      </div>
    </div>
  );
}
