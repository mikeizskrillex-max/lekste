'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { saveQuestionnaire } from '@/lib/auth/actions';
import type { Answers } from '@/lib/questionnaire/schema';
import { answers as answersSchema } from '@/lib/questionnaire/schema';
import { withDefaults } from '@/lib/questionnaire/steps';
import { loadDraft, saveDraft } from '@/lib/questionnaire/storage';

/**
 * Moves the guest questionnaire into the account after sign-in (only when the account has none yet),
 * and brings the account's answers into this browser when it has none.
 */
export function AccountSync({ server }: { server: Answers | null }) {
  const t = useTranslations('auth');
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle');
  useEffect(() => {
    const local = answersSchema.safeParse(withDefaults(loadDraft()));
    if (!server && local.success) {
      setState('saving');
      void saveQuestionnaire(local.data).then((r) => {
        setState(r.ok ? 'saved' : 'idle');
        if (r.ok) router.refresh();
      });
    } else if (server && !local.success) {
      saveDraft(server);
    }
  }, [server, router]);
  if (state === 'idle') return null;
  return (
    <p role="status" className="bg-surface-2 rounded-xl px-4 py-3 text-sm">
      {t(state === 'saving' ? 'syncing' : 'synced')}
    </p>
  );
}
