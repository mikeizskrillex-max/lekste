import { expect, test } from '@playwright/test';

// Without Supabase settings the pages explain that accounts are coming and never break.
test('sign-up page renders in both languages and is not indexed', async ({ page }) => {
  await page.goto('/registracija');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sukurkite paskyrą');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await page.goto('/ru/registracija');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Создайте аккаунт');
});

test('sign-in, password reset pages render', async ({ page }) => {
  await page.goto('/prisijungti');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Prisijunkite');
  await page.goto('/slaptazodis');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Slaptažodžio atkūrimas');
});

test('the account page sends a signed-out visitor to sign in', async ({ page }) => {
  await page.goto('/paskyra');
  await expect(page).toHaveURL(/\/prisijungti\?next=%2Fpaskyra$/);
});

test('a bad e-mail link lands on sign-in with an explanation, not an error page', async ({ page }) => {
  const res = await page.goto('/api/auth/confirm?token_hash=x&type=nonsense&next=/paskyra');
  expect(res?.status()).toBeLessThan(400);
  await expect(page).toHaveURL(/\/prisijungti\?klaida=nuoroda$/);
});

test('the norm next to the sign-up form comes from the questionnaire on this device', async ({ page }) => {
  await page.goto('/registracija');
  await page.evaluate(() =>
    localStorage.setItem(
      'lekste:questionnaire:v1',
      JSON.stringify({
        goal: 'lose',
        adults: 1,
        meals: '3',
        consentAt: '2026-11-18T10:00:00.000Z',
        me: { sex: 'female', age: 35, heightCm: 168, weightKg: 70 },
        health: 'none',
        activity: 3,
        budgetEur: 30,
        diet: 'omnivore',
        store: 'cheapest',
        cookTime: 'any',
      }),
    ),
  );
  await page.reload();
  await expect(page.getByText('1 753', { exact: true })).toBeVisible();
});
