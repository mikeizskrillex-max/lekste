'use client';

import { Menu, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { NAV_READY } from './nav';

/** ☰ menu for phones. Closes on navigation and on Escape. */
export function MobileMenu() {
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? t('closeMenu') : t('openMenu')}
        onClick={() => setOpen((o) => !o)}
        className="hover:bg-surface-2 grid h-10 w-10 place-items-center rounded-full"
      >
        {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
      </button>
      {open && (
        <nav
          id="mobile-menu"
          aria-label={t('main')}
          className="border-line bg-bg shadow-card absolute inset-x-0 top-16 border-b px-4 pt-2 pb-4"
        >
          {NAV_READY.map((n) => (
            <Link
              key={n.key}
              href={n.href}
              className="hover:bg-surface-2 block rounded-xl px-3 py-3 text-base font-medium"
            >
              {t(n.key)}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
