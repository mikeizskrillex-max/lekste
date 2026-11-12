import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TopBar } from '../components/ui';
import { useI18n } from '../i18n/I18n';

export function Welcome() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-bg">
      <TopBar />
      <main className="container-app grid place-items-center pt-20 text-center">
        <motion.div className="text-[72px]" initial={{ scale: 0.4, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }}>🎉</motion.div>
        <h1 className="mt-4 font-display text-[26px] font-extrabold">{t('welcomeTitle')}</h1>
        <p className="mt-2 max-w-[320px] text-muted">{t('welcomeText')}</p>
        <Link to="/app" className="btn mt-8">{t('toCabinet')}</Link>
      </main>
    </div>
  );
}
