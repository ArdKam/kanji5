import { test, expect } from '@playwright/test';

test('browser-compat startup and core learning smoke', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'webkit') test.setTimeout(90000);
  const startupTimeout = testInfo.project.name === 'webkit' ? 60000 : 20000;
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
    await expect(page.locator('#root .app-shell')).toBeVisible({ timeout: startupTimeout });
  } catch (error) {
    const state = await page.evaluate(() => ({
      readyState: document.readyState,
      rootHtml: document.getElementById('root')?.innerHTML?.slice(0, 800) || '',
      startupShell: document.getElementById('kanji5-startup-shell')?.getAttribute('aria-hidden') || null,
      scripts: Array.from(document.scripts).map(script => script.src || 'inline').slice(-12),
      reactBundle: performance.getEntriesByType('resource').some(entry => String(entry.name).includes('react-dist/kanji5-react.js')),
      bootstrap: performance.getEntriesByType('resource').some(entry => String(entry.name).includes('app-bootstrap.js'))
    }));
    throw new Error('WebKit startup did not mount React. diagnostics=' + diagnostics.slice(-24).join(' | ') + ' state=' + JSON.stringify(state) + ' Original=' + String(error));
  }
  await expect(page.locator('#root .learning-card-front .button.wide')).toBeVisible({ timeout: 15000 });
  await page.locator('#root .learning-card-front .button.wide').click();
  await expect(page.locator('#root .rating-grid')).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: /خوب|Good/, exact: true }).click();
  await expect(page.locator('#root .learning-card')).toBeVisible({ timeout: 15000 });
  expect(await page.evaluate(() => ({ lang: document.documentElement.lang, dir: document.documentElement.dir }))).toMatchObject({ lang: expect.any(String), dir: expect.any(String) });
});