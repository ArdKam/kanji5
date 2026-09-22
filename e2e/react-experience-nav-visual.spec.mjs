import { test, expect } from '@playwright/test';

test('Learning and Active Recall use a persistent Lovable-style bottom switcher', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#root .app-shell')).toBeVisible({ timeout: 20000 });

  const nav = page.locator('.experience-nav');
  const tabs = nav.locator('.experience-tab');
  await expect(nav).toBeVisible();
  await expect(tabs).toHaveCount(2);

  const geometry = await nav.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    return {
      position: style.position,
      bottom: parseFloat(style.bottom),
      top: rect.top,
      height: rect.height,
      left: rect.left,
      right: window.innerWidth - rect.right,
      width: rect.width,
    };
  });
  expect(geometry.position).toBe('fixed');
  expect(geometry.bottom).toBeGreaterThanOrEqual(8);
  expect(geometry.top).toBeGreaterThan(geometry.viewportHeight / 2);
  expect(geometry.height).toBeLessThan(120);
  expect(geometry.left).toBeGreaterThanOrEqual(8);
  expect(geometry.right).toBeGreaterThanOrEqual(8);

  await expect(tabs.nth(0)).toHaveAttribute('aria-current', 'page');
  await tabs.nth(1).click();
  await expect(tabs.nth(1)).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('#exercise')).toBeVisible({ timeout: 10000 });

  await tabs.nth(0).click();
  await expect(tabs.nth(0)).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.card').first()).toBeVisible();
});
