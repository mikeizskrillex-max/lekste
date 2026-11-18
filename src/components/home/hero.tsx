import { ArrowRight, ListChecks, ShieldCheck, Tag } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { START_HREF } from '@/components/layout/nav';
import { Link } from '@/i18n/navigation';

/** Illustrative "week on the table": real dish photos, one per day. */
const WEEK = ['chicken_buckwheat', 'pumpkin_soup', 'syrniki', 'salmon_rice', 'plov', 'oat_berries'] as const;

export function Hero() {
  const t = useTranslations();
  const perks = [
    ['prices', Tag],
    ['allergens', ShieldCheck],
    ['list', ListChecks],
  ] as const;
  return (
    <section className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] items-center gap-10 px-4 pt-10 pb-16 md:px-6 md:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14">
      <div>
        <h1 className="text-[40px] leading-[1.05] font-semibold md:text-[60px]">{t('hero.title')}</h1>
        <p className="text-muted mt-5 max-w-xl text-lg md:text-xl">{t('hero.subtitle')}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href={START_HREF} data-track="cta_plan" data-track-place="hero">
              {t('hero.ctaPrimary')} <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/#kaip-veikia">{t('hero.ctaSecondary')}</Link>
          </Button>
        </div>
        <ul className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          {perks.map(([k, Icon]) => (
            <li key={k} className="flex items-center gap-2.5 text-[15px] font-medium">
              <span className="bg-accent-soft text-accent grid h-9 w-9 shrink-0 place-items-center rounded-full">
                <Icon className="h-[18px] w-[18px]" aria-hidden />
              </span>
              {t(`home.perks.${k}`)}
            </li>
          ))}
        </ul>
      </div>
      <figure className="min-w-0">
        <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0">
          {WEEK.map((photo, i) => (
            <li
              key={photo}
              className={`w-[42%] shrink-0 snap-start sm:w-auto ${i % 3 === 1 ? 'sm:translate-y-5' : ''}`}
            >
              <div className="rounded-card bg-surface shadow-card ring-line/70 overflow-hidden ring-1">
                <div className="relative aspect-square">
                  <Image
                    src={`/images/dishes/${photo}.jpg`}
                    alt={t(`home.dishes.d${i}`)}
                    fill
                    sizes="(max-width: 640px) 42vw, (max-width: 1024px) 30vw, 200px"
                    priority={i < 3}
                    className="object-cover"
                  />
                  <span className="bg-surface/90 absolute top-2 left-2 rounded-full px-2 py-0.5 text-xs font-bold backdrop-blur">
                    {t(`home.days.d${i}`)}
                  </span>
                </div>
                <p className="truncate px-3 py-2 text-[13px] font-medium">{t(`home.dishes.d${i}`)}</p>
              </div>
            </li>
          ))}
        </ul>
        <figcaption className="text-muted mt-7 flex flex-wrap justify-between gap-2 text-sm">
          <span className="text-ink font-semibold">{t('home.weekCaption')}</span>
          <span>{t('home.photosNote')}</span>
        </figcaption>
      </figure>
    </section>
  );
}
