'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { Button, Card } from './ui';

interface BIPEvent extends Event { prompt: () => Promise<void> }

/** "Add to home screen": native prompt where the browser offers one (Android/Chrome), instructions otherwise. */
export function InstallApp() {
  const { t } = useI18n();
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [standalone, setStandalone] = useState(true);
  useEffect(() => {
    setStandalone(window.matchMedia('(display-mode: standalone)').matches);
    const h = (e: Event) => { e.preventDefault(); setEvt(e as BIPEvent); };
    window.addEventListener('beforeinstallprompt', h);
    return () => window.removeEventListener('beforeinstallprompt', h);
  }, []);
  if (standalone) return null;
  return (
    <Card className="flex flex-wrap items-center gap-3 p-4">
      <span className="text-[22px]" aria-hidden>📲</span>
      <div className="min-w-0 flex-1"><b className="block text-[14.5px]">{t('installApp')}</b><span className="text-[12.5px] text-muted">{t('installHint')}</span></div>
      {evt && <Button size="sm" onClick={() => { void evt.prompt(); setEvt(null); }}>{t('installApp')}</Button>}
    </Card>
  );
}
