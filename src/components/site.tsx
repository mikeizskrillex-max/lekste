import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { recipeImage } from '../data/recipes';
import { useI18n } from '../i18n/I18n';
import { LangSwitch, Logo } from './ui';

/** Real dish photo with a soft placeholder while loading. */
export function DishPhoto({ id, alt, className = '', eager = false }: { id: string; alt: string; className?: string; eager?: boolean }) {
  return (
    <div className={`overflow-hidden bg-leaf ${className}`}>
      <img src={recipeImage(id)} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" className="h-full w-full object-cover" />
    </div>
  );
}

export function SiteHeader() {
  const { t } = useI18n();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const links: [string, string][] = [['#how', t('navHow')], ['#week', t('navMenu')], ['#prices', t('navPrices')], ['#plans', t('navPlans')], ['#faq', t('navFaq')]];
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/90 backdrop-blur">
      <div className="container-site flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-7 text-[14px] font-semibold text-muted lg:flex" aria-label="Main">
          {links.map(([href, label]) => <a key={href} href={href} className="transition hover:text-ink">{label}</a>)}
        </nav>
        <div className="flex items-center gap-3">
          <LangSwitch />
          <Link to="/app" className="hidden text-[14px] font-semibold text-muted hover:text-ink sm:block">{t('login')}</Link>
          <button type="button" onClick={() => nav('/quiz')} className="hidden rounded-xl bg-accent px-4 py-2.5 text-[14px] font-bold text-onaccent transition hover:brightness-110 sm:block">{t('startFree')}</button>
          <button type="button" className="grid h-10 w-10 place-items-center rounded-xl border border-line lg:hidden" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>☰</button>
        </div>
      </div>
      {open && (
        <nav className="container-site grid gap-1 pb-4 lg:hidden" aria-label="Mobile">
          {links.map(([href, label]) => <a key={href} href={href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 font-semibold hover:bg-soft">{label}</a>)}
          <Link to="/app" className="rounded-xl px-3 py-3 font-semibold hover:bg-soft">{t('login')}</Link>
          <button type="button" onClick={() => nav('/quiz')} className="btn mt-2">{t('startFree')}</button>
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-site grid gap-8 py-12 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm text-[14px] text-muted">{t('footerAbout')}</p>
        </div>
        <div className="grid content-start gap-2 text-[14px]">
          <a href="#how" className="text-muted hover:text-ink">{t('navHow')}</a>
          <a href="#prices" className="text-muted hover:text-ink">{t('navPrices')}</a>
          <a href="#plans" className="text-muted hover:text-ink">{t('navPlans')}</a>
        </div>
        <div className="grid content-start gap-2 text-[14px]">
          <Link to="/privacy" className="text-muted hover:text-ink">{t('privacy')}</Link>
          <Link to="/terms" className="text-muted hover:text-ink">{t('terms')}</Link>
        </div>
      </div>
      <div className="container-site flex flex-col gap-1 border-t border-line py-5 text-[12px] text-muted md:flex-row md:justify-between">
        <span>© Lėkštė · {t('notMedical')}</span>
        <span>{t('photosCredit')}</span>
      </div>
    </footer>
  );
}
