const { test } = require('@playwright/test')

test('PCS Express launches without a blank root', async ({ page }) => {
  const logs = []
  page.on('console', msg => logs.push({ type: msg.type(), text: msg.text() }))
  page.on('pageerror', error => logs.push({ type: 'pageerror', text: error.message, stack: error.stack }))

  await page.goto(process.env.PCS_URL || 'http://127.0.0.1:4283/', { waitUntil: 'networkidle' })
  await page.screenshot({ path: process.env.PCS_SCREENSHOT || '/private/tmp/pcs-smoke.png', fullPage: false })

  const root = await page.locator('#root').evaluate(el => ({
    childCount: el.childElementCount,
    text: el.innerText.slice(0, 1000),
    html: el.innerHTML.slice(0, 1000),
  }))
  const body = await page.locator('body').evaluate(el => ({
    text: el.innerText.slice(0, 1000),
    htmlLength: el.innerHTML.length,
  }))

  console.log(JSON.stringify({ url: page.url(), title: await page.title(), root, body, logs }, null, 2))

  if (root.childCount < 1) {
    throw new Error('React root is empty after launch')
  }
})
