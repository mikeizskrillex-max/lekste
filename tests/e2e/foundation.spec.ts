import { expect, test } from '@playwright/test';

test('home is Lithuanian by default and fits the screen', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'lt');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Jūsų asmeninis AI mitybos planuotojas');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await expect(page.getByText('Tai nėra medicininė konsultacija.')).toBeVisible();
});

test('language switch keeps the page: /pradeti ↔ /ru/pradeti', async ({ page }) => {
  await page.goto('/pradeti');
  await page.getByRole('link', { name: /^ru/i }).first().click();
  await expect(page).toHaveURL(/\/ru\/pradeti$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Какая у вас цель?');
  await page.getByRole('link', { name: /^lt/i }).first().click();
  await expect(page).toHaveURL(/\/pradeti$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Koks jūsų tikslas?');
});

test('a Russian browser is sent to /ru on the first visit', async ({ browser }) => {
  const ctx = await browser.newContext({ locale: 'ru-RU', extraHTTPHeaders: { 'Accept-Language': 'ru-RU,ru;q=0.9' } });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page).toHaveURL(/\/ru$/);
  await ctx.close();
});

test('theme toggle switches to dark and remembers it', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: /Tema/ });
  await toggle.click(); // device → light
  await toggle.click(); // light → dark
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/dark/);
});

test('unknown pages show a localized 404', async ({ page }) => {
  const res = await page.goto('/ru/nera-tokio');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Страница не найдена');
});

test('design page is hidden from search engines and shows the price source', async ({ page }) => {
  await page.goto('/dizainas');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.getByRole('button', { name: /Kainos šaltinis: Barbora · patikrinta 2026-11-16/ })).toBeVisible();
});

test('home shows the pains, the plans 8,99 / 19,99 / 79,99 € and no sideways scroll', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Ar pažįstama?' })).toBeVisible();
  for (const price of ['8,99', '19,99', '79,99'])
    await expect(page.getByText(new RegExp(`^${price}\\s€$`))).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
