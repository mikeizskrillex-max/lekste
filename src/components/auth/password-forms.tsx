'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { requestPasswordReset, setNewPassword } from '@/lib/auth/actions';
import { emailOnlyInput, newPasswordInput } from '@/lib/auth/schemas';
import { Field, FormError, Notice } from './field';

export function ForgotForm({ available }: { available: boolean }) {
  const t = useTranslations('auth');
  const locale = useLocale();
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const f = useForm<{ email: string }>({ resolver: zodResolver(emailOnlyInput) });
  if (!available) return <Notice title={t('forgotTitle')}>{t('unavailableNotice')}</Notice>;
  if (sentTo) {
    return (
      <Notice title={t('checkEmailTitle')}>
        <p>{t('checkEmailReset', { email: sentTo })}</p>
        <p>{t('checkSpam')}</p>
      </Notice>
    );
  }
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={f.handleSubmit(async (v) => {
        setError(null);
        const r = await requestPasswordReset({ ...v, locale });
        if (r.ok) setSentTo(v.email);
        else setError(r.error);
      })}
    >
      <Field
        label={t('email')}
        type="email"
        autoComplete="email"
        error={f.formState.errors.email?.message}
        {...f.register('email')}
      />
      <FormError error={error} />
      <Button type="submit" size="lg" className="w-full" disabled={f.formState.isSubmitting}>
        {t('sendReset')}
      </Button>
    </form>
  );
}

export function NewPasswordForm() {
  const t = useTranslations('auth');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const f = useForm<{ password: string; repeat: string }>({ resolver: zodResolver(newPasswordInput) });
  if (done) {
    return (
      <Notice title={t('passwordSaved')}>
        <Link href="/paskyra" className="text-accent font-semibold">
          {t('toAccount')}
        </Link>
      </Notice>
    );
  }
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={f.handleSubmit(async (v) => {
        setError(null);
        const r = await setNewPassword(v);
        if (r.ok) setDone(true);
        else setError(r.error);
      })}
    >
      <Field
        label={t('password')}
        type="password"
        autoComplete="new-password"
        hint={t('passwordHint')}
        error={f.formState.errors.password?.message}
        {...f.register('password')}
      />
      <Field
        label={t('repeatPassword')}
        type="password"
        autoComplete="new-password"
        error={f.formState.errors.repeat?.message}
        {...f.register('repeat')}
      />
      <FormError error={error} />
      <Button type="submit" size="lg" className="w-full" disabled={f.formState.isSubmitting}>
        {t('savePassword')}
      </Button>
    </form>
  );
}
