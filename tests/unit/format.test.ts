import { describe, expect, it } from 'vitest';
import { formatDate, formatEur, formatEurDelta, formatGrams, formatNumber } from '@/lib/i18n/format';

const n = (s: string) => s.replace(/ | /g, ' ');

describe('format', () => {
  it('money: 58,49 € with comma, two decimals and a non-breaking space', () => {
    expect(formatEur(58.49)).toBe('58,49 €');
    expect(n(formatEur(0))).toBe('0,00 €');
    expect(n(formatEur(1234.5))).toBe('1 234,50 €');
    expect(n(formatEur(-25.01))).toBe('−25,01 €');
    expect(n(formatEur(-0.001))).toBe('0,00 €');
  });
  it('savings delta', () => {
    expect(n(formatEurDelta(-25.01))).toBe('−25,01 €');
    expect(n(formatEurDelta(3))).toBe('+3,00 €');
    expect(n(formatEurDelta(0))).toBe('0,00 €');
  });
  it('numbers group thousands and use a decimal comma', () => {
    expect(n(formatNumber(1750))).toBe('1 750');
    expect(formatNumber(532)).toBe('532');
    expect(formatNumber(2.5, 1)).toBe('2,5');
    expect(formatNumber(2, 2)).toBe('2');
    expect(n(formatNumber(-1500))).toBe('−1 500');
  });
  it('dates are YYYY-MM-DD in Vilnius time', () => {
    expect(formatDate('2026-11-17T23:30:00Z')).toBe('2026-11-18');
    expect(formatDate(new Date('2026-11-16T10:00:00Z'))).toBe('2026-11-16');
    expect(() => formatDate('nope')).toThrow();
  });
  it('grams', () => {
    expect(n(formatGrams(532))).toBe('532 g');
    expect(n(formatGrams(1250))).toBe('1,25 kg');
    expect(n(formatGrams(2000))).toBe('2 kg');
  });
  it('rejects non-finite amounts', () => {
    expect(() => formatEur(Number.NaN)).toThrow();
  });
});
