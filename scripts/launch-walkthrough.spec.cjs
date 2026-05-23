const { test, expect } = require('@playwright/test');

const BASE = process.env.PCS_URL || 'http://localhost:4173/';

const consoleErrors = [];
const pageErrors = [];

test.beforeEach(async ({ page }) => {
  consoleErrors.length = 0;
  pageErrors.length = 0;
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => pageErrors.push(err.message));
});

test.afterEach(async () => {
  if (pageErrors.length) console.log('PAGE ERRORS:', pageErrors);
  if (consoleErrors.length) console.log('CONSOLE ERRORS:', consoleErrors);
});

test('landing page renders without errors', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await expect(page).toHaveTitle(/PCS Express/i);
  const title = page.getByText(/Military Relocation Readiness/i).first();
  await expect(title).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test('start PCS plan flow opens onboarding', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const startBtn = page.getByRole('button', { name: /Start Your PCS Plan/i }).first();
  await startBtn.click();
  // After clicking, the app should show some form / wizard / tool surface
  await page.waitForTimeout(500);
  expect(pageErrors).toEqual([]);
});

test('tab strips do not wrap to multiple rows (narrow viewport)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  // Enter the app via Start
  await page.getByRole('button', { name: /Start Your PCS Plan/i }).first().click();
  await page.waitForTimeout(1500);
  // Try to find any TabBar/tablist; verify each renders in a single row
  const tablists = page.locator('[role="tablist"]');
  const count = await tablists.count();
  for (let i = 0; i < count; i++) {
    const tl = tablists.nth(i);
    if (!(await tl.isVisible())) continue;
    const box = await tl.boundingBox();
    if (!box) continue;
    // Find first child's bbox; if any child's top differs significantly, it wrapped
    const childTops = await tl.locator('> *').evaluateAll(els =>
      els.map(el => Math.round(el.getBoundingClientRect().top))
    );
    if (childTops.length > 1) {
      const min = Math.min(...childTops);
      const max = Math.max(...childTops);
      expect(max - min).toBeLessThan(8); // allow 8px subpixel slop
    }
  }
});

test('demo request form renders', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const reqDemo = page.getByRole('button', { name: /Request a Demo/i }).first();
  if (await reqDemo.count()) {
    await reqDemo.click();
    await page.waitForTimeout(500);
    expect(pageErrors).toEqual([]);
  }
});
