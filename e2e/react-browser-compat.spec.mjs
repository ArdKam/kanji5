import { test, expect } from '@playwright/test';

test('browser-compat startup and core learning smoke', async ({ page }) => {
  test.setTimeout(60000);
  const diagnostics = [];
  page.on('pageerror', error => diagnostics.push('PAGE_ERROR: ' + String(error)));
  page.on('console', msg => { if (msg.type() === 'error') diagnostics.push('CONSOLE_ERROR: ' + msg.text()); });
  page.on('requestfailed', request => diagnostics.push('REQUEST_FAILED: ' + request.url() + ' :: ' + String(request.failure()?.errorText || 'unknown')));
  await page.addInitScript(() => {
    for (const key of Object.keys(localStorage)) if (key.startsWith('kanji5-')) localStorage.removeItem(key);
    sessionStorage.clear();
    localStorage.setItem("kanji5-onboarding-v2","complete");
  });
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  try {
    await expect(page.locator('#root .app-shell')).toBeVisible({ timeout: 30000 });
  } catch (error) {
    throw new Error('WebKit startup did not mount the React app. ' + diagnostics.slice(-24).join(' | ') + ' Original: ' + String(error));
  }
  await expect(page.locator('#root .learning-card-front .button.wide')).toBeVisible({ timeout: 15000 });
  await page.locator('#root .learning-card-front .button.wide').click();
  await expect(page.locator('#root .rating-grid')).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: /خوب|Good/, exact: true }).click();
  await expect(page.locator('#root .learning-card')).toBeVisible({ timeout: 15000 });
  expect(await page.evaluate(() => ({ lang: document.documentElement.lang, dir: document.documentElement.dir }))).toMatchObject({ lang: expect.any(String), dir: expect.any(String) });
});