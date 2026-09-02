import { test, expect } from '@playwright/test';

test.describe('Kanji 5 browser smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('loads the real app into the study screen', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto('/');

    await expect(page).toHaveTitle(/Kanji 5/);
    await expect(page.locator('#app')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('#studyPanel')).toBeVisible();

    expect(pageErrors, pageErrors.join('\n')).toEqual([]);
  });
});
