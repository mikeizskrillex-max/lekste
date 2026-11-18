/**
 * The only formatters for money, dates and numbers. Lithuanian conventions in every locale:
 * 58,49 € · 2026-11-18 · 1 750 (narrow no-break space between thousands).
 */
const NBSP = ' ';
const THIN = ' ';
const MINUS = '−';

function group(int: string): string {
  return int.length > 3 ? int.replace(/\B(?=(\d{3})+(?!\d))/g, THIN) : int;
}

/** 1750 → "1 750"; 2.5 with digits=1 → "2,5"; trailing zeros dropped */
export function formatNumber(value: number, digits = 0): string {
  if (!Number.isFinite(value)) throw new RangeError('formatNumber: not a finite number');
  const fixed = Math.abs(value).toFixed(digits);
  const trimmed = digits > 0 ? fixed.replace(/0+$/, '').replace(/\.$/, '') : fixed;
  const [int = '0', frac] = trimmed.split('.');
  return `${value < 0 && Number(trimmed) !== 0 ? MINUS : ''}${group(int)}${frac ? `,${frac}` : ''}`;
}

/** 58.49 → "58,49 €" (always two decimals) */
export function formatEur(amount: number): string {
  if (!Number.isFinite(amount)) throw new RangeError('formatEur: not a finite number');
  const [int = '0', frac = '00'] = Math.abs(amount).toFixed(2).split('.');
  const sign = amount < 0 && Math.abs(amount) >= 0.005 ? MINUS : '';
  return `${sign}${group(int)},${frac}${NBSP}€`;
}

/** Signed difference: −25.01 → "−25,01 €", 3 → "+3,00 €", 0 → "0,00 €" */
export function formatEurDelta(amount: number): string {
  return amount >= 0.005 ? `+${formatEur(amount)}` : formatEur(amount);
}

/** Date | ISO string → "2026-11-18" (calendar date in Europe/Vilnius) */
export function formatDate(value: Date | string): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) throw new RangeError('formatDate: invalid date');
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Vilnius',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/** 532 → "532 g", 1250 → "1,25 kg" */
export function formatGrams(grams: number): string {
  return grams >= 1000 ? `${formatNumber(grams / 1000, 2)}${NBSP}kg` : `${formatNumber(Math.round(grams))}${NBSP}g`;
}
