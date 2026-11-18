import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from './language-switcher';
import { Logo } from './logo';
import { MobileMenu } from './mobile-menu';
import { NAV_READY, START_HREF } from './nav';
import { ThemeToggle } from './theme-toggle';

export function SiteHeader() {
  const t = useTranslations();
  return (
    <header className="border-line/70 bg-bg/85 supports-[backdrop-filter]:bg-bg/70 sticky top-0 z-40 border-b backdrop-blur">
      <a
        href="#turinys"
        className="focus:bg-surface sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded-full focus:px-4 focus:py-2"
      >
        {t('common.skipToContent')}
      </a>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
        <Link href="/" aria-label={t('common.brand')} className="rounded-full">
          <Logo label={t('common.brand')} />
        </Link>
        <nav aria-label={t('nav.main')} className="hidden items-center gap-1 md:flex">
          {NAV_READY.map((n) => (
            <Link
              key={n.key}
              href={n.href}
              className="text-ink/80 hover:bg-surface-2 hover:text-ink rounded-full px-3 py-2 text-[15px] font-medium"
            >
              {t(`nav.${n.key}`)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <LanguageSwitcher className="hidden md:flex" />
          <ThemeToggle />
          <Button asChild size="sm" className="hidden md:inline-flex">
            <Link href={START_HREF}>{t('nav.start')}</Link>
          </Button>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
