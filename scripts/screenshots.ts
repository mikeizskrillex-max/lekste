/**
 * Report screenshots: every page × 360 / 1440 px × light / dark.
 * Usage: npm run screenshots -- <out-dir> [baseURL]   (needs a running server, e.g. `npx next start -p 3100`)
 */
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const out = process.argv[2] ?? 'screenshots';
const base = process.argv[3] ?? 'http://localhost:3100';
const pages = (process.env.SHOT_PAGES ?? '/,/ru,/pradeti,/dizainas').split(',');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
for (const width of [360, 1440]) {
  for (const scheme of ['light', 'dark'] as const) {
    const ctx = await browser.newContext({
      viewport: { width, height: width === 360 ? 780 : 900 },
      colorScheme: scheme,
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    for (const p of pages) {
      await page.goto(base + p, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const name = `${(p.replace(/\//g, '_') || '_').replace(/^_$/, 'home')}-${width}-${scheme}.png`.replace(/^_/, '');
      await page.screenshot({ path: `${out}/${name}`, fullPage: true });
    }
    await ctx.close();
  }
}
await browser.close();
console.log(`screenshots → ${out}`);
