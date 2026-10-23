import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('kanji5-ui-language', 'en');
    localStorage.setItem('kanji5-onboarding-v2', 'complete');
  });
});

test('data trust: learner state survives tab close and reopen', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#root .app-shell')).toBeVisible({ timeout: 20000 });
  const state = await page.evaluate(() => {
    const api = window.__KANJI5_STATE__;
    const current = api.loadState();
    current.settings.dailyGoal = 61;
    current.reviews = [{ id: 'tab-test', eventId: 'tab-test-1', at: '2026-10-05T18:00:00.000Z', rating: 'Good' }];
    api.saveState(current);
    return {
      goal: JSON.parse(window.__KANJI5_STORAGE__.getItem('kanji5-v1')).settings.dailyGoal,
      reviews: JSON.parse(window.__KANJI5_STORAGE__.getItem('kanji5-v1-reviews')).length,
      summary: api.readReviewSummary().totalReviews
    };
  });
  expect(state).toEqual({ goal: 61, reviews: 1, summary: 1 });

  await page.close();
  const reopened = await page.context().newPage();
  try {
    await reopened.goto('/');
    await expect(reopened.locator('#root .app-shell')).toBeVisible({ timeout: 20000 });
    await expect.poll(() => reopened.evaluate(() => {
      const api = window.__KANJI5_STATE__;
      return {
        goal: JSON.parse(window.__KANJI5_STORAGE__.getItem('kanji5-v1')).settings.dailyGoal,
        reviews: JSON.parse(window.__KANJI5_STORAGE__.getItem('kanji5-v1-reviews')).length,
        summary: api.readReviewSummary().totalReviews
      };
    })).toEqual({ goal: 61, reviews: 1, summary: 1 });
  } finally {
    await reopened.close();
  }
});
test('data trust: backup round-trip restores state and rejects tampered backup without mutation', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#root .app-shell')).toBeVisible({ timeout: 20000 });

  await page.evaluate(() => {
    const api = window.__KANJI5_STATE__;
    const state = api.loadState();
    state.settings.dailyGoal = 73;
    state.reviews = [{
      id: 'backup-test',
      eventId: 'backup-test-1',
      deviceId: 'browser-test',
      at: '2026-10-05T18:00:00.000Z',
      rating: 'Good',
    }];
    state.reviewSummary = api.updateReviewSummary(state.reviews, state.reviewSummary);
    api.saveState(state);
  });

  await page.getByRole('button', { name: 'More', exact: true }).click();
  const menu = page.locator('#header-tools-menu');
  await expect(menu).toHaveAttribute('aria-modal', 'true');
  await menu.getByRole('button', { name: 'Settings', exact: true }).click();
  const settings = page.getByRole('dialog');
  await expect(settings).toBeVisible({ timeout: 10000 });
  await settings.getByText('Data & backup', { exact: true }).waitFor({ state: 'visible', timeout: 10000 });

  const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
  await settings.getByRole('button', { name: 'Export backup', exact: true }).click();
  const download = await downloadPromise;
  const backupPath = await download.path();
  if (!backupPath) throw new Error('DATA_TRUST_BACKUP_DOWNLOAD_PATH_UNAVAILABLE');

  const backup = JSON.parse(await readFile(backupPath, 'utf8'));
  expect(backup.version).toBe(2);
  expect(backup.format).toBe('kanji5-backup');

  await page.evaluate(() => {
    const api = window.__KANJI5_STATE__;
    const state = api.loadState();
    state.settings.dailyGoal = 91;
    api.saveState(state);
  });
  await expect.poll(() => page.evaluate(() => window.__KANJI5_STATE__.loadState().settings.dailyGoal)).toBe(91);

  const input = settings.locator('input[type="file"]');
  await input.setInputFiles({
    name: 'kanji5-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await expect(settings.getByRole('alert')).toBeVisible({ timeout: 10000 });
  await settings.getByRole('button', { name: 'Restore backup', exact: true }).click();

  await expect(page.locator('#root .app-shell')).toBeVisible({ timeout: 20000 });
  await expect.poll(() => page.evaluate(() => window.__KANJI5_STATE__.loadState().settings.dailyGoal)).toBe(73);
  await expect.poll(() => page.evaluate(() => window.__KANJI5_STATE__.readReviewSummary().totalReviews)).toBe(1);

  await page.getByRole('button', { name: 'More', exact: true }).click();
  await page.locator('#header-tools-menu').getByRole('button', { name: 'Settings', exact: true }).click();
  const settingsAfterRestore = page.getByRole('dialog');
  await settingsAfterRestore.getByText('Data & backup', { exact: true }).waitFor({ state: 'visible', timeout: 10000 });

  const tampered = structuredClone(backup);
  tampered.data.core.settings.dailyGoal = 999;
  await settingsAfterRestore.locator('input[type="file"]').setInputFiles({
    name: 'tampered.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(tampered)),
  });
  await expect(settingsAfterRestore.getByRole('alert')).toBeVisible({ timeout: 10000 });
  await settingsAfterRestore.getByRole('button', { name: 'Restore backup', exact: true }).click();
  await expect(settingsAfterRestore.locator('[role="status"]')).toContainText(/invalid or from an unsupported version|نامعتبر/iu);
  await expect.poll(() => page.evaluate(() => window.__KANJI5_STATE__.loadState().settings.dailyGoal)).toBe(73);
});


test('data trust: local-data erasure clears this browser only and preserves unrelated site data', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#root .app-shell')).toBeVisible({ timeout: 20000 });
  await page.waitForFunction(() => Boolean(window.__KANJI5_ACCOUNT__ && typeof window.__KANJI5_ACCOUNT__.getState === 'function'));

  let cloudRequests = 0;
  await page.route('https://vbrtzkejodkddfdbolbo.supabase.co/rest/v1/**', async route => {
    cloudRequests += 1;
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  await page.evaluate(async () => {
    if ('serviceWorker' in navigator) {
      await Promise.race([
        navigator.serviceWorker.ready,
        new Promise(resolve => window.setTimeout(resolve, 5000)),
      ]);
    }

    localStorage.setItem('kanji5-local-erasure-sentinel', 'must-be-removed');
    localStorage.setItem('kanji5-reading-lab-session-v1', JSON.stringify({
      text: '秘密の文章',
      annotations: { '秘密': 'private note' },
    }));
    localStorage.setItem('sb-vbrtzkejodkddfdbolbo-auth-token', JSON.stringify({
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      token_type: 'bearer',
      expires_in: 3600,
    }));
    localStorage.setItem('other-app-data', 'keep-local-data');

    sessionStorage.setItem('kanji5-session-erasure-sentinel', 'must-be-removed');
    sessionStorage.setItem('v19RecoveryState', 'must-be-removed');
    sessionStorage.setItem('other-app-session', 'keep-session-data');

    await caches.open('kanji5-api-test-erasure');
    await caches.open('kanji5-shell-test-erasure');
    await caches.open('other-app-cache');

    window.__KANJI5_ACCOUNT__.signOutLocal = async () => {
      sessionStorage.setItem('test-local-erasure-auth-signout', 'called');
    };
  });

  await page.getByRole('button', { name: 'More', exact: true }).click();
  const menu = page.locator('#header-tools-menu');
  await expect(menu).toHaveAttribute('aria-modal', 'true');
  await menu.getByRole('button', { name: 'Settings', exact: true }).click();

  const settings = page.getByRole('dialog');
  await expect(settings).toBeVisible({ timeout: 10000 });
  const erasure = settings.locator('.settings-local-data-erasure');
  await expect(erasure).toBeVisible();
  await erasure.getByRole('button', { name: 'Erase local data', exact: true }).click();

  const confirmation = erasure.getByRole('alertdialog');
  await expect(confirmation).toBeVisible();
  await expect(confirmation).toContainText('Your account and cloud copy remain unchanged');
  await confirmation.getByRole('textbox', { name: 'Confirmation phrase', exact: true }).fill('DELETE');
  const navigation = page.waitForNavigation({ waitUntil: 'domcontentloaded' });
  await confirmation.getByRole('button', { name: "Erase this browser's data", exact: true }).click();
  await navigation;
  await expect(page.locator('#root .app-shell')).toBeVisible({ timeout: 20000 });

  const remaining = await page.evaluate(async () => ({
    appSentinel: localStorage.getItem('kanji5-local-erasure-sentinel'),
    readingLab: localStorage.getItem('kanji5-reading-lab-session-v1'),
    authToken: localStorage.getItem('sb-vbrtzkejodkddfdbolbo-auth-token'),
    unrelatedLocal: localStorage.getItem('other-app-data'),
    appSessionSentinel: sessionStorage.getItem('kanji5-session-erasure-sentinel'),
    recoveryState: sessionStorage.getItem('v19RecoveryState'),
    unrelatedSession: sessionStorage.getItem('other-app-session'),
    authSignOutCalled: sessionStorage.getItem('test-local-erasure-auth-signout'),
    caches: await caches.keys(),
  }));

  expect(remaining.appSentinel).toBeNull();
  expect(remaining.readingLab).toBeNull();
  expect(remaining.authToken).toBeNull();
  expect(remaining.appSessionSentinel).toBeNull();
  expect(remaining.recoveryState).toBeNull();
  expect(remaining.unrelatedLocal).toBe('keep-local-data');
  expect(remaining.unrelatedSession).toBe('keep-session-data');
  expect(remaining.authSignOutCalled).toBe('called');
  expect(remaining.caches).not.toContain('kanji5-api-test-erasure');
  expect(remaining.caches).toContain('kanji5-shell-test-erasure');
  expect(remaining.caches).toContain('other-app-cache');
  expect(cloudRequests).toBe(0);
});


test('data trust: account deletion requires exact confirmation and leaves local learning data separate', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('kanji5-ui-language', 'en');
    localStorage.setItem('kanji5-onboarding-v2', 'complete');
    localStorage.setItem('kanji5-local-learning-sentinel', 'keep-local-until-separate-erasure');
    const state = {
      status: 'signed-in',
      user: { id: 'mock-account-user', email: 'learner@example.invalid', name: 'Test learner', avatarUrl: null },
      syncStatus: 'synced',
      error: null,
      recoveryPending: false,
      syncSummary: { activeCards: 4, reviews: 12, personalMnemonics: 1, lastSyncedAt: null },
    };
    const api = {
      getState: () => state,
      subscribe(listener) { listener(state); return () => {}; },
      signOut: async () => {},
      syncNow: async () => {},
      deleteAccount: async () => {
        sessionStorage.setItem('mock-account-deletion-called', 'true');
      },
    };
    Object.defineProperty(window, '__KANJI5_ACCOUNT__', {
      configurable: true,
      get: () => api,
      set: () => {},
    });
  });

  await page.goto('/');
  await expect(page.locator('#root .app-shell')).toBeVisible({ timeout: 20000 });
  await page.locator('.account-button').click();
  const dialog = page.locator('.account-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Local browser data and downloaded backups are separate and remain');

  await dialog.getByRole('button', { name: 'Delete account', exact: true }).click();
  const confirmation = dialog.locator('.account-delete-confirmation');
  await expect(confirmation).toContainText('Local browser data and downloaded backups are separate and remain');
  const phrase = confirmation.getByRole('textbox', { name: 'Confirmation phrase', exact: true });
  const confirm = confirmation.getByRole('button', { name: 'Confirm account deletion', exact: true });
  await expect(confirmation).toBeVisible();
  await expect(confirm).toBeDisabled();

  await phrase.fill('DELETE ');
  await expect(confirm).toBeDisabled();
  await phrase.fill('DELETE');
  await expect(confirm).toBeEnabled();
  await confirm.click();

  await expect(dialog).toHaveCount(0);
  const result = await page.evaluate(() => ({
    deletedCall: sessionStorage.getItem('mock-account-deletion-called'),
    localLearningData: localStorage.getItem('kanji5-local-learning-sentinel'),
  }));
  expect(result).toEqual({
    deletedCall: 'true',
    localLearningData: 'keep-local-until-separate-erasure',
  });
});

test('data trust: account deletion failure is not reported as success', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('kanji5-ui-language', 'en');
    localStorage.setItem('kanji5-onboarding-v2', 'complete');
    const state = {
      status: 'signed-in',
      user: { id: 'mock-account-user', email: 'learner@example.invalid', name: 'Test learner', avatarUrl: null },
      syncStatus: 'synced',
      error: null,
      recoveryPending: false,
      syncSummary: { activeCards: 0, reviews: 0, personalMnemonics: 0, lastSyncedAt: null },
    };
    const api = {
      getState: () => state,
      subscribe(listener) { listener(state); return () => {}; },
      signOut: async () => {},
      syncNow: async () => {},
      deleteAccount: async () => { throw new Error('AUTH_ACCOUNT_DELETE_FAILED'); },
    };
    Object.defineProperty(window, '__KANJI5_ACCOUNT__', {
      configurable: true,
      get: () => api,
      set: () => {},
    });
  });

  await page.goto('/');
  await expect(page.locator('#root .app-shell')).toBeVisible({ timeout: 20000 });
  await page.locator('.account-button').click();
  const dialog = page.locator('.account-dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Delete account', exact: true }).click();
  const confirmation = dialog.locator('.account-delete-confirmation');
  await confirmation.getByRole('textbox', { name: 'Confirmation phrase', exact: true }).fill('DELETE');
  await confirmation.getByRole('button', { name: 'Confirm account deletion', exact: true }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('status')).toContainText('Account deletion could not be confirmed');
});
