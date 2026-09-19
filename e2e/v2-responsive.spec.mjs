import { test, expect } from '@playwright/test';

for (const viewport of [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
]) {
  test('v2 layout remains usable without horizontal overflow on ' + viewport.name, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/');
    await expect(page.locator('#v2App')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('#v2LearningCard, #v2ReviewCard, #v2Exercise')).toHaveCount(1, { timeout: 10000 });
    await expect.poll(async () => page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      width: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth
    }))).toMatchObject({ overflow: false });

    if (viewport.name === 'mobile') {
      await expect(page.locator('#v2StartPractice')).toBeVisible();
      await expect(page.locator('#v2Stats')).toBeVisible();
      await expect(page.locator('#v2Settings')).toBeVisible();
    } else {
      await expect(page.locator('.v2-header-meta')).toBeVisible();
      await expect(page.locator('.v2-daily-summary')).toBeVisible();
    }
  });
}
