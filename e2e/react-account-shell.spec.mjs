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


test('account signup preserves entered credentials and handles a successful signup response', async ({ page }) => {
  await page.route('https://vbrtzkejodkddfdbolbo.supabase.co/auth/v1/signup', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: '00000000-0000-4000-8000-000000000001',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'test-signup@example.com',
          confirmation_sent_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        },
        session: null
      })
    });
  });

  await page.goto('/');
  await page.locator('.account-button').click();
  await expect(page.locator('.account-dialog')).toBeVisible();
  await expect(page.locator('.account-dialog .account-auth-form')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('.account-dialog input[name="email"]')).toBeVisible();

  const form = page.locator('.account-dialog .account-auth-form');
  await form.locator('input[name="email"]').fill('test-signup@example.com');
  await form.locator('input[name="password"]').fill('StrongTestPassword123!');
  await page.locator('.account-text-action').click();

  await expect(form.locator('input[name="email"]')).toHaveValue('test-signup@example.com');
  await expect(form.locator('input[name="password"]')).toHaveValue('StrongTestPassword123!');
  await expect(form.locator('button[type="submit"]')).toHaveText(/ایجاد حساب|ساخت حساب|Create account/);

  await form.locator('button[type="submit"]').click();
  await expect(page.locator('.account-message')).toContainText(/حساب ساخته شد|Account created/);
});
