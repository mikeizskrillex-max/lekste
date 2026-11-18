/** <loc> entries of a sitemap (product URLs). */
export function sitemapLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => (m[1] ?? '').replace(/&amp;/g, '&'));
}

/** The last path segment that names the product, as words: ".../p/grikiai-extra-line-800-g" → "grikiai extra line 800 g" */
export function productWordsFromUrl(url: string): string {
  const path = new URL(url).pathname.replace(/\/p\/\d+\/?$/, '');
  const seg = path.split('/').filter(Boolean).pop() ?? '';
  return decodeURIComponent(seg).replace(/-/g, ' ').toLowerCase();
}
