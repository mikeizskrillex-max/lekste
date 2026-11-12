import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LangSwitch } from '../../components/ui';
import { useI18n } from '../../i18n/I18n';
import { useStore } from '../../lib/store';

export function Settings() {
  const { t } = useI18n();
  const store = useStore();
  const nav = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const [exported, setExported] = useState<string | null>(null);

  return (
    <div className="pt-2">
      <h1 className="font-display text-[26px] font-extrabold md:text-[32px]">{t('settingsTitle')}</h1>
      <div className="mt-4 grid max-w-[640px] gap-2">
        <Link to="/quiz" className="card flex justify-between p-4 font-semibold"><span>🎯 {t('redoQuiz')}</span><span>›</span></Link>
        <Link to="/app/progress" className="card flex justify-between p-4 font-semibold lg:hidden"><span>📈 {t('tabProgress')}</span><span>›</span></Link>
        <div className="card flex items-center justify-between p-4 font-semibold"><span>🌐 {t('language')}</span><LangSwitch /></div>
        <button type="button" className="card flex justify-between p-4 text-left font-semibold" onClick={() => alertNotReady(setExported)}>
          <span>💳 {t('manageSub')}</span><span>›</span>
        </button>
        <button type="button" className="card flex justify-between p-4 text-left font-semibold"
          onClick={() => setExported(JSON.stringify({ answers: store.answers, weights: store.weights, feedback: store.feedback }, null, 2))}>
          <span>⬇️ {t('exportData')}</span><span>›</span>
        </button>
        {exported && <pre className="max-h-48 overflow-auto rounded-xl bg-surface p-3 text-[11px]">{exported}</pre>}
        {!confirm
          ? <button type="button" className="card p-4 text-left font-semibold text-[#c0392b]" onClick={() => setConfirm(true)}>🗑 {t('deleteAccount')}</button>
          : (
            <div className="card p-4">
              <p className="font-semibold">{t('deleteConfirm')}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" className="btn-ghost" onClick={() => setConfirm(false)}>{t('cancel')}</button>
                <button type="button" className="btn !bg-[#c0392b] !text-white" onClick={() => { store.reset(); nav('/'); }}>{t('yesDelete')}</button>
              </div>
            </div>
          )}
      </div>
      <p className="mt-6 text-center text-[12px] text-muted">{t('notMedical')}</p>
    </div>
  );
}

/** Stripe Customer Portal is connected in the next step; until then explain in place. */
function alertNotReady(set: (s: string) => void) {
  set('Stripe Customer Portal: connected after Supabase + Stripe keys are added (see README).');
}
