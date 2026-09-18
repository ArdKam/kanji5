import { test, expect } from '@playwright/test';

test('v2 completes a finite session after the final correct task', async ({ page }) => {
  await page.goto('/?legacy=1');
  await expect(page.locator('#app')).toBeVisible({ timeout: 20000 });

  await page.locator('#revealBtn').click();
  await expect(page.locator('#ratings')).toHaveClass(/show/);
  const target = (await page.locator('.kanji').first().textContent())?.trim();
  expect(target).toBeTruthy();
  await page.locator('.rate[data-r="Good"]').click();

  await page.evaluate(() => {
    const at = new Date().toISOString();
    const history = JSON.parse(localStorage.getItem('kanji5-v1.6-session-history') || '[]');
    history.push({
      status:'active',
      schemaVersion:2,
      sessionId:'v2-finite-session',
      startedAt:at,
      reviews:0,
      recallAttempts:0,
      unknownAttempts:0,
      ratings:{Again:0,Hard:0,Good:0,Easy:0},
      plan:{version:2,target:1,modes:[{mode:'production',label:'تولید',plannedCount:1,share:1,score:1}],priority:['production']},
      remainingModes:{meaning:0,reading:0,production:1,vocabulary:0,context:0},
      planRevision:0
    });
    localStorage.setItem('kanji5-v1.6-session-history',JSON.stringify(history));
  });

  await page.goto('/');
  await expect(page.locator('#v2App')).toBeVisible({ timeout: 20000 });
  await expect(page.locator('#v2StartPractice')).toBeVisible();

  await page.locator('#v2StartPractice').click();
  await expect(page.locator('.v2-mode-badge')).toHaveText('تولید');
  const choice = page.locator('.v2-production-choice').filter({hasText:target});
  await expect(choice).toHaveCount(1);
  await choice.click();

  await expect(page.locator('#v2App')).toContainText('درست', { timeout: 10000 });
  await expect.poll(async () => page.evaluate(() => {
    const rows = JSON.parse(localStorage.getItem('kanji5-v1.6-session-history') || '[]');
    return rows.some(row => row?.sessionId === 'v2-finite-session' && !row?.status);
  })).toBe(true);
  await expect.poll(async () => page.evaluate(() => {
    const rows = JSON.parse(localStorage.getItem('kanji5-v1.6-session-history') || '[]');
    return !rows.some(row => row?.sessionId === 'v2-finite-session' && row?.status === 'active');
  })).toBe(true);
});
