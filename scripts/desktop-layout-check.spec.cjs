const { test } = require('@playwright/test')

test('PCS Express dashboard width drill-down', async ({ page }) => {
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
  })

  await page.goto('https://pcsexpress.app/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)

  // Dismiss any modal/banner that might cover the layout
  const understand = page.locator('button:has-text("I understand")').first()
  if (await understand.count()) await understand.click().catch(() => {})
  await page.waitForTimeout(400)
  const skip = page.locator('button:has-text("Skip")').first()
  if (await skip.count()) await skip.click().catch(() => {})
  await page.waitForTimeout(400)

  await page.screenshot({ path: '/tmp/pcs-dashboard-clear.png', fullPage: false })

  const probe = await page.evaluate(() => {
    const main = document.getElementById('pcs-main-content')
    if (!main) return { error: 'no main' }
    const mainRect = main.getBoundingClientRect()
    const mainCs = window.getComputedStyle(main)
    const parent = main.parentElement
    const parentRect = parent?.getBoundingClientRect()
    const parentCs = parent ? window.getComputedStyle(parent) : null
    const siblings = parent ? Array.from(parent.children).map(c => {
      const r = c.getBoundingClientRect()
      const s = window.getComputedStyle(c)
      return {
        tag: c.tagName.toLowerCase(),
        id: c.id || '',
        cls: typeof c.className === 'string' ? c.className.slice(0, 40) : '',
        w: Math.round(r.width),
        h: Math.round(r.height),
        left: Math.round(r.left),
        position: s.position,
        display: s.display,
        flex: s.flex,
        flexShrink: s.flexShrink,
        width: s.width,
        maxWidth: s.maxWidth,
      }
    }) : []
    // Drill DOWN into main children too
    const mainChildren = Array.from(main.children).map(c => {
      const r = c.getBoundingClientRect()
      const s = window.getComputedStyle(c)
      return {
        tag: c.tagName.toLowerCase(),
        id: c.id || '',
        cls: typeof c.className === 'string' ? c.className.slice(0, 40) : '',
        w: Math.round(r.width),
        h: Math.round(r.height),
        position: s.position,
        flex: s.flex,
        width: s.width,
        maxWidth: s.maxWidth,
      }
    })
    return {
      main: {
        w: Math.round(mainRect.width),
        left: Math.round(mainRect.left),
        position: mainCs.position,
        flex: mainCs.flex,
        width: mainCs.width,
        maxWidth: mainCs.maxWidth,
        minWidth: mainCs.minWidth,
      },
      parent: parent ? {
        tag: parent.tagName.toLowerCase(),
        w: Math.round(parentRect.width),
        flexDir: parentCs.flexDirection,
        display: parentCs.display,
      } : null,
      siblings,
      mainChildren,
    }
  })

  console.log('===PROBE===')
  console.log(JSON.stringify(probe, null, 2))
})
