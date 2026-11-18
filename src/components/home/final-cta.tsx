import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { START_HREF } from '@/components/layout/nav';
import { Link } from '@/i18n/navigation';

export function FinalCta() {
  const t = useTranslations('home.final');
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 md:px-6">
      <div className="bg-ink text-bg rounded-[2rem] px-6 py-12 text-center md:px-12 md:py-16">
        <h2 className="text-3xl font-semibold md:text-5xl">{t('title')}</h2>
        <p className="mx-auto mt-4 max-w-xl text-lg opacity-80">{t('text')}</p>
        <Button asChild size="lg" className="mt-8">
          <Link href={START_HREF} data-track="cta_plan" data-track-place="bottom">
            {t('cta')} <ArrowRight className="h-5 w-5" aria-hidden />
          </Link>
        </Button>
      </div>
    </section>
  );
}
