'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { sendMagicLink, signIn } from '@/lib/auth/actions';
import { emailOnlyInput, safeNext, signInInput } from '@/lib/auth/schemas';
import { cn } from '@/lib/utils';
import { Field, FormError, Notice } from './field';
import { GoogleButton, OrDivider } from './google-button';

type Mode = 'password' | 'link';

export function SignInForm({ available, next, linkError }: { available: boolean; next?: string; linkError?: string }) {
  const t = useTranslations('auth');
  const locale = useLocale();
  const [mode, setMode] = useState<Mode>('password');
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const pw = useForm<{ email: string; password: string }>({ resolver: zodResolver(signInInput) });
  const link = useForm<{ email: string }>({ resolver: zodResolver(emailOnlyInput) });
  const fallback = locale === 'ru' ? '/ru/paskyra' : '/paskyra';

  if (!available) return <Notice title={t('signInTitle')}>{t('unavailableNotice')}</Notice>;
  if (sentTo) {
    return (
      <Notice title={t('checkEmailTitle')}>
        <p>{t('checkEmailLink', { email: sentTo })}</p>
        <p>{t('checkSpam')}</p>
      </Notice>
    );
  }
  const tab = (m: Mode, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === m}
      onClick={() => {
        setMode(m);
        setError(null);
      }}
      className={cn(
        'h-10 flex-1 rounded-full text-sm font-semibold',
        mode === m ? 'bg-surface shadow-card' : 'text-muted',
      )}
    >
      {label}
    </button>
  );

  return (
    <>
      {linkError && (
        <p role="alert" className="bg-accent-soft mb-4 rounded-xl px-4 py-3 text-sm">
          {t(linkError === 'google' ? 'googleFailed' : 'linkFailed')}
        </p>
      )}
      <GoogleButton next={next} />
      <OrDivider />
      <div role="tablist" className="bg-surface-2 mb-5 flex gap-1 rounded-full p-1">
        {tab('password', t('withPassword'))}
        {tab('link', t('withLink'))}
      </div>
      {mode === 'password' ? (
        <form
          noValidate
          className="space-y-4"
          onSubmit={pw.handleSubmit(async (v) => {
            setError(null);
            const r = await signIn(v);
            if (r.ok) window.location.assign(safeNext(next, fallback));
            else setError(r.error);
          })}
        >
          <Field
            label={t('email')}
            type="email"
            autoComplete="email"
            error={pw.formState.errors.email?.message}
            {...pw.register('email')}
          />
          <Field
            label={t('password')}
            type="password"
            autoComplete="current-password"
            error={pw.formState.errors.password?.message}
            {...pw.register('password')}
          />
          <FormError error={error} />
          <Button type="submit" size="lg" className="w-full" disabled={pw.formState.isSubmitting}>
            {t('signIn')}
          </Button>
          <Link
            href="/slaptazodis"
            className="text-muted hover:text-ink block text-sm underline-offset-4 hover:underline"
          >
            {t('forgot')}
          </Link>
        </form>
      ) : (
        <form
          noValidate
          className="space-y-4"
          onSubmit={link.handleSubmit(async (v) => {
            setError(null);
            const r = await sendMagicLink({ ...v, locale, next });
            if (r.ok) setSentTo(v.email);
            else setError(r.error);
          })}
        >
          <Field
            label={t('email')}
            type="email"
            autoComplete="email"
            error={link.formState.errors.email?.message}
            {...link.register('email')}
          />
          <FormError error={error} />
          <Button type="submit" size="lg" className="w-full" disabled={link.formState.isSubmitting}>
            {t('sendLink')}
          </Button>
        </form>
      )}
      <p className="mt-6 text-sm">
        {t('noAccount')}{' '}
        <Link href="/registracija" className="text-accent font-semibold underline-offset-4 hover:underline">
          {t('signUpLink')}
        </Link>
      </p>
    </>
  );
}
