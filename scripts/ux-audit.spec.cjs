/**
 * UI/UX Desktop Consistency Audit — pcsexpress.app
 *
 * Loads live site with Marcus Thompson demo profile, visits each of 6 mission
 * groups, drills into every inner tab strip, screenshots, and measures the
 * main column for layout bugs. Repeats at 1440x900, 1366x768, and 375x812.
 *
 * Outputs:
 *   /tmp/audit-ui-<viewport>-<route>-<tab>.png  (screenshots)
 *   /tmp/audit-ux.json                          (raw findings)
 */
const { test } = require('@playwright/test')
const fs = require('fs')

const MISSION_GROUPS = [
  'home',
  'pcs-operations',
  'home-relocation',
  'family-readiness',
  'medical-readiness',
  'mission-resources',
]

const MISSION_LABELS = {
  'home': 'Command Center',
  'pcs-operations': 'PCS Operations',
  'home-relocation': 'Movement & Logistics',
  'family-readiness': 'Family Readiness',
  'medical-readiness': 'Holistic Health',
  'mission-resources': 'Mission Resources',
}

const VIEWPORTS = [
  { name: '1440x900',  w: 1440, h: 900,  expectMainW: 1210 },
  { name: '1366x768',  w: 1366, h: 768,  expectMainW: 1136 },
  { name: '375x812',   w: 375,  h: 812,  expectMainW: 375,  mobile: true },
]

function injectDemo(page) {
  return page.addInitScript(() => {
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
    try { localStorage.setItem('pcs_translation_banner_dismissed_v1', '1') } catch {}
  })
}

async function dismissOverlays(page) {
  // Skip demo tour if present
  for (const sel of ['button:has-text("Skip ✕")', 'button:has-text("Skip")', 'button[aria-label*="Dismiss"]']) {
    const loc = page.locator(sel).first()
    if (await loc.count().catch(() => 0)) {
      try { await loc.click({ timeout: 800 }) } catch {}
      await page.waitForTimeout(150)
    }
  }
}

/**
 * Find inner tab-strip buttons inside the main content area. We look for
 * `role="tab"` first, and fall back to common `.pcs-tab` class.
 */
async function getInnerTabs(page) {
  return page.evaluate(() => {
    const main = document.getElementById('pcs-main-content')
    if (!main) return []
    const tabs = []
    // Prefer ARIA role=tab
    const roleTabs = Array.from(main.querySelectorAll('[role="tab"]'))
    // Fallback to .pcs-tab class
    const classTabs = roleTabs.length ? [] : Array.from(main.querySelectorAll('.pcs-tab'))
    const candidates = roleTabs.length ? roleTabs : classTabs
    for (const el of candidates) {
      const r = el.getBoundingClientRect()
      if (r.width < 4 || r.height < 4) continue
      // Visible?
      const s = window.getComputedStyle(el)
      if (s.display === 'none' || s.visibility === 'hidden') continue
      tabs.push({
        id: el.id || '',
        text: (el.textContent || '').trim().slice(0, 40),
        x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
        ariaSelected: el.getAttribute('aria-selected') || '',
      })
    }
    return tabs
  })
}

/**
 * Measure main column + overflow + sticky + whitespace.
 */
async function measureLayout(page, expectMainW) {
  return page.evaluate((expectMainW) => {
    const main = document.getElementById('pcs-main-content')
    if (!main) return { error: 'no main' }
    const mainRect = main.getBoundingClientRect()
    const body = document.body
    const docEl = document.documentElement
    const bodyOverflowX = body.scrollWidth > body.clientWidth
    const docOverflowX = docEl.scrollWidth > docEl.clientWidth
    const mainOverflowX = main.scrollWidth > main.clientWidth + 1

    // Find any elements that protrude past main
    const overflowers = []
    main.querySelectorAll('*').forEach(el => {
      const r = el.getBoundingClientRect()
      const tag = el.tagName.toLowerCase()
      if (tag === 'script' || tag === 'style') return
      if (r.width === 0 || r.height === 0) return
      const overflowRight = r.right > mainRect.right + 1
      if (overflowRight) {
        overflowers.push({
          tag,
          id: el.id || '',
          cls: (el.className && typeof el.className === 'string') ? el.className.slice(0, 80) : '',
          text: (el.textContent || '').trim().slice(0, 60),
          right: Math.round(r.right),
          mainRight: Math.round(mainRect.right),
          over: Math.round(r.right - mainRect.right),
        })
      }
    })

    // Look for large vertical whitespace gaps in main: scan direct children
    const gaps = []
    const directKids = Array.from(main.children)
    let prevBottom = mainRect.top
    for (const child of directKids) {
      const r = child.getBoundingClientRect()
      if (r.height === 0) continue
      const gap = r.top - prevBottom
      if (gap > 200) {
        gaps.push({
          beforeTag: child.tagName.toLowerCase(),
          gap: Math.round(gap),
          atY: Math.round(r.top),
        })
      }
      prevBottom = r.bottom
    }

    // Sticky elements: check if any have top:0 and aren't sticking
    const stickies = []
    main.querySelectorAll('*').forEach(el => {
      const s = window.getComputedStyle(el)
      if (s.position === 'sticky') {
        const r = el.getBoundingClientRect()
        stickies.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || '',
          top: s.top,
          y: Math.round(r.y),
          h: Math.round(r.height),
        })
      }
    })

    // Tab strip wrap analysis: check if any tab strip is wider than container or
    // has children on multiple Y lines (wrapped)
    const tabStrips = []
    const groups = new Set()
    main.querySelectorAll('[role="tab"], .pcs-tab').forEach(el => {
      const parent = el.parentElement
      if (parent && !groups.has(parent)) groups.add(parent)
    })
    for (const group of groups) {
      const tabs = Array.from(group.querySelectorAll('[role="tab"], .pcs-tab'))
      if (tabs.length < 2) continue
      const ys = new Set(tabs.map(t => Math.round(t.getBoundingClientRect().y)))
      const gr = group.getBoundingClientRect()
      const tabsRight = Math.max(...tabs.map(t => t.getBoundingClientRect().right))
      tabStrips.push({
        count: tabs.length,
        rows: ys.size,
        groupW: Math.round(gr.width),
        tabsRight: Math.round(tabsRight),
        overflowsContainer: tabsRight > gr.right + 1,
      })
    }

    // Ellipsis truncation on critical labels (h1/h2/h3/h4 with overflow:hidden)
    const truncated = []
    main.querySelectorAll('h1,h2,h3,h4,button,[role="tab"]').forEach(el => {
      const s = window.getComputedStyle(el)
      if (s.textOverflow === 'ellipsis' && s.overflow.includes('hidden')) {
        if (el.scrollWidth > el.clientWidth + 1) {
          truncated.push({
            tag: el.tagName.toLowerCase(),
            text: (el.textContent || '').trim().slice(0, 50),
            scrollW: el.scrollWidth,
            clientW: el.clientWidth,
          })
        }
      }
    })

    // Modals: any role=dialog or fixed/full-cover elements
    const modals = []
    document.querySelectorAll('[role="dialog"], [aria-modal="true"]').forEach(el => {
      const r = el.getBoundingClientRect()
      modals.push({
        tag: el.tagName.toLowerCase(),
        x: Math.round(r.x), y: Math.round(r.y),
        w: Math.round(r.width), h: Math.round(r.height),
      })
    })

    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      main: { w: Math.round(mainRect.width), left: Math.round(mainRect.left), scrollW: main.scrollWidth, clientW: main.clientWidth },
      expectMainW,
      mainWidthOk: Math.round(mainRect.width) >= expectMainW - 20,
      bodyOverflowX, docOverflowX, mainOverflowX,
      overflowers: overflowers.slice(0, 10),
      gaps,
      stickies,
      tabStrips,
      truncated: truncated.slice(0, 10),
      modals,
    }
  }, expectMainW)
}

async function clickSidebarOrNav(page, groupId, isMobile) {
  if (isMobile) {
    // Open burger if not native iOS — on web mobile we use slide-down drawer
    const burger = page.locator('button[aria-label*="navigation menu"]').first()
    if (await burger.count()) {
      try { await burger.click({ timeout: 800 }) } catch {}
      await page.waitForTimeout(150)
    }
  }
  // Click the nav button that contains the mission label
  const label = MISSION_LABELS[groupId]
  // Match by visible text inside a button
  const btn = page.locator(`button:has-text("${label}")`).first()
  if (await btn.count()) {
    try {
      await btn.click({ timeout: 1200 })
      await page.waitForTimeout(450)
      return true
    } catch (e) {
      return false
    }
  }
  return false
}

for (const vp of VIEWPORTS) {
  test(`UX audit @ ${vp.name}`, async ({ page }) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width: vp.w, height: vp.h })
    await injectDemo(page)

    const findings = { viewport: vp, routes: [] }

    await page.goto('https://pcsexpress.app/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1500)
    await dismissOverlays(page)
    await page.waitForTimeout(400)

    for (const group of MISSION_GROUPS) {
      const clicked = await clickSidebarOrNav(page, group, !!vp.mobile)
      await page.waitForTimeout(500)
      await dismissOverlays(page)
      // Scroll to top so screenshots are consistent
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.waitForTimeout(150)

      const baseShot = `/tmp/audit-ui-${vp.name}-${group}.png`
      try { await page.screenshot({ path: baseShot, fullPage: false }) } catch {}

      const layout = await measureLayout(page, vp.expectMainW)
      const tabs = await getInnerTabs(page)

      const tabFindings = []
      // Visit up to first 12 tabs to avoid timeouts
      const tabsToVisit = tabs.slice(0, 12)
      for (let i = 0; i < tabsToVisit.length; i++) {
        const t = tabsToVisit[i]
        try {
          const safeText = (t.text || `tab${i}`).replace(/[^a-z0-9-]+/gi, '_').slice(0, 30)
          // Click by ID if available, else use nth role=tab
          if (t.id) {
            // Use attribute selector to avoid CSS.escape (Node lacks it)
            await page.locator(`[id="${t.id.replace(/"/g, '\\"')}"]`).click({ timeout: 1500 })
          } else {
            await page.locator('[role="tab"], .pcs-tab').nth(i).click({ timeout: 1500 })
          }
          await page.waitForTimeout(300)
          await page.evaluate(() => window.scrollTo(0, 0))
          const shot = `/tmp/audit-ui-${vp.name}-${group}-tab-${i}-${safeText}.png`
          try { await page.screenshot({ path: shot, fullPage: false }) } catch {}
          const tlayout = await measureLayout(page, vp.expectMainW)
          tabFindings.push({ index: i, label: t.text, screenshot: shot, layout: tlayout })
        } catch (e) {
          tabFindings.push({ index: i, label: t.text, error: String(e.message || e).slice(0, 200) })
        }
      }

      findings.routes.push({
        group,
        clicked,
        screenshot: baseShot,
        layout,
        tabsFound: tabs.length,
        tabFindings,
      })
    }

    const outPath = `/tmp/audit-ux-${vp.name}.json`
    fs.writeFileSync(outPath, JSON.stringify(findings, null, 2))
    console.log(`\n===WROTE ${outPath}===`)
    console.log(`Routes audited: ${findings.routes.length}`)
    for (const r of findings.routes) {
      console.log(`  ${r.group}: main=${r.layout?.main?.w}px ok=${r.layout?.mainWidthOk} tabs=${r.tabsFound} overflowers=${r.layout?.overflowers?.length || 0} gaps=${r.layout?.gaps?.length || 0}`)
    }
  })
}
