const { test } = require('@playwright/test');

test('Saved Korean profile triggers full UI translation', async ({ page }) => {
  test.setTimeout(60_000);
  const logs = [];
  page.on('console', msg => logs.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', error => logs.push({ type: 'pageerror', text: error.message }));

  const url = process.env.PCS_URL || 'http://127.0.0.1:4283/';

  // Step 1: load and inject a saved Korean profile + fast-path language key
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('pcs_user_language', 'ko');
    // Inject a normalized profile so initial render bypasses onboarding
    const profile = {
      branch: 'Army',
      firstName: 'Test',
      lastName: 'User',
      component: 'Active Duty',
      paygrade: 'E-5',
      losingInstallation: 'Fort Liberty',
      gainingInstallation: 'Fort Carson',
      departingDate: '2026-09-01',
      childAges: [],
      childrenAges: '',
      hasChildren: false,
      language: 'ko',
      religiousPreference: 'No Preference',
      demoMode: false,
    };
    localStorage.setItem('pcs_profile', JSON.stringify(profile));
  });

  // Reload so the app initializes with our saved profile
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2500); // let runtime + catch-up passes complete

  const htmlLang = await page.locator('html').getAttribute('lang');
  const htmlDir = await page.locator('html').getAttribute('dir');
  const localStorageLang = await page.evaluate(() => localStorage.getItem('pcs_user_language'));
  const rootDataLang = await page.locator('#root').getAttribute('data-pcs-language-runtime').catch(() => null);

  const visibleText = await page.locator('body').innerText();
  const koreanCharCount = (visibleText.match(/[ㄱ-힝]/g) || []).length;
  const totalChars = visibleText.length;
  const ratio = totalChars > 0 ? (koreanCharCount / totalChars).toFixed(3) : 0;

  // Find English content words that should NOT be present in a Korean UI
  const flagWords = ['the', 'Continue', 'Next', 'Back', 'Search', 'Branch', 'Profile', 'Language', 'Schools', 'Childcare', 'Documents'];
  const englishHits = {};
  flagWords.forEach(w => {
    const re = new RegExp(`\\b${w}\\b`, 'g');
    englishHits[w] = (visibleText.match(re) || []).length;
  });

  // Sample text from different sections
  const headings = await page.locator('h1, h2, h3, [style*="font-weight: 950"], [style*="font-weight: 900"]').allTextContents();
  const headingSample = headings.slice(0, 10);

  console.log(JSON.stringify({
    url: page.url(),
    htmlLang,
    htmlDir,
    localStorageLang,
    rootDataLang,
    koreanCharCount,
    totalChars,
    koreanRatio: ratio,
    englishWordHits: englishHits,
    headingSample,
    visibleTextSample: visibleText.substring(0, 500),
    consoleErrors: logs.filter(l => l.type === 'error' || l.type === 'pageerror'),
  }, null, 2));
});
