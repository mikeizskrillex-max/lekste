import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/config/env';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['', '/how-it-works', '/pricing', '/demo', '/supermarkets', '/faq', '/privacy', '/terms'];
  return pages.map((p) => ({ url: `${SITE_URL}${p}`, lastModified: new Date('2026-11-12'), changeFrequency: p === '' ? 'weekly' : 'monthly', priority: p === '' ? 1 : 0.6 }));
}
