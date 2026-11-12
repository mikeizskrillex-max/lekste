import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/config/env';
import { CHEF_RECIPES } from '@/data/recipes';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['', '/how-it-works', '/pricing', '/demo', '/supermarkets', '/faq', '/privacy', '/terms'];
  const recipes = CHEF_RECIPES.map((r) => ({ url: `${SITE_URL}/recipe/${r.id}`, lastModified: new Date('2026-11-12'), changeFrequency: 'monthly' as const, priority: 0.5 }));
  return [...pages.map((p) => ({ url: `${SITE_URL}${p}`, lastModified: new Date('2026-11-12'), changeFrequency: (p === '' ? 'weekly' : 'monthly') as 'weekly' | 'monthly', priority: p === '' ? 1 : 0.6 })), ...recipes];
}
