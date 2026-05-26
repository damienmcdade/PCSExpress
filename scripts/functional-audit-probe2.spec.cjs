/* eslint-disable */
// Targeted follow-up probe: drill into Mission Resources, Family
// Readiness, and Medical Readiness to capture deep page content so we
// can confirm whether tab clicks actually load the intended panel.
const { test } = require('@playwright/test')
const fs = require('fs')

test.setTimeout(10 * 60 * 1000)

test('Mission groups deep-content probe', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    const demo = {
      firstName: 'Marcus', lastName: 'Thompson', branch: 'Army',
      component: 'Active Duty', paygrade: 'E-5',
      losingInstallation: 'Fort Bragg', gainingInstallation: 'Fort Hood',
      departingDate: '2026-08-01', unit: '',
      isOverseas: false, hasDependents: true, hasChildren: false,
      childAges: [], bedrooms: '3', language: 'en',
      religiousPreference: 'No Preference', demoMode: true,
    }
    try { sessionStorage.setItem('pcs_demo_profile', JSON.stringify(demo)) } catch {}
    try { localStorage.setItem('pcs_landing_dismissed', '1') } catch {}
    try { localStorage.setItem('pcs_profile', JSON.stringify(demo)) } catch {}
    try { localStorage.setItem('pcs_independence_ack_v1', '1') } catch {}
  })

  const out = { steps: [], consoleErrors: [], pageErrors: [], net: [] }
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') out.consoleErrors.push({ type: m.type(), text: m.text() }) })
  page.on('pageerror', e => out.pageErrors.push({ message: e.message, stack: (e.stack || '').split('\n').slice(0, 4).join('\n') }))
  page.on('response', r => { if (r.status() >= 400) out.net.push({ status: r.status(), url: r.url() }) })

  await page.goto('https://pcsexpress.app/', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})
  await page.waitForTimeout(1500)

  const dismiss = async () => {
    const skip = page.locator('button:has-text("Skip ✕"), button:has-text("Skip")').first()
    if (await skip.count()) await skip.click({ timeout: 1000 }).catch(() => {})
    const ack = page.locator('button:has-text("I understand")').first()
    if (await ack.count()) await ack.click({ timeout: 1000 }).catch(() => {})
  }
  await dismiss()

  const clickInAside = async (label) => {
    const btn = page.locator(`aside button:has-text("${label}")`).first()
    if (await btn.count()) await btn.click({ timeout: 3000 }).catch(() => {})
    await page.waitForTimeout(800)
    await dismiss()
  }

  // Click a tab by id (or text) inside the main content panel
  const clickTabById = async (id) => {
    const sel = `#pcs-main-content #${id}, #pcs-main-content [id="${id}"]`
    const el = page.locator(sel).first()
    if (!(await el.count())) return false
    try {
      await el.scrollIntoViewIfNeeded({ timeout: 1500 })
      await el.click({ timeout: 3000 })
      await page.waitForTimeout(700)
      return true
    } catch (e) {
      return false
    }
  }

  const grab = async (label) => {
    const data = await page.evaluate(() => {
      const main = document.getElementById('pcs-main-content') || document.body
      // Build a "deep content" string: skip the first 600 chars of header noise
      // by reading main.innerText, then collect heading-like elements explicitly
      const text = (main.innerText || '').trim()
      const headings = Array.from(main.querySelectorAll('h1,h2,h3,h4,[role="heading"]'))
        .map(h => (h.textContent || '').trim())
        .filter(Boolean)
        .slice(0, 30)
      const sel = Array.from(main.querySelectorAll('[role="tab"][aria-selected="true"]'))
        .map(t => ({ id: t.id, text: (t.textContent || '').trim() }))
      return { len: text.length, deepSample: text.slice(600, 1400), headings, selectedTabs: sel }
    })
    out.steps.push({ label, ...data })
  }

  // 1) Mission Resources - drill each top-level tab and confirm content swaps.
  await clickInAside('Mission Resources')
  await grab('mission-resources:landing')
  const mrTabs = [
    'cat-tab-base-insights', 'cat-tab-maps', 'cat-tab-help-hub',
    'cat-tab-veteran', 'cat-tab-directory', 'cat-tab-reviews',
  ]
  for (const id of mrTabs) {
    const ok = await clickTabById(id)
    await grab(`mission-resources:${id}:clicked=${ok}`)
  }

  // 2) Family Readiness - drill the full strip (including the cut-off tabs)
  await clickInAside('Family Readiness')
  await grab('family-readiness:landing')
  const frTabs = [
    'cat-tab-family', 'cat-tab-education', 'cat-tab-translation',
    'cat-tab-faith', 'cat-tab-deployment', 'cat-tab-efmp',
    'cat-tab-employment', 'cat-tab-family-fun',
    'cat-tab-permanent-resident', 'cat-tab-pets', 'cat-tab-schools',
  ]
  for (const id of frTabs) {
    const ok = await clickTabById(id)
    await grab(`family-readiness:${id}:clicked=${ok}`)
  }

  // 3) Medical Readiness / Holistic Health - the 4 tabs
  await clickInAside('Holistic Health')
  await grab('medical-readiness:landing')
  const medTabs = ['med-tab-medical', 'med-tab-behavioral', 'med-tab-spiritual', 'med-tab-fitness']
  for (const id of medTabs) {
    const ok = await clickTabById(id)
    await grab(`medical-readiness:${id}:clicked=${ok}`)
  }

  // 4) PCS Operations - Checklist / Paperwork / Timeline content
  await clickInAside('PCS Operations')
  await grab('pcs-operations:landing')
  const opsTabs = ['cat-tab-checklist', 'cat-tab-paperwork', 'cat-tab-timeline']
  for (const id of opsTabs) {
    const ok = await clickTabById(id)
    await grab(`pcs-operations:${id}:clicked=${ok}`)
  }

  fs.writeFileSync('/tmp/audit-functional-probe2.json', JSON.stringify(out, null, 2))
  console.log('PROBE2_PATH=/tmp/audit-functional-probe2.json',
    'steps=', out.steps.length, 'consoleErrors=', out.consoleErrors.length,
    'pageErrors=', out.pageErrors.length, 'net4xx=', out.net.length)
})
