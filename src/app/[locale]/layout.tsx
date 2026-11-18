import type { Metadata, Viewport } from 'next';
import { Inter, Literata } from 'next/font/google';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { MobileBar } from '@/components/layout/mobile-bar';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { routing } from '@/i18n/routing';
import { site } from '@/lib/config';

// Both fonts cover Lithuanian diacritics (latin-ext) and Cyrillic
const literata = Literata({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  variable: '--font-literata',
  display: 'swap',
});
const inter = Inter({ subsets: ['latin', 'latin-ext', 'cyrillic'], variable: '--font-inter', display: 'swap' });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf5ec' },
    { media: '(prefers-color-scheme: dark)', color: '#171513' },
  ],
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    metadataBase: new URL(site.url),
    title: { default: t('title'), template: `%s · ${site.name}` },
    description: t('description'),
    alternates: { languages: { lt: '/', ru: '/ru' } },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return (
    <html lang={locale} suppressHydrationWarning className={`${literata.variable} ${inter.variable}`}>
      <body className="min-h-dvh">
        <NextIntlClientProvider>
          <ThemeProvider>
            <SiteHeader />
            <main id="turinys">{children}</main>
            <SiteFooter />
            <MobileBar />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
