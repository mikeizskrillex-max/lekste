import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from './language-switcher';
import { START_HREF } from './nav';

/** Fixed bottom bar on phones: language switch + the main action, always under the thumb. */
export function MobileBar() {
  const t = useTranslations('nav');
  return (
    <div className="border-line/70 bg-bg/92 fixed inset-x-0 bottom-0 z-40 border-t px-4 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
      <div className="flex items-center justify-between gap-3">
        <LanguageSwitcher />
        <Button asChild className="flex-1">
          <Link href={START_HREF}>{t('start')}</Link>
        </Button>
      </div>
    </div>
  );
}
