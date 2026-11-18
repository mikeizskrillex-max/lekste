'use client';

import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { STORE_NAMES, type StoreCode } from '@/lib/config';
import { formatDate, formatEur } from '@/lib/i18n/format';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';

type Props = {
  amount: number;
  store: StoreCode;
  /** when the price was read from the store — every price shows it */
  checkedAt: string;
  suffix?: string;
  size?: 'sm' | 'lg';
  className?: string;
};

/** A price with its source and check date (tooltip "Barbora · patikrinta 2026-11-16"). */
export function PriceTag({ amount, store, checkedAt, suffix, size = 'sm', className }: Props) {
  const t = useTranslations('price');
  const source = t('checked', { store: STORE_NAMES[store], date: formatDate(checkedAt) });
  return (
    <span className={cn('inline-flex items-baseline gap-1.5', className)}>
      <span
        className={cn('tabular font-semibold', size === 'lg' ? 'font-serif text-4xl tracking-tight' : 'text-[15px]')}
      >
        {formatEur(amount)}
      </span>
      {suffix && <span className="text-muted text-sm">{suffix}</span>}
      <Tooltip content={source}>
        <button
          type="button"
          className="text-muted hover:text-ink inline-flex translate-y-[2px] items-center gap-1 rounded-full text-[11px]"
          aria-label={`${t('sourceInfo')}: ${source}`}
        >
          <Info className="h-3.5 w-3.5" aria-hidden />
          <span className="hidden sm:inline">{STORE_NAMES[store]}</span>
        </button>
      </Tooltip>
    </span>
  );
}
