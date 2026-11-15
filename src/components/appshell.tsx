'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import type { MessageKey } from '@/i18n/messages';
import { signOut } from '@/lib/account';
import { useStore } from '@/state/store';
import { DevBanner, LangSwitch, Logo } from './site';
import { ButtonLink, Card, Container, Skeleton, cx } from './ui';

const NAV: { href: string; key: MessageKey; icon: string; mobile?: boolean }[] = [
  { href: '/app', key: 'tabHome', icon: '◉' },
  { href: '/app/menu', key: 'tabMenu2', icon: '🍽', mobile: true },
  { href: '/app/recipes', key: 'navRecipes', icon: '📖' },
  { href: '/app/shopping', key: 'tabShopping', icon: '🧺', mobile: true },
  { href: '/app/basket', key: 'tabBasket2', icon: '🛒' },
  { href: '/app/compare', key: 'tabCompare', icon: '⚖' },
  { href: '/app/assistant', key: 'tabAssistant', icon: '✦' },
  { href: '/app/progress', key: 'tabProgress2', icon: '📈', mobile: true },
  { href: '/app/settings', key: 'tabSettings2', icon: '⚙', mobile: true },
  { href: '/app/subscription', key: 'tabSubscription', icon: '💳' },
];

const active = (path: string, href: string) => (href === '/app' ? path === '/app' : path.startsWith(href) || (href === '/app/menu' && path.startsWith('/app/recipe/')));

async function serverLogout() { await signOut(); }

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const path = usePathname();
  const router = useRouter();
  const { ready, onboarded, subscription, logout, session } = useStore();
  const open = path.startsWith('/app/settings') || path.startsWith('/app/subscription') || path.startsWith('/app/recipe');

  let content = children;
  if (!ready) content = <div className="space-y-4"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-40" /><Skeleton className="h-40" /></div>;
  else if (!onboarded && !open) content = <Gate text={t('noPlanYet')} href="/onboarding" cta={t('startOnboarding')} />;
  else if (subscription.status === 'none' && !open) content = <Gate text={t('subscriptionNeeded')} href="/checkout" cta={t('choosePlanCta')} />;

  return (
    <div className="min-h-screen bg-paper">
      <DevBanner />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-line bg-card px-4 py-5 lg:flex">
        <Logo />
        <nav className="mt-8 flex-1 space-y-1" aria-label="App">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={cx('flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] font-semibold transition', active(path, n.href) ? 'bg-sage text-forest' : 'text-ink/75 hover:bg-paper')}>
              <span className="w-5 text-center" aria-hidden>{n.icon}</span>{t(n.key)}
            </Link>
          ))}
          {session?.role === 'admin' && <Link href="/admin" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] font-semibold text-ink/75 hover:bg-paper"><span className="w-5 text-center">⛭</span>Admin</Link>}
        </nav>
        <div className="space-y-3 border-t border-line pt-4">
          <LangSwitch />
          <button type="button" className="block text-[13.5px] font-semibold text-muted hover:text-ink" onClick={async () => { await serverLogout(); logout(); router.push('/'); router.refresh(); }}>{t('logout')}</button>
        </div>
      </aside>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-paper/95 px-4 backdrop-blur lg:hidden">
        <Logo />
        <div className="flex items-center gap-2">
          <Link href="/app/assistant" className="grid h-9 w-9 place-items-center rounded-xl bg-sage text-forest" aria-label={t('tabAssistant')}>✦</Link>
          <Link href="/app/basket" className="grid h-9 w-9 place-items-center rounded-xl bg-sage" aria-label={t('tabBasket2')}>🛒</Link>
          <Link href="/app" className="grid h-9 w-9 place-items-center rounded-xl bg-sage" aria-label={t('tabHome')}>◉</Link>
        </div>
      </header>
      <main id="main" className="pb-28 lg:pb-12 lg:pl-[248px]">
        <Container className="max-w-[1080px] py-6 md:py-8">{content}</Container>
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-card/95 backdrop-blur pb-safe lg:hidden" aria-label="Tabs">
        {NAV.filter((n) => n.mobile).map((n) => (
          <Link key={n.href} href={n.href} className={cx('flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-bold', active(path, n.href) ? 'text-forest' : 'text-muted')}>
            <span className="text-[19px]" aria-hidden>{n.icon}</span>{t(n.key)}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function Gate({ text, href, cta }: { text: string; href: string; cta: string }) {
  return <Card className="mx-auto mt-10 max-w-md p-8 text-center"><p className="text-[16px]">{text}</p><ButtonLink href={href} className="mt-6">{cta} →</ButtonLink></Card>;
}

export function PageTitle({ title, sub, right }: { title: string; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="font-display text-[28px] font-extrabold leading-tight md:text-[34px]">{title}</h1>{sub && <div className="mt-1 text-[14.5px] text-muted">{sub}</div>}</div>
      {right}
    </div>
  );
}
