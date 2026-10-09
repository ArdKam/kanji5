import { test, expect } from '@playwright/test';

test('Learning, Active Recall and Dictionary use a persistent Lovable-style bottom switcher', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('kanji5-onboarding-v2','complete'));
  await page.goto('/');
  await expect(page.locator('#root .app-shell')).toBeVisible({ timeout: 20000 });

  const nav = page.locator('.experience-nav');
  const tabs = nav.locator('.experience-tab');
  await expect(nav).toBeVisible();
  await expect(tabs).toHaveCount(3);

  const geometry = await nav.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    return {
      position: style.position,
      bottom: parseFloat(style.bottom),
      top: rect.top,
      height: rect.height,
      left: rect.left,
      right: window.innerWidth - rect.right,
      width: rect.width,
      viewportHeight: window.innerHeight,
    };
  });
  expect(geometry.position).toBe('fixed');
  expect(geometry.bottom).toBeGreaterThanOrEqual(8);
  expect(geometry.top).toBeGreaterThan(geometry.viewportHeight / 2);
  expect(geometry.height).toBeLessThan(120);
  expect(geometry.left).toBeGreaterThanOrEqual(8);
  expect(geometry.right).toBeGreaterThanOrEqual(8);

  // Verify the same persistent switcher remains usable at both desktop and mobile breakpoints.
  for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    const mobileGeometry = await nav.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return {
        position: style.position,
        bottom: parseFloat(style.bottom),
        top: rect.top,
        height: rect.height,
        left: rect.left,
        right: window.innerWidth - rect.right,
        width: rect.width,
        viewportHeight: window.innerHeight,
      };
    });
    expect(mobileGeometry.position).toBe('fixed');
    expect(mobileGeometry.bottom).toBeGreaterThanOrEqual(8);
    expect(mobileGeometry.top).toBeGreaterThan(mobileGeometry.viewportHeight / 2);
    expect(mobileGeometry.height).toBeLessThan(120);
    expect(mobileGeometry.left).toBeGreaterThanOrEqual(8);
    expect(mobileGeometry.right).toBeGreaterThanOrEqual(8);
    await expect(tabs.nth(0)).toBeVisible();
    await expect(tabs.nth(1)).toBeVisible();
    await expect(tabs.nth(2)).toBeVisible();
    if (viewport.width === 390) {
      const learningCard = page.locator("#root .learning-card").first();
      const summary = page.locator("#root .daily-summary");
      await expect(learningCard).toBeVisible({ timeout: 10000 });
      await expect(summary).toBeVisible({ timeout: 10000 });
      const cardTop = await learningCard.evaluate(node => node.getBoundingClientRect().top);
      const summaryTop = await summary.evaluate(node => node.getBoundingClientRect().top);
      expect(cardTop).toBeLessThan(summaryTop);
      const domOrderIsLearningFirst = await page.locator(".content").evaluate(node => {
        const card = node.querySelector(".learning-card");
        const stats = node.querySelector(".daily-summary");
        return Boolean(card && stats && (card.compareDocumentPosition(stats) & Node.DOCUMENT_POSITION_FOLLOWING));
      });
      expect(domOrderIsLearningFirst).toBe(true);
    }
  }

  await expect(tabs.nth(0)).toHaveAttribute('aria-current', 'page');
  await tabs.nth(1).click();
  await expect(tabs.nth(1)).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('#root .practice-home')).toBeVisible({ timeout: 10000 });

  await tabs.nth(0).click();
  await expect(tabs.nth(0)).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.card').first()).toBeVisible();

  await tabs.nth(2).click();
  await expect(tabs.nth(2)).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.dictionary-page')).toBeVisible({timeout:10000});
  await expect(page.locator('.dictionary-page-search input')).toBeVisible();
  await expect(page.locator('.kanji-catalog-tile')).toHaveCount(2136,{timeout:10000});
});


test('Dictionary Kanji card supports adjacent navigation without closing', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('kanji5-onboarding-v2','complete'));
  await page.goto('/');
  await expect(page.locator('#root .app-shell')).toBeVisible({ timeout: 20000 });
  await page.locator('.experience-tab').nth(2).click();
  await expect(page.locator('.dictionary-page')).toBeVisible({ timeout: 10000 });

  const firstTile = page.locator('.kanji-catalog-tile').first();
  const firstCharacter = (await firstTile.locator('.kanji-catalog-character').textContent())?.trim();
  expect(firstCharacter).toBeTruthy();
  await firstTile.click();
  const dialog = page.locator('.dictionary-card-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.dictionary-card-header-character')).toHaveText(firstCharacter);

  const card = dialog.locator('.dictionary-card');
  await card.dispatchEvent('pointerdown', { pointerType: 'touch', pointerId: 5101, isPrimary: true, button: 0, buttons: 1, clientX: 120, clientY: 300, bubbles: true });
  await card.dispatchEvent('pointerup', { pointerType: 'touch', pointerId: 5101, isPrimary: true, button: 0, buttons: 0, clientX: 190, clientY: 300, bubbles: true });
  await expect(dialog.locator('.dictionary-card-header-character')).not.toHaveText(firstCharacter);
  await expect(dialog).toBeVisible();

  await card.dispatchEvent('pointerdown', { pointerType: 'touch', pointerId: 5102, isPrimary: true, button: 0, buttons: 1, clientX: 190, clientY: 300, bubbles: true });
  await card.dispatchEvent('pointerup', { pointerType: 'touch', pointerId: 5102, isPrimary: true, button: 0, buttons: 0, clientX: 120, clientY: 300, bubbles: true });
  await expect(dialog.locator('.dictionary-card-header-character')).toHaveText(firstCharacter);

  await page.keyboard.press('ArrowRight');
  await expect(dialog.locator('.dictionary-card-header-character')).not.toHaveText(firstCharacter);
  await page.keyboard.press('ArrowLeft');
  await expect(dialog.locator('.dictionary-card-header-character')).toHaveText(firstCharacter);
});


test('Dictionary advanced filters are progressive and can be reset without clearing search', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('kanji5-onboarding-v2', 'complete');
    localStorage.setItem('kanji5-ui-language', 'en');
  });
  await page.goto('/');
  await expect(page.locator('#root .app-shell')).toBeVisible({ timeout: 20000 });
  await page.locator('.experience-tab').nth(2).click();
  await expect(page.locator('.dictionary-page')).toBeVisible({ timeout: 10000 });

  const search = page.locator('.dictionary-page-search input');
  await search.fill('学');
  const advanced = page.locator('.dictionary-advanced-filters');
  await expect(advanced).toHaveJSProperty('open', false);
  await advanced.locator('summary').click();
  await expect(advanced).toHaveJSProperty('open', true);

  const mastery = advanced.getByLabel('Mastery');
  const grade = advanced.getByLabel('Grade');
  await mastery.selectOption('mastered');
  await grade.selectOption('1');
  await expect(advanced.locator('.dictionary-filter-count')).toHaveText('2');

  await advanced.getByRole('button', { name: 'Clear extra filters', exact: true }).click();
  await expect(mastery).toHaveValue('all');
  await expect(grade).toHaveValue('all');
  await expect(advanced.locator('.dictionary-filter-count')).toHaveCount(0);
  await expect(search).toHaveValue('学');
});


test('Dictionary curated topic filters combine with other filters and work in Persian RTL', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('kanji5-onboarding-v2', 'complete');
    if (!localStorage.getItem('kanji5-ui-language')) {
      localStorage.setItem('kanji5-ui-language', 'en');
    }
  });
  await page.goto('/');
  await expect(page.locator('#root .app-shell')).toBeVisible({ timeout: 20000 });
  await page.locator('.experience-tab').nth(2).click();
  await expect(page.locator('.dictionary-page')).toBeVisible({ timeout: 10000 });

  const advanced = page.locator('.dictionary-advanced-filters');
  await advanced.locator('summary').click();
  const topic = advanced.getByLabel('Topic');
  await topic.selectOption('nature');
  await expect(page.locator('.kanji-catalog-tile[aria-label^="山 —"]')).toHaveCount(1);
  await expect(page.locator('.kanji-catalog-tile[aria-label^="食 —"]')).toHaveCount(0);
  await expect(advanced.locator('.dictionary-filter-count')).toHaveText('1');

  await topic.selectOption('numbers');
  await expect(page.locator('.kanji-catalog-tile[aria-label^="一 —"]')).toHaveCount(1);
  await expect(page.locator('.kanji-catalog-tile[aria-label^="山 —"]')).toHaveCount(0);
  await page.locator('.dictionary-page-search input').fill('山');
  await expect(page.locator('.kanji-catalog-tile')).toHaveCount(0);
  await topic.selectOption('nature');
  await page.locator('.dictionary-level-filter').getByRole('button', { name: 'N5', exact: true }).click();
  await expect(page.locator('.kanji-catalog-tile[aria-label^="山 —"]')).toHaveCount(1);

  await advanced.getByRole('button', { name: 'Clear extra filters', exact: true }).click();
  await expect(topic).toHaveValue('all');
  await expect(advanced.locator('.dictionary-filter-count')).toHaveCount(0);
  await expect(page.locator('.dictionary-page-search input')).toHaveValue('山');
  await expect(page.locator('.dictionary-level-filter').getByRole('button', { name: 'N5', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.kanji-catalog-tile[aria-label^="山 —"]')).toHaveCount(1);

  await page.evaluate(() => localStorage.setItem('kanji5-ui-language', 'fa'));
  await page.reload();
  await expect(page.locator('#root .app-shell')).toBeVisible({ timeout: 20000 });
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await page.locator('.experience-tab').nth(2).click();
  await expect(page.locator('.dictionary-page')).toBeVisible({ timeout: 10000 });
  const persianAdvanced = page.locator('.dictionary-advanced-filters');
  await persianAdvanced.locator('summary').click();
  const persianTopic = persianAdvanced.getByLabel('موضوع');
  await persianTopic.selectOption('body');
  await expect(page.locator('.kanji-catalog-tile[aria-label^="手 —"]')).toHaveCount(1);
  await expect(page.locator('.kanji-catalog-tile[aria-label^="山 —"]')).toHaveCount(0);
});
