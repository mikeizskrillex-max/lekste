'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { formatNumber } from '@/lib/i18n/format';
import { householdTargets } from '@/lib/nutrition/targets';
import { answers } from '@/lib/questionnaire/schema';
import { withDefaults } from '@/lib/questionnaire/steps';
import { loadDraft } from '@/lib/questionnaire/storage';

/** Design A: next to the form — the norm from this browser's questionnaire, which the account will keep. */
export function NormAside() {
  const t = useTranslations('auth');
  const [kcal, setKcal] = useState<number | null | undefined>(undefined);
  useEffect(() => {
    const a = answers.safeParse(withDefaults(loadDraft()));
    setKcal(a.success ? (householdTargets(a.data)[0]?.kcal ?? null) : null);
  }, []);
  if (kcal === undefined) return <div className="hidden min-h-64 md:block" aria-hidden />;
  return (
    <aside className="rounded-card bg-surface-2 flex flex-col items-center justify-center gap-4 p-6 text-center md:p-10">
      <p className="text-muted text-sm font-semibold tracking-wide uppercase">{t('asideTitle')}</p>
      {kcal !== null ? (
        <>
          <div className="border-line bg-surface relative flex size-40 flex-col items-center justify-center rounded-full border-[14px] [border-top-color:var(--accent)] [border-right-color:var(--promo)] [border-bottom-color:var(--savings)] md:size-48">
            <span className="tabular font-serif text-4xl font-semibold">{formatNumber(kcal)}</span>
            <span className="text-muted text-xs">{t('asideKcal')}</span>
          </div>
          <p className="max-w-xs">{t('asideSaved')}</p>
        </>
      ) : (
        <>
          <p className="max-w-xs">{t('asideEmpty')}</p>
          <Button asChild variant="secondary">
            <Link href="/pradeti">{t('asideStart')}</Link>
          </Button>
        </>
      )}
    </aside>
  );
}
