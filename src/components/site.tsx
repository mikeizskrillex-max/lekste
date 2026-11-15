'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useModes } from '@/app/providers';
import { useI18n } from '@/i18n/I18nProvider';
import { useStore } from '@/state/store';
import { ButtonLink, Container, cx } from './ui';

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className={cx('flex items-center gap-2 font-display text-[20px] font-extrabold tracking-tight', light ? 'text-white' : 'text-forest')} aria-label="Lėkštė">
      <span className={cx('grid h-8 w-8 place-items-center rounded-[10px]', light ? 'bg-white/15' : 'bg-forest')}>
        <span className="block h-4 w-4 rounded-full border-[3px] border-paper"><span className="m-auto mt-[2px] block h-1.5 w-1.5 rounded-full bg-gold" /></span>
      </span>
      Lėkštė
    </Link>
  );
}

export function LangSwitch({ className }: { className?: string }) {
  const { lang, setLang } = useI18n();
  return (
    <div className={cx('inline-flex rounded-full bg-sage p-0.5 text-[12px] font-bold', className)} role="group" aria-label="Language">
      {(['lt', 'ru'] as const).map((l) => (
        <button key={l} type="button" onClick={() => setLang(l)} aria-pressed={lang === l}
          className={cx('rounded-full px-2.5 py-1 uppercase transition', lang === l ? 'bg-card text-forest shadow-soft' : 'text-muted')}>{l}</button>
      ))}
    </div>
  );
}

export function DevBanner() {
  const modes = useModes();
  const { t } = useI18n();
  if (modes.supabase && modes.stripe) return null;
  const list = [!modes.supabase && 'Supabase', !modes.stripe && 'Stripe'].filter(Boolean).join(', ');
  return (
    <div className="bg-ink px-4 py-1.5 text-center text-[11.5px] font-medium text-white/85">
      ◎ {modes.supabase ? t('devBannerShort', { list }) : `${t('devMode')}: ${t('devBanner', { list })}`}
    </div>
  );
}

export function SiteHeader() {
  const { t } = useI18n();
  const { session } = useStore();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const links = [
    { href: '/how-it-works', label: t('navHow') },
    { href: '/demo', label: t('navDemo') },
    { href: '/recipes', label: t('navRecipes') },
    { href: '/supermarkets', label: t('navSupermarkets') },
    { href: '/pricing', label: t('navPricing') },
    { href: '/faq', label: t('navFaq') },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/90 backdrop-blur">
      <DevBanner />
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={cx('rounded-xl px-3 py-2 text-[14.5px] font-semibold transition hover:bg-sage', path === l.href ? 'text-forest' : 'text-ink/75')}>{l.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LangSwitch className="hidden sm:inline-flex" />
          {session
            ? <ButtonLink href="/app" variant="secondary" size="sm">{t('tabHome')}</ButtonLink>
            : <Link href="/login" className="hidden px-2 text-[14px] font-semibold text-ink/75 hover:text-ink sm:block">{t('login')}</Link>}
          <ButtonLink href="/onboarding" size="sm" className="hidden sm:inline-flex">{t('ctaCreate')}</ButtonLink>
          <button type="button" className="grid h-10 w-10 place-items-center rounded-xl ring-1 ring-line lg:hidden" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <span className="text-[18px]">{open ? '✕' : '☰'}</span>
          </button>
        </div>
      </Container>
      {open && (
        <div className="border-t border-line bg-paper lg:hidden">
          <Container className="flex flex-col gap-1 py-3">
            {links.map((l) => <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-[16px] font-semibold hover:bg-sage">{l.label}</Link>)}
            <Link href={session ? '/app' : '/login'} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-[16px] font-semibold hover:bg-sage">{session ? t('tabHome') : t('login')}</Link>
            <div className="flex items-center justify-between px-3 pt-2"><LangSwitch /><ButtonLink href="/onboarding" size="sm">{t('ctaCreate')}</ButtonLink></div>
          </Container>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  const { t, lang } = useI18n();
  const cols = [
    { title: 'Lėkštė', links: [['/how-it-works', t('navHow')], ['/demo', t('navDemo')], ['/recipes', t('navRecipes')], ['/pricing', t('navPricing')], ['/faq', t('navFaq')]] },
    { title: t('navSupermarkets'), links: [['/supermarkets', 'Maxima · Lidl · Rimi · Iki · Barbora']] },
    { title: lang === 'lt' ? 'Teisinė informacija' : 'Правовая информация', links: [['/privacy', t('privacy')], ['/terms', t('terms')]] },
  ];
  return (
    <footer className="mt-24 bg-forest text-white">
      <Container className="grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-white/70">{t('footerTag')}</p>
          <p className="mt-4 max-w-sm text-[12px] leading-relaxed text-white/50">{t('medicalDisclaimer')}</p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <div className="text-[13px] font-bold uppercase tracking-wider text-white/50">{c.title}</div>
            <ul className="mt-3 space-y-2">{c.links.map(([h, l]) => <li key={h}><Link href={h} className="text-[14.5px] text-white/85 hover:text-white">{l}</Link></li>)}</ul>
          </div>
        ))}
      </Container>
      <div className="border-t border-white/10 py-5 text-center text-[12px] text-white/50">© 2026 Lėkštė · {t('photosCredit')}</div>
    </footer>
  );
}

export function PublicPage({ children }: { children: React.ReactNode }) {
  return (<><SiteHeader /><main id="main">{children}</main><SiteFooter /></>);
}
