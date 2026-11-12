import { describe, expect, it } from 'vitest';
import { parseRules } from './rules';

const types = (m: string, today = 2) => parseRules(m, today).actions.map((a) => a.type);

describe('rules assistant parser', () => {
  it('replace today dinner (RU/LT/EN)', () => {
    for (const m of ['замени сегодняшний ужин', 'pakeisk šiandienos vakarienę', "replace today's dinner"]) {
      const a = parseRules(m, 3).actions[0];
      expect(a.type).toBe('replace_meal');
      expect(a.meal).toBe('dinner');
      expect(a.day).toBe(3);
    }
  });
  it('cheaper lunch on friday', () => {
    expect(parseRules('обед в пятницу подешевле', 0).actions[0]).toMatchObject({ type: 'replace_meal', meal: 'lunch', day: 4, mode: 'cheaper' });
  });
  it('protein numbers and more protein', () => {
    expect(parseRules('хочу 150 г белка', 0).actions[0]).toMatchObject({ type: 'set_targets', protein: 150 });
    expect(parseRules('daugiau baltymų', 0).actions[0]).toMatchObject({ type: 'set_targets', proteinFactor: 1.2 });
  });
  it('household, stores, budget, exclusions, diet', () => {
    expect(parseRules('на двоих', 0).actions[0]).toMatchObject({ type: 'set_household', household: 2 });
    expect(parseRules('dviem žmonėms', 0).actions[0]).toMatchObject({ type: 'set_household', household: 2 });
    expect(parseRules('только Lidl', 0).actions[0]).toMatchObject({ type: 'set_stores', stores: ['lidl'] });
    expect(parseRules('iki 50 € per savaitę', 0).actions[0]).toMatchObject({ type: 'set_budget', budget: 50 });
    expect(types('без рыбы')).toContain('exclude');
    expect(types('сделай вегетарианское меню')).toContain('set_diet');
  });
  it('regenerate a weekday', () => {
    expect(parseRules('другие блюда на понедельник', 4).actions[0]).toMatchObject({ type: 'regenerate_day', day: 0 });
  });
  it('unknown text gives no actions', () => {
    expect(parseRules('labas', 0).actions).toHaveLength(0);
  });
});
