import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { use } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'start' });
  return { title: t('title') };
}

/** Questionnaire placeholder — the 9-step wizard is phase 3. */
export default function StartPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations();
  return (
    <section className="mx-auto max-w-2xl px-4 pt-16 md:px-6">
      <h1 className="text-4xl font-semibold">{t('start.title')}</h1>
      <p className="text-muted mt-4 text-lg">{t('start.body')}</p>
      <p className="text-muted mt-2 text-sm">{t('common.medicalDisclaimer')}</p>
      <Button asChild variant="secondary" className="mt-8">
        <Link href="/">{t('start.back')}</Link>
      </Button>
    </section>
  );
}
