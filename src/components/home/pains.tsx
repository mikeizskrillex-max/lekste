import { ArrowRight, CircleHelp, Globe2, Receipt, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';

const PAINS = [
  ['p1', CircleHelp],
  ['p2', Receipt],
  ['p3', Trash2],
  ['p4', Globe2],
] as const;

/** "Sound familiar?": the four pains from the ads, each with how Lėkštė solves it. */
export function Pains() {
  const t = useTranslations('home.pains');
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 md:px-6">
      <h2 className="text-3xl font-semibold md:text-4xl">{t('title')}</h2>
      <p className="text-muted mt-3 text-lg">{t('subtitle')}</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {PAINS.map(([k, Icon]) => (
          <li key={k}>
            <Card className="flex h-full flex-col p-6">
              <Icon className="text-accent h-7 w-7" aria-hidden />
              <h3 className="mt-4 text-xl font-semibold">{t(`${k}Title`)}</h3>
              <p className="text-muted mt-2">{t(`${k}Text`)}</p>
              <p className="border-line text-savings mt-4 flex items-start gap-2 border-t pt-4 font-medium">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {t(`${k}Fix`)}
              </p>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
