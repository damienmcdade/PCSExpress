const { test } = require('@playwright/test')

const VIEWPORTS = [
  { name: 'macbook-1440', w: 1440, h: 900 },
  { name: 'common-laptop-1366', w: 1366, h: 768 },
  { name: 'compact-1024', w: 1024, h: 768 },
]

for (const vp of VIEWPORTS) {
  test(`PCS Express dashboard at ${vp.name} (${vp.w}x${vp.h})`, async ({ page }) => {
    await page.setViewportSize({ width: vp.w, height: vp.h })

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

    await page.goto('https://pcsexpress.app/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    // Dismiss demo tour if it pops up
    const skip = page.locator('button:has-text("Skip ✕")').first()
    if (await skip.count()) await skip.click().catch(() => {})
    await page.waitForTimeout(400)

    await page.screenshot({ path: `/tmp/pcs-verify-${vp.name}.png`, fullPage: false })

    const result = await page.evaluate((expectedW) => {
      const main = document.getElementById('pcs-main-content')
      if (!main) return { error: 'no main' }
      const mainRect = main.getBoundingClientRect()
      const parent = main.parentElement
      const aside = parent?.querySelector('aside')
      const asideRect = aside?.getBoundingClientRect()
      const sibsWithWidth = parent ? Array.from(parent.children).filter(c => {
        const s = window.getComputedStyle(c)
        return s.position !== 'fixed' && s.position !== 'absolute' && c.tagName.toLowerCase() !== 'aside' && c.id !== 'pcs-main-content'
      }).map(c => {
        const r = c.getBoundingClientRect()
        const s = window.getComputedStyle(c)
        return { tag: c.tagName.toLowerCase(), w: Math.round(r.width), pos: s.position }
      }) : []
      return {
        viewport: { w: window.innerWidth, h: window.innerHeight },
        main: { w: Math.round(mainRect.width), left: Math.round(mainRect.left) },
        aside: asideRect ? { w: Math.round(asideRect.width) } : null,
        otherInFlowSiblings: sibsWithWidth,
        ok: Math.round(mainRect.width) >= expectedW - 20,
      }
    }, vp.w - 250)

    console.log(`===${vp.name}===`)
    console.log(JSON.stringify(result, null, 2))
  })
}
