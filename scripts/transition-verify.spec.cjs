const { test, expect } = require('@playwright/test')

const BASE = process.env.PCS_URL || 'http://127.0.0.1:4283/'

// Runs in the browser BEFORE app scripts. `p` is supplied as the second
// addInitScript arg (closures don't serialize, so the profile must be
// passed explicitly). Seeds a REAL onboarded profile (no demoMode) so the
// demo-tour overlay never mounts.
function seedScript(p) {
  try { localStorage.setItem('pcs_profile', JSON.stringify(p)) } catch {}
  try { localStorage.setItem('pcs_landing_dismissed', '1') } catch {}
  try { localStorage.setItem('pcs_independence_ack_v1', '1') } catch {}
}

// Click a visible button by its text via direct DOM dispatch — bypasses
// fixed-overlay pointer interception (banners/FAB) that blocks real clicks
// in this dense dashboard shell. Fine for a navigation harness.
async function clickButtonByText(page, text) {
  const ok = await page.evaluate((t) => {
    const visible = (el) => {
      const r = el.getBoundingClientRect()
      const s = getComputedStyle(el)
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'
    }
    const needle = t.toLowerCase()
    const b = [...document.querySelectorAll('button')]
      .filter(visible)
      .find(x => (x.innerText || '').toLowerCase().includes(needle))
    if (!b) return false
    b.click()
    return true
  }, text)
  if (!ok) {
    const dump = await page.locator('button').evaluateAll(els => els.map(e => (e.innerText || '').replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 30))
    throw new Error(`button not found: ${text} :: visible buttons => ${JSON.stringify(dump)}`)
  }
}

async function openTransition(page) {
  // Transition is now a top-level left-side nav tab.
  await page.locator('button:has-text("Transition")').first().waitFor({ state: 'attached', timeout: 15000 })
  await page.waitForTimeout(400)
  await clickButtonByText(page, 'Transition')
  await page.waitForTimeout(600)
}

test('military member — VA track shows BDD; switching to career hides it', async ({ page }) => {
  const logs = []
  page.on('pageerror', e => logs.push('PAGEERROR: ' + e.message))
  await page.addInitScript(seedScript, {
    firstName: 'Marcus', lastName: 'Thompson', branch: 'Army',
    component: 'Active Duty', paygrade: 'E-6', isOverseas: false,
    hasDependents: true, language: 'en',
  })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await openTransition(page)

  await expect(page.locator('h2:has-text("Transition")').first()).toBeVisible()
  // Default track is career → VA BDD milestone hidden.
  await expect(page.getByText('Benefits Delivery at Discharge', { exact: false })).toHaveCount(0)
  // Switch to VA track.
  await clickButtonByText(page, 'VA disability')
  await page.waitForTimeout(300)
  await expect(page.getByText('Benefits Delivery at Discharge', { exact: false }).first()).toBeVisible()
  // SFL-TAP branch program text present for Army.
  await expect(page.getByText('SFL-TAP', { exact: false }).first()).toBeVisible()

  // Check a milestone → persists and reflects aria-checked.
  await page.evaluate(() => document.querySelector('[role="checkbox"]')?.click())
  await page.waitForTimeout(200)
  await expect(page.locator('[role="checkbox"]').first()).toHaveAttribute('aria-checked', 'true')

  console.log('MILITARY_LOGS', JSON.stringify(logs))
  expect(logs).toHaveLength(0)
})

test('DoD civilian — shows OPM/FEHB items, hides military track question', async ({ page }) => {
  const logs = []
  page.on('pageerror', e => logs.push('PAGEERROR: ' + e.message))
  await page.addInitScript(seedScript, {
    firstName: 'Dana', lastName: 'Reyes', branch: 'Air Force',
    component: 'DoD Civilian', paygrade: 'GS-12', isOverseas: false,
    hasDependents: false, language: 'en',
  })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await openTransition(page)

  await expect(page.getByText('Federal Civilian Off-Boarding', { exact: false }).first()).toBeVisible()
  // FERS retirement option exists.
  await expect(page.getByText('FERS retirement', { exact: false }).first()).toBeVisible()
  // The military "VA disability / medical track" question should NOT render for civilians.
  await expect(page.getByText('heading to a civilian career, or filing a VA', { exact: false })).toHaveCount(0)
  // Pick FERS retirement → FEHB-into-retirement item should appear.
  await clickButtonByText(page, 'FERS retirement')
  await page.waitForTimeout(300)
  await expect(page.getByText('FEHB', { exact: false }).first()).toBeVisible()

  console.log('CIVILIAN_LOGS', JSON.stringify(logs))
  expect(logs).toHaveLength(0)
})
