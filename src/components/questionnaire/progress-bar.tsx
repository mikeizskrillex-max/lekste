'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

/** Segmented progress: one segment per screen, plus "3 / 9". */
export function ProgressBar({ current, total }: { current: number; total: number }) {
  const t = useTranslations('questionnaire');
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex flex-1 gap-1"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-valuetext={t('progress', { current, total })}
      >
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors duration-300',
              i < current ? 'bg-accent' : 'bg-line',
            )}
          />
        ))}
      </div>
      <span className="tabular text-muted w-12 text-right text-sm font-semibold">
        {t('progress', { current, total })}
      </span>
    </div>
  );
}
