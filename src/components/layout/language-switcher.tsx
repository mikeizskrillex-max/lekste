'use client';

import { Globe } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { cn } from '@/lib/utils';

/** 🌐 + language code; each language is named in itself, no flags. Keeps the current page. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations('lang');
  const locale = useLocale();
  const pathname = usePathname();
  return (
    <nav aria-label={t('label')} className={cn('flex items-center gap-1', className)}>
      <Globe className="text-muted h-4 w-4" aria-hidden />
      {routing.locales.map((l) => (
        <Link
          key={l}
          href={pathname}
          locale={l}
          lang={l}
          hrefLang={l}
          aria-current={l === locale ? 'true' : undefined}
          title={t(l)}
          className={cn(
            'rounded-full px-2 py-1 text-sm font-semibold uppercase transition-colors',
            l === locale ? 'bg-ink text-bg' : 'text-muted hover:text-ink',
          )}
        >
          {l}
          <span className="sr-only"> — {t(l)}</span>
        </Link>
      ))}
    </nav>
  );
}
