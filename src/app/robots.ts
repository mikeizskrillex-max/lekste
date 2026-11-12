import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/config/env';

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/app', '/admin', '/api', '/checkout', '/success', '/onboarding'] }], sitemap: `${SITE_URL}/sitemap.xml` };
}
