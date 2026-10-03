import { chromium } from '@playwright/test';

const baseUrl = String(process.env.KANJI5_LIVE_URL || 'https://ardkam.github.io/kanji5').replace(/\/$/, '');

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ serviceWorkers: 'allow' });
  try {
    const page = await context.newPage();
    await page.addInitScript(() => {
      localStorage.setItem('kanji5-ui-language', 'en');
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('kanji5-') && key !== 'kanji5-ui-language') localStorage.removeItem(key);
      }
      sessionStorage.clear();
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
      await onboarding.getByRole('button', { name: "Start today's learning", exact: true }).click();
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

    await page.getByRole('button', { name: 'Active Recall', exact: true }).click();
    await page.locator('#root .practice-home').waitFor({ state: 'visible', timeout: 10000 });
    await page.getByRole('button', { name: 'Start exercise', exact: true }).click();
    await page.locator('#exercise').waitFor({ state: 'visible', timeout: 15000 });
    await page.getByRole('button', { name: 'Learning', exact: true }).click();
    await page.locator('#root .learning-card').waitFor({ state: 'visible', timeout: 15000 });

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
    if (!/^kanji5-backup-\\d{4}-\\d{2}-\\d{2}\\.json$/.test(download.suggestedFilename())) {
      throw new Error('LIVE_SMOKE_UNEXPECTED_BACKUP_FILENAME: ' + download.suggestedFilename());
    }
    await expect(settings.getByRole('status')).toContainText('Backup exported successfully.');
    await settings.getByRole('button', { name: 'Close', exact: true }).click();

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

    await context.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('#root .app-shell').waitFor({ state: 'visible', timeout: 30000 });
    await page.locator('#root .daily-summary').waitFor({ state: 'visible', timeout: 10000 });
    console.log('LIVE_PAGES_OFFLINE_AND_SMOKE_E2E_VERIFIED');
  } finally {
    await context.close();
  }
} finally {
  await browser.close();
}
