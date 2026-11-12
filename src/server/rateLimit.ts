/**
 * Fixed-window in-memory rate limiter. Good enough for one instance and for
 * development; on Vercel with several instances replace it with Upstash/Redis
 * (same interface).
 */
const hits = new Map<string, { n: number; reset: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.reset < now) { hits.set(key, { n: 1, reset: now + windowMs }); return { ok: true, retryAfter: 0 }; }
  h.n++;
  if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
  return h.n <= limit ? { ok: true, retryAfter: 0 } : { ok: false, retryAfter: Math.ceil((h.reset - now) / 1000) };
}

export function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'local';
}
