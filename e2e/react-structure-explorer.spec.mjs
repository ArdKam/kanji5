import { test, expect } from '@playwright/test';

test('radical and component explorer support lookup, intersection, and structure links', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('/');
  await expect(page.locator('#root .app-shell')).toBeVisible({ timeout: 20_000 });

  await page.locator('.experience-nav .experience-tab').nth(2).click();
  await expect(page.locator('.dictionary-page')).toBeVisible({ timeout: 10_000 });

  const explorer = page.locator('.structure-explorer');
  await explorer.locator('summary').click();
  await expect(explorer).toBeVisible();

  const componentTab = explorer.getByRole('tab', { name: /جزء دیداری|Visual component/i });
  await componentTab.click();
  const input = explorer.locator('.structure-explorer-search input');
  await input.fill('言');
  await explorer.locator('button[type="submit"]').click();
  await expect(explorer.locator('.structure-result-kanji').filter({ hasText: '語' })).toBeVisible({ timeout: 10_000 });

  await input.fill('言 + 義');
  await explorer.locator('button[type="submit"]').click();
  await expect(explorer.locator('.structure-result-kanji').filter({ hasText: '議' })).toBeVisible({ timeout: 10_000 });

  const radicalTab = explorer.getByRole('tab', { name: /رادیکال سنتی|Traditional radical/i });
  await radicalTab.click();
  await input.fill('85');
  await explorer.locator('button[type="submit"]').click();
  await expect(explorer.locator('.structure-selection')).toContainText('85');
  await expect(explorer.locator('.structure-selection [lang="ja"]')).toHaveText('水');
  await expect(explorer.locator('.structure-result-kanji').filter({ hasText: '水' })).toBeVisible({ timeout: 10_000 });

  const dictionarySearch = page.locator('.dictionary-page-search input');
  await dictionarySearch.fill('湖');
  await expect(page.locator('.kanji-catalog-tile').filter({ hasText: '湖' })).toHaveCount(1);
  await page.locator('.kanji-catalog-tile').filter({ hasText: '湖' }).click();
  const dialog = page.locator('.dictionary-card-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.dictionary-card-structure-line')).toContainText(/85|رادیکال سنتی|Traditional radical/);
  await expect(dialog.locator('.component-breakdown')).toBeVisible();

  const preLinkBoundary = await page.evaluate(async () => {
    const result = await window.__KANJI5_V19_V2_BOUNDARY__?.getKanjiByComponent?.("氵", true, 80);
    return {
      count: result?.results?.length ?? -1,
      hasLake: Boolean(result?.results?.some(item => item?.character === "湖")),
    };
  });
  console.log("STRUCTURE_PREFLIGHT", JSON.stringify(preLinkBoundary));
  expect(preLinkBoundary.hasLake).toBe(true);

  const componentButton = dialog.locator('.component-breakdown-part-button').filter({ hasText: '氵' });
  await expect(componentButton).toBeVisible();
  await componentButton.click();
  await expect(dialog).toHaveCount(0);
  await expect(explorer).toHaveAttribute('open', '');

  await expect(explorer.getByRole('tab', { name: /جزء دیداری|Visual component/i })).toHaveAttribute('aria-selected', 'true');
  await expect(explorer.locator('.structure-explorer-search input')).toHaveValue('氵');
  const postLinkBoundary = await page.evaluate(async () => {
    const result = await window.__KANJI5_V19_V2_BOUNDARY__?.getKanjiByComponent?.("氵", true, 80);
    return {
      count: result?.results?.length ?? -1,
      hasLake: Boolean(result?.results?.some(item => item?.character === "湖")),
      cards: Array.from(document.querySelectorAll(".structure-result-kanji")).map(node => node.textContent?.trim()).filter(Boolean).slice(0, 60),
    };
  });
  console.log("STRUCTURE_POSTLINK", JSON.stringify(postLinkBoundary));
  expect(postLinkBoundary.hasLake).toBe(true);
  await expect(explorer.locator('.structure-result-kanji').first()).toHaveText('湖');


  await expect(explorer.locator('.structure-result-kanji').filter({ hasText: '湖' })).toBeVisible({ timeout: 10_000 });

  expect(pageErrors, pageErrors.join('\n')).toEqual([]);
});
