'use client';

import { useEffect, useRef, useState } from 'react';
import type { Intent } from '@/ai/intent';
import { useModes } from '@/app/providers';
import { useI18n } from '@/i18n/I18nProvider';
import type { MessageKey } from '@/i18n/messages';
import { todayIndex, useStore } from '@/state/store';
import { PageTitle } from '../appshell';
import { Badge, Card, cx } from '../ui';

interface Msg { role: 'user' | 'bot'; text: string; bad?: boolean }

const SUGGEST: Record<'lt' | 'ru', string[]> = {
  lt: ['Pakeisk šiandienos vakarienę', 'Pigesni pietūs rytoj', 'Daugiau baltymų', 'Vegetariškai', 'Dviem žmonėms', 'Tik Lidl', 'Iki 50 € per savaitę', 'Be žuvies'],
  ru: ['Замени сегодняшний ужин', 'Обед на завтра подешевле', 'Больше белка', 'Вегетарианское меню', 'На двоих', 'Только Lidl', 'До 50 € в неделю', 'Без рыбы'],
};

export function AssistantPage() {
  const { t, lang } = useI18n();
  const modes = useModes();
  const store = useStore();
  const [msgs, setMsgs] = useState<Msg[]>([{ role: 'bot', text: t('assistantHello') }]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [msgs]);

  const send = async (m: string) => {
    if (!m.trim() || busy) return;
    setText(''); setBusy(true);
    setMsgs((x) => [...x, { role: 'user', text: m }]);
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: m, context: { lang, today: todayIndex(), mealsPerDay: store.answers.mealsPerDay, household: store.answers.household, dietType: store.answers.dietType, stores: store.answers.stores } }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const { intent } = (await res.json()) as { intent: Intent };
      const notes = store.applyAssistant(intent);
      const lines = notes.map((n) => ({ role: 'bot' as const, text: t(n.key as MessageKey, n.vars), bad: n.kind === 'fail' }));
      setMsgs((x) => [...x, ...(intent.reply ? [{ role: 'bot' as const, text: intent.reply }] : []), ...(lines.length ? lines : intent.reply ? [] : [{ role: 'bot' as const, text: t('assistantNothing') }])]);
    } catch {
      setMsgs((x) => [...x, { role: 'bot', text: t('assistantError'), bad: true }]);
    } finally { setBusy(false); }
  };

  return (
    <>
      <PageTitle title={t('tabAssistant')} right={<Badge tone={modes.ai ? 'leaf' : 'line'}>{modes.ai ? t('assistantAi') : t('assistantRules')}</Badge>} />
      <Card className="flex h-[calc(100vh-260px)] min-h-[420px] flex-col overflow-hidden">
        <div className="flex-1 space-y-3 overflow-y-auto p-4 md:p-6" aria-live="polite">
          {msgs.map((m, i) => (
            <div key={i} className={cx('max-w-[85%] rounded-2xl px-4 py-2.5 text-[14.5px] leading-relaxed', m.role === 'user' ? 'ml-auto bg-forest text-white' : m.bad ? 'bg-danger/10 text-danger' : 'bg-sage text-ink')}>{m.text}</div>
          ))}
          {busy && <div className="w-16 animate-pulse rounded-2xl bg-sage px-4 py-2.5">…</div>}
          <div ref={end} />
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto border-t border-line px-4 py-2.5">
          {SUGGEST[lang].map((s) => <button key={s} type="button" onClick={() => send(s)} className="shrink-0 rounded-full bg-paper px-3 py-1.5 text-[12.5px] font-semibold ring-1 ring-line hover:ring-leaf">{s}</button>)}
        </div>
        <form className="flex gap-2 border-t border-line p-3" onSubmit={(e) => { e.preventDefault(); send(text); }}>
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder={t('assistantPlaceholder')} aria-label={t('assistantPlaceholder')} className="min-w-0 flex-1 rounded-xl bg-paper px-3.5 py-3 text-[15px] ring-1 ring-line outline-none focus:ring-2 focus:ring-leaf" />
          <button type="submit" disabled={busy} className="rounded-xl bg-leaf px-5 font-semibold text-white disabled:opacity-50">{t('send')}</button>
        </form>
      </Card>
      <p className="mt-3 text-[12px] text-muted">{t('assistantPrivacy')} {t('medicalDisclaimer')}</p>
    </>
  );
}
