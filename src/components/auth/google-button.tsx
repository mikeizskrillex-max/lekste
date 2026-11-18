'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { googleSignInUrl } from '@/lib/auth/actions';
import { FormError } from './field';

export function GoogleButton({ next }: { next?: string }) {
  const t = useTranslations('auth');
  const locale = useLocale();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="w-full"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await googleSignInUrl({ locale, next });
            if (r.ok) window.location.assign(r.url);
            else setError(r.error);
          })
        }
      >
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
          <path
            fill="#4285F4"
            d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2-1.9 3.3-4.7 3.3-8z"
          />
          <path
            fill="#34A853"
            d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.6H2.1v2.9A11 11 0 0 0 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.8 14c-.2-.7-.4-1.3-.4-2s.1-1.4.4-2V7.1H2.1A11 11 0 0 0 1 12c0 1.8.4 3.4 1.1 4.9L5.8 14z"
          />
          <path
            fill="#EA4335"
            d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1L5.8 10c.9-2.7 3.3-4.6 6.2-4.6z"
          />
        </svg>
        {t('google')}
      </Button>
      <FormError error={error} />
    </div>
  );
}

export function OrDivider() {
  const t = useTranslations('auth');
  return (
    <div className="text-muted my-5 flex items-center gap-3 text-sm" aria-hidden>
      <span className="bg-line h-px flex-1" />
      {t('or')}
      <span className="bg-line h-px flex-1" />
    </div>
  );
}
