/**
 * Pack size from a product title: "Grikiai EXTRA LINE, 800 g" → 800 g, "Pienas 2,5 %, 1 l" → 1000 ml,
 * "Kiaušiniai M, 10 vnt." → 10 pcs, "Jogurtas 4 x 125 g" → 500 g. The last size in the title wins
 * (titles start with the name and end with the size).
 */
export interface Pack {
  size: number;
  unit: 'g' | 'ml' | 'pcs';
}

const UNITS: Record<string, { unit: Pack['unit']; factor: number }> = {
  g: { unit: 'g', factor: 1 },
  gr: { unit: 'g', factor: 1 },
  kg: { unit: 'g', factor: 1000 },
  ml: { unit: 'ml', factor: 1 },
  cl: { unit: 'ml', factor: 10 },
  l: { unit: 'ml', factor: 1000 },
  vnt: { unit: 'pcs', factor: 1 },
  'vnt.': { unit: 'pcs', factor: 1 },
};

const RE = /(?:(\d+)\s*[x×]\s*)?(\d+(?:[.,]\d+)?)\s*(kg|gr|g|ml|cl|l|vnt\.?)(?![a-ząčęėįšųūž])/gi;

export function packFromTitle(title: string): Pack | null {
  let last: Pack | null = null;
  for (const m of title.matchAll(RE)) {
    const count = m[1] ? Number(m[1]) : 1;
    const value = Number((m[2] ?? '').replace(',', '.'));
    const u = UNITS[(m[3] ?? '').toLowerCase()];
    if (!u || !Number.isFinite(value) || value <= 0) continue;
    last = { size: Math.round(count * value * u.factor * 1000) / 1000, unit: u.unit };
  }
  return last;
}
