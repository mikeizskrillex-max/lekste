import { ArrowRight } from 'lucide-react';
import type { Locale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { use } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { START_HREF } from '@/components/layout/nav';
import { Link } from '@/i18n/navigation';

/** Phase 1 home: hero and "how it works" from SPEC §13. The live demo and the rest arrive in phase 8. */
export default function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations();
  const steps = [1, 2, 3, 4] as const;
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-14 pb-16 md:px-6 md:pt-24">
        <h1 className="max-w-3xl text-[40px] leading-[1.05] font-semibold md:text-[64px]">{t('hero.title')}</h1>
        <p className="text-muted mt-6 max-w-2xl text-lg md:text-xl">{t('hero.subtitle')}</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href={START_HREF}>
              {t('hero.ctaPrimary')} <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/#kaip-veikia">{t('hero.ctaSecondary')}</Link>
          </Button>
        </div>
      </section>
      <section id="kaip-veikia" className="mx-auto max-w-6xl scroll-mt-24 px-4 md:px-6">
        <h2 className="text-3xl font-semibold md:text-4xl">{t('how.title')}</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((n) => (
            <li key={n}>
              <Card className="h-full p-6">
                <span className="tabular bg-accent-soft text-accent grid h-10 w-10 place-items-center rounded-full font-serif text-lg font-semibold">
                  {n}
                </span>
                <h3 className="mt-4 text-xl font-semibold">{t(`how.s${n}Title`)}</h3>
                <p className="text-muted mt-2">{t(`how.s${n}Text`)}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
