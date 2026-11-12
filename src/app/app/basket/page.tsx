'use client';

import { PageTitle } from '@/components/appshell';
import { BasketView } from '@/components/basket';
import { useI18n } from '@/i18n/I18nProvider';

export default function Page() {
  const { t } = useI18n();
  return <><PageTitle title={t('tabBasket2')} sub={t('consolidated')} /><BasketView /></>;
}
