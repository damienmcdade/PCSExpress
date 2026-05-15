/*
 * Drive the live site through Family Fun + record /api/* requests so
 * we can see WHY cards are not populating for the user.
 */
const { test } = require('@playwright/test');

test('Family Fun dynamic cards populate on live deploy', async ({ page }) => {
  test.setTimeout(120_000);
  const requests = [];
  const responses = [];
  const errors = [];
  page.on('request', r => { if (r.url().includes('/api/')) requests.push({ url: r.url(), method: r.method() }); });
  page.on('response', async r => {
    if (r.url().includes('/api/')) {
      let bodySnippet = '';
      try { bodySnippet = (await r.text()).slice(0, 200); } catch {}
      responses.push({ url: r.url(), status: r.status(), bodySnippet });
    }
  });
  page.on('pageerror', e => errors.push({ kind: 'pageerror', msg: e.message }));
  page.on('console', m => { if (m.type() === 'error') errors.push({ kind: 'console', msg: m.text() }); });

  const url = process.env.PCS_URL || 'https://pcs-express.vercel.app/';
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
      hasDependents: true, hasChildren: true, childAges: [4, 9, 14],
      religiousPreference: 'Protestant',
      hasPets: false, moveType: 'HHG',
    };
    localStorage.setItem('pcs_profile', JSON.stringify(profile));
  });

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Navigate via the sidebar / nav: Family Readiness -> Family Fun
  const familyBtn = page.locator('text="Family Readiness"').first();
  if (await familyBtn.count() > 0) {
    await familyBtn.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(800);
  }
  const familyFunBtn = page.locator('text="Family Fun"').first();
  if (await familyFunBtn.count() > 0) {
    await familyFunBtn.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(3500);
  }

  // Look for the cards section text
  const bodyText = await page.locator('body').innerText().catch(() => '');
  const hasLoading = bodyText.includes('Searching OpenStreetMap');
  const hasResults = /Tap card → Google directions|Family Fun/.test(bodyText);
  const hasError = bodyText.includes('OpenStreetMap is temporarily unavailable') || bodyText.includes('No nearby family activities found');

  console.log(JSON.stringify({
    requests,
    responses: responses.map(r => ({ status: r.status, url: r.url.replace(url, ''), bodySnippet: r.bodySnippet })),
    errors: errors.slice(0, 10),
    state: { hasLoading, hasResults, hasError },
    bodyExcerpt: bodyText.slice(0, 600),
  }, null, 2));
});
