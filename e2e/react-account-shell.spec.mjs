import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.title === 'guest-first onboarding keeps account optional and leads directly into learning') return;
  await page.addInitScript(() => localStorage.setItem('kanji5-onboarding-v2', 'complete'));
});

test('account hub exposes a compact auth flow and RTL-safe fields', async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('kanji5-ui-language', 'fa'); localStorage.setItem('kanji5-onboarding-v2', 'complete'); });
  await page.goto('/');
  await expect(page.locator('.account-button:visible')).toHaveCount(1, { timeout: 15000 });
  await page.locator('.account-button:visible').click();
  await expect(page.locator('.account-dialog:visible')).toHaveCount(1);
  const accountDialog = page.locator('.account-dialog:visible');
  await expect(accountDialog).not.toHaveClass(/secondary-page-dialog/);
  expect(await accountDialog.evaluate((el) => getComputedStyle(el).position)).toBe('fixed');
  const accountDialogBounds = await accountDialog.boundingBox();
  const accountCloseBounds = await page.locator('.account-dialog-close:visible').boundingBox();
  if (!accountDialogBounds || !accountCloseBounds) throw new Error('Account dialog geometry unavailable');
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  const viewportHeight = await page.evaluate(() => window.innerHeight);
  expect(Math.abs((accountDialogBounds.x + accountDialogBounds.width / 2) - viewportWidth / 2)).toBeLessThanOrEqual(2);
  expect(Math.abs((accountDialogBounds.y + accountDialogBounds.height / 2) - viewportHeight / 2)).toBeLessThanOrEqual(2);
  expect(accountCloseBounds.x).toBeGreaterThanOrEqual(accountDialogBounds.x);
  expect(accountCloseBounds.x + accountCloseBounds.width).toBeLessThanOrEqual(accountDialogBounds.x + accountDialogBounds.width);
  expect(accountCloseBounds.y).toBeGreaterThanOrEqual(accountDialogBounds.y);
  expect(accountCloseBounds.y + accountCloseBounds.height).toBeLessThanOrEqual(accountDialogBounds.y + accountDialogBounds.height);
  await expect(page.locator('.account-auth-surface')).toBeVisible();
  await expect(page.locator('.account-auth-tabs')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Continue with Google|ادامه با Google/ })).toBeVisible();
  const magicLink = page.getByRole('button', { name: /ورود با لینک جادویی|Use a magic link/ });
  await expect(magicLink).toHaveCSS('min-height', '44px');
  await expect(magicLink).toHaveCSS('text-decoration-line', 'underline');
  const magicLinkBounds = await magicLink.boundingBox();
  expect(magicLinkBounds?.height).toBeGreaterThanOrEqual(44);

  const tabs = page.locator('.account-auth-intent [role="tab"]');
  await expect(tabs).toHaveCount(2);
  await expect(tabs.nth(0)).toHaveAttribute('tabindex', '0');
  await expect(tabs.nth(1)).toHaveAttribute('tabindex', '-1');
  await tabs.nth(0).focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await tabs.nth(0).click();

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

test('Google sign-in delegates to the account auth API', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('kanji5-ui-language', 'en');
    localStorage.setItem('kanji5-onboarding-v2', 'complete');
  });
  await page.route('**/account-fallback.js*', route => route.fulfill({ status: 200, contentType: 'text/javascript', body: '(()=>{})();' }));
  await page.route('**/supabase-sync.js', route => route.fulfill({
    status: 200,
    contentType: 'text/javascript',
    body: `
      (() => {
        const snapshot = {
          status: 'signed-out',
          user: null,
          syncStatus: 'idle',
          error: null,
          recoveryPending: false,
          syncSummary: { activeCards: 0, reviews: 0, personalMnemonics: 0, lastSyncedAt: null }
        };
        window.__KANJI5_ACCOUNT__ = {
          getState: () => ({ ...snapshot, syncSummary: { ...snapshot.syncSummary } }),
          subscribe: listener => { listener(window.__KANJI5_ACCOUNT__.getState()); return () => {}; },
          signInWithGoogle: async () => { window.__KANJI5_GOOGLE_SIGNIN_CALLED__ = true; }
        };
      })();
    `
  }));

  await page.goto('/');
  await page.locator('.account-button:visible').click();
  await expect(page.locator('.account-dialog:visible')).toBeVisible();
  const google = page.getByRole('button', { name: /Continue with Google|ادامه با Google/ });
  await expect(google).toBeVisible();
  await google.click();
  await expect.poll(() => page.evaluate(() => window.__KANJI5_GOOGLE_SIGNIN_CALLED__ === true)).toBe(true);
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

  await page.addInitScript(() => { localStorage.setItem('kanji5-ui-language', 'en'); localStorage.setItem('kanji5-onboarding-v2', 'complete'); });
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
  await expect(page.locator('.account-message')).toContainText(/حساب ساخته شد؛ برای ادامه ایمیلت را تأیید کن|Your account was created. Check your email to continue/);
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


test('signed-in account hub renders one identity surface, sync metrics, and separate security actions', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('kanji5-ui-language', 'en'));
  await page.route('**/account-fallback.js*', route => route.fulfill({ status: 200, contentType: 'text/javascript', body: '(()=>{})();' }));
  await page.route('**/supabase-sync.js', route => route.fulfill({
    status: 200,
    contentType: 'text/javascript',
    body: `
      (() => {
        let snapshot = {
          status: 'signed-in',
          user: { id: 'user-1', email: 'arden@example.com', name: 'Ardin', avatarUrl: null },
          syncStatus: 'synced',
          error: null,
          recoveryPending: false,
          syncSummary: { activeCards: 24, reviews: 120, personalMnemonics: 3, lastSyncedAt: new Date(Date.now() - 120000).toISOString() }
        };
        window.__KANJI5_ACCOUNT__ = {
          getState: () => ({ ...snapshot, user: { ...snapshot.user }, syncSummary: { ...snapshot.syncSummary } }),
          subscribe: listener => { listener(window.__KANJI5_ACCOUNT__.getState()); return () => {}; },
          signInWithGoogle: async () => {},
          signInWithPassword: async () => {},
          signUpWithPassword: async () => ({ needsEmailConfirmation: false }),
          updateProfile: async name => { snapshot = { ...snapshot, user: { ...snapshot.user, name } }; },
          updatePassword: async () => {},
          sendMagicLink: async () => {},
          sendPasswordReset: async () => {},
          setPassword: async () => {},
          signOut: async () => { snapshot = { ...snapshot, status: 'signed-out', user: null }; },
          syncNow: async () => {},
          getSyncSummary: () => ({ ...snapshot.syncSummary })
        };
      })();
    `
  }));

  await page.goto('/');
  await page.locator('.account-button:visible').click();
  await expect(page.locator('.account-dialog:visible')).toBeVisible();
  await expect(page.locator('.account-identity-card')).toHaveCount(1);
  await expect(page.locator('.account-identity-card')).toContainText('Ardin');
  await expect(page.locator('.account-identity-card')).toContainText('arden@example.com');
  await expect(page.locator('.account-section')).toHaveCount(4);
  await expect(page.locator('.account-section-tabs')).toHaveCount(0);
  await expect(page.locator('.account-sync-snapshot')).toContainText('24');
  await expect(page.locator('.account-sync-snapshot')).toContainText('120');
  await expect(page.locator('.account-sync-snapshot')).toContainText('3');
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sync now', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Change password', exact: true }).click();
  await expect(page.locator('input[name="currentPassword"]')).toBeVisible();
  await expect(page.locator('input[name="newPassword"]')).toBeVisible();
  await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
});

test('guest-first onboarding keeps account optional and leads directly into learning', async ({ page }) => {
  await page.addInitScript(() => {
    for (const key of Object.keys(localStorage)) if (key.startsWith('kanji5-')) localStorage.removeItem(key);
    sessionStorage.clear();
  });
  await page.goto('/');
  const onboarding = page.locator('[data-testid="onboarding-flow"]');
  await expect(onboarding).toBeVisible({ timeout: 20000 });
  await expect(page.locator('#root .app-shell')).toHaveCount(0);
  await onboarding.getByRole('button', { name: /شروع کنیم|Let's begin/ }).click();
  await onboarding.getByRole('button', { name: /ادامه|Continue/ }).click();
  await onboarding.getByRole('button', { name: /از ابتدا|Beginner|از ابتدا شروع/ }).click();
  await onboarding.getByRole('button', { name: /ادامه|Continue/ }).click();
  await onboarding.locator('.kanji5-onboarding-range-option').first().click();
  await onboarding.getByRole('button', { name: /ادامه|Continue/ }).click();
  await expect(onboarding.getByRole('button', { name: /Continue as a guest|ادامه به‌عنوان مهمان/ })).toBeVisible();
  await onboarding.getByRole('button', { name: /Continue as a guest|ادامه به‌عنوان مهمان/ }).click();
  await expect(onboarding).toHaveCount(0);
  await expect(page.locator('#root .learning-card')).toBeVisible({ timeout: 15000 });
});
test('logout leaves local learner state untouched', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('kanji5-ui-language', 'en');
    localStorage.setItem('kanji5-v1', JSON.stringify({
      settings: { dailyGoal: 37 },
      today: '2026-10-02',
      todayNew: 2,
      todayReviewCount: 3,
      goalCelebrated: false,
      streak: { current: 2, longest: 4, lastActiveDate: '2026-10-02' }
    }));
    localStorage.setItem('kanji5-v1-cards', JSON.stringify({ 'kanji:test': { card: { due: '2026-10-02T00:00:00.000Z' } } }));
  });
  await page.route('**/account-fallback.js*', route => route.fulfill({ status: 200, contentType: 'text/javascript', body: '(()=>{})();' }));
  await page.route('**/supabase-sync.js', route => route.fulfill({
    status: 200,
    contentType: 'text/javascript',
    body: `
      (() => {
        let snapshot = {
          status: 'signed-in',
          user: { id: 'user-logout-test', email: 'logout@example.com', name: 'Logout Test', avatarUrl: null },
          syncStatus: 'synced',
          error: null,
          recoveryPending: false,
          syncSummary: { activeCards: 1, reviews: 3, personalMnemonics: 0, lastSyncedAt: new Date().toISOString() }
        };
        window.__KANJI5_ACCOUNT__ = {
          getState: () => ({ ...snapshot, user: { ...snapshot.user }, syncSummary: { ...snapshot.syncSummary } }),
          subscribe: listener => { listener(window.__KANJI5_ACCOUNT__.getState()); return () => {}; },
          signInWithGoogle: async () => {},
          signInWithPassword: async () => {},
          signUpWithPassword: async () => ({ needsEmailConfirmation: false }),
          updateProfile: async () => {},
          updatePassword: async () => {},
          sendMagicLink: async () => {},
          sendPasswordReset: async () => {},
          setPassword: async () => {},
          signOut: async () => { snapshot = { ...snapshot, status: 'signed-out', user: null, syncStatus: 'idle' }; },
          syncNow: async () => {},
          getSyncSummary: () => ({ ...snapshot.syncSummary })
        };
      })();
    `
  }));
  await page.goto('/');
  await page.locator('.account-button:visible').click();
  await expect(page.locator('.account-dialog:visible')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await page.waitForTimeout(50);
  const state = await page.evaluate(() => ({
    main: localStorage.getItem('kanji5-v1'),
    cards: localStorage.getItem('kanji5-v1-cards')
  }));
  expect(JSON.parse(state.main || '{}').settings.dailyGoal).toBe(37);
  expect(Object.keys(JSON.parse(state.cards || '{}'))).toContain('kanji:test');
});


test('account copy makes sync benefit and guest path explicit', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('kanji5-ui-language', 'en'));
  await page.goto('/');
  await page.locator('.account-button:visible').click();
  const auth = page.locator('.account-auth-surface');
  await expect(auth).toBeVisible();
  await expect(auth).toContainText('sync your progress across devices');
  await expect(auth).toContainText('keep learning without an account on this device');
});

test('persisted learner state survives a fresh browser context', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('kanji5-ui-language', 'en');
    localStorage.setItem('kanji5-v1', JSON.stringify({
      settings: { dailyGoal: 41 },
      today: '2026-10-02',
      todayNew: 4,
      todayReviewCount: 5,
      goalCelebrated: false,
      streak: { current: 3, longest: 6, lastActiveDate: '2026-10-02' }
    }));
    localStorage.setItem('kanji5-v1-cards', JSON.stringify({
      'kanji:restart-test': { card: { due: '2026-10-02T00:00:00.000Z' } }
    }));
  });
  await page.goto('/');
  await expect(page.locator('#root .app-shell')).toBeVisible({ timeout: 20000 });
  const browser = page.context().browser();
  if (!browser) throw new Error('Browser instance unavailable for restart simulation');
  const storageState = await page.context().storageState();
  const freshContext = await browser.newContext({ storageState });
  try {
    const freshPage = await freshContext.newPage();
    await freshPage.goto('/');
    await expect(freshPage.locator('#root .app-shell')).toBeVisible({ timeout: 20000 });
    const state = await freshPage.evaluate(() => ({
      main: localStorage.getItem('kanji5-v1'),
      cards: localStorage.getItem('kanji5-v1-cards')
    }));
    expect(JSON.parse(state.main || '{}').settings.dailyGoal).toBe(41);
    expect(Object.keys(JSON.parse(state.cards || '{}'))).toContain('kanji:restart-test');
  } finally {
    await freshContext.close();
  }
});


test('guest state survives a later account sign-in', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('kanji5-ui-language', 'en');
    localStorage.setItem('kanji5-v1', JSON.stringify({
      settings: { dailyGoal: 29 },
      today: '2026-10-02',
      todayNew: 1,
      todayReviewCount: 2,
      goalCelebrated: false,
      streak: { current: 1, longest: 2, lastActiveDate: '2026-10-02' }
    }));
  });
  await page.route('**/account-fallback.js*', route => route.fulfill({ status: 200, contentType: 'text/javascript', body: '(()=>{})();' }));
  await page.route('**/supabase-sync.js', route => route.fulfill({
    status: 200,
    contentType: 'text/javascript',
    body: `
      (() => {
        let snapshot = {
          status: 'signed-out',
          user: null,
          syncStatus: 'idle',
          error: null,
          recoveryPending: false,
          syncSummary: { activeCards: 0, reviews: 0, personalMnemonics: 0, lastSyncedAt: null }
        };
        const listeners = new Set();
        const notify = () => listeners.forEach(listener => listener({ ...snapshot, user: snapshot.user && { ...snapshot.user }, syncSummary: { ...snapshot.syncSummary } }));
        window.__KANJI5_ACCOUNT__ = {
          getState: () => ({ ...snapshot, user: snapshot.user && { ...snapshot.user }, syncSummary: { ...snapshot.syncSummary } }),
          subscribe: listener => { listeners.add(listener); listener(window.__KANJI5_ACCOUNT__.getState()); return () => listeners.delete(listener); },
          signInWithGoogle: async () => {},
          signInWithPassword: async () => {
            snapshot = {
              ...snapshot,
              status: 'signed-in',
              user: { id: 'later-user', email: 'later@example.com', name: 'Later User', avatarUrl: null },
              syncStatus: 'synced',
              syncSummary: { activeCards: 0, reviews: 0, personalMnemonics: 0, lastSyncedAt: new Date().toISOString() }
            };
            notify();
          },
          signUpWithPassword: async () => ({ needsEmailConfirmation: false }),
          updateProfile: async () => {},
          updatePassword: async () => {},
          sendMagicLink: async () => {},
          sendPasswordReset: async () => {},
          setPassword: async () => {},
          signOut: async () => {
            snapshot = { ...snapshot, status: 'signed-out', user: null, syncStatus: 'idle' };
            notify();
          },
          syncNow: async () => {},
          getSyncSummary: () => ({ ...snapshot.syncSummary })
        };
      })();
    `
  }));
  await page.goto('/');
  await page.locator('.account-button:visible').click();
  const dialog = page.locator('.account-dialog:visible');
  await expect(dialog).toBeVisible();
  await dialog.locator('input[name="email"]').fill('later@example.com');
  await dialog.locator('input[name="password"]').fill('StrongTestPassword123!');
  await dialog.getByRole('button', { name: /Sign in with email|ورود با ایمیل/ }).click();
  await expect(page.locator('.account-dialog:visible')).toHaveCount(0);
  const accountButton = page.locator('.account-button:visible');
  await expect(accountButton).toContainText('Later User');
  await accountButton.click();
  await expect(page.locator('.account-dialog:visible .account-identity-card')).toContainText('later@example.com');
  const main = await page.evaluate(() => JSON.parse(localStorage.getItem('kanji5-v1') || '{}'));
  expect(main.settings.dailyGoal).toBe(29);
});
