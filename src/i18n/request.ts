import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const messages = (await import(`../../messages/${locale}.json`)).default;
  // missing keys fall back to Lithuanian, the reference language
  const fallback = locale === routing.defaultLocale ? messages : (await import('../../messages/lt.json')).default;
  return {
    locale,
    messages: deepMerge(fallback, messages),
    timeZone: 'Europe/Vilnius',
    onError: (e) => {
      if (process.env.NODE_ENV !== 'production') console.error(e.message);
    },
  };
});

type Tree = { [k: string]: string | Tree };
function deepMerge(base: Tree, over: Tree): Tree {
  const out: Tree = { ...base };
  for (const [k, v] of Object.entries(over)) {
    const b = out[k];
    out[k] = typeof v === 'object' && typeof b === 'object' ? deepMerge(b, v) : v;
  }
  return out;
}
