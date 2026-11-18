import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AuthLayout } from '@/components/auth/auth-layout';
import { NewPasswordForm } from '@/components/auth/password-forms';
import { redirect } from '@/i18n/navigation';
import { supabaseServer } from '@/lib/supabase/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });
  return { title: t('newPasswordTitle'), robots: { index: false } };
}

/** Reached from the reset e-mail: /api/auth/confirm signs the person in first. */
export default async function NewPasswordPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const db = await supabaseServer();
  const user = db ? (await db.auth.getUser()).data.user : null;
  if (!user) redirect({ href: '/slaptazodis', locale });
  const t = await getTranslations('auth');
  return (
    <AuthLayout title={t('newPasswordTitle')} aside={false}>
      <NewPasswordForm />
    </AuthLayout>
  );
}
