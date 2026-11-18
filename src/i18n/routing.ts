import { defineRouting } from 'next-intl/routing';

/** lt is the reference language and has no URL prefix (/pradeti); ru lives under /ru (/ru/pradeti). */
export const routing = defineRouting({
  locales: ['lt', 'ru'],
  defaultLocale: 'lt',
  localePrefix: 'as-needed',
  localeCookie: { name: 'NEXT_LOCALE', maxAge: 60 * 60 * 24 * 365 },
});

export type Locale = (typeof routing.locales)[number];
