import { test, expect } from '@playwright/test';

test('account hub exposes a compact auth flow and RTL-safe fields', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('kanji5-ui-language', 'fa'));
  await page.goto('/');
  await expect(page.locator('.account-button:visible')).toBeVisible({ timeout: 15000 });
  await page.locator('.account-button:visible').click();
  await expect(page.locator('.account-dialog:visible')).toBeVisible();
  await expect(page.locator('.account-auth-surface')).toBeVisible();
  await expect(page.locator('.account-auth-tabs')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Google sign-in will be enabled soon|ورود با Google/ })).toHaveCount(0);

  const tabs = page.locator('.account-auth-intent [role="tab"]');
  await expect(tabs).toHaveCount(2);
  await expect(tabs.nth(0)).toHaveAttribute('tabindex', '0');
  await expect(tabs.nth(1)).toHaveAttribute('tabindex', '-1');
  await tabs.nth(0).focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');

  const email = page.locator('input[name="email"]');
  const password = page.locator('input[name="password"]');
  await expect(email).toHaveAttribute('dir', 'ltr');
  await expect(password).toHaveAttribute('dir', 'ltr');
  await expect(page.getByRole('button', { name: /نمایش رمز عبور|Show password/ })).toBeVisible();
  await expect(page.locator('.account-footer')).toContainText('محلی‌اول');
  await expect(page.locator('.account-footer')).not.toContainText('Local-first');

  await page.getByRole('button', { name: /رمز عبور را فراموش کرده‌ای|Forgot password/ }).click();
  await expect(page.getByRole('heading', { name: /رمز عبور را فراموش کرده‌ای|Forgot password/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /بازگشت به ورود|Back to sign in/ })).toBeVisible();

  await page.getByRole('button', { name: /بازگشت به ورود|Back to sign in/ }).click();
  await page.getByRole('button', { name: /ورود با لینک جادویی|Use a magic link/ }).click();
  await expect(page.locator('input[name="magic-email"]')).toHaveAttribute('dir', 'ltr');
  await expect(page.getByRole('button', { name: /بازگشت به ورود|Back to sign in/ })).toBeVisible();
});

test('account signup preserves entered credentials after switching auth intent', async ({ page }) => {
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
  await page.locator('.account-button:visible').click();
  await expect(page.locator('.account-dialog:visible')).toBeVisible();
  const form = page.locator('.account-dialog .account-auth-form');
  await form.locator('input[name="email"]').fill('test-signup@example.com');
  await form.locator('input[name="password"]').fill('StrongTestPassword123!');
  await page.getByRole('tab', { name: /ایجاد حساب|Create account/ }).click();

  await expect(form.locator('input[name="email"]')).toHaveValue('test-signup@example.com');
  await expect(form.locator('input[name="password"]')).toHaveValue('StrongTestPassword123!');
  await expect(form.locator('button[type="submit"]')).toHaveText(/ایجاد حساب|Create account/);

  await form.locator('button[type="submit"]').click();
  await expect(page.locator('.account-message')).toContainText(/حساب ساخته شد|Account created/);
});

test('forgot password sends a recovery request and keeps the user in the recovery state', async ({ page }) => {
  await page.route('https://vbrtzkejodkddfdbolbo.supabase.co/auth/v1/recover', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({})
    });
  });

  await page.goto('/');
  await page.locator('.account-button:visible').click();
  await page.getByRole('button', { name: /رمز عبور را فراموش کرده‌ای|Forgot password/ }).click();
  await page.locator('input[name="email"]').fill('reset@example.com');
  await page.getByRole('button', { name: /ارسال لینک بازنشانی|Send reset link/ }).click();

  await expect(page.locator('.account-message')).toContainText(/لینک بازنشانی رمز به ایمیلت ارسال شد|A password reset link was sent to your email/);
  await expect(page.locator('.account-auth-surface')).toBeVisible();
});
