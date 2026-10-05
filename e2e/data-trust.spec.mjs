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
  await page.locator('#header-tools-menu').getByRole('button', { name: 'Settings', exact: true }).click();
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
