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

  test('rating advances the queue and persists a review', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto('/');
    await expect(page.locator('#app')).toBeVisible({ timeout: 20_000 });

    const firstKanji = await page.locator('.kanji').textContent();
    await page.locator('#revealBtn').click();
    await expect(page.locator('#ratings')).toHaveClass(/show/);
    await page.locator('.rate[data-r="Good"]').click();

    await expect(page.locator('.kanji')).not.toHaveText(firstKanji || '', { timeout: 5_000 });
    const persistedReviews = await page.evaluate(() => {
      const raw = localStorage.getItem('kanji5-v1-reviews');
      return raw ? JSON.parse(raw) : [];
    });
    expect(persistedReviews.length).toBeGreaterThan(0);
    expect(persistedReviews.at(-1).rating).toBe('Good');
    expect(persistedReviews.at(-1).eventSchemaVersion).toBeGreaterThanOrEqual(1);

    expect(pageErrors, pageErrors.join('\n')).toEqual([]);
  });
});
