import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AccountSync } from '@/components/auth/account-sync';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { Button } from '@/components/ui/button';
import { Link, redirect } from '@/i18n/navigation';
import { loadQuestionnaire } from '@/lib/auth/actions';
import { formatNumber } from '@/lib/i18n/format';
import { householdTargets } from '@/lib/nutrition/targets';
import { supabaseServer } from '@/lib/supabase/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });
  return { title: t('accountTitle'), robots: { index: false } };
}

export default async function AccountPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const db = await supabaseServer();
  const user = db ? (await db.auth.getUser()).data.user : null;
  if (!user)
    return redirect({
      href: { pathname: '/prisijungti', query: { next: locale === 'ru' ? '/ru/paskyra' : '/paskyra' } },
      locale,
    });
  const [t, tq] = await Promise.all([getTranslations('auth'), getTranslations('questionnaire.result')]);
  const answers = await loadQuestionnaire();
  const people = answers ? householdTargets(answers) : [];
  const me = people[0];

  return (
    <section className="mx-auto max-w-3xl px-4 pt-10 pb-24 md:px-6 md:pt-16">
      <h1 className="text-3xl font-semibold md:text-4xl">{t('accountTitle')}</h1>
      <p className="text-muted mt-2">{t('signedInAs', { email: user.email ?? '' })}</p>
      <div className="mt-6 space-y-4">
        <AccountSync server={answers} />
        <div className="rounded-card bg-surface shadow-card ring-line p-6 ring-1">
          <h2 className="text-xl font-semibold">{t('savedNorm')}</h2>
          {me ? (
            <>
              <p className="tabular mt-3 font-serif text-5xl font-semibold">{formatNumber(me.kcal)}</p>
              <p className="text-muted">{tq('perDay')}</p>
              <p className="tabular mt-3 text-sm">
                {(['protein', 'fat', 'carbs'] as const)
                  .map((k) => `${tq(k)} ${tq('grams', { value: formatNumber(me[k]) })}`)
                  .join(' · ')}
              </p>
              <Button asChild variant="secondary" className="mt-5">
                <Link href="/pradeti">{t('editQuestionnaire')}</Link>
              </Button>
            </>
          ) : (
            <>
              <p className="text-muted mt-2">{t('noQuestionnaire')}</p>
              <Button asChild className="mt-4">
                <Link href="/pradeti">{t('fillQuestionnaire')}</Link>
              </Button>
            </>
          )}
        </div>
        <p className="text-muted text-sm">{t('menuSoon')}</p>
        <SignOutButton home={locale === 'ru' ? '/ru' : '/'} />
      </div>
    </section>
  );
}
