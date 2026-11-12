import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { LangSwitch, Logo } from '../../components/ui';
import { useI18n } from '../../i18n/I18n';
import type { StringKey } from '../../i18n/strings';
import { useStore } from '../../lib/store';

const NAV: { to: string; icon: string; label: StringKey; mobile: boolean }[] = [
  { to: '/app', icon: '🗓️', label: 'tabWeek', mobile: true },
  { to: '/app/menu', icon: '🍽️', label: 'tabMenu', mobile: true },
  { to: '/app/basket', icon: '🛒', label: 'tabBasket', mobile: true },
  { to: '/app/diary', icon: '📒', label: 'tabDiary', mobile: true },
  { to: '/app/progress', icon: '📈', label: 'tabProgress', mobile: false },
  { to: '/app/settings', icon: '⚙️', label: 'tabSettings', mobile: true },
];

export function AppLayout() {
  const { t } = useI18n();
  const { quizDone, plan, trialDaysLeft, startTrial } = useStore();
  const loc = useLocation();
  const ready = quizDone && !!plan;
  useEffect(() => { if (ready && trialDaysLeft === null) startTrial(); }, [ready, trialDaysLeft, startTrial]);
  if (!quizDone || !plan) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg p-6 text-center">
        <div><div className="text-[56px]">🥗</div><p className="mt-3 font-semibold">{t('noPlan')}</p><Link to="/quiz" className="btn mt-5">{t('startTrial')}</Link></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg lg:grid lg:grid-cols-[250px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-surface p-5 lg:flex">
        <Logo />
        <nav className="mt-8 grid gap-1" aria-label="App">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/app'}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] font-semibold transition ${isActive ? 'bg-soft text-accent' : 'text-muted hover:bg-bg hover:text-ink'}`}>
              <span aria-hidden>{n.icon}</span>{t(n.label)}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto grid gap-3">
          <TrialCard days={trialDaysLeft ?? 7} />
          <LangSwitch />
        </div>
      </aside>

      <div className="min-w-0 pb-24 lg:pb-10">
        <header className="flex items-center justify-between border-b border-line bg-bg/90 px-4 py-3 backdrop-blur lg:hidden">
          <Logo /><LangSwitch />
        </header>
        <div className="border-b border-line bg-soft px-4 py-2 text-center text-[12.5px] font-semibold text-accent lg:hidden">
          ⏳ {(trialDaysLeft ?? 7) > 0 ? t('trialBanner', { n: trialDaysLeft ?? 7 }) : t('trialEnded')}
        </div>
        <AnimatePresence mode="wait">
          <motion.main key={loc.pathname} className="mx-auto w-full max-w-[1100px] px-4 pt-5 md:px-8 md:pt-8"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>

      {/* Mobile tabs */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="App tabs">
        <div className="mx-auto grid max-w-[560px] grid-cols-5">
          {NAV.filter((n) => n.mobile).map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/app'}
              className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2.5 text-[10.5px] font-semibold transition ${isActive ? 'text-accent' : 'text-muted opacity-70'}`}>
              <span className="text-[19px]" aria-hidden>{n.icon}</span>{t(n.label)}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

function TrialCard({ days }: { days: number }) {
  const { t } = useI18n();
  return (
    <div className="rounded-2xl bg-deep p-4 text-white">
      <div className="text-[12px] font-bold uppercase tracking-[.08em] text-leaf">{t('trialTitle')}</div>
      <div className="mt-1 text-[13px] opacity-90">{days > 0 ? t('trialBanner', { n: days }) : t('trialEnded')}</div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#8fe0b0]" style={{ width: `${(days / 7) * 100}%` }} /></div>
    </div>
  );
}
