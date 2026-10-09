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
    commit: process.env.AUDIT_COMMIT_SHA || null,
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173',
    screens: [],
    pageErrors: [],
    consoleErrors: [],
    failedRequests: [],
    failedResponses: [],
    skippedScrollCaptures: [],
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

  let currentScrollTarget = { kind: 'page-top', label: 'Page top', scrollTop: 0, maxScrollTop: 0 };

  const resetScrollPositions = async () => {
    await page.evaluate(() => {
      document.scrollingElement?.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      for (const element of document.querySelectorAll('body *')) {
        const style = getComputedStyle(element);
        if (element.scrollHeight > element.clientHeight + 24 && /(auto|scroll)/.test(style.overflowY)) {
          element.scrollTop = 0;
        }
      }
    });
  };

  const capture = async (name, { resetScroll = true, suffix = 'viewport' } = {}) => {
    if (resetScroll) {
      await resetScrollPositions();
      currentScrollTarget = { kind: 'page-top', label: 'Page top', scrollTop: 0, maxScrollTop: 0 };
    }
    await page.evaluate(async () => { await document.fonts.ready; });
    const screenshot = path.join(outputDir, name + '-' + suffix + '.png');
    // Capture the visible browser viewport. Full-page stitching misrepresents fixed
    // dialogs and navigation because it places them at document rather than screen coordinates.
    await page.screenshot({ path: screenshot, fullPage: false, animations: 'disabled', caret: 'hide' });
    const state = await page.evaluate(() => {
      const visible = element => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      };
      const label = element => {
        const cls = typeof element.className === 'string' ? element.className.trim().split(/\s+/).slice(0, 3).join('.') : '';
        return element.id ? '#' + element.id : (element.tagName.toLowerCase() + (cls ? '.' + cls : ''));
      };
      const tabs = [...document.querySelectorAll('.experience-tab')];
      const currentTab = tabs.find(tab => tab.getAttribute('aria-current') === 'page');
      const dialogs = [...document.querySelectorAll('[role="dialog"], dialog')].filter(visible).map(dialog => {
        const labelledBy = dialog.getAttribute('aria-labelledby');
        return (dialog.getAttribute('aria-label') ||
          (labelledBy ? document.getElementById(labelledBy)?.textContent : '') ||
          dialog.querySelector('h1,h2,h3')?.textContent || dialog.className || dialog.tagName).toString().trim();
      });
      const scrollables = [...document.querySelectorAll('body *')].filter(element => {
        if (!visible(element) || element.scrollHeight <= element.clientHeight + 24) return false;
        return /(auto|scroll)/.test(getComputedStyle(element).overflowY);
      }).map(element => ({
        element: label(element),
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight,
        scrollTop: Math.round(element.scrollTop),
        maxScrollTop: element.scrollHeight - element.clientHeight,
      })).sort((a, b) => (b.scrollHeight - b.clientHeight) - (a.scrollHeight - a.clientHeight)).slice(0, 8);
      const brokenImages = [...document.images]
        .filter(image => image.complete && image.naturalWidth === 0)
        .map(image => image.currentSrc || image.src);
      const fixedElements = [...document.querySelectorAll('body *')].filter(element => {
        if (!visible(element)) return false;
        return ['fixed', 'sticky'].includes(getComputedStyle(element).position);
      }).map(element => {
        const rect = element.getBoundingClientRect();
        return {
          element: label(element), position: getComputedStyle(element).position, zIndex: getComputedStyle(element).zIndex,
          rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
        };
      }).slice(0, 20);
      const scroller = document.scrollingElement;
      return {
        title: document.title,
        language: document.documentElement.lang,
        direction: document.documentElement.dir,
        viewport: { width: innerWidth, height: innerHeight },
        document: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
        pageScroll: { x: Math.round(window.scrollX), y: Math.round(window.scrollY),
          maxY: Math.max(0, (scroller?.scrollHeight || 0) - innerHeight) },
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
        currentTab: currentTab?.textContent?.trim() || null,
        visibleDialogs: dialogs,
        scrollables,
        fixedElements,
        brokenImages,
      };
    });
    report.screens.push({ name, file: path.basename(screenshot), screenshotMode: 'viewport', scrollTarget: currentScrollTarget, ...state });
  };

  const captureScrolled = async (name, { scope = 'page', ratio = 0.78 } = {}) => {
    currentScrollTarget = await page.evaluate(({ scope, ratio }) => {
      const visible = element => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' &&
          style.visibility !== 'hidden' && style.opacity !== '0';
      };
      const label = element => {
        const cls = typeof element.className === 'string' ? element.className.trim().split(/\s+/).slice(0, 3).join('.') : '';
        return element.id ? '#' + element.id : (element.tagName.toLowerCase() + (cls ? '.' + cls : ''));
      };
      const activeDialogs = [...document.querySelectorAll('[role="dialog"], dialog')].filter(visible);
      if (scope === 'page') {
        const root = document.scrollingElement;
        const pageMaxScrollTop = Math.max(0, (root?.scrollHeight || 0) - innerHeight);
        // Prefer the actual page scroll when the document can scroll. This prevents hidden
        // back faces or nested learning-card internals from masquerading as a page-scroll capture.
        if (pageMaxScrollTop > 24) {
          window.scrollTo({ top: Math.round(pageMaxScrollTop * Math.max(0, Math.min(1, ratio))), behavior: 'instant' });
          return { kind: 'page', label: 'window/document', scrollTop: Math.round(window.scrollY), maxScrollTop: pageMaxScrollTop };
        }
      }
      const scopeRoot = scope === 'dialog' && activeDialogs.length
        ? activeDialogs[activeDialogs.length - 1]
        : document.body;
      const candidates = [scopeRoot, ...scopeRoot.querySelectorAll('*')].filter(element => {
        const style = getComputedStyle(element);
        if (!visible(element) || style.opacity === '0' || element.scrollHeight <= element.clientHeight + 24) return false;
        return /(auto|scroll)/.test(style.overflowY);
      }).sort((a, b) =>
        (b.scrollHeight - b.clientHeight) - (a.scrollHeight - a.clientHeight)
      );
      if (candidates.length) {
        const target = candidates[0];
        const maxScrollTop = Math.max(0, target.scrollHeight - target.clientHeight);
        target.scrollTo({ top: Math.round(maxScrollTop * Math.max(0, Math.min(1, ratio))), behavior: 'instant' });
        return { kind: 'element', label: label(target), scrollTop: Math.round(target.scrollTop), maxScrollTop };
      }
      return { kind: 'none', label: 'No scrollable content in requested scope', scrollTop: 0, maxScrollTop: 0 };
    }, { scope, ratio });
    if (currentScrollTarget.kind === 'none' || currentScrollTarget.maxScrollTop <= 24) {
      report.skippedScrollCaptures.push({
        name, scope, reason: 'No meaningful scroll range in the requested scope',
        target: currentScrollTarget,
      });
      return;
    }
    await page.waitForTimeout(120);
    await capture(name, { resetScroll: false, suffix: 'scrolled' });
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
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const onboarding = page.locator('[data-testid="onboarding-flow"]');
    await expect(onboarding).toBeVisible({ timeout: 30_000 });
    await capture('01-onboarding-desktop');
    await onboarding.getByRole('button', { name: 'فارسی', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await capture('02-onboarding-persian-desktop');
    await page.setViewportSize({ width: 390, height: 844 });
    await capture('03-onboarding-persian-mobile');
    await captureScrolled('03-onboarding-persian-mobile-bottom', { scope: 'page', ratio: 1 });
    await onboarding.getByRole('button', { name: 'EN', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await capture('04-onboarding-mobile');
    await captureScrolled('04-onboarding-mobile-bottom', { scope: 'page', ratio: 1 });
    await page.setViewportSize({ width: 1440, height: 960 });

    await onboarding.getByRole('button', { name: 'Skip setup', exact: true }).click();
    await expect(page.locator('#root .app-shell')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('#root .learning-card')).toBeVisible({ timeout: 15_000 });
    await capture('05-learning-desktop');
    await captureScrolled('05-learning-desktop', { scope: 'page', ratio: 1 });
    await page.setViewportSize({ width: 390, height: 844 });
    await capture('06-learning-mobile');
    const navBackground = await page.locator('.experience-nav').evaluate(element => getComputedStyle(element).backgroundColor);
    expect(navBackground).toBe('rgb(253, 251, 247)');
    await captureScrolled('06-learning-mobile', { scope: 'page', ratio: 1 });
    await page.setViewportSize({ width: 1440, height: 960 });

    const tabs = page.locator('.experience-nav .experience-tab');
    await expect(tabs).toHaveCount(3);
    await tabs.nth(1).click();
    await expect(page.locator('#root .practice-home')).toBeVisible({ timeout: 15_000 });
    await capture('07-active-recall-desktop');
    await captureScrolled('07-active-recall-desktop', { scope: 'page', ratio: 1 });
    await page.setViewportSize({ width: 390, height: 844 });
    await capture('08-active-recall-mobile');
    await captureScrolled('08-active-recall-mobile', { scope: 'page', ratio: 1 });
    await page.setViewportSize({ width: 1440, height: 960 });

    await tabs.nth(0).click();
    await expect(page.locator('#root .learning-card')).toBeVisible();
    await tabs.nth(2).click();
    await expect(page.locator('.dictionary-page')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.kanji-catalog-tile').first()).toBeVisible({ timeout: 15_000 });
    await capture('09-dictionary-desktop');
    await captureScrolled('09-dictionary-desktop-mid-catalog', { scope: 'page', ratio: 0.5 });
    await page.setViewportSize({ width: 390, height: 844 });
    await capture('10-dictionary-mobile');
    const filterLayout = await page.locator('.dictionary-controls>.dictionary-filter-row').evaluate(row => {
      const level = row.querySelector('.dictionary-level-filter');
      const more = row.querySelector('details.dictionary-advanced-filters summary');
      const bounds = [level, more].filter(Boolean).map(element => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.left >= 0 && rect.right <= window.innerWidth + 1;
      });
      return { levelDisplay: level ? getComputedStyle(level).display : '', inViewport: bounds.length === 2 && bounds.every(Boolean) };
    });
    expect(filterLayout.levelDisplay).toBe('grid');
    expect(filterLayout.inViewport).toBe(true);
    await captureScrolled('10-dictionary-mobile-mid-catalog', { scope: 'page', ratio: 0.5 });

    await page.locator('.dictionary-page-search input').fill('学');
    await expect(page.locator('.kanji-catalog-tile').first()).toBeVisible({ timeout: 10_000 });
    await capture('11-dictionary-search-mobile');
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.locator('.kanji-catalog-tile').first().click();
    const dictionaryDialog = page.locator('.dictionary-card-dialog:visible');
    await expect(dictionaryDialog).toBeVisible({ timeout: 10_000 });
    await capture('12-dictionary-card-desktop');
    await captureScrolled('12-dictionary-card-desktop-dialog', { scope: 'dialog', ratio: 0.8 });
    await page.setViewportSize({ width: 390, height: 844 });
    await capture('12-dictionary-card-mobile');
    await captureScrolled('12-dictionary-card-mobile-dialog', { scope: 'dialog', ratio: 0.8 });
    await dictionaryDialog.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(dictionaryDialog).toBeHidden();

    // Start the desktop Settings dialog at the intended desktop viewport. The previous
    // Dictionary card captures leave this journey at the mobile breakpoint.
    await page.setViewportSize({ width: 1440, height: 960 });

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
    await capture('13-settings-desktop');
    await captureScrolled('13-settings-desktop-dialog', { scope: 'dialog', ratio: 0.8 });
    await page.setViewportSize({ width: 390, height: 844 });
    await capture('14-settings-mobile');
    await captureScrolled('14-settings-mobile-dialog', { scope: 'dialog', ratio: 0.8 });
    await expect(dialog.locator('.settings-page-header')).toBeInViewport();
    await expect(dialog.locator('.settings-save-region')).toBeInViewport();
    await expect(dialog.locator('.dialog-close')).toBeInViewport();
    await page.setViewportSize({ width: 1440, height: 960 });
    await closeDialog(dialog);

    dialog = await openMenuItem('Stats');
    await capture('15-statistics-desktop');
    await captureScrolled('15-statistics-desktop-dialog', { scope: 'dialog', ratio: 0.8 });
    await page.setViewportSize({ width: 390, height: 844 });
    await capture('15-statistics-mobile');
    await expect(dialog.locator('.stats-activity-section .empty-text')).toBeVisible();
    await expect(dialog.locator('.activity-chart')).toHaveCount(0);
    await captureScrolled('15-statistics-mobile-dialog', { scope: 'dialog', ratio: 0.8 });
    await page.setViewportSize({ width: 1440, height: 960 });
    await closeDialog(dialog);

    dialog = await openMenuItem('Reading lab');
    await expect(dialog.locator('.reading-lab')).toBeVisible({ timeout: 10_000 });
    await capture('16-reading-lab-desktop');
    await captureScrolled('16-reading-lab-desktop-dialog', { scope: 'dialog', ratio: 0.8 });
    await page.setViewportSize({ width: 390, height: 844 });
    await capture('17-reading-lab-mobile');
    await expect(dialog.locator('.reading-lab')).toHaveCSS('overflow-y', 'auto');
    await captureScrolled('17-reading-lab-mobile-dialog', { scope: 'dialog', ratio: 0.8 });
    await expect(dialog.locator('h2')).toBeInViewport();
    await expect(dialog.locator('.dialog-close')).toBeInViewport();
    await page.setViewportSize({ width: 1440, height: 960 });
    await closeDialog(dialog);

    const accountButton = page.locator('.account-button:visible').first();
    if (await accountButton.count()) {
      await accountButton.click();
      const accountDialog = page.locator('.account-dialog:visible');
      await expect(accountDialog).toBeVisible({ timeout: 10_000 });
      await capture('18-account-dialog-desktop');
      await page.setViewportSize({ width: 390, height: 844 });
      await capture('18-account-dialog-mobile');
      await captureScrolled('18-account-dialog-mobile-dialog', { scope: 'dialog', ratio: 0.8 });
      await page.setViewportSize({ width: 1440, height: 960 });
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
    await captureScrolled('19-learning-persian-mobile', { scope: 'page', ratio: 1 });

    await page.locator('.experience-nav .experience-tab').nth(1).click();
    await expect(page.locator('#root .practice-home')).toBeVisible({ timeout: 15_000 });
    await capture('20-active-recall-persian-mobile');
    await captureScrolled('20-active-recall-persian-mobile', { scope: 'page', ratio: 1 });

    await page.locator('.experience-nav .experience-tab').nth(2).click();
    await expect(page.locator('.dictionary-page')).toBeVisible({ timeout: 15_000 });
    await capture('21-dictionary-persian-mobile');
    await captureScrolled('21-dictionary-persian-mobile-mid-catalog', { scope: 'page', ratio: 0.5 });

    await page.getByRole('button', { name: 'بیشتر', exact: true }).click();
    const persianMenu = page.locator('#header-tools-menu');
    await expect(persianMenu).toHaveClass(/open/);
    await persianMenu.getByRole('button', { name: 'تنظیمات', exact: true }).click();
    const persianSettings = page.getByRole('dialog').last();
    await expect(persianSettings).toBeVisible({ timeout: 10_000 });
    await capture('22-settings-persian-mobile');
    await captureScrolled('22-settings-persian-mobile-dialog', { scope: 'dialog', ratio: 0.8 });
  } finally {
    await fs.writeFile(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  }

  expect(report.pageErrors, 'Uncaught browser page errors; see visual-audit report and screenshots').toEqual([]);
  expect(report.failedResponses, 'First-party HTTP errors; see visual-audit report and screenshots').toEqual([]);
  expect(report.failedRequests, 'First-party failed requests; see visual-audit report and screenshots').toEqual([]);
});
