'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { signUp } from '@/lib/auth/actions';
import { signUpInput } from '@/lib/auth/schemas';
import { Field, FormError, Notice } from './field';
import { GoogleButton, OrDivider } from './google-button';

type Values = { email: string; password: string };

export function SignUpForm({ available }: { available: boolean }) {
  const t = useTranslations('auth');
  const locale = useLocale();
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<Values>({ resolver: zodResolver(signUpInput) });

  if (!available) return <Notice title={t('signUpTitle')}>{t('unavailableNotice')}</Notice>;
  if (sentTo) {
    return (
      <Notice title={t('checkEmailTitle')}>
        <p>{t('checkEmailSignUp', { email: sentTo })}</p>
        <p>{t('checkSpam')}</p>
      </Notice>
    );
  }
  return (
    <>
      <GoogleButton />
      <OrDivider />
      <form
        noValidate
        className="space-y-4"
        onSubmit={handleSubmit(async (v) => {
          setError(null);
          const r = await signUp({ ...v, locale });
          if (r.ok) setSentTo(v.email);
          else setError(r.error);
        })}
      >
        <Field
          label={t('email')}
          type="email"
          autoComplete="email"
          error={formState.errors.email?.message}
          {...register('email')}
        />
        <Field
          label={t('password')}
          type="password"
          autoComplete="new-password"
          hint={t('passwordHint')}
          error={formState.errors.password?.message}
          {...register('password')}
        />
        <FormError error={error} />
        <Button type="submit" size="lg" className="w-full" disabled={formState.isSubmitting}>
          {t('create')}
        </Button>
        <p className="text-muted text-xs">{t('terms')}</p>
      </form>
      <p className="mt-6 text-sm">
        {t('haveAccount')}{' '}
        <Link href="/prisijungti" className="text-accent font-semibold underline-offset-4 hover:underline">
          {t('signInLink')}
        </Link>
      </p>
    </>
  );
}
