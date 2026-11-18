/**
 * EFSA Average Requirements (AR) for energy, MJ/day, at PAL 1.6 ("moderately active").
 * Source: EFSA, Summary of Dietary Reference Values, version 4 (September 2017), Table 1
 * (based on EFSA NDA Panel, Scientific Opinion on DRVs for energy, EFSA Journal 2013;11(1):3005).
 * https://www.efsa.europa.eu/sites/default/files/assets/DRV_Summary_tables_jan_17.pdf
 * Ages 1–3 have one value only (EFSA used PAL 1.4 for toddlers); that value is used.
 * TODO: проверить диетологом.
 */
export const MJ_TO_KCAL = 238.83;

type Pair = readonly [male: number, female: number];

/** Children 1–17 y, PAL 1.6 (1–3 y: the only value given). */
export const EFSA_CHILD_AR_MJ: Readonly<Record<number, Pair>> = {
  1: [3.3, 3.0],
  2: [4.3, 4.0],
  3: [4.9, 4.6],
  4: [6.0, 5.6],
  5: [6.4, 5.9],
  6: [6.7, 6.3],
  7: [7.2, 6.7],
  8: [7.6, 7.1],
  9: [8.1, 7.5],
  10: [8.1, 7.6],
  11: [8.5, 8.0],
  12: [9.1, 8.4],
  13: [9.8, 8.8],
  14: [10.5, 9.1],
  15: [11.3, 9.3],
  16: [11.9, 9.5],
  17: [12.3, 9.5],
};

/** Adults by age band, PAL 1.6. Used only when an adult's body data is skipped. */
const EFSA_ADULT_AR_MJ: readonly (readonly [maxAge: number, values: Pair])[] = [
  [29, [11.2, 9.0]],
  [39, [10.8, 8.7]],
  [49, [10.7, 8.6]],
  [59, [10.5, 8.5]],
  [69, [9.6, 7.8]],
  [Infinity, [9.5, 7.7]], // 70–79 y; EFSA gives no values for 80+, the 70–79 value is used
];

export type Sex = 'male' | 'female';

const pick = ([m, f]: Pair, sex: Sex | undefined) => (sex === 'male' ? m : sex === 'female' ? f : (m + f) / 2);

export function childKcal(age: number, sex: Sex | undefined): number {
  const row = EFSA_CHILD_AR_MJ[Math.min(17, Math.max(1, Math.round(age)))];
  if (!row) throw new RangeError(`no EFSA value for age ${age}`);
  return Math.round(pick(row, sex) * MJ_TO_KCAL);
}

/** Approximate adult maintenance when no body data was given. Without age: the 30–39 y band. */
export function adultReferenceKcal(age: number | undefined, sex: Sex | undefined): number {
  const a = age ?? 35;
  const band = EFSA_ADULT_AR_MJ.find(([max]) => a <= max) ?? EFSA_ADULT_AR_MJ[EFSA_ADULT_AR_MJ.length - 1];
  if (!band) throw new RangeError('EFSA adult table is empty');
  return Math.round(pick(band[1], sex) * MJ_TO_KCAL);
}
