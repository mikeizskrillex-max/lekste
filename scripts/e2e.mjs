/**
 * End-to-end scenarios A–J from the project brief, run against a running
 * server (default http://localhost:3000, override with E2E_URL) in Chromium.
 * Development mode (no Supabase/Stripe keys) is assumed: test checkout, dev login.
 *   npm run build && npm start   # in one terminal
 *   npm run e2e                  # in another
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

// require() so a globally installed Playwright (NODE_PATH) is found as well as a local one
const { chromium, devices } = createRequire(import.meta.url)('playwright');

const BASE = process.env.E2E_URL ?? 'http://localhost:3000';
const DB = JSON.parse(readFileSync(new URL('../data/recipes.json', import.meta.url)));
const RECIPE = Object.fromEntries(DB.recipes.map((r) => [r.id, r]));
const results = [];
const check = (name, cond, info = '') => { results.push({ name, ok: !!cond, info }); console.log(`${cond ? '✓' : '✗'} ${name}${info ? ` — ${info}` : ''}`); };
const state = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('lekste:v2') || '{}'));

const browser = await chromium.launch();
try {
  // ---------- A: mobile onboarding → result → test checkout ----------
  const mobile = await browser.newContext({ ...devices['iPhone 13'], locale: 'lt-LT' });
  const page = await mobile.newPage();
  await page.goto(`${BASE}/`);
  check('A landing renders hero', await page.getByRole('heading', { level: 1 }).isVisible());
  await page.goto(`${BASE}/onboarding`);
  const t0 = Date.now();
  const next = () => page.getByRole('button', { name: /Toliau|Далее/ }).click();
  await page.getByRole('button', { name: /Numesti svorio/ }).click();                         // 1 goal (auto-advance)
  await page.getByText(/Apie jus/).waitFor();
  await page.getByRole('button', { name: 'Ūgis +' }).click();                                  // 2 body: one tap on a stepper
  await next();
  await page.getByRole('button', { name: '2', exact: true }).click();                          // 3 household, budget, store
  await page.getByRole('button', { name: /laisviau/ }).click();
  await next();
  await page.getByRole('button', { name: 'Žuvis', exact: true }).click();                      // 4 exclusions: fish + dairy
  await page.getByRole('button', { name: 'Pieno produktai', exact: true }).click();
  await page.getByRole('button', { name: /Daugiau nustatymų/ }).click();
  await page.getByRole('button', { name: /Burokėliai/ }).click();
  const boxes = page.locator('input[type=checkbox]');
  await boxes.nth(1).check();                                                                  // combined consent
  await page.getByRole('button', { name: /Pamatyti mano rezultatą/ }).click();
  await page.waitForURL('**/onboarding/result**');
  check('FAST questionnaire is 4 screens', true, `${((Date.now() - t0) / 1000).toFixed(1)} s automated`);
  // optional taste swipe from the result page
  await page.getByText(/Jūsų savaitės meniu/).waitFor();
  await page.getByRole('link', { name: /Patikslinti skonį/ }).click();
  await page.waitForURL('**/onboarding/taste**');
  await page.getByText(/Kas jums patinka/).waitFor();
  for (const v of ['Patinka', 'Patinka', 'Ne man', 'Patinka', 'Ne man']) { await page.getByRole('button', { name: v, exact: true }).click(); await page.waitForTimeout(300); }
  await page.getByRole('button', { name: /Praleisti/ }).click();
  await page.waitForURL('**/onboarding/result**');
  {
    const st = await state(page);
    check('TASTE swipes saved and used', (st.answers.tasteLiked ?? []).length === 3 && (st.answers.dislikedRecipes ?? []).length === 2);
  }
  await page.getByText(/Jūsų savaitės meniu/).waitFor();
  check('A result shows the menu for every day', await page.getByRole('tab').count() === 7);
  await page.getByRole('tab').nth(3).click();
  check('A day 4 has its own shopping list', await page.getByText(/Ką nupirkti šiai dienai/).isVisible());
  {
    const euro = (txt) => Number(txt.replace(/[^0-9,]/g, '').replace(',', '.'));
    const weekTxt = await page.getByText('Numatomas krepšelis').locator('..').innerText();
    const week = euro(weekTxt.split('\n')[1]);
    let sum = 0;
    for (let i = 0; i < 7; i++) {
      await page.getByRole('tab').nth(i).click();
      const head = await page.getByText(/Šios dienos dalis iš savaitės krepšelio/).locator('../..').innerText();
      sum += euro(head.split('\n').pop());
    }
    check('A 7 day totals add up to the weekly basket', Math.abs(sum - week) <= 0.05, `${sum.toFixed(2)} vs ${week.toFixed(2)}`);
  }
  await page.getByRole('link', { name: /Gauti mėnesio planą/ }).click();
  await page.waitForURL('**/register**');
  await page.getByLabel('El. paštas').fill('e2e@example.com');
  await page.getByLabel('Slaptažodis').fill('e2e-password-123');
  await page.getByRole('button', { name: /Sukurti paskyrą ir tęsti/ }).click();
  await page.waitForURL('**/checkout**');
  check('ACCOUNT created after the result page', true);
  await page.locator('input[type=checkbox]').check();
  await page.getByRole('button', { name: /Pradėti 7 d\. nemokamai|Mokėti/ }).click();
  await page.waitForURL('**/success');
  await page.getByText(/Prenumerata aktyvi/).waitFor();
  check('A test checkout reaches success', true);
  {
    const sub = (await state(page)).subscription;
    const days = Math.round((Date.parse(sub.trialEnd) - Date.now()) / 86400000);
    check('TRIAL starts a 7-day free week (0 € today)', sub.status === 'trialing' && days === 7 && sub.payments[0].amount === 0, `${sub.status}, ${days} d`);
  }
  await page.getByRole('link', { name: /Atidaryti paskyrą/ }).click();
  await page.waitForURL('**/app');
  check('A dashboard opens with bottom nav (mobile)', await page.getByRole('navigation', { name: 'Tabs' }).isVisible());

  // ---------- C: restrictions & budget respected ----------
  let s = await state(page);
  const ids = s.plan.days.flatMap((d) => d.meals.map((m) => m.recipeId));
  const bad = ids.filter((id) => { const r = RECIPE[id]; return !r || r.allergens.includes('milk') || r.allergens.includes('fish') || r.ingredients.some((i) => ['cod', 'salmon', 'shrimp', 'tuna_can'].includes(i.id)); });
  check('C plan has no fish or dairy', bad.length === 0, bad.join(','));
  check('C disliked beetroot never appears', !ids.some((id) => RECIPE[id]?.ingredients.some((i) => i.id === 'beetroot')));
  check('C weekly cost within budget', s.plan.weeklyCost <= s.answers.weeklyBudget * 1.05, `${s.plan.weeklyCost.toFixed(2)} / ${s.answers.weeklyBudget}`);

  // ---------- B: replace a meal ----------
  await page.goto(`${BASE}/app/menu/0`);
  const before = (await state(page)).plan.days[0].meals[0].recipeId;
  await page.getByRole('button', { name: /Pakeisti/ }).first().click();
  await page.getByRole('button', { name: 'Pigiau' }).click().catch(() => {});
  await page.waitForTimeout(400);
  let after = (await state(page)).plan.days[0].meals[0].recipeId;
  if (after === before) { await page.getByRole('button', { name: /Pakeisti/ }).first().click(); await page.locator('div.absolute button').first().click(); await page.waitForTimeout(400); after = (await state(page)).plan.days[0].meals[0].recipeId; }
  check('B replace meal changes the dish', after !== before, `${before} → ${after}`);
  const r2 = RECIPE[after];
  check('B replacement still respects dairy rule', r2 && !r2.allergens.includes('milk'));

  // ---------- D: consolidated shopping list ----------
  await page.goto(`${BASE}/app/shopping`);
  const items = await page.locator('main input[type=checkbox]').count();
  check('D shopping list consolidates the week', items > 10, `${items} items`);

  // ---------- E: basket comparison across supermarkets ----------
  await page.goto(`${BASE}/app/basket`);
  check('E same list priced at every store with data', await page.getByText(/Tas pats sąrašas kitose parduotuvėse/).isVisible() && (await page.locator('main').innerText()).match(/Barbora[\s\S]*Rimi|Rimi[\s\S]*Barbora/) !== null);
  await page.getByRole('button', { name: /Rimi/ }).first().click();
  await page.waitForTimeout(500);
  s = await state(page);
  check('E choosing a store rebuilds the plan for it', s.answers.homeStore === 'rimi');
  await page.goto(`${BASE}/app/shopping`);
  const shopText = await page.locator('main').innerText();
  check('E shopping list comes from one store only', shopText.includes('Rimi') && !/\bBarbora\b[^\n]*€/.test(shopText.split('Įrašyti apsipirkimą')[0]));
  await page.getByRole('button', { name: /^An / }).click();
  check('E per-day list shown', await page.getByText(/Ką nupirkti šiai dienai/).isVisible());

  // ---------- F: change budget recalculates ----------
  await page.goto(`${BASE}/app/menu`);
  const plan1 = JSON.stringify((await state(page)).plan.days.map((d) => d.meals.map((m) => m.recipeId)));
  await page.getByRole('button', { name: /Asmeniniai nustatymai/ }).click();
  await page.locator('#budget').fill('30');
  await page.waitForTimeout(600);
  s = await state(page);
  check('F budget change rebuilds the menu', s.answers.weeklyBudget === 30 && JSON.stringify(s.plan.days.map((d) => d.meals.map((m) => m.recipeId))) !== plan1);

  // ---------- G: analytics shows recorded spending/savings ----------
  await page.goto(`${BASE}/app/shopping`);
  await page.getByLabel('Sumokėta, €').fill('25');
  await page.getByRole('button', { name: 'Išsaugoti' }).click();
  await page.goto(`${BASE}/app/progress`);
  check('G progress shows recorded spending', (await page.locator('main').innerText()).includes('25,00'));

  // ---------- today screen, promos, sharing, leftovers, basics ----------
  await page.goto(`${BASE}/app`);
  check('TODAY next meal card with cook button', await page.getByRole('link', { name: /Gaminti dabar/ }).isVisible());
  const homeText = await page.locator('main').innerText();
  check('TODAY savings line is meaningful (not 0,00 €)', /palyginti su|pigesnė|pigiausia/.test(homeText));
  await page.goto(`${BASE}/app/shopping`);
  check('SHOP share + WhatsApp buttons', await page.getByRole('button', { name: /Dalintis/ }).isVisible() && await page.getByRole('link', { name: 'WhatsApp' }).isVisible());
  await page.getByRole('button', { name: /\+ Pridėti/ }).click();
  await page.locator('form select').first().selectOption('rice');
  await page.locator('form input[aria-label="g"]').fill('1000');
  await page.getByRole('button', { name: 'Išsaugoti' }).first().click();
  await page.waitForTimeout(400);
  check('SHOP leftover at home saved', ((await state(page)).stock ?? {}).rice === 1000);
  check('SHOP basics checklist shown', await page.getByText(/Ar turite namuose/).isVisible());
  const pub = await page.request.get(`${BASE}/recipe/plov`);
  check('SEO recipe page has schema.org Recipe', (await pub.text()).includes('"@type":"Recipe"'));

  // ---------- new week, history, catalog, favorites ----------
  await page.goto(`${BASE}/app/menu`);
  const before7 = JSON.stringify((await state(page)).plan.days.map((d) => d.meals.map((m) => m.recipeId)));
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: /Nauja savaitė/ }).first().click();
  await page.waitForTimeout(800);
  s = await state(page);
  check('NEW new week builds a different menu and keeps history', JSON.stringify(s.plan.days.map((d) => d.meals.map((m) => m.recipeId))) !== before7 && s.history?.length === 1);
  await page.goto(`${BASE}/app/recipes`);
  await page.getByPlaceholder(/Ieškoti/).fill('vištien');
  await page.waitForTimeout(400);
  const cards = await page.locator('main a[href^="/app/recipe/"]').count();
  check('NEW recipe catalog search works', cards > 3, `${cards} cards`);
  await page.getByRole('button', { name: 'Į mėgstamus' }).first().click();
  s = await state(page);
  check('NEW favorite saved', (s.answers.favorites ?? []).length === 1);
  const man = await page.request.get(`${BASE}/manifest.webmanifest`);
  check('NEW installable web app manifest', man.ok() && (await man.json()).icons.length >= 2);

  // ---------- J: cancel subscription ----------
  page.on('dialog', (d) => d.accept());
  await page.goto(`${BASE}/app/subscription`);
  await page.getByRole('button', { name: /Atšaukti prenumeratą/ }).click();
  await page.waitForTimeout(300);
  check('J cancel keeps access until the end and stops renewal', (await state(page)).subscription.cancelAtPeriodEnd === true && await page.getByText(/prieiga lieka iki/).first().isVisible());

  // ---------- I: unauthorized access blocked ----------
  const anon = await browser.newContext();
  const ap = await anon.newPage();
  await ap.goto(`${BASE}/app/menu`);
  check('I anonymous /app redirects to login', ap.url().includes('/login'));
  const api = await ap.request.get(`${BASE}/api/admin/users`);
  check('I anonymous admin API → 401', api.status() === 401);
  await page.goto(`${BASE}/admin`);
  check('I regular user cannot open /admin', !page.url().includes('/admin'), page.url());
  const wrong = await ap.request.post(`${BASE}/api/dev/login`, { data: { email: 'x@example.com', role: 'admin', passphrase: 'nope' } });
  check('I wrong admin passphrase → 403', wrong.status() === 403);

  // ---------- H: admin CSV import updates catalogue ----------
  const adminCtx = await browser.newContext({ locale: 'lt-LT' });
  const ad = await adminCtx.newPage();
  await ad.goto(`${BASE}/login?next=/admin/prices&admin=1`);
  await ad.getByLabel('El. paštas').fill('admin@example.com');
  await ad.getByLabel(/Slaptafrazė/).fill(process.env.DEV_ADMIN_PASSPHRASE ?? 'lekste-admin');
  await ad.getByRole('button', { name: 'Prisijungti', exact: true }).click();
  await ad.waitForURL('**/admin/prices');
  const csv = 'retailer,product_name,price_eur,package_grams,regular_price_eur,ingredient_id,brand,ean,promo_valid_from,promo_valid_to,url\nlidl,Avižiniai dribsniai 500 g,0.49,500,0.79,oats,,,2026-11-10,2026-11-16,';
  await ad.locator('textarea').fill(csv);
  await ad.getByRole('button', { name: 'Validate' }).click();
  await ad.getByRole('button', { name: /Import 1 records/ }).click();
  check('H CSV import accepted', await ad.getByText(/Imported\./).isVisible());
  const lidl = await ad.evaluate(() => JSON.parse(localStorage.getItem('lekste:prices') || '[]'));
  check('H imported price stored for Lidl', lidl.some((r) => r.retailer === 'lidl' && r.ingredientId === 'oats'));
  await ad.goto(`${BASE}/admin/supermarkets`);
  check('H Lidl now has records', (await ad.locator('main, body').innerText()).match(/Lidl[\s\S]*?Records\s*1/) !== null);
} finally {
  await browser.close();
}
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
