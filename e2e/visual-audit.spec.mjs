import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const outputDir = path.resolve('test-results/visual-audit');

test('capture a reviewable visual audit across core product surfaces and breakpoints', async ({ page }) => {
  test.setTimeout(120_000);
  await fs.mkdir(outputDir, { recursive: true });

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    commit: process.env.GITHUB_SHA || null,
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173',
    screens: [],
    pageErrors: [],
    consoleErrors: [],
    failedRequests: [],
    failedResponses: [],
  };
  const expectedOrigin = new URL(report.baseURL).origin;

  page.on('pageerror', error => report.pageErrors.push(error?.stack || String(error)));
  page.on('console', message => {
    if (message.type() === 'error') report.consoleErrors.push({ text: message.text(), location: message.location() });
  });
  page.on('requestfailed', request => {
    try {
      if (new URL(request.url()).origin === expectedOrigin) {
        report.failedRequests.push({ url: request.url(), error: request.failure()?.errorText || 'request failed' });
      }
    } catch { /* Ignore malformed URLs. */ }
  });
  page.on('response', response => {
    try {
      if (response.status() >= 400 && new URL(response.url()).origin === expectedOrigin) {
        report.failedResponses.push({ status: response.status(), url: response.url() });
      }
    } catch { /* Ignore malformed URLs. */ }
  });

  const capture = async (name) => {
    await page.evaluate(async () => { await document.fonts.ready; });
    const screenshot = path.join(outputDir, name + '.png');
    await page.screenshot({ path: screenshot, fullPage: true, animations: 'disabled' });
    const state = await page.evaluate(() => {
      const visible = (element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      };
      const tabs = [...document.querySelectorAll('.experience-tab')];
      const currentTab = tabs.find(tab => tab.getAttribute('aria-current') === 'page');
      const dialogs = [...document.querySelectorAll('[role="dialog"], dialog')].filter(visible).map(dialog =>
        (dialog.getAttribute('aria-label') || dialog.getAttribute('aria-labelledby') ||
         dialog.querySelector('h1,h2,h3')?.textContent || dialog.className || dialog.tagName).toString().trim()
      );
      const brokenImages = [...document.images]
        .filter(image => image.complete && image.naturalWidth === 0)
        .map(image => image.currentSrc || image.src);
      return {
        title: document.title,
        language: document.documentElement.lang,
        direction: document.documentElement.dir,
        viewport: { width: innerWidth, height: innerHeight },
        document: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
        currentTab: currentTab?.textContent?.trim() || null,
        visibleDialogs: dialogs,
        brokenImages,
      };
    });
    report.screens.push({ name, file: path.basename(screenshot), ...state });
  };

  try {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.addInitScript(() => {
      if (sessionStorage.getItem('kanji5-visual-audit-initialized') !== '1') {
        localStorage.clear();
        localStorage.setItem('kanji5-ui-language', 'en');
        sessionStorage.setItem('kanji5-visual-audit-initialized', '1');
      }
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const onboarding = page.locator('[data-testid="onboarding-flow"]');
    await expect(onboarding).toBeVisible({ timeout: 30_000 });
    await capture('01-onboarding-desktop');
    await onboarding.getByRole('button', { name: 'فارسی', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await capture('02-onboarding-persian-desktop');
    await page.setViewportSize({ width: 390, height: 844 });
    await capture('03-onboarding-persian-mobile');
    await onboarding.getByRole('button', { name: 'EN', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await capture('04-onboarding-mobile');
    await page.setViewportSize({ width: 1440, height: 960 });

    await onboarding.getByRole('button', { name: 'Skip setup', exact: true }).click();
    await expect(page.locator('#root .app-shell')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('#root .learning-card')).toBeVisible({ timeout: 15_000 });
    await capture('03-learning-desktop');
    await page.setViewportSize({ width: 390, height: 844 });
    await capture('04-learning-mobile');
    await page.setViewportSize({ width: 1440, height: 960 });

    const tabs = page.locator('.experience-nav .experience-tab');
    await expect(tabs).toHaveCount(3);
    await tabs.nth(1).click();
    await expect(page.locator('#root .practice-home')).toBeVisible({ timeout: 15_000 });
    await capture('05-active-recall-desktop');
    await page.setViewportSize({ width: 390, height: 844 });
    await capture('06-active-recall-mobile');
    await page.setViewportSize({ width: 1440, height: 960 });

    await tabs.nth(0).click();
    await expect(page.locator('#root .learning-card')).toBeVisible();
    await tabs.nth(2).click();
    await expect(page.locator('.dictionary-page')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.kanji-catalog-tile').first()).toBeVisible({ timeout: 15_000 });
    await capture('07-dictionary-desktop');
    await page.setViewportSize({ width: 390, height: 844 });
    await capture('08-dictionary-mobile');

    await page.locator('.dictionary-page-search input').fill('学');
    await expect(page.locator('.kanji-catalog-tile').first()).toBeVisible({ timeout: 10_000 });
    await capture('09-dictionary-search-mobile');
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.locator('.kanji-catalog-tile').first().click();
    const dictionaryDialog = page.locator('.dictionary-card-dialog:visible');
    await expect(dictionaryDialog).toBeVisible({ timeout: 10_000 });
    await capture('10-dictionary-card-desktop');
    await dictionaryDialog.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(dictionaryDialog).toBeHidden();

    const openMenuItem = async (name) => {
      await page.getByRole('button', { name: 'More', exact: true }).click();
      const menu = page.locator('#header-tools-menu');
      await expect(menu).toHaveClass(/open/);
      await menu.getByRole('button', { name, exact: true }).click();
      const dialog = page.getByRole('dialog').last();
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      return dialog;
    };
    const closeDialog = async (dialog) => {
      // Dialog surfaces can expose both an accessible × control and a footer Close button.
      await dialog.getByRole('button', { name: 'Close', exact: true }).last().click();
      await expect(dialog).toBeHidden();
    };

    let dialog = await openMenuItem('Settings');
    await capture('11-settings-desktop');
    await page.setViewportSize({ width: 390, height: 844 });
    await capture('12-settings-mobile');
    await page.setViewportSize({ width: 1440, height: 960 });
    await closeDialog(dialog);

    dialog = await openMenuItem('Stats');
    await capture('13-statistics-desktop');
    await closeDialog(dialog);

    dialog = await openMenuItem('Reading lab');
    await expect(dialog.locator('.reading-lab')).toBeVisible({ timeout: 10_000 });
    await capture('14-reading-lab-desktop');
    await page.setViewportSize({ width: 390, height: 844 });
    await capture('15-reading-lab-mobile');
    await page.setViewportSize({ width: 1440, height: 960 });
    await closeDialog(dialog);

    const accountButton = page.locator('.account-button:visible').first();
    if (await accountButton.count()) {
      await accountButton.click();
      const accountDialog = page.locator('.account-dialog:visible');
      await expect(accountDialog).toBeVisible({ timeout: 10_000 });
      await capture('18-account-dialog-desktop');
      await closeDialog(accountDialog);
    }

    // Repeat core product surfaces in Persian/RTL to detect layout regressions that an
    // English-only screenshot set would miss. Preserve the same clean guest profile.
    await page.evaluate(() => localStorage.setItem('kanji5-ui-language', 'fa'));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('#root .app-shell')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('#root .learning-card')).toBeVisible({ timeout: 15_000 });
    await page.setViewportSize({ width: 390, height: 844 });
    await capture('19-learning-persian-mobile');

    await page.locator('.experience-nav .experience-tab').nth(1).click();
    await expect(page.locator('#root .practice-home')).toBeVisible({ timeout: 15_000 });
    await capture('20-active-recall-persian-mobile');

    await page.locator('.experience-nav .experience-tab').nth(2).click();
    await expect(page.locator('.dictionary-page')).toBeVisible({ timeout: 15_000 });
    await capture('21-dictionary-persian-mobile');

    await page.getByRole('button', { name: 'بیشتر', exact: true }).click();
    const persianMenu = page.locator('#header-tools-menu');
    await expect(persianMenu).toHaveClass(/open/);
    await persianMenu.getByRole('button', { name: 'تنظیمات', exact: true }).click();
    const persianSettings = page.getByRole('dialog').last();
    await expect(persianSettings).toBeVisible({ timeout: 10_000 });
    await capture('22-settings-persian-mobile');
  } finally {
    await fs.writeFile(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  }

  expect(report.pageErrors, 'Uncaught browser page errors; see visual-audit report and screenshots').toEqual([]);
  expect(report.failedResponses, 'First-party HTTP errors; see visual-audit report and screenshots').toEqual([]);
  expect(report.failedRequests, 'First-party failed requests; see visual-audit report and screenshots').toEqual([]);
});
