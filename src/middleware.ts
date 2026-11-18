import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

/** Language: URL → NEXT_LOCALE cookie → Accept-Language → lt. (Profile language joins in phase 9.) */
export default createMiddleware(routing);

export const config = {
  // everything except API routes, Next internals and files with an extension
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
