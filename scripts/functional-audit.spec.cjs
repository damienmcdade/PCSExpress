/* eslint-disable */
// Live-site functional correctness audit for PCS Express.
// Drives https://pcsexpress.app/ via Playwright, visits every mission
// group + every discoverable inner tab strip, and captures:
//   - JS console errors
//   - Page errors (uncaught exceptions)
//   - Failed network requests (>=400)
//   - Empty/dead render states (rootChildElementCount, visible text length)
//   - Suspicious external links (http://, well-known dead patterns)
// Writes a JSON dump to /tmp/audit-functional.json so a follow-up step
// can summarize it into /tmp/audit-functional.md.

const { test } = require('@playwright/test')
const fs = require('fs')

const BASE_URL = 'https://pcsexpress.app/'
const MISSION_TABS = [
  'home',
  'pcs-operations',
  'home-relocation',
  'family-readiness',
  'medical-readiness',
  'mission-resources',
]

// Patterns that signal a bad external URL even without HEAD-checking it.
const SUSPICIOUS_LINK_PATTERNS = [
  /^http:\/\//i,                        // not HTTPS
  /localhost|127\.0\.0\.1/i,             // dev leftovers
  /example\.com/i,                       // placeholder
  /TODO|FIXME|placeholder/i,
  /\.test(\/|$)/i,
  /\bnull\b|\bundefined\b/i,
  /pcsexpress\.app\/api\//i,             // accidental absolute API ref
]

test.setTimeout(15 * 60 * 1000)

test('PCS Express live functional audit', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  // Inject demo profile BEFORE first navigation so landing + onboarding
  // are skipped on every page load (including reloads).
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

  // Global collectors. We reset the "current scope" before each
  // navigation so we can attribute findings to the right route/tab.
  const findings = []
  let scope = { route: 'init', tab: null }

  const recordConsole = []
  const recordPageErr = []
  const recordNetErr = []

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      recordConsole.push({
        scope: { ...scope },
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
      })
    }
  })
  page.on('pageerror', err => {
    recordPageErr.push({
      scope: { ...scope },
      message: err.message,
      stack: (err.stack || '').split('\n').slice(0, 6).join('\n'),
    })
  })
  page.on('response', resp => {
    const status = resp.status()
    if (status >= 400) {
      recordNetErr.push({
        scope: { ...scope },
        url: resp.url(),
        status,
        method: resp.request().method(),
        resourceType: resp.request().resourceType(),
      })
    }
  })
  page.on('requestfailed', req => {
    recordNetErr.push({
      scope: { ...scope },
      url: req.url(),
      status: 'failed',
      method: req.method(),
      resourceType: req.resourceType(),
      failure: req.failure()?.errorText,
    })
  })

  // Initial load.
  scope = { route: 'initial-load', tab: null }
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
  // Some chunks lazy-load on idle; give them a window.
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})
  await page.waitForTimeout(1500)

  // Dismiss demo tour if visible.
  const dismissTour = async () => {
    const skip = page.locator('button:has-text("Skip ✕"), button:has-text("Skip")').first()
    if (await skip.count()) {
      await skip.click({ timeout: 1000 }).catch(() => {})
      await page.waitForTimeout(200)
    }
    // Independence ack modal
    const ack = page.locator('button:has-text("I understand")').first()
    if (await ack.count()) {
      await ack.click({ timeout: 1000 }).catch(() => {})
      await page.waitForTimeout(200)
    }
  }
  await dismissTour()

  // Helper: snapshot dead-state metrics for the current route.
  const snapshotState = async (label) => {
    const m = await page.evaluate(() => {
      const root = document.getElementById('root') || document.body
      const main = document.getElementById('pcs-main-content') || root
      const visibleText = (main.innerText || '').trim()
      // Look for common "empty" patterns
      const tooShort = visibleText.length < 80
      const errBoundary = /something went wrong|error boundary|crashed|chunk failed/i.test(visibleText)
      // Pull every external anchor on the page
      const anchors = Array.from(document.querySelectorAll('a[href^="http"], a[href^="//"]'))
        .map(a => ({
          href: a.getAttribute('href'),
          text: (a.textContent || '').trim().slice(0, 80),
          target: a.target || null,
        }))
      // Look for visible buttons/tabs in case we want to drill in.
      const tabButtons = Array.from(document.querySelectorAll('[role="tab"], button.pcs-tab, button[id^="edub-tab-"]'))
        .map(el => ({
          text: (el.textContent || '').trim().slice(0, 60),
          id: el.id || null,
          selected: el.getAttribute('aria-selected') === 'true' || el.classList.contains('is-active'),
        }))
        .filter(b => b.text)
      return {
        rootChildElementCount: root.childElementCount,
        mainChildElementCount: main.childElementCount,
        textLength: visibleText.length,
        textSample: visibleText.slice(0, 240),
        tooShort,
        errBoundary,
        anchors,
        tabButtons,
      }
    })
    findings.push({ kind: 'state', scope: { ...scope }, label, ...m })
    return m
  }

  // Helper: discover inner tab buttons inside the active panel.
  // Returns an array of `{ text, id }` for in-panel tab strips,
  // excluding the side nav (which we drive separately).
  const findInnerTabs = async () => {
    return await page.evaluate(() => {
      const main = document.getElementById('pcs-main-content') || document.body
      const seen = new Set()
      const out = []
      // 1) ARIA tabs
      main.querySelectorAll('[role="tab"]').forEach(el => {
        const key = `${el.id || ''}|${(el.textContent || '').trim()}`
        if (!key.trim() || seen.has(key)) return
        seen.add(key)
        out.push({ kind: 'role-tab', id: el.id || null, text: (el.textContent || '').trim().slice(0, 80) })
      })
      // 2) Existing CSS class convention used through the app
      main.querySelectorAll('button.pcs-tab').forEach(el => {
        const key = `cls|${(el.textContent || '').trim()}`
        if (seen.has(key)) return
        seen.add(key)
        out.push({ kind: 'pcs-tab', id: el.id || null, text: (el.textContent || '').trim().slice(0, 80) })
      })
      // 3) Buttons with "edub-tab-" id (Education benefits)
      main.querySelectorAll('button[id^="edub-tab-"]').forEach(el => {
        const key = `edub|${el.id}`
        if (seen.has(key)) return
        seen.add(key)
        out.push({ kind: 'edub-tab', id: el.id, text: (el.textContent || '').trim().slice(0, 80) })
      })
      return out
    })
  }

  // Helper: click an inner tab by index (re-resolves each time because
  // the React tree may rerender between clicks).
  const clickInnerTabByIndex = async (idx) => {
    const locator = page.locator(
      '#pcs-main-content [role="tab"], #pcs-main-content button.pcs-tab, #pcs-main-content button[id^="edub-tab-"]'
    )
    const count = await locator.count()
    if (idx >= count) return false
    const target = locator.nth(idx)
    try {
      await target.scrollIntoViewIfNeeded({ timeout: 1500 })
      await target.click({ timeout: 2500 })
      return true
    } catch (e) {
      findings.push({
        kind: 'tab-click-failed',
        scope: { ...scope },
        index: idx,
        error: e.message,
      })
      return false
    }
  }

  // Helper: click a sidebar nav item by id. Falls back to clicking
  // a button whose text matches the nav label.
  const goToTab = async (tabId, label) => {
    // Sidebar buttons render their label as visible text. Use that.
    const tried = []
    // Try by visible-text "label" first (exact match preferred).
    const byText = page.locator(`aside button:has-text("${label}")`).first()
    if (await byText.count()) {
      try {
        await byText.click({ timeout: 3000 })
        tried.push('byText:ok')
      } catch (e) { tried.push(`byText:${e.message}`) }
    } else {
      // Fallback: click via JS, dispatching against any button containing the id+label.
      const clicked = await page.evaluate((label) => {
        const aside = document.querySelector('aside')
        if (!aside) return false
        const btns = Array.from(aside.querySelectorAll('button'))
        const hit = btns.find(b => (b.textContent || '').trim().toLowerCase().includes(label.toLowerCase()))
        if (!hit) return false
        hit.click()
        return true
      }, label)
      tried.push(`jsFallback:${clicked}`)
    }
    await page.waitForTimeout(900)
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
    await dismissTour()
    findings.push({ kind: 'nav', tabId, label, tried })
  }

  // Iterate every mission group.
  const MISSION_GROUP_LABELS = {
    'home': 'Command Center',
    'pcs-operations': 'PCS Operations',
    'home-relocation': 'Movement & Logistics',
    'family-readiness': 'Family Readiness',
    'medical-readiness': 'Holistic Health',
    'mission-resources': 'Mission Resources',
  }

  for (const tabId of MISSION_TABS) {
    const label = MISSION_GROUP_LABELS[tabId]
    scope = { route: tabId, tab: null }
    await goToTab(tabId, label)
    const state = await snapshotState(`mission-group:${tabId}`)

    // Discover inner tabs once.
    const innerTabs = await findInnerTabs()
    findings.push({ kind: 'inner-tabs-discovered', scope: { ...scope }, count: innerTabs.length, list: innerTabs })

    // Click each inner tab one-by-one. Re-resolve count each time
    // because some tabs reveal further nested strips.
    let seenInnerCount = innerTabs.length
    for (let i = 0; i < seenInnerCount && i < 25; i++) {
      const innerLabel = innerTabs[i]?.text || `index-${i}`
      scope = { route: tabId, tab: innerLabel }
      const ok = await clickInnerTabByIndex(i)
      if (!ok) continue
      await page.waitForTimeout(500)
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})
      await snapshotState(`tab:${tabId}/${innerLabel}`)

      // If this tab reveals SECOND-LEVEL tabs (e.g. Education sub-tabs,
      // Documents categories), grab the first couple and click those too.
      const nested = await findInnerTabs()
      if (nested.length > innerTabs.length + 1) {
        // probably nested; click up to 5 additional ones
        const cap = Math.min(nested.length, innerTabs.length + 6)
        for (let j = innerTabs.length; j < cap; j++) {
          scope = { route: tabId, tab: `${innerLabel} > ${nested[j]?.text || 'n/a'}` }
          const ok2 = await clickInnerTabByIndex(j)
          if (!ok2) continue
          await page.waitForTimeout(400)
          await snapshotState(`nested-tab:${tabId}/${innerLabel}/${nested[j]?.text || j}`)
        }
      }
    }
  }

  // Categorize external links collected per route into "suspicious".
  const linkReport = []
  for (const f of findings) {
    if (f.kind !== 'state' || !f.anchors) continue
    for (const a of f.anchors) {
      const href = a.href || ''
      for (const pat of SUSPICIOUS_LINK_PATTERNS) {
        if (pat.test(href)) {
          linkReport.push({
            scope: f.scope,
            href,
            text: a.text,
            reason: pat.source,
          })
          break
        }
      }
    }
  }

  const summary = {
    base: BASE_URL,
    consoleErrors: recordConsole,
    pageErrors: recordPageErr,
    networkErrors: recordNetErr,
    suspiciousLinks: linkReport,
    findings,
  }

  fs.writeFileSync('/tmp/audit-functional.json', JSON.stringify(summary, null, 2))
  console.log('AUDIT_SUMMARY_PATH=/tmp/audit-functional.json')
  console.log('counts', {
    consoleErrors: recordConsole.length,
    pageErrors: recordPageErr.length,
    networkErrors: recordNetErr.length,
    suspiciousLinks: linkReport.length,
    findings: findings.length,
  })
})
