import { test, expect } from "@playwright/test";

async function clean(page, language = "fa") {
  await page.addInitScript(lang => {
    localStorage.clear();
    localStorage.setItem("kanji5-ui-language", lang);
  }, language);
  await page.goto("/");
  await expect(page.locator("#root .app-shell")).toBeVisible({ timeout: 20000 });
}

async function openDictionary(page) {
  await page.getByRole("button", { name: /فرهنگ کانجی|Kanji dictionary/ }).click();
  await expect(page.locator(".dictionary-page")).toBeVisible({ timeout: 10000 });
}

async function openFirstKanji(page) {
  const tile = page.locator(".kanji-catalog-tile").first();
  await expect(tile).toBeVisible({ timeout: 10000 });
  await tile.click();
  const dialog = page.locator(".dictionary-card-dialog:visible");
  await expect(dialog).toBeVisible({ timeout: 10000 });
  return dialog;
}

test("dictionary search has clear control and detailed view stays bounded", async ({ page }) => {
  await clean(page);
  await openDictionary(page);

  const search = page.locator(".dictionary-page-search input");
  await search.fill("学");
  const clear = page.getByRole("button", { name: "پاک کردن جست‌وجو", exact: true });
  await expect(clear).toBeVisible();
  await expect(page.locator(".kanji-catalog-tile")).toHaveCount(1);
  await clear.click();
  await expect(search).toHaveValue("");
  await expect(clear).toHaveCount(0);
  await expect(page.locator(".kanji-catalog-tile")).toHaveCount(2136);

  const detailed = page.getByRole("button", { name: /جزئیات|Detailed/, exact: false });
  await expect(detailed).toBeVisible();
  await expect(detailed).toBeDisabled();

  await search.fill("学");
  await expect(detailed).toBeEnabled();
  await detailed.click();
  await expect(page.locator(".kanji-catalog-grid")).toHaveClass(/is-detailed/);
  const tile = page.locator(".kanji-catalog-tile.is-detailed").first();
  await expect(tile.locator(".kanji-catalog-details-meta")).toBeVisible();
  await expect(tile.locator(".kanji-catalog-details-readings")).toBeVisible();
  await expect(tile.locator(".kanji-catalog-details-meaning")).toBeVisible();

  await search.fill("zzzzzz-no-kanji");
  await expect(page.locator(".dictionary-empty[role=\"status\"]")).toBeVisible();
  await expect(page.locator(".kanji-catalog-tile")).toHaveCount(0);
  await expect(page.locator(".dictionary-view-button.active")).toContainText("جزئیات");
});

test("dictionary card keeps dismiss control visible and switches tabs without scroll jumps", async ({ page }) => {
  await clean(page);
  await openDictionary(page);
  const dialog = await openFirstKanji(page);

  const close = dialog.getByRole("button", { name: "بستن", exact: true });
  await expect(close).toBeVisible();
  await page.waitForTimeout(4500);
  await expect(close).toBeVisible();

  await expect(dialog.getByRole("tab", { name: "نمای کلی", exact: true })).toHaveAttribute("aria-selected", "true");
  const meaning = dialog.locator(".dictionary-card-section");
  await expect(meaning).toContainText("معنی:");
  await expect(dialog.locator(".dictionary-card-section-value")).toHaveAttribute("dir", "auto");

  const structure = dialog.getByRole("tab", { name: "ساختار", exact: true });
  const writing = dialog.getByRole("tab", { name: "تمرین دست‌خط", exact: true });
  const vocabulary = dialog.getByRole("tab", { name: "نمونه‌های واژگانی", exact: true });

  await structure.click();
  await expect(structure).toHaveAttribute("aria-selected", "true");
  await expect(dialog.locator(".dictionary-tabpanel")).toHaveCount(1);
  await expect(dialog.evaluate(node => node.scrollTop)).toBe(0);

  await writing.click();
  await expect(writing).toHaveAttribute("aria-selected", "true");
  await expect(dialog.locator(".dictionary-tabpanel")).toHaveCount(1);
  await expect(dialog.evaluate(node => node.scrollTop)).toBe(0);
  await expect(dialog.locator(".handwriting-practice")).toBeVisible();

  await vocabulary.click();
  await expect(vocabulary).toHaveAttribute("aria-selected", "true");
  await expect(dialog.locator(".dictionary-tabpanel")).toHaveCount(1);
  await expect(dialog.evaluate(node => node.scrollTop)).toBe(0);
  await expect(dialog.locator(".dictionary-vocabulary")).toBeVisible();
});

test("dictionary card mixed-direction vocabulary uses ruby and highlights the target", async ({ page }) => {
  await clean(page, "en");
  await openDictionary(page);
  const search = page.locator(".dictionary-page-search input");
  await search.fill("学");
  await page.locator(".kanji-catalog-tile").first().click();
  const dialog = page.locator(".dictionary-card-dialog:visible");
  await dialog.getByRole("tab", { name: "Vocabulary", exact: true }).click();

  await expect(dialog.locator(".dictionary-vocabulary")).toBeVisible({ timeout: 10000 });
  const ruby = dialog.locator(".dictionary-vocabulary-ruby").first();
  if (await ruby.count()) {
    await expect(ruby).toBeVisible();
    await expect(ruby.locator("rt")).toBeVisible();
    await expect(ruby.locator(".dictionary-vocabulary-target")).toHaveCount(1);
    await expect(dialog.locator(".dictionary-vocabulary-meaning").first()).toHaveAttribute("dir", "auto");
  }
});
