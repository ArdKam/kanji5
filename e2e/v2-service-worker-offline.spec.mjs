import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'allow' });

test('v2 boots through the real service worker and continues offline', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.locator('#v2App')).toBeVisible({ timeout: 20000 });
  await expect(page.locator('#v2LearningCard')).toBeVisible({ timeout: 10000 });
  await expect.poll(async () => page.evaluate(() => Boolean(window.__KANJI5_V16_SESSION_API__))).toBe(true);
  await expect.poll(async () => page.evaluate(async () => Boolean(await navigator.serviceWorker.getRegistration()))).toBe(true);

  await page.reload();
  await expect(page.locator('#v2App')).toBeVisible({ timeout: 20000 });
  await expect(page.locator('#v2LearningCard')).toBeVisible({ timeout: 10000 });
  await expect.poll(async () => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#v2App')).toBeVisible({ timeout: 20000 });
  await expect(page.locator('#v2LearningCard')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#v2App')).not.toContainText('اجرای برنامه با مشکل مواجه شد');
});
