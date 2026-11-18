import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { availabilitySnapshot, unavailableRecipes } from '@/lib/availability/snapshot';

describe('availability snapshot', () => {
  it('the committed snapshot is valid', () => {
    expect(availabilitySnapshot.safeParse(JSON.parse(readFileSync('data/availability.json', 'utf8'))).success).toBe(
      true,
    );
  });
  it('flags recipes with an ingredient that is not in both stores', () => {
    const snap = {
      checkedAt: '2026-11-16T02:00:00.000Z',
      bothStores: ['carrot', 'onion'],
      missing: { frozen_blueberries: { barbora: 'ok' as const, rimi: 'no_product' as const } },
    };
    expect(
      unavailableRecipes(
        [
          { slug: 'sriuba', ingredients: ['carrot', 'onion'] },
          { slug: 'blynai', ingredients: ['carrot', 'frozen_blueberries'] },
        ],
        snap,
      ),
    ).toEqual([{ recipe: 'blynai', ingredient: 'frozen_blueberries' }]);
  });
});
