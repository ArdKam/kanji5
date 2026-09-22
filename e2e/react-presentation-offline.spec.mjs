import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'allow' });

test('React presentation is available offline from the real service-worker shell', async ({ page, context }) => {
  await page.reload();
  await expect(page.locator('#root .daily-summary')).toBeVisible({ timeout: 10000 });
});
