import { test, expect } from "@playwright/test";

async function clean(page, language = "en") {
  await page.addInitScript((value) => localStorage.setItem("kanji5-ui-language", value), language);
  await page.goto("/");
  await page.evaluate((value) => {
    for (const key of Object.keys(localStorage)) if (key.startsWith("kanji5-")) localStorage.removeItem(key);
    localStorage.setItem("kanji5-ui-language", value);
    sessionStorage.clear();localStorage.setItem('kanji5-onboarding-v2','complete');
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

  await dialog.locator(".dialog-close").click();
  const reopened = await openMenuItem(page, "Grammar guide");
  await expect(reopened.locator(".grammar-progress")).toContainText("%");
  const progressText = await reopened.locator(".grammar-progress").innerText();
  expect(progressText).not.toMatch(/0%/);
});

test("Prepared Mnemonics waits for the catalog, exposes loading, search, modes, and saved state", async ({ page }) => {
  await clean(page, "en");

  await page.evaluate(() => {
    const original = window.__KANJI5_V19_V2_BOUNDARY__;
    if (!original) throw new Error("Boundary missing");
    window.__KANJI5_V2_TEST_BOUNDARY__ = original;
    window.__KANJI5_V19_V2_BOUNDARY__ = Object.freeze({
      ...original,
      listKanji: async () => {
        await new Promise(resolve => setTimeout(resolve, 800));
        return original.listKanji();
      }
    });
  });

  const dialogPromise = openMenuItem(page, "Prepared mnemonics");
  const dialog = await dialogPromise;
  await expect(dialog.locator(".prepared-mnemonic-library-loading")).toBeVisible({ timeout: 500 });
  await expect(dialog.locator(".prepared-mnemonic-library-row.is-curated").first()).toBeVisible({ timeout: 10000 });
  await expect(dialog.locator(".prepared-mnemonics-dialog-metrics")).toContainText("259");
  await expect(dialog.locator(".prepared-mnemonics-dialog-metrics")).toContainText("1877");
  await expect(dialog.getByText("This is not a review and does not give SRS credit; it simply makes a memory path easier to build.", { exact: true })).toBeVisible();
  await expect(dialog.locator(".prepared-mnemonic-mode-tab").first()).toHaveAttribute("aria-pressed", "true");
  await expect(dialog.locator(".prepared-mnemonic-library-row.is-curated")).toHaveCount(60);

  const search = dialog.locator(".prepared-mnemonic-library-search");
  await search.fill("study");
  await expect.poll(async () => dialog.locator(".prepared-mnemonic-library-row").count(), { timeout: 10000 }).toBeGreaterThan(0);
  const curatedRow = dialog.locator(".prepared-mnemonic-library-row.is-curated").first();
  await expect(curatedRow).toContainText(/学|study/i);
  await expect(curatedRow.locator(".prepared-mnemonic-library-meaning")).toBeVisible();
  const save = curatedRow.locator(".prepared-mnemonic-library-use");
  await expect(save).toBeVisible();
  await save.click();
  await expect(save).toContainText("Saved to personal mnemonics");

  await search.fill("");
  await dialog.locator(".prepared-mnemonic-mode-tab").nth(1).click();
  await expect(dialog.locator(".prepared-mnemonic-mode-tab").nth(1)).toHaveAttribute("aria-pressed", "true");
  await expect(dialog.locator(".prepared-mnemonic-library-row.is-generated").first()).toBeVisible();
  await expect(dialog.locator(".prepared-mnemonic-library-scaffold-title").first()).toContainText("not a finished mnemonic");
  await expect(dialog.getByRole("button", { name: "Open card to build", exact: true }).first()).toBeVisible();
});

test("Prepared Mnemonics shows a retry state when the catalog fails to load", async ({ page }) => {
  await clean(page, "en");
  await page.evaluate(() => {
    const original = window.__KANJI5_V19_V2_BOUNDARY__;
    if (!original) throw new Error("Boundary missing");
    window.__KANJI5_TEST_BOUNDARY__ = original;
    window.__KANJI5_V19_V2_BOUNDARY__ = Object.freeze({
      ...original,
      listKanji: async () => { throw new Error("forced catalog failure"); },
      listPersonalMnemonics: async () => ({ mnemonics: {} })
    });
  });

  const dialog = await openMenuItem(page, "Prepared mnemonics");
  await expect(dialog.locator(".prepared-mnemonic-library-error")).toBeVisible({ timeout: 10000 });
  await expect(dialog.getByRole("button", { name: "Try again", exact: true })).toBeVisible();

  await page.evaluate(() => {
    window.__KANJI5_V19_V2_BOUNDARY__ = window.__KANJI5_TEST_BOUNDARY__;
  });
  await dialog.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(dialog.locator(".prepared-mnemonic-library-row.is-curated").first()).toBeVisible({ timeout: 10000 });
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
    await dialog.locator(".dialog-close").click();
  }
});

test("Settings is learner-first: placement stays in Active Recall and changes require explicit save", async ({ page }) => {
  await clean(page, "en");

  const settings = await openMenuItem(page, "Settings");
  await expect(settings).toHaveClass(/settings-dialog/);
  await expect(settings.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
  await expect(settings.getByText("Learning", { exact: true })).toBeVisible();
  await expect(settings.getByText("Review scheduling", { exact: true })).toBeVisible();
  await expect(settings.getByText("Data & backup", { exact: true })).toBeVisible();
  await expect(settings.getByText("Placement check", { exact: true })).toHaveCount(0);

  const dailyNew = settings.getByLabel("New kanji per day", { exact: true });
  await expect(dailyNew).toHaveValue("5");
  await expect(settings.getByRole("button", { name: "Save changes", exact: true })).toBeDisabled();

  await dailyNew.fill("7");
  await expect(settings.getByText("You have unsaved changes.", { exact: true })).toBeVisible();
  await expect(settings.getByRole("button", { name: "Save changes", exact: true })).toBeEnabled();

  await settings.locator(".dialog-close").click();
  const discard = settings.getByRole("alertdialog");
  await expect(discard).toBeVisible();
  await discard.getByRole("button", { name: "Keep editing", exact: true }).click();
  await dailyNew.fill("8");
  await settings.locator(".dialog-close").click();
  await settings.getByRole("alertdialog").getByRole("button", { name: "Discard changes", exact: true }).click();

  const practice = await openMenuItem(page, "Settings");
  await expect(practice.getByLabel("New kanji per day", { exact: true })).toHaveValue("5");
  await practice.locator(".dialog-close").click();

  await page.getByRole("button", { name: "Active Recall", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Placement check", exact: true })).toBeVisible();
});

test("Settings keeps Save changes visible while its content scrolls", async ({ page }) => {
  await clean(page, "en");
  await page.setViewportSize({ width: 1280, height: 720 });

  const settings = await openMenuItem(page, "Settings");
  const scrollRegion = settings.locator(".settings-form-scroll");
  const saveRegion = settings.locator(".settings-save-region");
  await expect(scrollRegion).toBeVisible();
  await expect(saveRegion).toBeVisible();

  const initial = await saveRegion.evaluate(el => el.getBoundingClientRect().toJSON());
  await scrollRegion.evaluate(el => {
    el.scrollTop = el.scrollHeight;
  });
  await expect.poll(() => scrollRegion.evaluate(el => el.scrollTop)).toBeGreaterThan(0);

  const after = await saveRegion.evaluate(el => el.getBoundingClientRect().toJSON());
  expect(Math.abs(after.top - initial.top)).toBeLessThanOrEqual(2);
  expect(Math.abs(after.bottom - initial.bottom)).toBeLessThanOrEqual(2);
  await expect(settings.getByRole("button", { name: "Save changes", exact: true })).toBeVisible();

  await settings.locator(".dialog-close").click();
});

test("Data backup exports and restores the authoritative learning data", async ({ page }) => {
  await clean(page, "en");
  let settings = await openMenuItem(page, "Settings");

  const dailyNew = settings.getByLabel("New kanji per day", { exact: true });
  await expect(dailyNew).toHaveValue("5");

  const downloadPromise = page.waitForEvent("download");
  await settings.getByRole("button", { name: "Export backup", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^rinemi-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const backupPath = await download.path();
  expect(backupPath).toBeTruthy();

  await dailyNew.fill("9");
  await settings.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.locator("#settings-title")).toHaveCount(0);
  await expect.poll(async () => page.evaluate(async () => {
    const boundary = window.__KANJI5_V19_V2_BOUNDARY__;
    const snapshot = await boundary?.snapshot?.();
    const appState = window.__KANJI5_STATE__?.readAppState?.();
    return { snapshotDailyNew: snapshot?.settings?.dailyNew ?? null, persistedDailyNew: appState?.settings?.dailyNew ?? null };
  }), { timeout: 10000 }).toEqual({ snapshotDailyNew: 9, persistedDailyNew: 9 });

  settings = await openMenuItem(page, "Settings");
  await expect(settings.getByLabel("New kanji per day", { exact: true })).toHaveValue("9");
  await settings.locator(".settings-backup-import input").setInputFiles(backupPath);
  await expect(settings.getByRole("alert").filter({ hasText: "Restore this Kanji5 backup?" })).toBeVisible();
  await settings.getByRole("alert").filter({ hasText: "Restore this Kanji5 backup?" }).getByRole("button", { name: "Restore backup", exact: true }).click();

  await expect.poll(async () => page.locator("#root .app-shell").count(), { timeout: 20000 }).toBe(1);
  settings = await openMenuItem(page, "Settings");
  await expect(settings.getByLabel("New kanji per day", { exact: true })).toHaveValue("5");
  await settings.locator(".dialog-close").click();
});

test("Placement has one discoverable home in Active Recall", async ({ page }) => {
  await clean(page, "en");
  const settings = await openMenuItem(page, "Settings");
  await expect(settings.getByText("Placement check", { exact: true })).toHaveCount(0);
  await settings.locator(".dialog-close").click();

  await page.getByRole("button", { name: "Active Recall", exact: true }).click();
  const placement = page.getByRole("heading", { name: "Placement check", exact: true });
  await expect(placement).toBeVisible();
  await expect(page.getByRole("button", { name: "Start diagnostic", exact: true })).toBeVisible();
});


test("Reading Lab analysis metrics keep an even grid across desktop and mobile", async ({ page }) => {
  await clean(page, "en");
  await page.setViewportSize({ width: 1280, height: 800 });
  const dialog = await openMenuItem(page, "Reading lab");
  await dialog.locator(".reading-lab-input").fill("私は学生です。今日、学校へ行きます。");
  const metrics = dialog.locator(".reading-lab-analysis-stats");
  await expect(metrics).toBeVisible({ timeout: 10000 });
  await expect(metrics.locator("> div")).toHaveCount(6);

  const columnCount = async () => metrics.evaluate(element =>
    getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length
  );
  await expect.poll(columnCount).toBe(3);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(columnCount).toBe(2);
  await expect(metrics.locator("> div").first()).toHaveCSS("grid-column-start", "1");
  await expect(metrics.locator("> div").first()).toHaveCSS("grid-column-end", "-1");
});
