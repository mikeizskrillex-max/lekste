import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';

/** Four steps (SPEC §13). The recipe count joins step 3 once the recipe base exists (phase 6). */
export function How() {
  const t = useTranslations('how');
  return (
    <section id="kaip-veikia" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-12 md:px-6">
      <h2 className="text-3xl font-semibold md:text-4xl">{t('title')}</h2>
      <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {([1, 2, 3, 4] as const).map((n) => (
          <li key={n}>
            <Card className="h-full p-6">
              <span className="tabular bg-accent-soft text-accent grid h-10 w-10 place-items-center rounded-full font-serif text-lg font-semibold">
                {n}
              </span>
              <h3 className="mt-4 text-xl font-semibold">{t(`s${n}Title`)}</h3>
              <p className="text-muted mt-2">{t(`s${n}Text`)}</p>
            </Card>
          </li>
        ))}
      </ol>
    </section>
  );
}
