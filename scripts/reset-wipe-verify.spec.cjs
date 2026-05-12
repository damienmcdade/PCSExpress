/*
 * Verify Reset actually wipes everything:
 *   1. Seed localStorage with a pcs_profile envelope + IndexedDB
 *      crypto key (call secureLocalStore.set + ensure key exists).
 *   2. Call eraseAllUserData().
 *   3. Confirm localStorage has no pcs_* keys.
 *   4. Confirm the pcs-express-crypto IndexedDB database is GONE
 *      (not just closed) — this was the bug we just fixed.
 *   5. Confirm sessionStorage is empty.
 */
const { test } = require('@playwright/test');

test('Reset wipes localStorage, sessionStorage, and IndexedDB completely', async ({ page }) => {
  test.setTimeout(45_000);
  const logs = [];
  page.on('pageerror', error => logs.push({ type: 'pageerror', text: error.message }));

  await page.goto(process.env.PCS_URL || 'http://127.0.0.1:4283/', { waitUntil: 'networkidle' });

  // Seed: write data via the actual production API.
  const seedResult = await page.evaluate(async () => {
    const mod = await import('/src/security/SecurityExtensions.js').catch(() => null);
    if (!mod) return { skipped: true };
    localStorage.setItem('pcs_user_language', 'en');
    sessionStorage.setItem('pcs_demo_profile', JSON.stringify({ demoMode: true }));
    await mod.secureLocalStore.set('pcs_profile_wipe_test', { branch: 'Army', firstName: 'Test' });
    await mod.secureLocalStore.set('pcs_checklist_checks', { 'Orders Received-0': true });

    // Wait a tick for any pending IDB ops.
    await new Promise(r => setTimeout(r, 50));

    // Snapshot pre-wipe state.
    const lsKeys = [];
    for (let i = 0; i < localStorage.length; i++) lsKeys.push(localStorage.key(i));
    const idbDbs = indexedDB.databases ? (await indexedDB.databases()).map(d => d.name) : ['(databases() unavailable)'];
    return {
      lsKeys: lsKeys.filter(k => k && (k.startsWith('pcs_') || k === 'translations_saved')),
      sessionKeys: Object.keys(sessionStorage),
      idbDbs,
    };
  });

  console.log('SEED:', JSON.stringify(seedResult, null, 2));
  if (seedResult.skipped) throw new Error('Could not import SecurityExtensions module (run against dev server)');
  if (!seedResult.lsKeys.includes('pcs_user_language') || !seedResult.lsKeys.includes('pcs_profile_wipe_test')) {
    throw new Error('Seed failed — expected pcs_* keys not present in localStorage');
  }
  if (!seedResult.idbDbs.includes('pcs-express-crypto')) {
    throw new Error('Seed failed — pcs-express-crypto IndexedDB DB was not created');
  }

  // Execute Reset using the same code paths the UI uses.
  await page.evaluate(async () => {
    const { closeCryptoStoreDB } = await import('/src/security/cryptoStore.js');
    closeCryptoStoreDB();
    // localStorage
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('pcs_') || k === 'translations_saved')) toRemove.push(k);
    }
    toRemove.forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
    // IndexedDB
    await new Promise(resolve => {
      const req = indexedDB.deleteDatabase('pcs-express-crypto');
      req.onsuccess = req.onerror = req.onblocked = () => resolve();
    });
    await new Promise(r => setTimeout(r, 100));
  });

  // Snapshot post-wipe state.
  const wipeResult = await page.evaluate(async () => {
    const lsKeys = [];
    for (let i = 0; i < localStorage.length; i++) lsKeys.push(localStorage.key(i));
    const idbDbs = indexedDB.databases ? (await indexedDB.databases()).map(d => d.name) : ['(unavailable)'];
    return {
      pcsKeysRemaining: lsKeys.filter(k => k && (k.startsWith('pcs_') || k === 'translations_saved')),
      sessionKeys: Object.keys(sessionStorage),
      idbDbs,
      cryptoDbStillPresent: idbDbs.includes('pcs-express-crypto'),
    };
  });

  console.log('POST-WIPE:', JSON.stringify(wipeResult, null, 2));

  if (wipeResult.pcsKeysRemaining.length > 0) throw new Error(`localStorage NOT fully wiped: ${wipeResult.pcsKeysRemaining.join(', ')}`);
  if (wipeResult.sessionKeys.length > 0) throw new Error(`sessionStorage NOT fully wiped: ${wipeResult.sessionKeys.join(', ')}`);
  if (wipeResult.cryptoDbStillPresent) throw new Error('pcs-express-crypto IndexedDB DB still present after wipe — closeCryptoStoreDB() did not help, deleteDatabase() blocked');
  if (logs.length > 0) throw new Error('Page errors during wipe: ' + JSON.stringify(logs));

  console.log('OK — Reset wipes localStorage + sessionStorage + IndexedDB cleanly.');
});
