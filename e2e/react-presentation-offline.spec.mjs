import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'allow' });

test('React presentation is available offline from the real service-worker shell', async ({ page, context }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(String(error)));
  page.on('console', msg => { if (msg.type() === 'error') pageErrors.push('console:' + msg.text()); });
  const cacheHas = path => page.evaluate(async path => {
    const target = new URL(path, location.href).href;
    return Boolean(await caches.match(target));
  }, path);

  await page.goto('/?react=1');
  await expect(page.locator('#root .app-shell')).toBeVisible({ timeout: 20000 });
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(async () => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await expect.poll(() => cacheHas('./react-dist/kanji5-react.js')).toBe(true);
  await expect.poll(() => cacheHas('./react-dist/kanji5-react.css')).toBe(true);
  await expect.poll(() => cacheHas('./app-bootstrap.js')).toBe(true);

  await context.setOffline(true);
  await page.goto(page.url(), { waitUntil: 'domcontentloaded' });
  const booted = await page.locator('#root .app-shell').isVisible({ timeout: 5000 }).catch(() => false);
  if (!booted) {
    const diagnostics = await page.evaluate(() => ({
      href: location.href,
      controller: Boolean(navigator.serviceWorker.controller),
      root: document.querySelector('#root')?.innerHTML?.slice(0, 1000) || '',
      caches: performance.getEntriesByType('resource').map(r => r.name).filter(Boolean).slice(-30),
    }));
    throw new Error('OFFLINE_BOOT_FAILED ' + JSON.stringify({ diagnostics, pageErrors }));
  }
  await expect(page.locator('#root .daily-summary')).toBeVisible({ timeout: 10000 });
});
