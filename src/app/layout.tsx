import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import { integrations, SITE_URL } from '@/config/env';
import type { Locale } from '@/config/markets';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Lėkštė — Valgyk geriau. Išleisk mažiau.', template: '%s · Lėkštė' },
  description: 'Asmeninis AI mitybos planuotojas: savaitės meniu pagal jūsų tikslą, biudžetą ir prekybos centrų kainas Lietuvoje.',
  applicationName: 'Lėkštė',
  alternates: { canonical: '/', languages: { lt: '/', ru: '/?lang=ru' } },
  openGraph: {
    type: 'website', siteName: 'Lėkštė', locale: 'lt_LT', alternateLocale: ['ru_RU'],
    title: 'Lėkštė — Valgyk geriau. Išleisk mažiau.',
    description: 'Savaitės meniu pagal jūsų tikslą ir biudžetą + pigiausias krepšelis Maxima, Rimi, Lidl, Iki, Barbora.',
    images: [{ url: '/img/site/mealbowl.jpg', width: 1200, height: 800, alt: 'Lėkštė' }],
  },
  twitter: { card: 'summary_large_image' },
  icons: { icon: '/favicon.svg' },
};

export const viewport: Viewport = { themeColor: '#174B35', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  const lang: Locale = cookies().get('lang')?.value === 'ru' ? 'ru' : 'lt';
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Lėkštė', url: SITE_URL, applicationCategory: 'HealthApplication',
    operatingSystem: 'Web', inLanguage: ['lt', 'ru'], offers: { '@type': 'Offer', price: '12.99', priceCurrency: 'EUR' },
  };
  return (
    <html lang={lang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>
        <Providers lang={lang} modes={integrations}>{children}</Providers>
      </body>
    </html>
  );
}
