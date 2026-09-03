import { test, expect } from '@playwright/test';

test.describe('Kanji 5 educational discovery', () => {
  test('a reviewed card is available for educational practice', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto('/');
    await expect(page.locator('#app')).toBeVisible({ timeout: 20_000 });

    const firstCard = page.locator('.kanji');
    await expect(firstCard).toBeVisible();
    const firstId = await firstCard.getAttribute('data-kanji-id');
    expect(firstId).toBeTruthy();

    // First exposure -> reveal -> rate so the card is persisted through the
    // production review state path used by the real app.
    await page.locator('#revealBtn').click();
    await expect(page.locator('#ratings')).toHaveClass(/show/);
    await page.locator('.rate[data-r="Good"]').click();

    const persisted = await page.evaluate(id => {
      const raw = localStorage.getItem('kanji5-v1-cards');
      const cards = raw ? JSON.parse(raw) : {};
      return Boolean(id && cards[id]);
    }, firstId);
    expect(persisted).toBe(true);

    const educationTab = page.locator('#v14EduTabs [data-tab="education"]');
    await expect(educationTab).toBeVisible({ timeout: 5_000 });
    await educationTab.click();

    const educationPane = page.locator('#v14EducationPane');
    await expect(educationPane).toBeVisible();
    await expect(educationPane.locator('.v14-edu-wrap')).toBeVisible({ timeout: 10_000 });
    await expect(educationPane).not.toContainText('فعلاً کانجی‌ای برای تمرین آموزشی نداری');
    await expect(educationPane).not.toContainText('ابتدا چند کانجی را در مرور ببین');

    expect(pageErrors, pageErrors.join('\n')).toEqual([]);
  });
});
