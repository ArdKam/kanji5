import { test, expect } from '@playwright/test';

async function cleanStart(page){
  await page.goto('/');
  await page.evaluate(() => { for (const key of Object.keys(localStorage)) if (key.startsWith('kanji5-')) localStorage.removeItem(key); });
  await page.reload();
  await expect(page.locator('#app')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('#v16Start')).toBeVisible();
  await expect(page.locator('#v16Start')).toHaveText('شروع جلسه');
}

test.describe('Kanji 5 v1.6 UX hardening', () => {
  test('shows only the start control before a session begins, then reveals session controls outside the dashboard', async ({ page }) => {
    await cleanStart(page);
    await expect(page.locator('#v16FinishExternal')).toBeHidden();
    await expect(page.locator('#v16DashboardToggle')).toBeHidden();
    await expect(page.locator('#v16DashboardMini')).toBeHidden();
    await expect(page.locator('#v16Session')).toBeHidden();

    await page.locator('#v16Start').click();

    await expect(page.locator('#v16Start')).toBeHidden();
    await expect(page.locator('#v16FinishExternal')).toBeVisible();
    await expect(page.locator('#v16DashboardToggle')).toBeVisible();
    await expect(page.locator('#v16DashboardMini')).toBeVisible();
    await expect(page.locator('#v16Session')).toBeHidden();
    await expect(page.locator('#v16FinishExternal').evaluate(el => el.parentElement.id)).resolves.toBe('v16DashboardToolbar');
    await expect(page.locator('#v16DashboardToggle').evaluate(el => el.parentElement.id)).resolves.toBe('v16DashboardToolbar');

    await page.locator('#v16DashboardToggle').click();
    await expect(page.locator('#v16Session')).toBeVisible();
    await page.locator('#v16DashboardToggle').click();
    await expect(page.locator('#v16Session')).toBeHidden();
  });

  test('shows the whole session timer in Persian digits and freezes it after finishing', async ({ page }) => {
    await cleanStart(page);
    await page.locator('#v16Start').click();
    await page.locator('#revealBtn').click();
    await page.waitForTimeout(1100);
    const beforeFinish = await page.locator('#v16Duration').textContent();
    expect(beforeFinish).toMatch(/^[۰-۹]+:[۰-۹]{2}$/);
    await page.locator('#v16FinishExternal').click();
    const frozen = await page.locator('#v16Duration').textContent();
    expect(frozen).toBe(beforeFinish);
    await expect(page.locator('#v16FinishExternal')).toBeHidden();
    await page.waitForTimeout(1600);
    await expect(page.locator('#v16Duration')).toHaveText(frozen);
  });

  test('uses a non-zooming 16px text input on mobile-sized viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await cleanStart(page);
    const fontSize = await page.evaluate(() => {
      const input=document.createElement('input');
      input.type='text';
      input.id='__v16MobileInputProbe';
      document.body.appendChild(input);
      const size=getComputedStyle(input).fontSize;
      input.remove();
      return size;
    });
    expect(fontSize).toBe('16px');
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
    expect(viewport).toContain('initial-scale=1');
  });
});
