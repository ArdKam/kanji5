import { test, expect } from '@playwright/test';

async function cleanStart(page){
  await page.goto('/');
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('kanji5-')) localStorage.removeItem(key);
    }
  });
  await page.reload();
  await expect(page.locator('#app')).toBeVisible({ timeout: 20_000 });
}

test.describe('v1.5 roadmap browser verification', () => {
  test('new-card queue starts at the lowest JLPT level', async ({ page }) => {
    await cleanStart(page);
    const expected = await page.evaluate(async () => {
      const payload = await fetch('/kanji-data.json', { cache: 'no-store' }).then(r => r.json());
      const items = Array.isArray(payload) ? payload : payload.kanji;
      const rank = { N5: 0, N4: 1, N3: 2, N2: 3, N1: 4 };
      return items
        .filter(item => item?.jlpt)
        .slice()
        .sort((a, b) => rank[a.jlpt] - rank[b.jlpt] || Number(a.frequency ?? Infinity) - Number(b.frequency ?? Infinity) || String(a.character).localeCompare(String(b.character)))[0]?.character;
    });
    const actual = (await page.locator('.kanji').textContent())?.trim();
    expect(actual).toBe(expected);
  });

  test('upcoming reviews appear without a page reload', async ({ page }) => {
    await cleanStart(page);
    const firstKanji = (await page.locator('.kanji').textContent())?.trim();
    expect(firstKanji).toBeTruthy();
    await page.locator('#revealBtn').click();
    await expect(page.locator('#ratings')).toHaveClass(/show/);
    await page.locator('.rate[data-r="Good"]').click();

    await expect(page.locator('.kanji')).not.toHaveText(firstKanji || '', { timeout: 5_000 });
    await expect(page.locator('#upcomingReviews')).toBeVisible({ timeout: 5_000 });
    // The v1.5 roadmap intentionally refreshes this panel every 15 seconds.
    await expect(page.locator('#upcomingReviewsBody')).toContainText(firstKanji || '', { timeout: 20_000 });
  });
});
