'use client';

/** Anonymous analytics (see /api/track): page views and clicks on key buttons. */
export function track(name: 'pageview' | 'cta_plan' | 'cta_month', place?: string) {
  try {
    if (location.pathname.startsWith('/admin')) return;
    const body = JSON.stringify({ name, path: location.pathname, ref: document.referrer || undefined, place });
    if (navigator.sendBeacon) navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
    else void fetch('/api/track', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true });
  } catch { /* analytics never breaks the site */ }
}
