import { chromium, expect } from '@playwright/test';

const baseUrl = String(process.env.KANJI5_LIVE_URL || 'https://ardkam.github.io/kanji5').replace(/\/$/, '');

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ serviceWorkers: 'allow' });
  try {
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error?.stack || String(error)));
    await page.addInitScript(() => {
      localStorage.setItem('kanji5-ui-language', 'en');
      const initialized = sessionStorage.getItem('kanji5-live-smoke-initialized') === '1';
      if (!initialized) {
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith('kanji5-') && key !== 'kanji5-ui-language') localStorage.removeItem(key);
        }
        sessionStorage.setItem('kanji5-live-smoke-initialized', '1');
      }
      // Core-product live smoke is intentionally independent from first-run onboarding;
      // onboarding has its own dedicated release gate. Keep the marker across reloads
      // so the persistence assertion can exercise the actual saved learner state.
      localStorage.setItem('kanji5-onboarding-v2', 'complete');
    });
    await page.goto(baseUrl + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    const onboarding = page.locator('[data-testid="onboarding-flow"]');
    const appShell = page.locator('#root .app-shell');
    await Promise.race([
      onboarding.waitFor({ state: 'visible', timeout: 30000 }),
      appShell.waitFor({ state: 'visible', timeout: 30000 }),
    ]);
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    if (!(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)))) {
      throw new Error('LIVE_OFFLINE_GATE_NO_SERVICE_WORKER_CONTROLLER');
    }

    if (await onboarding.isVisible().catch(() => false)) {
      await onboarding.getByRole('button', { name: "Let's begin", exact: true }).click();
      await onboarding.getByRole('button', { name: 'Continue', exact: true }).click();
      await onboarding.getByRole('button', { name: /Start from the beginning/ }).click();
      await onboarding.getByRole('button', { name: 'Continue', exact: true }).click();
      await onboarding.getByRole('button', { name: 'Continue', exact: true }).click();
      await onboarding.getByRole('button', { name: 'Continue as a guest', exact: true }).click();
      await onboarding.waitFor({ state: 'hidden', timeout: 15000 });
    }
    await appShell.waitFor({ state: 'visible', timeout: 30000 });
    await page.locator('#root .learning-card').waitFor({ state: 'visible', timeout: 15000 });

    const reveal = page.locator('#root .learning-card-front .button.primary.wide');
    await reveal.waitFor({ state: 'visible', timeout: 10000 });
    await reveal.click();
    await page.getByRole('button', { name: 'Good', exact: true }).click();
    await expect.poll(async () => page.evaluate(() => {
      const raw = localStorage.getItem('kanji5-v1-reviews');
      const reviews = raw ? JSON.parse(raw) : [];
      return Array.isArray(reviews) ? reviews.length : 0;
    }), {
      timeout: 10000,
      message: 'LIVE_SMOKE_REVIEW_NOT_PERSISTED_BEFORE_RELOAD',
    }).toBeGreaterThan(0);
    const reviewCountBeforeReload = await page.evaluate(() => {
      const raw = localStorage.getItem('kanji5-v1-reviews');
      const reviews = raw ? JSON.parse(raw) : [];
      return Array.isArray(reviews) ? reviews.length : 0;
    });
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('#root .app-shell').waitFor({ state: 'visible', timeout: 30000 });
    await page.locator('#root .learning-card').waitFor({ state: 'visible', timeout: 15000 });
    const reviewCountAfterReload = await page.evaluate(() => {
      const raw = localStorage.getItem('kanji5-v1-reviews');
      const reviews = raw ? JSON.parse(raw) : [];
      return Array.isArray(reviews) ? reviews.length : 0;
    });
    if (reviewCountAfterReload < reviewCountBeforeReload) throw new Error('LIVE_SMOKE_LEARNING_STATE_LOST_AFTER_RELOAD');

    await page.getByRole('button', { name: 'Practice', exact: true }).click();
    await page.locator('#root .practice-home').waitFor({ state: 'visible', timeout: 10000 });
    await page.getByRole('button', { name: 'Start exercise', exact: true }).click();
    await page.locator('#exercise').waitFor({ state: 'visible', timeout: 15000 });
    await page.getByRole('button', { name: 'Learning', exact: true }).click();
    await page.locator('#root .learning-card').waitFor({ state: 'visible', timeout: 15000 });

    // Live release evidence must exercise the shipped Dictionary surface, not only local browser E2E.
    await page.locator('.experience-nav .experience-tab').nth(2).click();
    const dictionaryPage = page.locator('.dictionary-page');
    await dictionaryPage.waitFor({ state: 'visible', timeout: 10000 });
    const dictionarySearch = dictionaryPage.locator('.dictionary-page-search input');
    await dictionarySearch.fill('学');
    const dictionaryTile = dictionaryPage.locator('.kanji-catalog-tile').filter({ hasText: '学' }).first();
    await dictionaryTile.waitFor({ state: 'visible', timeout: 10000 });
    await dictionaryTile.click();
    const dictionaryCard = page.locator('.dictionary-card-dialog:visible');
    await dictionaryCard.waitFor({ state: 'visible', timeout: 10000 });
    await dictionaryCard.getByRole('button', { name: 'Close', exact: true }).click();
    await dictionaryCard.waitFor({ state: 'hidden', timeout: 10000 });

    await page.getByRole('button', { name: 'More', exact: true }).click();
    await page.locator('#header-tools-menu').getByRole('button', { name: 'Reading lab', exact: true }).click();
    const readingDialog = page.getByRole('dialog', { name: 'Reading lab' });
    const readingLab = readingDialog.locator('.reading-lab');
    await readingLab.waitFor({ state: 'visible', timeout: 10000 });
    const readingText = '今日は学生です。明日は先生です。';
    await readingLab.locator('textarea').fill(readingText);
    await readingLab.locator('.reading-lab-sentence-next').click();
    await readingDialog.getByRole('button', { name: 'Close', exact: true }).click();
    await readingDialog.waitFor({ state: 'hidden', timeout: 10000 });
    await page.getByRole('button', { name: 'More', exact: true }).click();
    await page.locator('#header-tools-menu').getByRole('button', { name: 'Reading lab', exact: true }).click();
    const reopenedReadingDialog = page.getByRole('dialog', { name: 'Reading lab' });
    const reopenedReadingLab = reopenedReadingDialog.locator('.reading-lab');
    await reopenedReadingLab.waitFor({ state: 'visible', timeout: 10000 });
    await expect(reopenedReadingLab.locator('textarea')).toHaveValue(readingText);
    await expect(reopenedReadingLab.locator('.reading-lab-sentence-position')).toContainText('2 / 2');
    await reopenedReadingDialog.getByRole('button', { name: 'Close', exact: true }).click();
    await reopenedReadingDialog.waitFor({ state: 'hidden', timeout: 10000 });

    await page.getByRole('button', { name: 'More', exact: true }).click();
    await page.locator('#header-tools-menu').getByRole('button', { name: 'Stats', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 10000 });
    await page.getByRole('button', { name: 'Close', exact: true }).click();

    await page.getByRole('button', { name: 'More', exact: true }).click();
    await page.locator('#header-tools-menu').getByRole('button', { name: 'Settings', exact: true }).click();
    const settings = page.getByRole('dialog');
    await settings.waitFor({ state: 'visible', timeout: 10000 });
    await settings.getByText('Data & backup', { exact: true }).waitFor({ state: 'visible', timeout: 10000 });
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    await settings.getByRole('button', { name: 'Export backup', exact: true }).click();
    const download = await downloadPromise;
    if (!/^rinemi-backup-\d{4}-\d{2}-\d{2}\.json$/.test(download.suggestedFilename())) {
      throw new Error('LIVE_SMOKE_UNEXPECTED_BACKUP_FILENAME: ' + download.suggestedFilename());
    }
    await expect(settings.getByRole('status')).toContainText('Backup exported successfully.');
    await settings.locator('button.button.secondary').getByText('Close', { exact: true }).click();

    await page.locator('.account-button:visible').click();
    const accountDialog = page.locator('.account-dialog:visible');
    await expect(accountDialog).toHaveCount(1);
    await expect(accountDialog.locator('.account-auth-surface')).toBeVisible();
    await accountDialog.getByRole('button', { name: 'Close', exact: true }).click();

    const cached = await page.evaluate(async () => {
      const paths = ['./index.html', './app-bootstrap.js', './react-entry.js', './react-dist/kanji5-react.js', './react-dist/kanji5-react.css'];
      const result = {};
      for (const path of paths) {
        result[path] = Boolean(await caches.match(new URL(path, location.href).href));
      }
      return result;
    });
    if (!Object.values(cached).every(Boolean)) {
      throw new Error('LIVE_OFFLINE_GATE_MISSING_CACHE_ENTRY: ' + JSON.stringify(cached));
    }

    const offlinePage = await context.newPage();
    await offlinePage.goto(baseUrl + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await offlinePage.locator('#root .app-shell').waitFor({ state: 'visible', timeout: 30000 });
    await offlinePage.evaluate(async () => { await navigator.serviceWorker.ready; });
    await expect.poll(async () => offlinePage.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    const onboardingComplete = await offlinePage.evaluate(() => localStorage.getItem('kanji5-onboarding-v2'));
    if (onboardingComplete !== 'complete') throw new Error('LIVE_OFFLINE_GATE_ONBOARDING_NOT_PERSISTED: ' + onboardingComplete);

    await context.setOffline(true);
    await offlinePage.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
    await offlinePage.locator('#root .app-shell').waitFor({ state: 'visible', timeout: 30000 });
    await offlinePage.locator('#root .daily-summary').waitFor({ state: 'visible', timeout: 10000 });
    if (pageErrors.length) throw new Error('LIVE_SMOKE_PAGE_ERRORS: ' + pageErrors.join(' | '));
    console.log('LIVE_PAGES_OFFLINE_AND_SMOKE_E2E_VERIFIED');
  } finally {
    await context.close();
  }
} finally {
  await browser.close();
}
