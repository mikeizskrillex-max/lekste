/**
 * Search normalisation shared by the app and the database (`public.search_norm` in 0002_ingredients.sql
 * uses the same mapping): lower case, Lithuanian diacritics removed, ё → е, extra spaces collapsed.
 * So "Vištiena", "vistiena" and "VIŠTIENA" match, and so do "ёжик" and "ежик".
 */
const FROM = 'ąčęėįšųūžё';
// last letter is Cyrillic е (U+0435), not Latin e
const TO = 'aceeisuuz\u0435';

export function searchNorm(input: string): string {
  let out = '';
  for (const ch of input.toLowerCase()) {
    const i = FROM.indexOf(ch);
    out += i === -1 ? ch : TO[i];
  }
  return out.replace(/\s+/g, ' ').trim();
}
