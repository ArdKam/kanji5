import { test, expect } from '@playwright/test';

test('v2 restores the v1.8 settings and statistics surface', async ({page}) => {
  await page.goto('/?legacy=1');
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) if (key.startsWith('kanji5-')) localStorage.removeItem(key);
    sessionStorage.clear();
  });
  await page.reload();
  await expect(page.locator('#app')).toBeVisible({timeout:20000});

  await page.goto('/');
  await expect(page.locator('#v2App')).toBeVisible({timeout:20000});
  await expect(page.locator('#v2Stats')).toBeVisible();
  await expect(page.locator('#v2Settings')).toBeVisible();
  await expect(page.locator('.v2-daily-summary')).toBeVisible();
  await expect(page.locator('.v2-daily-stat')).toHaveCount(4);

  await page.locator('#v2Settings').click();
  await expect(page.locator('#v2SettingsDialog')).toBeVisible();
  await expect(page.locator('#v2DailyNew')).toBeVisible();
  await expect(page.locator('#v2DailyGoal')).toBeVisible();
  await page.locator('.v2-dialog').locator('button').filter({hasText:'بستن'}).click();
  await expect(page.locator('#v2SettingsDialog')).toBeHidden();

  await page.locator('#v2Stats').click();
  await expect(page.locator('#v2StatsDialog')).toBeVisible();
  await expect(page.locator('#v2StatsDialog')).toContainText('کل مرورها');
  await page.locator('#v2StatsDialog').locator('button').filter({hasText:'بستن'}).click();
  await expect(page.locator('#v2StatsDialog')).toBeHidden();
  await page.locator('#v2Settings').click();
  await expect(page.locator('#v2SettingsDialog')).toBeVisible();
  await page.locator('#v2DailyNew').fill('7');
  await page.locator('#v2SettingsDialog button[type="submit"]').click();
  await expect(page.locator('#v2SettingsDialog')).toBeHidden();
  await page.locator('#v2Settings').click();
  await expect(page.locator('#v2DailyNew')).toHaveValue('7');
  await page.locator('#v2SettingsDialog').locator('button').filter({hasText:'بستن'}).click();

  await expect(page.locator('#v2LearningCard')).toBeVisible({timeout:10000});
  await expect(page.locator('#v2LearningReveal')).toBeVisible();
  await expect(page.locator('#v2AnswerInput')).toHaveCount(0);
});