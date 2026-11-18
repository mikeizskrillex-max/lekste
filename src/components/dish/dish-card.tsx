import { Clock, Pin, RefreshCw, X } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { StoreCode } from '@/lib/config';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MacroBars, type Macro } from './macro-bars';
import { PriceTag } from './price-tag';

export type DishCardData = {
  title: string;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  minutes: number;
  photo: string;
  photoIsIllustration: boolean;
  macros: Macro[];
  portionPrice: { amount: number; store: StoreCode; checkedAt: string };
};

/** Dish card: photo, meal, time, title, macro bars, portion price with source; replace / lock / remove. */
export function DishCard({ dish }: { dish: DishCardData }) {
  const t = useTranslations('dish');
  const tc = useTranslations('common');
  return (
    <Card className="overflow-hidden">
      <div className="bg-surface-2 relative aspect-[4/3]">
        <Image
          src={dish.photo}
          alt={dish.title}
          fill
          sizes="(max-width: 640px) 100vw, 360px"
          className="object-cover"
        />
        {dish.photoIsIllustration && (
          <Badge className="bg-surface/90 absolute bottom-2 left-2 backdrop-blur">{tc('illustration')}</Badge>
        )}
      </div>
      <div className="space-y-3 p-4">
        <p className="text-muted flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
          {t(`meal_${dish.meal}`)}
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1 normal-case">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {t('minutes', { n: dish.minutes })}
          </span>
        </p>
        <h3 className="text-xl leading-snug font-semibold">{dish.title}</h3>
        <MacroBars items={dish.macros} />
        <div className="border-line flex items-center justify-between gap-2 border-t pt-3">
          <PriceTag {...dish.portionPrice} suffix={t('portion')} />
          <div className="flex gap-1">
            {(
              [
                ['replace', RefreshCw],
                ['lock', Pin],
                ['remove', X],
              ] as const
            ).map(([k, Icon]) => (
              <button
                key={k}
                type="button"
                aria-label={t(k)}
                title={t(k)}
                className="text-muted hover:bg-surface-2 hover:text-ink grid h-9 w-9 place-items-center rounded-full transition-colors"
              >
                <Icon className="h-4 w-4" aria-hidden />
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
