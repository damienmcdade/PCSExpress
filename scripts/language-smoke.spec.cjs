/*
 * Intrusive locale smoke: walks every SUPPORTED_LANGUAGES entry through
 * the boot path with a minimal pre-seeded profile so onboarding/landing
 * are skipped, then asserts:
 *   - the dashboard tree mounts (#root has children)
 *   - document.documentElement.lang reflects the locale
 *   - dir flips to rtl for Arabic, ltr otherwise
 *   - no console pageerror events fired during boot
 *
 * Run against the running dev server (port 3000) with:
 *   npx playwright test scripts/language-smoke.spec.cjs --browser=chromium --reporter=line
 */

const { test, expect } = require('@playwright/test')

const LOCALES = [
  { code: 'en', name: 'English',     curated: true,  dir: 'ltr' },
  { code: 'es', name: 'Spanish',     curated: true,  dir: 'ltr' },
  { code: 'de', name: 'German',      curated: true,  dir: 'ltr' },
  { code: 'fr', name: 'French',      curated: true,  dir: 'ltr' },
  { code: 'ko', name: 'Korean',      curated: true,  dir: 'ltr' },
  { code: 'ja', name: 'Japanese',    curated: true,  dir: 'ltr' },
  { code: 'tl', name: 'Tagalog',     curated: true,  dir: 'ltr' },
  { code: 'ar', name: 'Arabic',      curated: true,  dir: 'rtl' },
  { code: 'zh', name: 'Chinese',     curated: true,  dir: 'ltr' },
  { code: 'it', name: 'Italian',     curated: true,  dir: 'ltr' },
  { code: 'pt', name: 'Portuguese',  curated: true,  dir: 'ltr' },
  { code: 'vi', name: 'Vietnamese',  curated: true,  dir: 'ltr' },
  { code: 'sw', name: 'Swahili',     curated: false, dir: 'ltr' },
  { code: 'ha', name: 'Hausa',       curated: false, dir: 'ltr' },
  { code: 'yo', name: 'Yoruba',      curated: false, dir: 'ltr' },
  { code: 'am', name: 'Amharic',     curated: false, dir: 'ltr' },
  { code: 'zu', name: 'Zulu',        curated: false, dir: 'ltr' },
  { code: 'ig', name: 'Igbo',        curated: false, dir: 'ltr' },
  { code: 'so', name: 'Somali',      curated: false, dir: 'ltr' },
  { code: 'af', name: 'Afrikaans',   curated: false, dir: 'ltr' },
]

const SEED_PROFILE = {
  branch: 'Army',
  component: 'Active Duty',
  paygrade: 'E-5',
  firstName: 'Smoke',
  lastName: 'Tester',
  losingInstallation: 'Fort Bliss',
  gainingInstallation: 'Fort Liberty',
  language: 'en',
  isOverseas: false,
  hasDependents: false,
  ordersType: '',
}

const BASE_URL = process.env.PCS_URL || 'http://localhost:3000'

for (const locale of LOCALES) {
  test(`locale ${locale.code} (${locale.name}) — boots, lang/dir correct, no page errors`, async ({ page }) => {
    const errors = []
    page.on('pageerror', err => errors.push(err.message))

    // Visit once so localStorage is bound to the origin, seed, reload.
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
    await page.evaluate(([profile, lang]) => {
      const p = { ...profile, language: lang }
      localStorage.setItem('pcs_profile_v1', JSON.stringify(p))
      localStorage.setItem('pcs_profile', JSON.stringify(p))
      localStorage.setItem('pcs_user_language', lang)
      localStorage.setItem('pcs_landing_dismissed', '1')
      localStorage.setItem('pcs_crisis_chip_collapsed', '1')
    }, [SEED_PROFILE, locale.code])
    await page.reload({ waitUntil: 'networkidle' })

    // Give MutationObserver-based translation runtime a moment to settle
    // (only relevant for curated non-English locales).
    if (locale.code !== 'en') {
      await page.waitForTimeout(500)
    }

    const html = await page.locator('html').evaluate(el => ({
      lang: el.lang,
      dir: el.dir,
    }))
    const root = await page.locator('#root').evaluate(el => ({
      childCount: el.childElementCount,
      textLen: (el.innerText || '').length,
    }))

    expect(root.childCount, `#root must mount children for ${locale.code}`).toBeGreaterThan(0)
    expect(root.textLen, `#root must render visible text for ${locale.code}`).toBeGreaterThan(20)
    expect(html.lang, `<html lang> must match for ${locale.code}`).toBe(locale.code)
    // The IDL `dir` property returns '' when the default LTR mode is
    // implicit, even after explicitly assigning 'ltr'. For RTL we
    // require an explicit 'rtl'; for LTR, both '' and 'ltr' are OK.
    if (locale.dir === 'rtl') {
      expect(html.dir, `<html dir> must be rtl for ${locale.code}`).toBe('rtl')
    } else {
      expect(['', 'ltr']).toContain(html.dir)
    }
    expect(errors, `no pageerror events for ${locale.code}; got: ${errors.join(' | ')}`).toEqual([])
  })
}
