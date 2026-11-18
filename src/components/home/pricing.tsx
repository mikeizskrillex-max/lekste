import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { START_HREF } from '@/components/layout/nav';
import { Link } from '@/i18n/navigation';
import { formatEur } from '@/lib/i18n/format';
import { PLANS, perMonthEur, TRIAL_DAYS } from '@/lib/plans';
import { cn } from '@/lib/utils';

/** Plans with PVM. Buttons lead to the questionnaire; checkout arrives with phase 11. */
export function Pricing() {
  const t = useTranslations('home.pricing');
  return (
    <section id="kainos" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-12 md:px-6">
      <h2 className="text-3xl font-semibold md:text-4xl">{t('title')}</h2>
      <p className="text-muted mt-3 text-lg">{t('subtitle')}</p>
      <ul className="mt-8 grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => {
          const month = perMonthEur(p);
          return (
            <li key={p.id}>
              <Card className={cn('flex h-full flex-col p-6', p.highlighted && 'ring-accent ring-2')}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xl font-semibold">{t(p.id)}</h3>
                  {p.highlighted && <Badge tone="accent">{t('best')}</Badge>}
                </div>
                <p className="tabular mt-4 font-serif text-5xl font-semibold tracking-tight">{formatEur(p.priceEur)}</p>
                <p className="text-muted mt-2 min-h-6 text-sm">
                  {p.periodDays && p.periodDays > 30 && month !== null
                    ? t('perMonth', { price: formatEur(month) })
                    : ' '}
                </p>
                <p className="mt-3 text-sm">{p.periodDays ? t('renewsEvery', { days: p.periodDays }) : t('oneTime')}</p>
                {p.trial && (
                  <Badge tone="promo" className="mt-3 self-start">
                    {t('trial', { days: TRIAL_DAYS })}
                  </Badge>
                )}
                <div className="min-h-6 grow" />
                <Button asChild className="w-full" variant={p.highlighted ? 'primary' : 'secondary'}>
                  <Link href={START_HREF} data-track="cta_plan" data-track-place="pricing">
                    {p.trial ? t('ctaTrial', { days: TRIAL_DAYS }) : t('ctaChoose')}
                  </Link>
                </Button>
              </Card>
            </li>
          );
        })}
      </ul>
      <p className="text-muted mt-5 text-sm">{t('free')}</p>
    </section>
  );
}
