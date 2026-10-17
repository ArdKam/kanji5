import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'allow' });

test('service-worker updates wait for open clients, then evict stale caches and remain usable offline', async ({ page, context }) => {
  await page.addInitScript(() => {
    localStorage.setItem('kanji5-onboarding-v2', 'complete');
    localStorage.setItem('kanji5-ui-language', 'en');
  });
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

  // Stage a replacement while the old release still has an open controlled client.
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.register('./sw.js?upgrade-probe=' + Date.now(), {
      updateViaCache: 'none',
    });
    await registration.update();
  });
  await expect.poll(async () => page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration?.waiting?.state || null;
  }), { timeout: 20000 }).toBe('installed');

  // The current page must remain on its own release until it closes. In particular,
  // it must not lose the stale cache while the old JS bundle may still request chunks.
  await expect.poll(async () => page.evaluate(() => caches.has('kanji5-shell-vstale-release-probe'))).toBe(true);
  await expect(page.locator('#root .app-shell')).toBeVisible();

  // Closing the last old client permits the waiting worker to activate. Reopen only
  // after closing the old page, then verify activation removed stale cache entries.
  await page.close();
  const updatedPage = await context.newPage();
  await updatedPage.goto('/');
  await expect(updatedPage.locator('#root .app-shell')).toBeVisible({ timeout: 20000 });
  await updatedPage.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(async () => updatedPage.evaluate(() => Boolean(navigator.serviceWorker.controller)), { timeout: 20000 }).toBe(true);
  await expect.poll(
    async () => updatedPage.evaluate(() => caches.has('kanji5-shell-vstale-release-probe')),
    { timeout: 15000 },
  ).toBe(false);

  await context.setOffline(true);
  await updatedPage.reload();
  await expect(updatedPage.locator('#root .app-shell')).toBeVisible({ timeout: 20000 });
  await expect(updatedPage.locator('#root .daily-summary')).toBeVisible({ timeout: 10000 });
});
