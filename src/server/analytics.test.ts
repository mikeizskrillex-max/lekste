import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('./supabase', () => ({ supabaseAdmin: () => null }));
vi.mock('./stripe', () => ({ stripe: () => null }));
import { siteStats, type EventRow } from './analytics';

const now = Date.parse('2026-11-17T12:00:00Z');
const at = (minAgo: number) => new Date(now - minAgo * 60000).toISOString();
const e = (name: EventRow['name'], path: string, visitor: string, minAgo: number, extra: Partial<EventRow> = {}): EventRow => ({ at: at(minAgo), name, path, visitor, device: 'mobile', ref: null, place: null, ...extra });

describe('site analytics', () => {
  const ev: EventRow[] = [
    e('pageview', '/', 'a', 1, { ref: 'facebook.com' }), e('cta_plan', '/', 'a', 1, { place: 'hero' }), e('pageview', '/onboarding', 'a', 1),
    e('pageview', '/onboarding/result', 'a', 0), e('cta_month', '/onboarding/result', 'a', 0, { place: 'result' }), e('pageview', '/checkout', 'a', 0),
    e('pageview', '/', 'b', 3, { device: 'desktop' }), e('pageview', '/recipes', 'b', 2, { device: 'desktop' }),
    e('pageview', '/', 'c', 60 * 24 * 3), e('cta_plan', '/', 'c', 60 * 24 * 3, { place: 'header' }),
  ];
  const s = siteStats(ev, now);
  it('counts who is on the site now and per period', () => {
    expect(s.onlineNow).toBe(2);
    expect(s.visitors).toEqual({ today: 2, d7: 3, d30: 3 });
  });
  it('counts both buttons', () => {
    expect(s.ctaPlan).toEqual({ today: 1, d7: 2, d30: 2, people30: 2 });
    expect(s.ctaMonth).toEqual({ today: 1, d7: 1, d30: 1, people30: 1 });
    expect(s.ctaPlaces).toEqual([{ place: 'hero', clicks: 1 }, { place: 'header', clicks: 1 }]);
  });
  it('builds the visitor funnel', () => {
    expect(s.funnel.map((f) => f.n)).toEqual([3, 2, 1, 1, 1, 1]);
    expect(s.referrers).toEqual([{ ref: 'прямой заход / приложение', visitors: 2 }, { ref: 'facebook.com', visitors: 1 }]);
  });
});
