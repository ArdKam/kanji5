import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'allow' });

test('React presentation supports offline review writes, reload persistence, and reconnect', async ({ page, context }) => {
  const cacheHas = path => page.evaluate(async path => {
    const target = new URL(path, location.href).href;
    return Boolean(await caches.match(target));
  }, path);

  const reviewCount = () => page.evaluate(() => {
    const raw = localStorage.getItem('kanji5-v1-reviews');
    const reviews = raw ? JSON.parse(raw) : [];
    return Array.isArray(reviews) ? reviews.length : 0;
  });

  await page.addInitScript(() => {
    localStorage.setItem('kanji5-onboarding-v2', 'complete');
  });
  await page.goto('/?react=1');
  await expect(page.locator('#root .app-shell')).toBeVisible({ timeout: 20000 });
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(async () => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await expect.poll(() => cacheHas('./react-dist/kanji5-react.js')).toBe(true);
  await expect.poll(() => cacheHas('./react-dist/kanji5-react.css')).toBe(true);
  await expect.poll(() => cacheHas('./app-bootstrap.js')).toBe(true);

  const beforeOfflineReview = await reviewCount();
  await context.setOffline(true);

  // Exercise a real authoritative review mutation with network access disabled,
  // rather than only proving that the already-rendered shell can reload offline.
  const reveal = page.locator('#root .learning-card-front .button.primary.wide');
  await expect(reveal).toBeVisible({ timeout: 10000 });
  await reveal.click();
  await page.getByRole('button', { name: 'Good', exact: true }).click();
  await expect.poll(reviewCount, {
    timeout: 10000,
    message: 'OFFLINE_REVIEW_NOT_PERSISTED',
  }).toBeGreaterThan(beforeOfflineReview);
  const afterOfflineReview = await reviewCount();

  await page.reload();
  await expect(page.locator('#root .app-shell')).toBeVisible({ timeout: 20000 });
  await expect(page.locator('#root .daily-summary')).toBeVisible({ timeout: 10000 });
  await expect.poll(reviewCount, {
    timeout: 10000,
    message: 'OFFLINE_REVIEW_NOT_PRESERVED_AFTER_RELOAD',
  }).toBe(afterOfflineReview);

  await context.setOffline(false);
  await page.reload();
  await expect(page.locator('#root .app-shell')).toBeVisible({ timeout: 20000 });
  await expect.poll(reviewCount, {
    timeout: 10000,
    message: 'RECONNECT_CHANGED_LOCAL_REVIEW_COUNT',
  }).toBe(afterOfflineReview);
});
