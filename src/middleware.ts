import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, supabaseConfigured } from './lib/supabase/env';

const intl = createIntlMiddleware(routing);

/**
 * 1) Language: URL → NEXT_LOCALE cookie → Accept-Language → lt.
 * 2) Supabase session refresh: keeps the sign-in alive and writes the refreshed cookies to the response.
 */
export default async function middleware(request: NextRequest) {
  const response = intl(request);
  if (!supabaseConfigured) return response;
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => list.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  // everything except API routes, Next internals and files with an extension
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
