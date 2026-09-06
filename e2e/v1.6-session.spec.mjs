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

test.describe('Kanji 5 v1.6 session dashboard', () => {
  test('shows live session metrics and updates after a rating', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await cleanStart(page);
    await expect(page.locator('#v16Session')).toBeVisible();
    await expect(page.locator('#v16Due')).toBeVisible();
    await expect(page.locator('#v16New')).toBeVisible();
    await expect(page.locator('#v16Mastered')).toBeVisible();
    await expect(page.locator('#v16Streak')).toBeVisible();
    await expect(page.locator('#v16GoalText')).toContainText('هدف روزانه');
    await expect(page.locator('#v16Reviews')).toHaveText('۰');
    await expect(page.locator('#v16Recall')).toHaveText('۰');
    await expect(page.locator('#v16Unknown')).toHaveText('۰');
    await expect(page.locator('#v16Modes .v16-mode')).toHaveCount(5);

    await page.locator('#revealBtn').click();
    await expect(page.locator('#ratings')).toHaveClass(/show/);
    await page.locator('.rate[data-r="Good"]').click();
    await expect(page.locator('#v16Reviews')).toHaveText('۱');
    await expect(page.locator('#v16SessionText')).toContainText('۱ مرور');
    expect(pageErrors, pageErrors.join('\n')).toEqual([]);
  });

  test('counts an Active Recall dont-know attempt separately from FSRS ratings', async ({ page }) => {
    await cleanStart(page);
    const firstId = await page.locator('.kanji').getAttribute('data-kanji-id');
    expect(firstId).toBeTruthy();
    await page.locator('#revealBtn').click();
    await expect(page.locator('#ratings')).toHaveClass(/show/);
    await page.locator('.rate[data-r="Again"]').click();
    await page.evaluate(id => {
      const raw = localStorage.getItem('kanji5-v1-cards');
      const cards = raw ? JSON.parse(raw) : {};
      if (!id || !cards[id]?.card) throw new Error('persisted card missing');
      cards[id].card.due = new Date(Date.now() - 1000).toISOString();
      localStorage.setItem('kanji5-v1-cards', JSON.stringify(cards));
    }, firstId);
    await page.reload();
    await page.locator('#revealBtn').click();
    await expect(page.locator('#v15DontKnowRecall')).toBeVisible({ timeout: 10_000 });
    await page.locator('#v15DontKnowRecall').click();
    await expect(page.locator('#v16Recall')).toHaveText('۱');
    await expect(page.locator('#v16Unknown')).toHaveText('۱');
    await expect(page.locator('#v16Reviews')).toHaveText('۰');
  });

  test('finishes a session, persists the summary, and restores recent history after reload', async ({ page }) => {
    await cleanStart(page);
    await page.locator('#revealBtn').click();
    await page.locator('.rate[data-r="Good"]').click();
    await expect(page.locator('#v16Reviews')).toHaveText('۱');
    await page.locator('#v16Finish').click();
    await expect(page.locator('#v16CurrentSummary')).toContainText('خلاصهٔ آخرین جلسه');
    await expect(page.locator('#v16CurrentSummary')).toContainText('۱ مرور FSRS');
    await expect(page.locator('#v16Finish')).toBeDisabled();
    await expect(page.locator('#v16History .v16-history-item')).toHaveCount(1);
    await page.reload();
    await expect(page.locator('#v16CurrentSummary')).toContainText('خلاصهٔ آخرین جلسه');
    await expect(page.locator('#v16History .v16-history-item')).toHaveCount(1);
  });

  test('routes education toward the weakest skill in the adaptive session plan', async ({ page }) => {
    await cleanStart(page);
    await page.locator('#revealBtn').click();
    await page.locator('.rate[data-r="Good"]').click();
    await page.evaluate(() => {
      const knowledge = {
        '一': {
          meaning: { attempts: 20, correct: 19 },
          reading: { attempts: 20, correct: 2 },
          production: { attempts: 20, correct: 18 },
          vocabulary: { attempts: 20, correct: 19 },
          context: { attempts: 20, correct: 18 }
        }
      };
      localStorage.setItem('kanji5-v1.2-knowledge', JSON.stringify(knowledge));
    });
    await page.reload();
    await expect(page.locator('#v16Plan')).toContainText('خوانش');
    await page.locator('.v14-tab[data-tab="education"]').click();
    await expect(page.locator('#v14EducationPane')).toBeVisible();
    await expect(page.locator('.v14-edu-meta')).toContainText('reading', { timeout: 10_000 });
  });
});
