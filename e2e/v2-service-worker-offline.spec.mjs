import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'allow' });

test('v2 boots through the real service worker and continues offline', async ({ page, context }) => {
  const cacheHas = path => page.evaluate(async path => Boolean(await caches.match(new URL(path, location.href).href)), path);
  await page.goto('/');
  await expect(page.locator('#v2App')).toBeVisible({ timeout: 20000 });
  await expect(page.locator('#v2LearningCard')).toBeVisible({ timeout: 10000 });
  await expect.poll(async () => page.evaluate(() => Boolean(window.__KANJI5_V16_SESSION_API__))).toBe(true);
  await expect.poll(async () => page.evaluate(async () => Boolean(await navigator.serviceWorker.getRegistration()))).toBe(true);

  await page.reload();
  await expect(page.locator('#v2App')).toBeVisible({ timeout: 20000 });
  await expect(page.locator('#v2LearningCard')).toBeVisible({ timeout: 10000 });
  await expect.poll(async () => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  const swState = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    const cacheState = [];
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      const urls = (await cache.keys()).map(request => request.url);
      cacheState.push({
        name,
        size: urls.length,
        hasComponents: urls.some(url => url.endsWith('/v2-components.js')),
        componentUrls: urls.filter(url => url.includes('v2-components.js'))
      });
    }
    return {
      controller: navigator.serviceWorker.controller?.scriptURL || null,
      active: registration?.active?.scriptURL || null,
      cacheState
    };
  });
  console.log('KANJI5_SW_STATE', JSON.stringify(swState));
  await expect.poll(() => cacheHas('./v2-components.js')).toBe(true);
  await expect.poll(() => cacheHas('./v2-presentation.js')).toBe(true);
  await expect.poll(() => cacheHas('./v1.9-v2-boundary.js')).toBe(true);

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#v2App')).toBeVisible({ timeout: 20000 });
  await expect(page.locator('#v2LearningCard')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#v2App')).not.toContainText('اجرای برنامه با مشکل مواجه شد');
});
