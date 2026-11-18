import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

const next = (page: Page) => page.getByRole('button', { name: /^(Toliau|Skaičiuoti normą)/ });

async function fillToEnd(page: Page) {
  await page.goto('/pradeti');
  await expect(next(page)).toBeDisabled();
  await page.getByRole('radio', { name: /Numesti svorio/ }).click();
  await next(page).click();

  await page.getByRole('radio', { name: /3 \+ užkandis/ }).click();
  await next(page).click();

  // body data stays locked until the health-data consent is given
  await expect(page.getByRole('textbox', { name: 'Amžius' })).toBeDisabled();
  await page.getByRole('checkbox').check();
  await page.getByRole('radio', { name: 'Moteris' }).click();
  await page.getByRole('textbox', { name: 'Amžius' }).fill('35');
  await page.getByRole('textbox', { name: 'Ūgis' }).fill('168');
  await page.getByRole('textbox', { name: 'Svoris' }).fill('70');
  await expect(next(page)).toBeDisabled();
  await page.getByRole('radio', { name: 'Nieko iš to' }).click();
  await next(page).click();

  await page.getByRole('radio', { name: /Vidutiniškai/ }).click();
  await next(page).click();
  await expect(page.getByText('30,00 €').first()).toBeVisible(); // slider starts at 30 € for one adult
  await next(page).click();
  await page.getByRole('radio', { name: /Valgau viską/ }).click();
  await next(page).click();

  await page.getByRole('radiogroup', { name: 'Pienas' }).getByRole('radio', { name: 'Alergija' }).click();
  await next(page).click();

  await page.getByRole('button', { name: 'Žuvis' }).click();
  await page.getByLabel('Ieškoti produkto').fill('voverait');
  await page.getByRole('button', { name: 'Voveraitės', exact: true }).click();
  await expect(page.getByText('Pasirinkta: 8')).toBeVisible();
  await next(page).click();

  await page.getByRole('radio', { name: /Kur pigiau/ }).click();
  await page.getByRole('radio', { name: 'Nesvarbu' }).click();
  await next(page).click();
}

test('the whole questionnaire leads to a safe norm', async ({ page }) => {
  await fillToEnd(page);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Jūsų norma');
  // Mifflin–St Jeor: woman 35 y, 168 cm, 70 kg × 1.55 = 2192 kcal; −20 % → 1753 kcal
  await expect(page.getByText('1 753', { exact: true })).toBeVisible();
  await expect(page.getByText('Pienas (alergija)')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sudaryti savaitės meniu' })).toBeDisabled();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('answers survive a reload and "Atgal" goes back', async ({ page }) => {
  await page.goto('/pradeti');
  await page.getByRole('radio', { name: /Daugiau baltymų/ }).click();
  await next(page).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kas valgys?');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kas valgys?');
  await page.getByRole('button', { name: 'Atgal' }).click();
  await expect(page.getByRole('radio', { name: /Daugiau baltymų/ })).toHaveAttribute('aria-checked', 'true');
});

test('pregnancy means no calorie deficit and a doctor note', async ({ page }) => {
  await page.goto('/pradeti');
  await page.evaluate(() =>
    localStorage.setItem(
      'lekste:questionnaire:v1',
      JSON.stringify({
        goal: 'lose',
        adults: 1,
        meals: '3',
        consentAt: '2026-11-18T10:00:00.000Z',
        me: { sex: 'female', age: 30, heightCm: 165, weightKg: 75 },
        health: 'pregnant',
        activity: 2,
        budgetEur: 40,
        diet: 'vegetarian',
        store: 'rimi',
        cookTime: '20',
      }),
    ),
  );
  await page.reload();
  // every answer is already there, so the norm opens straight away
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Jūsų norma');
  await expect(page.getByText('Dėl nurodytos sveikatos būklės kalorijų nemažiname.')).toBeVisible();
  await expect(page.getByText('Rekomenduojame savo mitybą aptarti su gydytoju.')).toBeVisible();
});

test('Russian questionnaire', async ({ page }) => {
  await page.goto('/ru/pradeti');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Какая у вас цель?');
  await expect(page.getByText('Это не медицинская консультация.').first()).toBeVisible();
});
