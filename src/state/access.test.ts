import { describe, expect, it } from 'vitest';
import { accessEnded, hasAccess, type Subscription } from './store';

const DAY = 86400000;
const now = Date.parse('2026-11-17T12:00:00Z');
const iso = (ms: number) => new Date(ms).toISOString();
const sub = (x: Partial<Subscription>): Subscription => ({ planId: 'monthly', status: 'none', startedAt: iso(now - 10 * DAY), currentPeriodEnd: null, mode: 'stripe', payments: [], ...x });

describe('access closes for real', () => {
  it('free week: open until the trial ends, then closed', () => {
    const s = sub({ status: 'trialing', trialEnd: iso(now + DAY), currentPeriodEnd: iso(now + DAY) });
    expect(hasAccess(s, now)).toBe(true);
    expect(hasAccess(s, now + 2 * DAY)).toBe(false);
    expect(accessEnded(s)).toBe('trial');
  });
  it('a trial without an end date never opens the app', () => {
    expect(hasAccess(sub({ status: 'trialing', trialEnd: null }), now)).toBe(false);
  });
  it('paid month: open until the period ends plus 3 days of payment retries', () => {
    const s = sub({ status: 'active', currentPeriodEnd: iso(now + DAY), payments: [{ id: 'p', date: iso(now), amount: 9, status: 'paid', planId: 'monthly' }] });
    expect(hasAccess(s, now)).toBe(true);
    expect(hasAccess(s, now + 3 * DAY)).toBe(true);
    expect(hasAccess(s, now + 5 * DAY)).toBe(false);
    expect(accessEnded(s)).toBe('paid');
  });
  it('failed renewal closes after the grace days', () => {
    const s = sub({ status: 'past_due', currentPeriodEnd: iso(now - DAY) });
    expect(hasAccess(s, now)).toBe(true);
    expect(hasAccess(s, now + 3 * DAY)).toBe(false);
  });
  it('lifetime stays open', () => {
    expect(hasAccess(sub({ planId: 'lifetime', status: 'active', currentPeriodEnd: null }), now + 1000 * DAY)).toBe(true);
  });
  it('cancelled: open until the paid or trial end, then closed', () => {
    const s = sub({ status: 'canceled', currentPeriodEnd: iso(now + DAY) });
    expect(hasAccess(s, now)).toBe(true);
    expect(hasAccess(s, now + 2 * DAY)).toBe(false);
  });
  it('never subscribed: closed', () => {
    expect(hasAccess(sub({}), now)).toBe(false);
    expect(accessEnded(sub({ startedAt: null }))).toBe('none');
  });
});
