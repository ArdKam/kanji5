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
  await expect(dialog.locator(".prepared-mnemonic-purpose")).toHaveCount(0);
  await expect(dialog.locator(".prepared-mnemonic-howto")).toHaveCount(0);
  await expect(dialog.locator(".prepared-mnemonic-mode-note")).toHaveCount(0);
  await expect(dialog.locator(".prepared-mnemonic-mode-tab").first()).toHaveAttribute("aria-pressed", "true");
  await expect(dialog.locator(".prepared-mnemonic-library-row.is-curated")).toHaveCount(60);

  const moreButton = dialog.locator(".prepared-mnemonic-library-more");
  await expect(moreButton).toBeVisible();
  await expect(moreButton).toHaveCSS("position", "static");
  const initialMoreTop = await moreButton.evaluate(element => element.getBoundingClientRect().top);
  await dialog.evaluate(element => { element.scrollTop = Math.min(260, element.scrollHeight - element.clientHeight); });
  await expect.poll(() => dialog.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  const scrolledMoreTop = await moreButton.evaluate(element => element.getBoundingClientRect().top);
  expect(scrolledMoreTop).toBeLessThan(initialMoreTop - 20);
  await dialog.evaluate(element => { element.scrollTop = 0; });

  const search = dialog.locator(".prepared-mnemonic-library-search");
  await search.fill("study");
  await expect.poll(async () => dialog.locator(".prepared-mnemonic-library-row").count(), { timeout: 10000 }).toBeGreaterThan(0);
  const curatedRow = dialog.locator(".prepared-mnemonic-library-row.is-curated").first();
  await expect(curatedRow).toContainText(/学|study/i);
  await expect(curatedRow.locator(".prepared-mnemonic-library-meaning")).toBeVisible();
  const save = curatedRow.locator(".prepared-mnemonic-library-use");
  await expect(save).toBeVisible();
  await save.click();
  await expect(curatedRow.locator(".prepared-mnemonic-status")).toContainText("Saved");
  await expect(save).toContainText("Edit personal mnemonic");

  await search.fill("カ");
  await dialog.locator(".prepared-mnemonic-mode-tab").nth(1).click();
  await expect(dialog.locator(".prepared-mnemonic-mode-tab").nth(1)).toHaveAttribute("aria-pressed", "true");
  await expect(search).toHaveValue("カ");
  await expect(dialog.locator(".prepared-mnemonic-mode-note")).toBeVisible();
  await expect(dialog.locator(".prepared-mnemonic-mode-note")).toHaveCount(1);
  await expect(dialog.locator(".prepared-mnemonic-library-scaffold-title")).toHaveCount(0);
  await expect(dialog.locator(".prepared-mnemonic-library-row.is-generated").first()).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Make your own mnemonic", exact: true }).first()).toBeVisible();
});

test("Prepared Mnemonics supports grade and JLPT filters plus inline create/edit", async ({ page }) => {
  await clean(page, "en");
  const dialog = await openMenuItem(page, "Prepared mnemonics");
  await dialog.locator(".prepared-mnemonic-mode-tab").nth(1).click();
  const grade = dialog.locator(".prepared-mnemonic-filter-select select").nth(0);
  const jlpt = dialog.locator(".prepared-mnemonic-filter-select select").nth(1);

  await grade.selectOption("2");
  const gradeRows = dialog.locator(".prepared-mnemonic-library-row");
  await expect.poll(async () => gradeRows.count()).toBeGreaterThan(0);
  for (const value of await gradeRows.evaluateAll(rows => rows.map(row => row.getAttribute("data-grade")))) {
    expect(value).toBe("2");
  }

  await grade.selectOption("all");
  await jlpt.selectOption("N4");
  await expect.poll(async () => gradeRows.count()).toBeGreaterThan(0);
  for (const value of await gradeRows.evaluateAll(rows => rows.map(row => row.getAttribute("data-jlpt")))) {
    expect(value).toBe("N4");
  }

  await jlpt.selectOption("all");
  await dialog.locator(".prepared-mnemonic-mode-tab").nth(1).click();
  const row = dialog.locator(".prepared-mnemonic-library-row.is-generated").first();
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Make your own mnemonic", exact: true }).click();
  const editor = row.locator(".prepared-mnemonic-inline-editor textarea");
  await expect(editor).toBeVisible();
  await editor.fill("A personal scene that helps me remember this kanji.");
  await row.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(editor).toHaveCount(0);
  await expect(row.locator(".prepared-mnemonic-status")).toContainText("Saved");
  await expect(row.getByRole("button", { name: "Edit personal mnemonic", exact: true })).toBeVisible();

  await row.getByRole("button", { name: "Edit personal mnemonic", exact: true }).click();
  await expect(row.locator(".prepared-mnemonic-inline-editor textarea")).toHaveValue("A personal scene that helps me remember this kanji.");
  await row.locator(".prepared-mnemonic-inline-editor textarea").fill("An edited personal mnemonic.");
  await row.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(row.locator(".prepared-mnemonic-inline-editor textarea")).toHaveCount(0);
  await row.getByRole("button", { name: "Edit personal mnemonic", exact: true }).click();
  await expect(row.locator(".prepared-mnemonic-inline-editor textarea")).toHaveValue("An edited personal mnemonic.");
  await row.getByRole("button", { name: "Cancel", exact: true }).click();
});

test("Prepared Mnemonics cards remain contained on mobile", async ({ page }) => {
  await clean(page, "en");
  await page.setViewportSize({ width: 390, height: 844 });
  const dialog = await openMenuItem(page, "Prepared mnemonics");
  await expect(dialog).toBeVisible();
  await dialog.locator(".prepared-mnemonic-mode-tab").nth(1).click();
  await expect(dialog.locator(".prepared-mnemonic-mode-note")).toBeVisible();
  const row = dialog.locator(".prepared-mnemonic-library-row").first();
  await expect(row).toBeVisible();
  const geometry = await row.evaluate(element => {
    const row = element.getBoundingClientRect();
    const kanji = element.querySelector(".prepared-mnemonic-library-kanji").getBoundingClientRect();
    const action = element.querySelector(".prepared-mnemonic-library-action").getBoundingClientRect();
    return {
      rowLeft: row.left,
      rowRight: row.right,
      rowBottom: row.bottom,
      kanjiLeft: kanji.left,
      kanjiRight: kanji.right,
      actionLeft: action.left,
      actionRight: action.right,
      viewportWidth: window.innerWidth
    };
  });
  expect(geometry.rowLeft).toBeGreaterThanOrEqual(0);
  expect(geometry.rowRight).toBeLessThanOrEqual(geometry.viewportWidth + 1);
  expect(geometry.kanjiLeft).toBeGreaterThanOrEqual(geometry.rowLeft);
  expect(geometry.kanjiRight).toBeLessThanOrEqual(geometry.rowRight);
  expect(geometry.actionLeft).toBeGreaterThanOrEqual(geometry.rowLeft);
  expect(geometry.actionRight).toBeLessThanOrEqual(geometry.rowRight);
  await expect(row.locator(".prepared-mnemonic-library-build")).toBeVisible();
  await expect(row.locator(".prepared-mnemonic-library-mnemonic")).toHaveCount(0);
  await dialog.locator(".dialog-close").click();
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
  for (const name of ["Grammar guide", "Japanese text reader", "Prepared mnemonics", "Stats", "Settings"]) {
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

test("Settings is learner-first: placement stays in Practice and changes require explicit save", async ({ page }) => {
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

  await page.getByRole("button", { name: "Practice", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Not sure where to start?", exact: true })).toBeVisible();
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
  await expect(settings.getByRole("alert").filter({ hasText: "Restore this Rinemi backup?" })).toBeVisible();
  await settings.getByRole("alert").filter({ hasText: "Restore this Rinemi backup?" }).getByRole("button", { name: "Restore backup", exact: true }).click();

  await expect.poll(async () => page.locator("#root .app-shell").count(), { timeout: 20000 }).toBe(1);
  settings = await openMenuItem(page, "Settings");
  await expect(settings.getByLabel("New kanji per day", { exact: true })).toHaveValue("5");
  await settings.locator(".dialog-close").click();
});

test("Placement has one discoverable home in Practice", async ({ page }) => {
  await clean(page, "en");
  const settings = await openMenuItem(page, "Settings");
  await expect(settings.getByText("Placement check", { exact: true })).toHaveCount(0);
  await settings.locator(".dialog-close").click();

  await page.getByRole("button", { name: "Practice", exact: true }).click();
  const placement = page.getByRole("heading", { name: "Not sure where to start?", exact: true });
  await expect(placement).toBeVisible();
  await expect(page.getByRole("button", { name: "Start diagnostic", exact: true })).toBeVisible();
});


test("Reading Lab analysis metrics keep an even grid across desktop and mobile", async ({ page }) => {
  await clean(page, "en");
  await page.setViewportSize({ width: 1280, height: 800 });
  const dialog = await openMenuItem(page, "Japanese text reader");
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
