import { AnimatePresence, motion } from 'framer-motion';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { LangSwitch, Logo } from '../../components/ui';
import { useI18n } from '../../i18n/I18n';
import type { StringKey } from '../../i18n/strings';
import { useStore } from '../../lib/store';

const TABS: [string, string, StringKey][] = [
  ['/app', '🏠', 'tabToday'],
  ['/app/menu', '🍽️', 'tabMenu'],
  ['/app/shop', '🛒', 'tabShop'],
  ['/app/progress', '📈', 'tabProgress'],
  ['/app/settings', '⚙️', 'tabSettings'],
];

export function AppLayout() {
  const { t } = useI18n();
  const { quizDone, plan } = useStore();
  const loc = useLocation();
  if (!quizDone || !plan) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg p-6 text-center">
        <div><div className="text-[56px]">🥗</div><p className="mt-3 font-semibold">{t('noPlan')}</p><Link to="/quiz" className="btn mt-5">{t('heroCta')}</Link></div>
      </div>
    );
  }
  if (loc.pathname === '/app/') return <Navigate to="/app" replace />;

  return (
    <div className="min-h-screen bg-bg pb-24">
      <header className="container-app flex items-center justify-between pb-1 pt-4"><Logo /><LangSwitch /></header>
      <AnimatePresence mode="wait">
        <motion.main key={loc.pathname} className="container-app"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur" aria-label="App">
        <div className="mx-auto grid max-w-[480px] grid-cols-5">
          {TABS.map(([to, icon, label]) => (
            <NavLink key={to} to={to} end={to === '/app'}
              className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition ${isActive ? 'text-accent' : 'text-muted opacity-70'}`}>
              <span className="text-[19px]" aria-hidden>{icon}</span>{t(label)}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
