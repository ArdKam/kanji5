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

  test('active recall does not leak the target and can use don\'t know', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto('/');
    await expect(page.locator('#app')).toBeVisible({ timeout: 20_000 });

    const firstKanji = await page.locator('.kanji').textContent();
    const gate = page.locator('.v12-recall-gate');
    await expect(gate).toBeVisible({ timeout: 10_000 });

    const prompt = await gate.innerText();
    expect(prompt).not.toContain('معنی هدف:');
    expect(prompt).not.toContain('خوانش هدف:');
    await expect(page.locator('#v15DontKnowRecall')).toBeVisible();

    await expect(page.locator('#ratings')).not.toHaveClass(/show/);
    const reviewsBefore = await page.evaluate(() => {
      const raw = localStorage.getItem('kanji5-v1-reviews');
      return raw ? JSON.parse(raw) : [];
    });
    expect(reviewsBefore).toEqual([]);

    await page.locator('#v15DontKnowRecall').click();

    await expect(gate).toHaveCount(0);
    await expect(page.locator('#answerBox')).toHaveClass(/show/);
    await expect(page.locator('#ratings')).toHaveClass(/show/);

    const lastAttempt = await page.evaluate(() => {
      const raw = localStorage.getItem('kanji5-v1.2-last-attempt');
      return raw ? JSON.parse(raw) : null;
    });
    expect(lastAttempt).toMatchObject({
      character: firstKanji?.trim(),
      correct: false,
      unknown: true,
      hadAttempt: true,
    });

    const componentEvidence = await page.evaluate(() => {
      const raw = localStorage.getItem('kanji5-v1.5-components');
      return raw ? JSON.parse(raw) : {};
    });
    const entry = componentEvidence[firstKanji?.trim() || ''];
    expect(entry).toBeTruthy();
    const componentStats = Object.values(entry?.meaning || {}).concat(Object.values(entry?.reading || {}));
    expect(componentStats.some(stat => Number(stat?.attempts) >= 1 && Number(stat?.unknown) >= 1)).toBe(true);

    const reviewsAfterUnknown = await page.evaluate(() => {
      const raw = localStorage.getItem('kanji5-v1-reviews');
      return raw ? JSON.parse(raw) : [];
    });
    expect(reviewsAfterUnknown).toEqual([]);

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
