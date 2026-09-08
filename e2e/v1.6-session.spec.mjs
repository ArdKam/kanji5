import { test, expect } from '@playwright/test';

async function cleanStart(page){
  await page.goto('/');
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) if (key.startsWith('kanji5-')) localStorage.removeItem(key);
    sessionStorage.clear();
  });
  await page.reload();
  await expect(page.locator('#app')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('#v16Start')).toBeVisible();
  await expect(page.locator('#v16Start')).toHaveText('شروع جلسه');
  await expect(page.locator('#v16Session')).toBeHidden();
}

async function startSession(page){
  if(await page.locator('#v16Start').isVisible()) await page.locator('#v16Start').click();
  await expect(page.locator('#v16Start')).toBeHidden();
  await expect(page.locator('#v16FinishExternal')).toBeVisible();
  await expect(page.locator('#v16DashboardToggle')).toBeVisible();
  await expect(page.locator('#v16Session')).toBeHidden();
}

async function openDashboard(page){
  if(await page.locator('#v16Session').isHidden()) await page.locator('#v16DashboardToggle').click();
  await expect(page.locator('#v16Session')).toBeVisible();
}

test.describe('Kanji 5 v1.6 session dashboard', () => {
  test('counts an Active Recall dont-know attempt separately from FSRS ratings', async ({ page }) => {
    await cleanStart(page); await startSession(page); await openDashboard(page); const firstId=await page.locator('.kanji').getAttribute('data-kanji-id'); expect(firstId).toBeTruthy(); await page.locator('#revealBtn').click(); await expect(page.locator('#ratings')).toHaveClass(/show/); await page.locator('.rate[data-r="Again"]').click();
    await page.reload(); await startSession(page); await openDashboard(page); await page.locator('#revealBtn').click(); await expect(page.locator('#v15DontKnowRecall')).toBeVisible({timeout:10_000}); await page.locator('#v15DontKnowRecall').click(); await expect(page.locator('#v16Recall')).toHaveText('۱'); await expect(page.locator('#v16Unknown')).toHaveText('۱'); await expect(page.locator('#v16Reviews')).toHaveText('۱');
  });
});
