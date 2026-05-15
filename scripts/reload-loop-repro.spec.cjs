/*
 * Reproduce the "PCS Express needs to reload this screen" error
 * boundary that the user is seeing. Strategy:
 *   1. Seed a complete profile that exercises every dynamic-card tab.
 *   2. Reload, then click through every Family Readiness sub-tab.
 *   3. Capture page errors + console errors + the error-boundary text
 *      whenever it appears.
 */
const { test } = require('@playwright/test');

test('Family Readiness tabs do not trigger error boundary', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = [];
  page.on('pageerror', e => errors.push({ kind: 'pageerror', msg: e.message, stack: e.stack }));
  page.on('console', m => { if (m.type() === 'error') errors.push({ kind: 'console', msg: m.text() }); });

  const url = process.env.PCS_URL || 'http://127.0.0.1:4283/';
  await page.goto(url, { waitUntil: 'networkidle' });

  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    const profile = {
      branch: 'Army', firstName: 'Test', lastName: 'User',
      component: 'Active Duty', paygrade: 'E-5',
      gainingInstallation: 'Fort Liberty',
      losingInstallation: 'Fort Carson',
      departingDate: '2026-12-15',
      reportNLTDate: '2026-12-30',
      language: 'en',
      hasDependents: true, hasChildren: true,
      childAges: [4, 9, 14],
      religiousPreference: 'Protestant',
      hasPets: false, moveType: 'HHG',
    };
    localStorage.setItem('pcs_profile', JSON.stringify(profile));
  });

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Try to find any text that indicates the error boundary
  async function checkReload(label) {
    const boundary = await page.locator('text=PCS Express needs to reload this screen').count();
    const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 200);
    return { label, errorBoundaryVisible: boundary, bodyStart: body };
  }

  const states = [];
  states.push(await checkReload('initial'));

  // Try opening hamburger / nav to find Family Readiness
  const hamburger = await page.locator('button:has-text("☰")').count();
  if (hamburger > 0) {
    await page.locator('button:has-text("☰")').first().click().catch(() => {});
    await page.waitForTimeout(300);
  }

  // Click each Family Readiness related tab visible
  const tabsToTry = ['Family Readiness', 'Family Support', 'Family', 'Schools', 'Schools & Childcare', 'Employment', 'Job Search', 'Family Fun', 'Home Relocation', 'Home Locator'];
  for (const tabText of tabsToTry) {
    const count = await page.locator(`text="${tabText}"`).count();
    if (count > 0) {
      await page.locator(`text="${tabText}"`).first().click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(800);
      states.push(await checkReload(tabText));
    }
  }

  console.log(JSON.stringify({ errors: errors.slice(0, 10), states }, null, 2));

  // Don't fail on a found error boundary - report it.
  const triggered = states.filter(s => s.errorBoundaryVisible > 0);
  console.log(`Error boundary triggered on: ${triggered.map(t => t.label).join(', ') || 'none'}`);
});
