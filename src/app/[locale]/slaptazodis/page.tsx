import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AuthLayout } from '@/components/auth/auth-layout';
import { ForgotForm } from '@/components/auth/password-forms';
import { supabaseConfigured } from '@/lib/supabase/env';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });
  return { title: t('forgotTitle'), robots: { index: false } };
}

export default async function ForgotPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('auth');
  return (
    <AuthLayout title={t('forgotTitle')} lead={t('forgotLead')} aside={false}>
      <ForgotForm available={supabaseConfigured} />
    </AuthLayout>
  );
}
