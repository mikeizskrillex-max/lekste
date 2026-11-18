import { CalendarCheck, Info, Store, Tag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';

/**
 * How a price looks in Lėkštė — structure only, no amounts. Real basket totals appear here
 * once weekly price collection runs (phase 4) and demo menus exist (phase 7).
 */
export function PriceDemo() {
  const t = useTranslations('home.priceDemo');
  const rows = [
    ['source', Store, t('store')],
    ['checked', CalendarCheck, t('date')],
    ['promo', Tag, t('promoValue')],
  ] as const;
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 md:grid-cols-2 md:px-6">
      <div>
        <h2 className="text-3xl font-semibold md:text-4xl">{t('title')}</h2>
        <p className="text-muted mt-3 text-lg">{t('text')}</p>
      </div>
      <Card className="p-6">
        <p className="flex items-center gap-2 font-semibold">
          <Info className="text-accent h-5 w-5" aria-hidden />
          {t('product')}
        </p>
        <dl className="divide-line mt-4 divide-y">
          {rows.map(([k, Icon, value]) => (
            <div key={k} className="flex items-center justify-between gap-4 py-3">
              <dt className="text-muted flex items-center gap-2">
                <Icon className="h-4 w-4" aria-hidden />
                {t(k)}
              </dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </section>
  );
}
