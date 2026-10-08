import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'allow' });

test('browser-compat startup and core learning smoke', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(String(error?.stack || error)));
  page.on('console', message => { if (message.type() === 'error') pageErrors.push('console:'+message.text()); });
  await page.addInitScript(() => {
    for (const key of Object.keys(localStorage)) if (key.startsWith('kanji5-')) localStorage.removeItem(key);
    sessionStorage.clear();
    localStorage.setItem("kanji5-onboarding-v2","complete");
  });
  await page.goto('/');
  try {
    await expect(page.locator('#root .app-shell')).toBeVisible({ timeout: 45000 });
  } catch (error) {
    const diagnostics = await page.evaluate(() => ({
      body: document.body.innerText.slice(0, 2500),
      rootHtml: document.querySelector('#root')?.innerHTML.slice(0, 5000) || '',
      bootstrapFlags: Object.fromEntries(Object.entries(window).filter(([k]) => k.startsWith('__KANJI5_') && /ERROR|FAIL|BOUNDARY|READY/.test(k)).map(([k,v]) => [k, String(v).slice(0,500)])),
    }));
    console.log('WEBKIT_STARTUP_DIAGNOSTICS', JSON.stringify({pageErrors, diagnostics}));
    throw error;
  }
  await expect(page.locator('#root .learning-card-front .button.wide')).toBeVisible({ timeout: 15000 });
  await page.locator('#root .learning-card-front .button.wide').click();
  await expect(page.locator('#root .rating-grid')).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: /خوب|Good/, exact: true }).click();
  await expect(page.locator('#root .learning-card')).toBeVisible({ timeout: 15000 });
  expect(await page.evaluate(() => ({ lang: document.documentElement.lang, dir: document.documentElement.dir }))).toMatchObject({ lang: expect.any(String), dir: expect.any(String) });
});