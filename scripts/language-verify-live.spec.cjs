const { test } = require('@playwright/test');

const cases = [
  { code: 'es', label: 'Spanish', expectFragments: ['Sin preferencia', 'Inicio', 'Recursos', 'Esto defenderemos'], bannerFragment: 'Navegación' },
  { code: 'ko', label: 'Korean', expectFragments: ['선호 없음', '홈', '자료', '이를 우리는 지킨다'], bannerFragment: '내비게이션' },
];

for (const c of cases) {
  test(`${c.label} (${c.code}) translates UI on live site`, async ({ page }) => {
    test.setTimeout(45_000);
    const logs = [];
    page.on('console', msg => logs.push({ type: msg.type(), text: msg.text() }));
    page.on('pageerror', error => logs.push({ type: 'pageerror', text: error.message }));

    await page.goto('https://pcs-express.vercel.app/', { waitUntil: 'networkidle' });
    await page.evaluate((lang) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('pcs_user_language', lang);
      localStorage.setItem('pcs_profile', JSON.stringify({
        branch: 'Army', firstName: 'Test', lastName: 'User',
        component: 'Active Duty', paygrade: 'E-5',
        losingInstallation: 'Fort Liberty', gainingInstallation: 'Fort Carson',
        departingDate: '2026-09-01', childAges: [], childrenAges: '',
        hasChildren: false, language: lang, religiousPreference: 'No Preference', demoMode: false,
      }));
    }, c.code);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);

    const htmlLang = await page.locator('html').getAttribute('lang');
    const visibleText = await page.locator('body').innerText();
    const present = c.expectFragments.map(f => ({ frag: f, found: visibleText.includes(f) }));
    const bannerFound = visibleText.includes(c.bannerFragment);
    const englishFlags = ['No Preference', 'Active Duty', 'Continue', 'Branch & Profile'].filter(w => visibleText.includes(w));

    console.log(JSON.stringify({
      lang: c.code,
      label: c.label,
      htmlLang,
      bannerVisible: bannerFound,
      requiredFragments: present,
      englishLeakage: englishFlags,
      consoleErrors: logs.filter(l => l.type === 'error' || l.type === 'pageerror').length,
      visibleTextSample: visibleText.substring(0, 700),
    }, null, 2));

    if (htmlLang !== c.code) throw new Error(`html.lang mismatch: expected ${c.code}, got ${htmlLang}`);
    const missingFragments = present.filter(p => !p.found && p.frag !== 'PCS Express' && p.frag !== 'SGT');
    if (missingFragments.length) throw new Error(`Missing translated fragments: ${missingFragments.map(m => m.frag).join(', ')}`);
    if (!bannerFound) throw new Error(`Banner not visible for ${c.label}`);
  });
}
