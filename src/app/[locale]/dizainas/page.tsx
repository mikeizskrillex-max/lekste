import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { use } from 'react';
import { DishCard, type DishCardData } from '@/components/dish/dish-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Dizainas', robots: { index: false, follow: false } };

const FONTS = { serif: 'Literata', sans: 'Inter' } as const;
const TOKENS = ['bg', 'surface', 'ink', 'muted', 'accent', 'promo', 'savings', 'line'] as const;

/** Internal design-system page (noindex). All figures here are a labelled design sample. */
export default function DesignPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations();
  const macros = (kcal: number, p: number, f: number, c: number) => [
    { key: 'kcal', label: t('dish.kcal'), value: kcal, unit: '', max: 800 },
    { key: 'p', label: t('dish.protein'), value: p, unit: 'g', max: 60 },
    { key: 'f', label: t('dish.fat'), value: f, unit: 'g', max: 35 },
    { key: 'c', label: t('dish.carbs'), value: c, unit: 'g', max: 90 },
  ];
  const dishes: DishCardData[] = [
    {
      title: t('design.dish1'),
      meal: 'dinner',
      minutes: 25,
      photo: '/images/dishes/chicken_buckwheat.jpg',
      photoIsIllustration: true,
      macros: macros(532, 48, 14, 52),
      portionPrice: { amount: 1.36, store: 'barbora', checkedAt: '2026-11-16T06:00:00Z' },
    },
    {
      title: t('design.dish2'),
      meal: 'lunch',
      minutes: 35,
      photo: '/images/dishes/pumpkin_soup.jpg',
      photoIsIllustration: true,
      macros: macros(482, 18, 16, 64),
      portionPrice: { amount: 0.94, store: 'rimi', checkedAt: '2026-11-16T06:00:00Z' },
    },
  ];
  return (
    <div className="mx-auto max-w-6xl space-y-14 px-4 pt-12 md:px-6">
      <header>
        <h1 className="text-4xl font-semibold">{t('design.title')}</h1>
        <p className="text-muted mt-3">{t('design.intro')}</p>
        <Badge tone="promo" className="mt-4">
          {t('design.sampleNote')}
        </Badge>
      </header>

      <section>
        <h2 className="text-2xl font-semibold">{t('design.colors')}</h2>
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TOKENS.map((k) => (
            <li key={k}>
              <Card className="overflow-hidden">
                <div className="ring-line/60 h-16 ring-1 ring-inset" style={{ background: `var(--${k})` }} />
                <p className="px-3 py-2 text-sm">
                  <span className="font-semibold">{t(`design.tokens.${k}`)}</span>
                  <span className="text-muted block text-xs">--{k}</span>
                </p>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">{t('design.type')}</h2>
        <p className="mt-5 font-serif text-4xl font-semibold">
          {FONTS.serif} — {t('design.pangram')}
        </p>
        <p className="mt-3 text-lg">
          {FONTS.sans} — {t('design.pangram')}
        </p>
        <p className="tabular text-muted mt-3 text-lg">0123456789 · 58,49 € · 2026-11-18</p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">{t('design.buttons')}</h2>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button size="lg">{t('hero.ctaPrimary')}</Button>
          <Button variant="secondary">{t('hero.ctaSecondary')}</Button>
          <Button variant="ghost">{t('dish.replace')}</Button>
          <Badge tone="promo">{t('design.badgePromo')}</Badge>
          <Badge tone="savings">{t('design.badgeSavings')}</Badge>
          <Badge>{t('design.badgeNeutral')}</Badge>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">{t('design.card')}</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {dishes.map((d) => (
            <DishCard key={d.title} dish={d} />
          ))}
        </div>
      </section>
    </div>
  );
}
