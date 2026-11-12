'use client';

import { PublicPage } from '@/components/site';
import { ButtonLink, Container } from '@/components/ui';
import { useI18n } from '@/i18n/I18nProvider';

export default function NotFound() {
  const { t } = useI18n();
  return <PublicPage><Container className="py-24 text-center"><h1 className="font-display text-[40px] font-extrabold">404</h1><p className="mt-2 text-muted">{t('notFound')}</p><ButtonLink href="/" className="mt-6">{t('toHome')}</ButtonLink></Container></PublicPage>;
}
