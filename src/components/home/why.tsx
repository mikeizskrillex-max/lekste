import { Globe, Tag, UtensilsCrossed, Users, Wallet, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';

const ITEMS = [
  ['w1', UtensilsCrossed],
  ['w2', Tag],
  ['w3', Wallet],
  ['w4', ShieldCheck],
  ['w5', Users],
  ['w6', Globe],
] as const;

export function Why() {
  const t = useTranslations('home.why');
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 md:px-6">
      <h2 className="text-3xl font-semibold md:text-4xl">{t('title')}</h2>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map(([k, Icon]) => (
          <li key={k}>
            <Card className="h-full p-6">
              <Icon className="text-accent h-6 w-6" aria-hidden />
              <h3 className="mt-3 text-lg font-semibold">{t(`${k}Title`)}</h3>
              <p className="text-muted mt-1.5">{t(`${k}Text`)}</p>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
