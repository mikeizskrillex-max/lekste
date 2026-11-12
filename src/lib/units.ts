import type { Lang } from './types';

/** Typical weight of one piece / spoon / can, to show friendly kitchen measures next to grams. */
const UNIT: Record<string, { g: number; lt: string; ru: string }> = {
  eggs: { g: 60, lt: 'vnt.', ru: 'шт.' },
  onion: { g: 100, lt: 'vnt.', ru: 'шт.' },
  carrot: { g: 80, lt: 'vnt.', ru: 'шт.' },
  tomato: { g: 120, lt: 'vnt.', ru: 'шт.' },
  cucumber: { g: 250, lt: 'vnt.', ru: 'шт.' },
  potatoes: { g: 120, lt: 'vnt.', ru: 'шт.' },
  banana: { g: 120, lt: 'vnt.', ru: 'шт.' },
  apple: { g: 180, lt: 'vnt.', ru: 'шт.' },
  pear: { g: 170, lt: 'vnt.', ru: 'шт.' },
  orange: { g: 200, lt: 'vnt.', ru: 'шт.' },
  avocado: { g: 150, lt: 'vnt.', ru: 'шт.' },
  lemon: { g: 100, lt: 'vnt.', ru: 'шт.' },
  bell_pepper: { g: 150, lt: 'vnt.', ru: 'шт.' },
  zucchini: { g: 250, lt: 'vnt.', ru: 'шт.' },
  sweet_potato: { g: 250, lt: 'vnt.', ru: 'шт.' },
  beetroot: { g: 150, lt: 'vnt.', ru: 'шт.' },
  garlic: { g: 5, lt: 'skiltel.', ru: 'зубч.' },
  olive_oil: { g: 10, lt: 'v. š.', ru: 'ст. л.' },
  honey: { g: 12, lt: 'a. š.', ru: 'ч. л.' },
  soy_sauce: { g: 15, lt: 'v. š.', ru: 'ст. л.' },
  sesame: { g: 8, lt: 'v. š.', ru: 'ст. л.' },
  peanut_butter: { g: 15, lt: 'v. š.', ru: 'ст. л.' },
  sunflower_seeds: { g: 10, lt: 'v. š.', ru: 'ст. л.' },
  sour_cream: { g: 20, lt: 'v. š.', ru: 'ст. л.' },
  canned_tomatoes: { g: 400, lt: 'skard.', ru: 'банка' },
  chickpeas: { g: 240, lt: 'skard.', ru: 'банка' },
  beans: { g: 240, lt: 'skard.', ru: 'банка' },
  rye_bread: { g: 40, lt: 'riek.', ru: 'ломт.' },
  lavash: { g: 80, lt: 'vnt.', ru: 'шт.' },
};

function nice(n: number): string {
  const h = Math.round(n * 2) / 2;
  if (h < 0.5) return '¼';
  const whole = Math.floor(h);
  return h % 1 ? (whole ? `${whole}½` : '½') : String(whole);
}

/** "≈ 2 шт." or null when grams alone are clearer. */
export function kitchenMeasure(id: string, grams: number, lang: Lang): string | null {
  const u = UNIT[id];
  if (!u) return null;
  return `≈ ${nice(grams / u.g)} ${u[lang]}`;
}
