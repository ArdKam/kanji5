import { test, expect } from "@playwright/test";

async function clean(page, language = "en") {
  await page.addInitScript((value) => localStorage.setItem("kanji5-ui-language", value), language);
  await page.goto("/");
  await page.evaluate((value) => {
    for (const key of Object.keys(localStorage)) if (key.startsWith("kanji5-")) localStorage.removeItem(key);
    localStorage.setItem("kanji5-ui-language", value);
    sessionStorage.clear();
  }, language);
  await page.reload();
  await expect(page.locator("#root .app-shell")).toBeVisible({ timeout: 20000 });
}

async function openMenuItem(page, name) {
  await page.getByRole("button", { name: "More", exact: true }).click();
  const menu = page.locator("#header-tools-menu");
  await expect(menu).toHaveClass(/open/);
  await menu.getByRole("button", { name, exact: true }).click();
  return page.getByRole("dialog").last();
}

test("Grammar behaves like a lesson: persistent progress, retry, and gated next step", async ({ page }) => {
  await clean(page, "en");
  const dialog = await openMenuItem(page, "Grammar guide");
  await expect(dialog.locator(".grammar-progress-track")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Next lesson", exact: true })).toBeDisabled();

  await dialog.locator(".grammar-option").filter({ hasText: "これは本を。" }).click();
  await expect(dialog.locator(".grammar-feedback.incorrect")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Try again", exact: true })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Next lesson", exact: true })).toBeDisabled();

  await dialog.getByRole("button", { name: "Try again", exact: true }).click();
  await dialog.locator(".grammar-option").filter({ hasText: "これは本です。" }).click();
  await expect(dialog.locator(".grammar-feedback.correct")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Next lesson", exact: true })).toBeEnabled();

  const stored = await page.evaluate(() => sessionStorage.getItem("kanji5-grammar-progress"));
  expect(stored).toContain("0");

  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  const reopened = await openMenuItem(page, "Grammar guide");
  await expect(reopened.locator(".grammar-progress")).toContainText("%");
  const progressText = await reopened.locator(".grammar-progress").innerText();
  expect(progressText).not.toMatch(/0%/);
});

test("Prepared Mnemonics search reaches dictionary meaning and reading fields", async ({ page }) => {
  await clean(page, "en");
  const dialog = await openMenuItem(page, "Prepared mnemonics");
  const search = dialog.locator(".prepared-mnemonic-library-search");
  await expect(search).toBeVisible({ timeout: 10000 });
  await search.fill("study");
  await expect.poll(async () => dialog.locator(".prepared-mnemonic-library-row").count(), { timeout: 10000 }).toBeGreaterThan(0);
  const rows = dialog.locator(".prepared-mnemonic-library-row");
  await expect(rows.first()).toContainText(/学|study/i);
});

test("Secondary desktop surfaces preserve centered modal geometry after the polish pass", async ({ page }) => {
  await clean(page, "en");
  await page.setViewportSize({ width: 1280, height: 720 });
  for (const name of ["Grammar guide", "Reading lab", "Prepared mnemonics", "Stats", "Settings"]) {
    const dialog = await openMenuItem(page, name);
    await expect(dialog).toBeVisible({ timeout: 10000 });
    const metrics = await dialog.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        position: getComputedStyle(el).position,
      };
    });
    expect(metrics.position).toBe("fixed");
    expect(Math.abs((metrics.left + metrics.width / 2) - metrics.viewportWidth / 2)).toBeLessThanOrEqual(2);
    expect(Math.abs((metrics.top + metrics.height / 2) - metrics.viewportHeight / 2)).toBeLessThanOrEqual(2);
    expect(metrics.left).toBeGreaterThanOrEqual(0);
    expect(metrics.top).toBeGreaterThanOrEqual(0);
    expect(metrics.left + metrics.width).toBeLessThanOrEqual(metrics.viewportWidth);
    expect(metrics.top + metrics.height).toBeLessThanOrEqual(metrics.viewportHeight);
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
  }
});
