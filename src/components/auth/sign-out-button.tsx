'use client';

import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth/actions';
import { clearDraft } from '@/lib/questionnaire/storage';

export function SignOutButton({ home }: { home: string }) {
  const t = useTranslations('auth');
  const [pending, start] = useTransition();
  return (
    <Button
      variant="secondary"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await signOut();
          // health data stays in the account, not on a shared device
          clearDraft();
          window.location.assign(home);
        })
      }
    >
      {t('signOut')}
    </Button>
  );
}
