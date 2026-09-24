import { test, expect } from '@playwright/test';

test('account control exposes email, magic-link, and Google entry points', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.account-button')).toBeVisible({ timeout: 15000 });
  await page.locator('.account-button').click();
  await expect(page.locator('.account-dialog')).toBeVisible();
  await expect(page.locator('.account-auth-tabs')).toBeVisible();
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
  await expect(page.getByRole('button', { name: /ورود با Google به‌زودی فعال می‌شود\.|Google sign-in will be enabled soon\./ })).toBeDisabled();
  await page.getByRole('tab', { name: /لینک ورود|Magic link/ }).click();
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /ارسال لینک ورود|Send magic link/ })).toBeVisible();
});
