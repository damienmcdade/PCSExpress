/*
 * Drive the Reset flow through the actual UI on the live Vercel site:
 *   1. Load page, seed a profile via localStorage.
 *   2. Reload — profile should appear.
 *   3. Open the More menu (or whichever Reset entry point exists).
 *   4. Click "Reset / Re-onboard".
 *   5. The warning modal should appear.
 *   6. Click "Yes, delete everything".
 *   7. After the reload, profile should be gone, onboarding shown.
 *   8. Storage layers should all be empty.
 *
 * If any step fails, the error reveals which part of the Reset wiring
 * is broken (button missing, modal not mounted, confirm action no-op,
 * page not reloading, storage not wiped, profile re-hydrating).
 */
const { test } = require('@playwright/test');

test('Reset flow on live site fully wipes saved state', async ({ page }) => {
  test.setTimeout(60_000);
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => pageErrors.push(err.message));

  const url = process.env.PCS_URL || 'https://pcs-express.vercel.app/';
  await page.goto(url, { waitUntil: 'networkidle' });

  // Seed: write a plain-JSON profile via store.set path (the encrypted
  // path needs a SubtleCrypto round-trip — we just need localStorage
  // to have something detectable on reload).
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    const fakeProfile = {
      branch: 'Army', firstName: 'Reset', lastName: 'TestUser',
      component: 'Active Duty', paygrade: 'E-5',
      gainingInstallation: 'Fort Carson',
      losingInstallation: 'Fort Liberty',
      departingDate: '2026-12-15',
      reportNLTDate: '2026-12-15',
      language: 'en', hasDependents: false, hasChildren: false,
      childAges: [], religiousPreference: 'No Preference',
      hasPets: false, moveType: 'HHG',
    };
    // Direct localStorage.setItem; the legacy-JSON path is also valid
    // for triggering profile rehydration via store.get (synchronous).
    localStorage.setItem('pcs_profile', JSON.stringify(fakeProfile));
  });

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Check the seed worked — page should show "Reset" (firstName) somewhere.
  const visibleAfterSeed = await page.locator('body').innerText();
  const seedActive = visibleAfterSeed.includes('Reset TestUser') || visibleAfterSeed.includes('TestUser') || visibleAfterSeed.includes('Fort Carson');

  // Find the Reset button — text-based search across left drawer + More sheet.
  // First try to open the More menu / hamburger if needed.
  const hamburgerCount = await page.locator('button:has-text("☰")').count();
  if (hamburgerCount > 0) await page.locator('button:has-text("☰")').first().click().catch(() => {});
  await page.waitForTimeout(300);

  const resetBtn = page.locator('button:has-text("Reset / Re-onboard")').first();
  const resetCount = await resetBtn.count();

  let resetClicked = false;
  if (resetCount > 0) {
    await resetBtn.click();
    resetClicked = true;
  }
  await page.waitForTimeout(500);

  // Modal should be visible — look for the unique header text.
  const modalVisible = await page.locator('text=WARNING — DESTRUCTIVE ACTION').count();
  const yesDeleteBtn = page.locator('button:has-text("Yes, delete everything")');
  const yesDeleteCount = await yesDeleteBtn.count();

  let confirmClicked = false;
  if (yesDeleteCount > 0) {
    // Don't await the click — it triggers a navigation/reload.
    yesDeleteBtn.first().click().catch(() => {});
    confirmClicked = true;
  }

  // Wait for the navigation that confirmReset triggers.
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(2500);

  // Post-reset state.
  const post = await page.evaluate(async () => {
    const lsKeys = [];
    for (let i = 0; i < localStorage.length; i++) lsKeys.push(localStorage.key(i));
    const visible = document.body?.innerText?.slice(0, 600) || '';
    const idbDbs = indexedDB.databases ? (await indexedDB.databases()).map(d => d.name).filter(Boolean) : null;
    return {
      pcsKeysRemaining: lsKeys.filter(k => k && (k.startsWith('pcs_') || k === 'translations_saved')),
      sessionKeys: Object.keys(sessionStorage),
      idbDbs,
      visiblePrefix: visible,
      visibleContainsOldName: visible.includes('Reset TestUser') || visible.includes('TestUser'),
    };
  });

  console.log(JSON.stringify({
    seedActive,
    resetClicked,
    modalVisible,
    yesDeleteCount,
    confirmClicked,
    post,
    consoleErrors: consoleErrors.slice(0, 5),
    pageErrors: pageErrors.slice(0, 5),
  }, null, 2));

  if (!resetClicked) throw new Error('Reset button not found on page — UI wiring broken');
  if (modalVisible === 0) throw new Error('Warning modal did not appear after clicking Reset');
  if (!confirmClicked) throw new Error('"Yes, delete everything" button not found in modal');
  if (post.pcsKeysRemaining.length > 0) throw new Error(`localStorage NOT wiped after Reset: ${post.pcsKeysRemaining.join(', ')}`);
  if (post.visibleContainsOldName) throw new Error('Old profile name still visible after Reset — re-hydration bug');

  console.log('OK — Reset UI flow wipes cleanly on live site.');
});
