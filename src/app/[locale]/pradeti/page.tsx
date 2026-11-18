import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Wizard } from '@/components/questionnaire/wizard';
import { pickerItems } from '@/lib/ingredients/picker-data';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'questionnaire' });
  return { title: t('title'), description: t('metaDescription') };
}

/** The questionnaire (SPEC §5): 9 screens, no sign-up, answers stay in the browser. */
export default async function StartPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Wizard items={pickerItems(locale === 'ru' ? 'ru' : 'lt')} />;
}
