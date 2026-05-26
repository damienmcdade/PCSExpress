/* eslint-disable */
// Accessibility audit for the live PCS Express deployment.
// Runs axe-core on the 6 mission groups + key sub-tabs at desktop (1440x900)
// and re-checks critical surfaces at mobile (375x812). Adds manual probes for
// tab order, focus traps, skip-link reachability, heading hierarchy and
// ARIA pair correctness. Findings are appended to /tmp/audit-a11y.md.

const { test, expect } = require('@playwright/test')
const AxeBuilder = require('@axe-core/playwright').default
const fs = require('fs')
const path = require('path')

const TARGET = 'https://pcsexpress.app/'

// ------------------------- file accumulator ---------------------------------

const OUT_FILE = '/tmp/audit-a11y.md'
const BUCKETS = {
  critical: new Map(), // ruleId -> [{selector, route, viewport, help, helpUrl}]
  serious: new Map(),
  moderate: new Map(),
  minor: new Map(),
}
const MANUAL_NOTES = []

function bucketAdd(impact, ruleId, payload) {
  const map = BUCKETS[impact] || BUCKETS.minor
  if (!map.has(ruleId)) map.set(ruleId, [])
  map.get(ruleId).push(payload)
}

function flushReport() {
  const lines = []
  lines.push('# PCS Express — Accessibility Audit')
  lines.push('')
  lines.push(`Target: ${TARGET}`)
  lines.push(`Date: ${new Date().toISOString()}`)
  lines.push(`Engine: axe-core via @axe-core/playwright`)
  lines.push('')
  lines.push('## Punch list by severity')
  lines.push('')

  const order = ['critical', 'serious', 'moderate', 'minor']
  for (const impact of order) {
    const map = BUCKETS[impact]
    const totalInstances = [...map.values()].reduce((s, arr) => s + arr.length, 0)
    lines.push(`### ${impact.toUpperCase()} — ${map.size} unique rule(s), ${totalInstances} instance(s)`)
    if (map.size === 0) { lines.push(''); lines.push('_No findings at this severity._'); lines.push(''); continue }
    lines.push('')
    // sort by # instances desc then rule id
    const sorted = [...map.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    for (const [ruleId, items] of sorted) {
      const first = items[0]
      lines.push(`#### \`${ruleId}\` — ${items.length} hit(s)`)
      if (first.help) lines.push(`*${first.help}*`)
      if (first.helpUrl) lines.push(`Docs: ${first.helpUrl}`)
      lines.push('')
      // show up to 5 sample selectors with route + viewport
      const samples = items.slice(0, 5)
      lines.push('| route | viewport | selector |')
      lines.push('| --- | --- | --- |')
      for (const s of samples) {
        const sel = String(s.selector || '').replace(/\|/g, '\\|').slice(0, 220)
        lines.push(`| ${s.route} | ${s.viewport} | \`${sel}\` |`)
      }
      if (items.length > samples.length) lines.push(`| … | … | …${items.length - samples.length} more instance(s) |`)
      lines.push('')
    }
  }

  lines.push('## Manual probes')
  lines.push('')
  if (MANUAL_NOTES.length === 0) lines.push('_No manual findings recorded._')
  for (const note of MANUAL_NOTES) {
    lines.push(`### ${note.title}`)
    lines.push('')
    if (note.summary) lines.push(note.summary)
    if (note.details) {
      lines.push('')
      lines.push('```')
      lines.push(note.details)
      lines.push('```')
    }
    lines.push('')
  }

  fs.writeFileSync(OUT_FILE, lines.join('\n'))
  console.log(`Wrote audit findings → ${OUT_FILE}`)
}

// ------------------------- shared helpers ----------------------------------

async function seedDemoProfile(context) {
  await context.addInitScript(() => {
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
}

async function dismissTour(page) {
  // The demo tour overlay covers the screen; dismiss it via Skip button.
  for (let i = 0; i < 3; i++) {
    const skip = page.locator('button:has-text("Skip ✕"), button:has-text("Skip")').first()
    if (await skip.count()) {
      await skip.click({ timeout: 1500 }).catch(() => {})
      await page.waitForTimeout(300)
    } else { break }
  }
}

async function gotoTab(page, tabId) {
  // Navigate via the in-app goTo by clicking the matching nav link.
  // Sidebar nav buttons match by accessible name; fall back to all
  // pcs-side-link buttons and filter via text.
  // The labels map: 'home' → 'Command Center', etc.
  const labelMap = {
    'home': 'Command Center',
    'pcs-operations': 'PCS Operations',
    'home-relocation': 'Movement & Logistics',
    'family-readiness': 'Family Readiness',
    'medical-readiness': 'Holistic Health',
    'mission-resources': 'Mission Resources',
  }
  const label = labelMap[tabId] || tabId
  // Try direct text match first
  const btn = page.locator(`button:has-text("${label}")`).first()
  if (await btn.count()) {
    await btn.scrollIntoViewIfNeeded().catch(() => {})
    await btn.click({ timeout: 4000 }).catch(() => {})
  } else {
    // Fallback: dispatch a custom click on the hamburger then the label
    const hamburger = page.locator('button[aria-controls="pcs-nav-drawer"]').first()
    if (await hamburger.count()) {
      await hamburger.click().catch(() => {})
      await page.waitForTimeout(200)
      const drawerBtn = page.locator(`button:has-text("${label}")`).first()
      if (await drawerBtn.count()) await drawerBtn.click({ timeout: 4000 }).catch(() => {})
    }
  }
  await page.waitForTimeout(900)
}

async function runAxe(page, route, viewport) {
  let results
  try {
    results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze()
  } catch (err) {
    MANUAL_NOTES.push({
      title: `axe-core failure on ${route} @ ${viewport}`,
      summary: `Scan threw: ${String(err && err.message || err)}`,
    })
    return
  }
  for (const v of results.violations) {
    const impact = v.impact || 'minor'
    for (const node of v.nodes) {
      bucketAdd(impact, v.id, {
        selector: (node.target || []).join(' >> ') || '(unknown)',
        route,
        viewport,
        help: v.help,
        helpUrl: v.helpUrl,
        failureSummary: node.failureSummary,
      })
    }
  }
  // Record an overview note per scan
  MANUAL_NOTES.push({
    title: `axe scan summary — ${route} @ ${viewport}`,
    summary: `violations=${results.violations.length}, passes=${results.passes.length}, incomplete=${results.incomplete.length}`,
  })
}

// ---------------------------------------------------------------------------
//  Desktop sweep — full axe scan on all 6 mission groups + key sub-tabs
// ---------------------------------------------------------------------------

const MISSION_GROUPS = [
  'home',
  'pcs-operations',
  'home-relocation',
  'family-readiness',
  'medical-readiness',
  'mission-resources',
]

test.describe.configure({ mode: 'serial' })

test.describe('a11y :: desktop 1440x900', () => {
  test.beforeAll(async () => {
    // wipe the report so this run starts fresh
    try { fs.writeFileSync(OUT_FILE, '') } catch {}
  })

  for (const tab of MISSION_GROUPS) {
    test(`axe @ ${tab}`, async ({ page, context }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await seedDemoProfile(context)
      await page.goto(TARGET, { waitUntil: 'networkidle' })
      await page.waitForTimeout(1500)
      await dismissTour(page)
      if (tab !== 'home') await gotoTab(page, tab)
      await page.waitForTimeout(800)
      await runAxe(page, tab, 'desktop')
    })
  }

  test('heading hierarchy across mission groups', async ({ page, context }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await seedDemoProfile(context)
    await page.goto(TARGET, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1200)
    await dismissTour(page)
    const findings = []
    for (const tab of MISSION_GROUPS) {
      if (tab !== 'home') await gotoTab(page, tab)
      await page.waitForTimeout(500)
      const headings = await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('main h1, main h2, main h3, main h4, main h5, main h6'))
        return els.map(el => ({ tag: el.tagName.toLowerCase(), text: (el.textContent || '').trim().slice(0, 90) }))
      })
      // detect: any h2 appearing BEFORE the first h1, or any level skip > 1
      const levels = headings.map(h => Number(h.tag.replace('h', '')))
      const firstH1Idx = levels.indexOf(1)
      const issues = []
      for (let i = 0; i < levels.length; i++) {
        if (firstH1Idx !== -1 && i < firstH1Idx && levels[i] === 2) {
          issues.push(`h2 before h1 at idx ${i}: "${headings[i].text}"`)
        }
        if (i > 0) {
          const jump = levels[i] - levels[i - 1]
          if (jump > 1) issues.push(`level skip h${levels[i - 1]} → h${levels[i]} at idx ${i}: "${headings[i].text}"`)
        }
      }
      findings.push({ tab, count: headings.length, levels, issues })
    }
    MANUAL_NOTES.push({
      title: 'Heading hierarchy (main region only)',
      summary: 'Per-tab heading sequence and any flagged issues.',
      details: findings.map(f => `${f.tab}: levels=[${f.levels.join(',')}]\n  issues=${f.issues.length ? '\n   - ' + f.issues.join('\n   - ') : 'none'}`).join('\n'),
    })
  })

  test('tab order from page load — first 30 Tab presses', async ({ page, context }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await seedDemoProfile(context)
    await page.goto(TARGET, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)
    await dismissTour(page)
    const path = []
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab')
      const info = await page.evaluate(() => {
        const el = document.activeElement
        if (!el || el === document.body) return { tag: null }
        return {
          tag: el.tagName.toLowerCase(),
          role: el.getAttribute('role') || null,
          aria: el.getAttribute('aria-label') || null,
          text: (el.innerText || el.value || '').trim().slice(0, 60) || null,
          cls: (el.className && typeof el.className === 'string') ? el.className.slice(0, 80) : null,
          href: el.getAttribute('href') || null,
        }
      })
      path.push(`${i + 1}. <${info.tag || 'body'}>${info.role ? ` role=${info.role}` : ''}${info.href ? ` href=${info.href}` : ''}${info.aria ? ` aria="${info.aria}"` : ''}${info.text ? ` text="${info.text}"` : ''}`)
    }
    MANUAL_NOTES.push({
      title: 'Tab order — first 30 Tab presses from page load (desktop)',
      summary: 'Sequence of focused elements as keyboard-only users would traverse.',
      details: path.join('\n'),
    })
  })

  test('skip link reachable on first Tab', async ({ page, context }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await seedDemoProfile(context)
    await page.goto(TARGET, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)
    await dismissTour(page)
    // Click the body once to ensure focus is on body
    await page.evaluate(() => { document.body.focus(); if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur() })
    await page.keyboard.press('Tab')
    const focusInfo = await page.evaluate(() => {
      const el = document.activeElement
      if (!el) return null
      return {
        tag: el.tagName.toLowerCase(),
        cls: (el.className && typeof el.className === 'string') ? el.className : null,
        href: el.getAttribute('href') || null,
        text: (el.textContent || '').trim().slice(0, 60),
      }
    })
    const isSkipLink = !!(focusInfo && focusInfo.cls && focusInfo.cls.includes('pcs-skip-link'))
    let activatedScroll = false
    if (isSkipLink) {
      await page.keyboard.press('Enter')
      await page.waitForTimeout(300)
      const main = await page.evaluate(() => {
        const m = document.getElementById('pcs-main-content')
        if (!m) return null
        const r = m.getBoundingClientRect()
        const focused = document.activeElement
        return { top: Math.round(r.top), focusedId: focused && focused.id, focusedTag: focused && focused.tagName.toLowerCase() }
      })
      activatedScroll = !!main
      MANUAL_NOTES.push({
        title: 'Skip link probe',
        summary: `First Tab focused .pcs-skip-link = ${isSkipLink}; Enter scrolled to #pcs-main-content (focused element id=${main && main.focusedId || ''}, tag=${main && main.focusedTag || ''}).`,
        details: JSON.stringify(focusInfo, null, 2),
      })
    } else {
      MANUAL_NOTES.push({
        title: 'Skip link probe',
        summary: 'FAIL: first Tab did not land on .pcs-skip-link.',
        details: JSON.stringify(focusInfo, null, 2),
      })
    }
  })

  test('focus trap probes — nav drawer, AI assistant, compliance modal', async ({ page, context }) => {
    // Drawer only renders on mobile; AI + compliance render everywhere.
    await page.setViewportSize({ width: 375, height: 812 })
    await seedDemoProfile(context)
    await page.goto(TARGET, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)
    await dismissTour(page)

    const probeTrap = async (label, openFn, closeFn) => {
      const opened = await openFn().catch((e) => ({ err: String(e) }))
      if (opened && opened.err) {
        MANUAL_NOTES.push({ title: `Focus trap: ${label}`, summary: `Could not open: ${opened.err}` })
        return
      }
      await page.waitForTimeout(400)
      // Tab 20 times and record whether focus stayed inside any element with role=dialog
      const trail = []
      let escaped = false
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press('Tab')
        const info = await page.evaluate(() => {
          const el = document.activeElement
          if (!el || el === document.body) return { outside: true, tag: 'body' }
          const dlg = el.closest('[role="dialog"]')
          return {
            outside: !dlg,
            tag: el.tagName.toLowerCase(),
            text: (el.innerText || el.value || el.getAttribute('aria-label') || '').trim().slice(0, 50),
          }
        })
        trail.push(`${i + 1}. <${info.tag}>${info.outside ? ' [OUTSIDE-DIALOG]' : ''}${info.text ? ` "${info.text}"` : ''}`)
        if (info.outside) escaped = true
      }
      MANUAL_NOTES.push({
        title: `Focus trap: ${label}`,
        summary: escaped ? 'FAIL: focus escaped the dialog at least once during 20 Tab presses.' : 'PASS: focus stayed inside the dialog for 20 Tab presses.',
        details: trail.join('\n'),
      })
      try { await closeFn() } catch {}
      await page.waitForTimeout(300)
    }

    // 1) Nav drawer (mobile only)
    await probeTrap('Nav drawer (mobile)', async () => {
      const burger = page.locator('button[aria-controls="pcs-nav-drawer"]').first()
      await burger.click({ timeout: 3000 })
    }, async () => {
      await page.keyboard.press('Escape')
    })

    // 2) AI assistant — via QuickActionsRow "Ask AI Assistant"
    // Switch to desktop where home shows quick actions clearly
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.waitForTimeout(400)
    await probeTrap('AI assistant modal', async () => {
      const btn = page.locator('button:has-text("Ask AI Assistant")').first()
      await btn.scrollIntoViewIfNeeded().catch(() => {})
      await btn.click({ timeout: 3000 })
    }, async () => {
      await page.keyboard.press('Escape')
    })

    // 3) Compliance modal — "Security & data"
    await probeTrap('Compliance modal', async () => {
      const btn = page.locator('button:has-text("Security & data")').first()
      await btn.scrollIntoViewIfNeeded().catch(() => {})
      await btn.click({ timeout: 3000 })
    }, async () => {
      await page.keyboard.press('Escape')
    })
  })

  test('ARIA tab/tabpanel + dialog pair validation', async ({ page, context }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await seedDemoProfile(context)
    await page.goto(TARGET, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)
    await dismissTour(page)

    // Visit each mission group then collect aria findings on a per-tab basis.
    const findings = []
    for (const tab of MISSION_GROUPS) {
      if (tab !== 'home') await gotoTab(page, tab)
      await page.waitForTimeout(700)
      const res = await page.evaluate(() => {
        const tabs = Array.from(document.querySelectorAll('[role="tab"]'))
        const tabIssues = []
        for (const t of tabs) {
          const controls = t.getAttribute('aria-controls')
          if (!controls) { tabIssues.push(`tab missing aria-controls: ${t.outerHTML.slice(0, 140)}`); continue }
          const panel = document.getElementById(controls)
          if (!panel) { tabIssues.push(`tab aria-controls="${controls}" → panel not found`); continue }
          if (panel.getAttribute('role') !== 'tabpanel') tabIssues.push(`element #${controls} referenced by tab is not role="tabpanel"`)
          const labelledby = panel.getAttribute('aria-labelledby')
          if (!labelledby) tabIssues.push(`tabpanel #${controls} missing aria-labelledby`)
        }
        const dialogs = Array.from(document.querySelectorAll('[role="dialog"]'))
        const dialogIssues = []
        for (const d of dialogs) {
          const issues = []
          if (d.getAttribute('aria-modal') !== 'true') issues.push('missing aria-modal="true"')
          if (!d.getAttribute('aria-label') && !d.getAttribute('aria-labelledby')) issues.push('missing aria-label/aria-labelledby')
          if (issues.length) dialogIssues.push(`${d.outerHTML.slice(0, 140)} :: ${issues.join('; ')}`)
        }
        // Tabs without a tablist ancestor
        const tabsNoList = tabs.filter(t => !t.closest('[role="tablist"]')).map(t => t.outerHTML.slice(0, 140))
        return { tabCount: tabs.length, tabIssues, dialogCount: dialogs.length, dialogIssues, tabsWithoutTablist: tabsNoList }
      })
      findings.push({ tab, ...res })
    }
    MANUAL_NOTES.push({
      title: 'ARIA tab + dialog pair validation',
      summary: 'Per-mission-group: counts and any role pair issues.',
      details: findings.map(f =>
        `[${f.tab}] tabs=${f.tabCount} dialogs=${f.dialogCount}\n  tabIssues(${f.tabIssues.length}): ${f.tabIssues.slice(0, 6).join(' | ') || 'none'}\n  tabsWithoutTablist(${f.tabsWithoutTablist.length}): ${f.tabsWithoutTablist.slice(0, 3).join(' | ') || 'none'}\n  dialogIssues(${f.dialogIssues.length}): ${f.dialogIssues.slice(0, 6).join(' | ') || 'none'}`
      ).join('\n\n'),
    })
  })

  test('forms — onboarding label coverage', async ({ page, context }) => {
    // Don't seed profile here — we want to see the onboarding flow.
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(TARGET, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1200)
    // Dismiss the landing splash if present
    const startBtn = page.locator('button:has-text("Start"), button:has-text("Begin"), button:has-text("Get Started"), button:has-text("Continue")').first()
    if (await startBtn.count()) await startBtn.click().catch(() => {})
    await page.waitForTimeout(800)

    const res = await page.evaluate(() => {
      const fields = Array.from(document.querySelectorAll('input, select, textarea'))
      const issues = []
      for (const f of fields) {
        if (f.type === 'hidden') continue
        const id = f.id
        const labelByFor = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null
        const wrappingLabel = f.closest('label')
        const aria = f.getAttribute('aria-label') || f.getAttribute('aria-labelledby')
        const placeholder = f.getAttribute('placeholder')
        if (!labelByFor && !wrappingLabel && !aria) {
          issues.push({
            tag: f.tagName.toLowerCase(),
            type: f.type,
            name: f.name || null,
            id: id || null,
            placeholder: placeholder || null,
            html: f.outerHTML.slice(0, 200),
          })
        }
      }
      return { totalFields: fields.length, unlabeled: issues }
    })
    MANUAL_NOTES.push({
      title: 'Form input labels — onboarding view',
      summary: `Total form fields scanned: ${res.totalFields}. Unlabeled: ${res.unlabeled.length}.`,
      details: res.unlabeled.slice(0, 25).map(u => `${u.tag}[${u.type}] name=${u.name} id=${u.id} placeholder="${u.placeholder}"\n   ${u.html}`).join('\n\n') || 'no unlabeled fields detected',
    })
  })

  test('low-contrast inline styles — heuristic scan', async ({ page, context }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await seedDemoProfile(context)
    await page.goto(TARGET, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)
    await dismissTour(page)
    // Walk each mission group and gather any inline style="..." that pairs
    // common low-contrast value strings (e.g. color #888 on #FFF, color rgba w/ alpha < 0.5)
    const findings = []
    for (const tab of MISSION_GROUPS) {
      if (tab !== 'home') await gotoTab(page, tab)
      await page.waitForTimeout(500)
      const hits = await page.evaluate(() => {
        const out = []
        const els = document.querySelectorAll('[style]')
        const sample = Array.from(els).slice(0, 4000)
        const lowAlphaRe = /color:\s*rgba?\([^)]*?,\s*0?\.[0-3]\d?\s*\)/i
        const grayOnLight = /color:\s*#(?:[89ab][0-9a-f]{2}|[89ab][0-9a-f]{5})/i // muted grays
        for (const el of sample) {
          const s = el.getAttribute('style') || ''
          if (lowAlphaRe.test(s) || grayOnLight.test(s)) {
            // Check if computed background is also light — heuristic only
            const cs = window.getComputedStyle(el)
            const bg = cs.backgroundColor || ''
            out.push({
              style: s.slice(0, 180),
              bg,
              tag: el.tagName.toLowerCase(),
              text: (el.innerText || '').trim().slice(0, 60),
            })
            if (out.length > 25) break
          }
        }
        return out
      })
      if (hits.length) findings.push({ tab, hits })
    }
    MANUAL_NOTES.push({
      title: 'Heuristic low-contrast inline styles (axe-core supersedes this)',
      summary: 'Flagging inline styles that hint at low-contrast color pairs. Treat as leads, not findings — defer to axe color-contrast rule above.',
      details: findings.map(f => `[${f.tab}]\n${f.hits.map(h => `  ${h.tag} text="${h.text}" style="${h.style}" bg=${h.bg}`).join('\n')}`).join('\n\n') || 'no inline low-contrast leads found',
    })
  })
})

// ---------------------------------------------------------------------------
//  Mobile sweep — critical surfaces only at 375x812
// ---------------------------------------------------------------------------

test.describe('a11y :: mobile 375x812', () => {
  for (const tab of ['home', 'pcs-operations', 'mission-resources']) {
    test(`mobile axe @ ${tab}`, async ({ page, context }) => {
      await page.setViewportSize({ width: 375, height: 812 })
      await seedDemoProfile(context)
      await page.goto(TARGET, { waitUntil: 'networkidle' })
      await page.waitForTimeout(1500)
      await dismissTour(page)
      if (tab !== 'home') {
        // Mobile uses the hamburger drawer
        const burger = page.locator('button[aria-controls="pcs-nav-drawer"]').first()
        if (await burger.count()) {
          await burger.click().catch(() => {})
          await page.waitForTimeout(300)
        }
        await gotoTab(page, tab)
      }
      await page.waitForTimeout(700)
      await runAxe(page, tab, 'mobile')
    })
  }
})

test.afterAll(() => { flushReport() })
