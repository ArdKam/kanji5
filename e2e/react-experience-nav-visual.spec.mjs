import { test, expect } from '@playwright/test';

test('Learning, Active Recall and Dictionary use a persistent Lovable-style bottom switcher', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('kanji5-onboarding-v2','complete'));
  await page.goto('/');
  await expect(page.locator('#root .app-shell')).toBeVisible({ timeout: 20000 });

  const nav = page.locator('.experience-nav');
  const tabs = nav.locator('.experience-tab');
  await expect(nav).toBeVisible();
  await expect(tabs).toHaveCount(3);

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
      viewportHeight: window.innerHeight,
    };
  });
  expect(geometry.position).toBe('fixed');
  expect(geometry.bottom).toBeGreaterThanOrEqual(8);
  expect(geometry.top).toBeGreaterThan(geometry.viewportHeight / 2);
  expect(geometry.height).toBeLessThan(120);
  expect(geometry.left).toBeGreaterThanOrEqual(8);
  expect(geometry.right).toBeGreaterThanOrEqual(8);

  // Verify the same persistent switcher remains usable at both desktop and mobile breakpoints.
  for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    const mobileGeometry = await nav.evaluate((node) => {
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
        viewportHeight: window.innerHeight,
      };
    });
    expect(mobileGeometry.position).toBe('fixed');
    expect(mobileGeometry.bottom).toBeGreaterThanOrEqual(8);
    expect(mobileGeometry.top).toBeGreaterThan(mobileGeometry.viewportHeight / 2);
    expect(mobileGeometry.height).toBeLessThan(120);
    expect(mobileGeometry.left).toBeGreaterThanOrEqual(8);
    expect(mobileGeometry.right).toBeGreaterThanOrEqual(8);
    await expect(tabs.nth(0)).toBeVisible();
    await expect(tabs.nth(1)).toBeVisible();
    await expect(tabs.nth(2)).toBeVisible();
  }

  await expect(tabs.nth(0)).toHaveAttribute('aria-current', 'page');
  await tabs.nth(1).click();
  await expect(tabs.nth(1)).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('#root .practice-home')).toBeVisible({ timeout: 10000 });

  await tabs.nth(0).click();
  await expect(tabs.nth(0)).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.card').first()).toBeVisible();

  await tabs.nth(2).click();
  await expect(tabs.nth(2)).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.dictionary-page')).toBeVisible({timeout:10000});
  await expect(page.locator('.dictionary-page-search input')).toBeVisible();
  await expect(page.locator('.kanji-catalog-tile')).toHaveCount(2136,{timeout:10000});
});


test('Dictionary Kanji card supports adjacent navigation without closing', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('kanji5-onboarding-v2','complete'));
  await page.goto('/');
  await expect(page.locator('#root .app-shell')).toBeVisible({ timeout: 20000 });
  await page.locator('.experience-tab').nth(2).click();
  await expect(page.locator('.dictionary-page')).toBeVisible({ timeout: 10000 });

  const firstTile = page.locator('.kanji-catalog-tile').first();
  const firstCharacter = (await firstTile.locator('.kanji-catalog-character').textContent())?.trim();
  expect(firstCharacter).toBeTruthy();
  await firstTile.click();
  const dialog = page.locator('.dictionary-card-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.dictionary-card-header-character')).toHaveText(firstCharacter);

  const card = dialog.locator('.dictionary-card');
  await card.dispatchEvent('pointerdown', { pointerType: 'touch', clientX: 120, clientY: 300, bubbles: true });
  await card.dispatchEvent('pointerup', { pointerType: 'touch', clientX: 190, clientY: 300, bubbles: true });
  await expect(dialog.locator('.dictionary-card-header-character')).not.toHaveText(firstCharacter);
  await expect(dialog).toBeVisible();

  await card.dispatchEvent('pointerdown', { pointerType: 'touch', clientX: 190, clientY: 300, bubbles: true });
  await card.dispatchEvent('pointerup', { pointerType: 'touch', clientX: 120, clientY: 300, bubbles: true });
  await expect(dialog.locator('.dictionary-card-header-character')).toHaveText(firstCharacter);

  await page.keyboard.press('ArrowRight');
  await expect(dialog.locator('.dictionary-card-header-character')).not.toHaveText(firstCharacter);
  await page.keyboard.press('ArrowLeft');
  await expect(dialog.locator('.dictionary-card-header-character')).toHaveText(firstCharacter);
});
