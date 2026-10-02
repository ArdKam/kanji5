import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'allow' });

test('current service worker evicts stale release caches and remains usable offline', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.locator('#root .app-shell')).toBeVisible({ timeout: 20000 });
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(async () => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  await page.evaluate(async () => {
    const stale = await caches.open('kanji5-shell-vstale-release-probe');
    await stale.put(
      new Request(new URL('./index.html', location.href)),
      new Response('<html><body>stale release</body></html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }),
    );
  });
  await expect.poll(async () => page.evaluate(() => caches.has('kanji5-shell-vstale-release-probe'))).toBe(true);

  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.register('./sw.js?upgrade-probe=' + Date.now(), {
      updateViaCache: 'none',
    });
    await registration.update();
    const worker = registration.installing || registration.waiting || registration.active;
    if (worker && worker.state !== 'activated') {
      await new Promise(resolve => {
        const onState = () => {
          if (worker.state === 'activated') {
            worker.removeEventListener('statechange', onState);
            resolve();
          }
        };
        worker.addEventListener('statechange', onState);
      });
    }
    await navigator.serviceWorker.ready;
  });

  await expect.poll(
    async () => page.evaluate(() => caches.has('kanji5-shell-vstale-release-probe')),
    { timeout: 10000 },
  ).toBe(false);

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#root .app-shell')).toBeVisible({ timeout: 20000 });
  await expect(page.locator('#root .daily-summary')).toBeVisible({ timeout: 10000 });
});
