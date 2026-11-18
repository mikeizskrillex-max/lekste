import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

export default function NotFound() {
  const t = useTranslations('notFound');
  return (
    <section className="mx-auto max-w-2xl px-4 pt-20 text-center md:px-6">
      <p className="text-accent font-serif text-7xl font-semibold">404</p>
      <h1 className="mt-4 text-3xl font-semibold">{t('title')}</h1>
      <p className="text-muted mt-3">{t('body')}</p>
      <Button asChild className="mt-8">
        <Link href="/">{t('home')}</Link>
      </Button>
    </section>
  );
}
