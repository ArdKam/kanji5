import { test, expect } from '@playwright/test';

async function cleanStart(page){
  await page.goto('/');
  await page.evaluate(() => { for (const key of Object.keys(localStorage)) if (key.startsWith('kanji5-')) localStorage.removeItem(key); });
  await page.reload();
  await expect(page.locator('#app')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('#v16DashboardToggle')).toHaveText('نمایش داشبورد جلسه');
}

async function createReviewedCard(page){
  const firstCard = page.locator('.kanji');
  await expect(firstCard).toBeVisible();
  const firstId = await firstCard.getAttribute('data-kanji-id');
  expect(firstId).toBeTruthy();
  await page.locator('#revealBtn').click();
  await expect(page.locator('#ratings')).toHaveClass(/show/);
  await page.locator('.rate[data-r="Good"]').click();
  await expect.poll(async () => page.evaluate(id => {
    const raw=localStorage.getItem('kanji5-v1-cards');
    const cards=raw?JSON.parse(raw):{};
    return Boolean(id&&cards[id]);
  }, firstId)).toBe(true);
}

test.describe('Kanji 5 v1.6 UX hardening', () => {
  test('keeps the dashboard collapsed by default and opens it on demand', async ({ page }) => {
    await cleanStart(page);
    await expect(page.locator('#v16Session')).toBeHidden();
    await expect(page.locator('#studyPanel')).toBeVisible();
    await expect(page.locator('#v16DashboardMini')).toContainText('جلسه:');
    await page.locator('#v16DashboardToggle').click();
    await expect(page.locator('#v16Session')).toBeVisible();
    await expect(page.locator('#v16DashboardToggle')).toHaveText('بستن داشبورد');
    await page.locator('#v16DashboardToggle').click();
    await expect(page.locator('#v16Session')).toBeHidden();
  });

  test('shows the whole session timer in Persian digits and freezes it after finishing', async ({ page }) => {
    await cleanStart(page);
    await page.locator('#v16DashboardToggle').click();
    await page.locator('#revealBtn').click();
    await page.waitForTimeout(1100);
    const beforeFinish = await page.locator('#v16Duration').textContent();
    expect(beforeFinish).toMatch(/^[۰-۹]+:[۰-۹]{2}$/);
    await page.locator('#v16Finish').click();
    const frozen = await page.locator('#v16Duration').textContent();
    expect(frozen).toBe(beforeFinish);
    await page.waitForTimeout(1600);
    await expect(page.locator('#v16Duration')).toHaveText(frozen);
  });

  test('uses a non-zooming 16px text input on mobile-sized viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await cleanStart(page);
    await createReviewedCard(page);
    const educationTab = page.locator('.v14-tab[data-tab="education"]');
    await expect(educationTab).toBeVisible({ timeout: 5_000 });
    await educationTab.click();
    const input = page.locator('#v14EduInput');
    await expect(input).toBeVisible({ timeout: 10_000 });
    await expect(input).toHaveCSS('font-size', '16px');
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
  });
});
