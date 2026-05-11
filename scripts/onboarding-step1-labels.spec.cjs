const { test } = require('@playwright/test');

test('Onboarding step-1 labels translate on live Vercel', async ({ page }) => {
  test.setTimeout(60_000);
  const logs = [];
  page.on('console', msg => logs.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', error => logs.push({ type: 'pageerror', text: error.message }));

  await page.goto('https://pcs-express.vercel.app/', { waitUntil: 'networkidle' });
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // Find the language <select> (the one with 한국어 option)
  const selectCount = await page.locator('select').count();
  let langIdx = -1;
  for (let i = 0; i < selectCount; i++) {
    const opts = await page.locator('select').nth(i).locator('option').allTextContents();
    if (opts.some(o => /한국어/.test(o))) { langIdx = i; break; }
  }
  if (langIdx === -1) throw new Error('language select not found');

  // Pick Korean
  await page.locator('select').nth(langIdx).selectOption('ko');
  await page.waitForTimeout(800);

  // Click the Continue button at the bottom of step 0
  const continueBtn = page.locator('button').filter({ hasText: /계속|Continue/ }).first();
  await continueBtn.click();
  await page.waitForTimeout(1500);

  const visibleText = await page.locator('body').innerText();

  const expectedKo = ['출발지 (이전 기지)', '도착지 (새 기지)', '출발일'];
  const englishFlags = ['DEPARTING FROM (LOSING INSTALLATION)', 'REPORTING TO (GAINING INSTALLATION)', 'DEPARTING DATE'];

  const koreanResults = expectedKo.map(s => ({ frag: s, found: visibleText.includes(s) }));
  const englishLeakage = englishFlags.filter(s => visibleText.includes(s));

  console.log(JSON.stringify({
    url: page.url(),
    htmlLang: await page.locator('html').getAttribute('lang'),
    expectedKoreanLabels: koreanResults,
    englishLeakage,
    consoleErrors: logs.filter(l => l.type === 'error' || l.type === 'pageerror').length,
    sample: visibleText.substring(0, 600),
  }, null, 2));

  if (englishLeakage.length) throw new Error(`English labels still showing: ${englishLeakage.join(', ')}`);
  const missing = koreanResults.filter(r => !r.found);
  if (missing.length) throw new Error(`Missing Korean labels: ${missing.map(m => m.frag).join(', ')}`);
});
