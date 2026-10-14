import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const outputRoot = path.resolve("test-results/design-system-visual-coverage");

function safeName(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90);
}

async function createCapture(page, testInfo) {
  const folder = path.join(outputRoot, safeName(testInfo.title));
  await fs.mkdir(folder, { recursive: true });
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    commit: process.env.AUDIT_COMMIT_SHA || null,
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4173",
    screenshots: [],
    pageErrors: [],
  };

  page.on("pageerror", error => report.pageErrors.push(error?.stack || String(error)));

  const persist = async () => {
    await fs.writeFile(path.join(folder, "report.json"), JSON.stringify(report, null, 2) + "\n");
  };

  const capture = async (name) => {
    await page.evaluate(async () => { await document.fonts.ready; });
    const file = path.join(folder, safeName(name) + ".png");
    await page.screenshot({
      path: file,
      fullPage: false,
      animations: "disabled",
      caret: "hide",
    });
    const state = await page.evaluate(() => {
      const visible = (element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return style.display !== "none" && style.visibility !== "hidden" &&
          Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
      };
      const dialog = [...document.querySelectorAll('[role="dialog"], dialog')]
        .filter(visible)
        .map(element => (element.getAttribute("aria-label") ||
          element.querySelector("h1,h2,h3")?.textContent ||
          element.className || element.tagName).toString().trim());
      const card = document.querySelector(".learning-card");
      const activeBackPage = card?.querySelector(".learning-back-page.active");
      const dictionaryContent = document.querySelector(".dictionary-card-content");
      const dictionaryControls = document.querySelector(".dictionary-controls");
      const firstKanjiTile = document.querySelector(".kanji-catalog-tile");
      const controlsRect = dictionaryControls?.getBoundingClientRect();
      const firstKanjiRect = firstKanjiTile?.getBoundingClientRect();
      const activeFilterLabels = [...document.querySelectorAll(".dictionary-filter-chip")]
        .map(element => element.textContent?.trim() || "")
        .filter(Boolean);
      return {
        title: document.title,
        language: document.documentElement.lang,
        direction: document.documentElement.dir,
        theme: document.documentElement.dataset.theme || null,
        viewport: { width: innerWidth, height: innerHeight },
        document: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
        bodyBackground: getComputedStyle(document.body).backgroundColor,
        visibleDialogs: dialog,
        learningCardRevealed: Boolean(card?.classList.contains("is-revealed")),
        activeLearningPage: activeBackPage?.getAttribute("aria-label") || null,
        activeDictionarySection: dictionaryContent?.getAttribute("data-active-section") || null,
        dictionary: dictionaryControls ? {
          query: document.querySelector(".dictionary-page-search input")?.value || "",
          activeFilters: activeFilterLabels,
          advancedFiltersOpen: Boolean(document.querySelector(".dictionary-advanced-filters")?.hasAttribute("open")),
          topicSelectorOpen: Boolean(document.querySelector(".dictionary-topic-dialog")?.matches(":modal")),
          activeView: document.querySelector(".dictionary-view-button[aria-pressed='true']")?.textContent?.trim() || null,
          sortValue: document.querySelector(".dictionary-sort select")?.value || null,
          controlRegion: controlsRect ? { x: Math.round(controlsRect.x), y: Math.round(controlsRect.y), width: Math.round(controlsRect.width), height: Math.round(controlsRect.height) } : null,
          distanceToFirstKanji: controlsRect && firstKanjiRect ? Math.round(firstKanjiRect.top - controlsRect.bottom) : null,
        } : null,
      };
    });
    report.screenshots.push({
      name,
      // This maps directly to the directory layout in the uploaded CI artifact.
      file: path.join("design-system-visual-coverage", path.relative(outputRoot, file)),
      ...state,
    });
    await persist();
  };

  return { capture, report, persist };
}

async function startApp(page, { language = "en", theme = "light" } = {}) {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ colorScheme: theme === "system" ? "dark" : theme, reducedMotion: "reduce" });
  await page.addInitScript(({ language: initialLanguage, theme: initialTheme }) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("kanji5-ui-language", initialLanguage);
    localStorage.setItem("kanji5-theme", initialTheme);
    localStorage.setItem("kanji5-onboarding-v2", "complete");
  }, { language, theme });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#root .app-shell")).toBeVisible({ timeout: 20000 });
}

test("visual coverage: onboarding steps, selected states, RTL-sized layouts and system theme", async ({ page }, testInfo) => {
  test.setTimeout(180000);
  const audit = await createCapture(page, testInfo);
  try {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem("kanji5-ui-language", "en");
      localStorage.setItem("kanji5-theme", "system");
    });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const onboarding = page.locator('[data-testid="onboarding-flow"]');
    await expect(onboarding).toBeVisible({ timeout: 30000 });

    await audit.capture("onboarding-welcome-system-dark-desktop");
    await page.emulateMedia({ colorScheme: "light" });
    await page.waitForTimeout(80);
    await audit.capture("onboarding-welcome-system-light-desktop");
    await onboarding.getByRole("button", { name: "فارسی", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await audit.capture("onboarding-welcome-persian-desktop");
    await page.setViewportSize({ width: 390, height: 844 });
    await audit.capture("onboarding-welcome-persian-mobile");
    await onboarding.getByRole("button", { name: "EN", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await audit.capture("onboarding-welcome-mobile");
    await page.setViewportSize({ width: 320, height: 740 });
    await audit.capture("onboarding-welcome-320px");
    await page.setViewportSize({ width: 1440, height: 960 });

    await onboarding.getByRole("button", { name: /Let's begin/ }).click();
    await expect(onboarding.getByRole("heading", { name: "How you learn each kanji" })).toBeVisible();
    await audit.capture("onboarding-learning-loop-desktop");
    await page.setViewportSize({ width: 390, height: 844 });
    await audit.capture("onboarding-learning-loop-mobile");
    await page.setViewportSize({ width: 1440, height: 960 });
    await onboarding.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(onboarding.getByRole("heading", { name: "Where should we start?" })).toBeVisible();
    await audit.capture("onboarding-starting-point-unselected");

    await onboarding.locator(".kanji5-onboarding-choice").nth(0).click();
    await audit.capture("onboarding-starting-point-beginner-selected");
    await onboarding.locator(".kanji5-onboarding-choice").nth(2).click();
    await audit.capture("onboarding-starting-point-placement-selected");
    await page.setViewportSize({ width: 390, height: 844 });
    await onboarding.getByRole("button", { name: "فارسی", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await audit.capture("onboarding-starting-point-placement-selected-persian-mobile");
    await onboarding.getByRole("button", { name: "EN", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await page.setViewportSize({ width: 1440, height: 960 });
    await onboarding.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(onboarding.locator(".kanji5-onboarding-question-meta")).toContainText("Question 1 / 20", { timeout: 20000 });
    await expect(onboarding.locator(".kanji5-onboarding-option").first()).toBeVisible();
    await audit.capture("onboarding-placement-question-desktop");
    await page.setViewportSize({ width: 390, height: 844 });
    await audit.capture("onboarding-placement-question-mobile");
    await onboarding.getByRole("button", { name: "فارسی", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await audit.capture("onboarding-placement-question-persian-mobile");
    await onboarding.getByRole("button", { name: "EN", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await page.setViewportSize({ width: 320, height: 740 });
    await audit.capture("onboarding-placement-question-320px");
    await page.setViewportSize({ width: 1440, height: 960 });

    for (let index = 0; index < 20; index += 1) {
      await onboarding.locator(".kanji5-onboarding-option").first().click();
      if (index < 19) {
        await expect(onboarding.locator(".kanji5-onboarding-question-meta")).toContainText(
          "Question " + (index + 2) + " / 20",
          { timeout: 10000 },
        );
      }
    }
    await expect(onboarding.getByRole("heading", { name: "Here is a suggested starting point" })).toBeVisible({ timeout: 15000 });
    await audit.capture("onboarding-placement-result-desktop");
    await page.setViewportSize({ width: 390, height: 844 });
    await audit.capture("onboarding-placement-result-mobile");
    await onboarding.getByRole("button", { name: "فارسی", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await audit.capture("onboarding-placement-result-persian-mobile");
    await onboarding.getByRole("button", { name: "EN", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await page.setViewportSize({ width: 1440, height: 960 });
    await onboarding.getByRole("button", { name: /Use this starting point/ }).click();
    await expect(onboarding.getByRole("heading", { name: "How many new kanji each day?" })).toBeVisible();
    await audit.capture("onboarding-daily-rhythm");
    await onboarding.getByRole("button", { name: /^10 new kanji$/ }).click();
    await audit.capture("onboarding-daily-rhythm-selected");
    await page.setViewportSize({ width: 390, height: 844 });
    await onboarding.getByRole("button", { name: "فارسی", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await audit.capture("onboarding-daily-rhythm-selected-persian-mobile");
    await onboarding.getByRole("button", { name: "EN", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await page.setViewportSize({ width: 1440, height: 960 });
    await onboarding.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(onboarding.getByRole("heading", { name: "An account is optional" })).toBeVisible();
    await audit.capture("onboarding-guest-first-account-step-desktop");
    await page.setViewportSize({ width: 390, height: 844 });
    await audit.capture("onboarding-guest-first-account-step-mobile");
    await page.setViewportSize({ width: 320, height: 740 });
    await audit.capture("onboarding-guest-first-account-step-320px");
    await onboarding.getByRole("button", { name: "فارسی", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await audit.capture("onboarding-guest-first-account-step-persian-320px");
  } finally {
    await audit.persist();
  }
  expect(audit.report.pageErrors, "Uncaught browser errors during onboarding visual coverage").toEqual([]);
});

test("visual coverage: learning-card back pages in light theme", async ({ page }, testInfo) => {
  test.setTimeout(120000);
  const audit = await createCapture(page, testInfo);
  try {
    await startApp(page, { language: "en", theme: "light" });
    const card = page.locator("#root .learning-card");
    await expect(card).toBeVisible({ timeout: 15000 });
    const revealButton = page.getByRole("button", {
      name: /(Reveal meaning & readings|Show (answer|kanji information)|نمایش (پاسخ|اطلاعات کانجی|معنی و خوانش‌ها))/,
    });
    await expect(revealButton).toBeVisible();
    await revealButton.click();
    await expect(card).toHaveClass(/is-revealed/, { timeout: 10000 });
    const shortcuts = card.locator(".learning-back-page-shortcut");
    await expect(shortcuts).toHaveCount(4);
    const sectionNames = ["meaning-structure", "vocabulary-examples", "personal-mnemonic", "stroke-order"];

    for (let index = 0; index < sectionNames.length; index += 1) {
      if (index > 0) {
        await shortcuts.nth(index).click();
        await expect(card.locator(".learning-back-page").nth(index)).toHaveClass(/active/);
      }
      await audit.capture("learning-back-" + sectionNames[index] + "-desktop-light");
    }

    await page.setViewportSize({ width: 390, height: 844 });
    for (let index = 0; index < sectionNames.length; index += 1) {
      await shortcuts.nth(index).click();
      await expect(card.locator(".learning-back-page").nth(index)).toHaveClass(/active/);
      await audit.capture("learning-back-" + sectionNames[index] + "-mobile-light");
    }

    await page.setViewportSize({ width: 320, height: 740 });
    await shortcuts.nth(0).click();
    await expect(card.locator(".learning-back-page").nth(0)).toHaveClass(/active/);
    await audit.capture("learning-back-meaning-structure-320px-light");
  } finally {
    await audit.persist();
  }
  expect(audit.report.pageErrors, "Uncaught browser errors during light learning-card visual coverage").toEqual([]);
});

test("visual coverage: learning-card faces, inner pages, rating feedback, themes and breakpoints", async ({ page }, testInfo) => {
  test.setTimeout(180000);
  const audit = await createCapture(page, testInfo);
  try {
    await startApp(page, { language: "en", theme: "light" });
    const card = page.locator("#root .learning-card");
    await expect(card).toBeVisible({ timeout: 15000 });
    await audit.capture("learning-front-desktop-light");
    await page.setViewportSize({ width: 768, height: 1024 });
    await audit.capture("learning-front-tablet-light");
    await page.setViewportSize({ width: 390, height: 844 });
    await audit.capture("learning-front-mobile-light");
    await page.setViewportSize({ width: 320, height: 740 });
    await audit.capture("learning-front-320px-light");
    await page.setViewportSize({ width: 1440, height: 960 });

    await page.getByRole("button", { name: "More", exact: true }).click();
    const menu = page.locator("#header-tools-menu");
    await expect(menu).toBeVisible();
    await audit.capture("learning-header-menu-open-light");
    await menu.getByRole("button", { name: "Dark", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await audit.capture("learning-header-menu-open-dark");
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();

    await audit.capture("learning-front-desktop-dark");
    await page.setViewportSize({ width: 390, height: 844 });
    await audit.capture("learning-front-mobile-dark");
    await page.setViewportSize({ width: 320, height: 740 });
    await audit.capture("learning-front-320px-dark");
    await page.setViewportSize({ width: 1440, height: 960 });

    const revealButton = page.getByRole("button", {
      name: /(Reveal meaning & readings|Show (answer|kanji information)|نمایش (پاسخ|اطلاعات کانجی|معنی و خوانش‌ها))/,
    });
    await expect(revealButton).toBeVisible();
    await revealButton.click();
    await expect(card).toHaveClass(/is-revealed/, { timeout: 10000 });
    const shortcuts = card.locator(".learning-back-page-shortcut");
    await expect(shortcuts).toHaveCount(4);
    const sectionNames = [
      "meaning-structure",
      "vocabulary-examples",
      "personal-mnemonic",
      "stroke-order",
    ];
    for (let index = 0; index < sectionNames.length; index += 1) {
      if (index > 0) {
        await shortcuts.nth(index).click();
        await expect(card.locator(".learning-back-page").nth(index)).toHaveClass(/active/);
      }
      await audit.capture("learning-back-" + sectionNames[index] + "-desktop-dark");
    }
    await page.setViewportSize({ width: 390, height: 844 });
    for (let index = 0; index < sectionNames.length; index += 1) {
      await shortcuts.nth(index).click();
      await expect(card.locator(".learning-back-page").nth(index)).toHaveClass(/active/);
      await audit.capture("learning-back-" + sectionNames[index] + "-mobile-dark");
    }
    await page.setViewportSize({ width: 320, height: 740 });
    await shortcuts.nth(0).click();
    await expect(card.locator(".learning-back-page").nth(0)).toHaveClass(/active/);
    await audit.capture("learning-back-meaning-structure-320px-dark");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "More", exact: true }).click();
    const rtlMenu = page.locator("#header-tools-menu");
    await expect(rtlMenu).toBeVisible();
    await rtlMenu.getByRole("button", { name: "فارسی", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await audit.capture("learning-header-menu-open-dark-persian");
    await page.keyboard.press("Escape");
    await expect(rtlMenu).toBeHidden();
    for (let index = 0; index < sectionNames.length; index += 1) {
      await shortcuts.nth(index).click();
      await expect(card.locator(".learning-back-page").nth(index)).toHaveClass(/active/);
      await audit.capture("learning-back-" + sectionNames[index] + "-mobile-dark-persian");
    }
    await page.setViewportSize({ width: 320, height: 740 });
    await shortcuts.nth(0).click();
    await expect(card.locator(".learning-back-page").nth(0)).toHaveClass(/active/);
    await audit.capture("learning-back-meaning-structure-320px-dark-persian");
    await page.setViewportSize({ width: 390, height: 844 });

    const rating = card.locator(".rating-grid button").nth(2);
    await expect(rating).toBeVisible();
    await rating.click();
    const feedback = page.locator(".session-feedback");
    await expect(feedback).toBeVisible({ timeout: 10000 });
    await audit.capture("learning-rating-feedback-mobile-dark-persian");
  } finally {
    await audit.persist();
  }
  expect(audit.report.pageErrors, "Uncaught browser errors during learning visual coverage").toEqual([]);
});

test("visual coverage: dictionary filters, empty results, detail tabs, dark mode and narrow layouts", async ({ page }, testInfo) => {
  test.setTimeout(180000);
  const audit = await createCapture(page, testInfo);
  try {
    await startApp(page, { language: "en", theme: "light" });
    const nav = page.locator(".experience-nav .experience-tab");
    await expect(nav).toHaveCount(3);
    await nav.nth(2).click();
    await expect(page.locator(".dictionary-page")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".kanji-catalog-tile").first()).toBeVisible({ timeout: 15000 });
    await audit.capture("dictionary-catalog-desktop-light");

    const advancedFilters = page.locator("details.dictionary-advanced-filters");
    if (await advancedFilters.count()) {
      await advancedFilters.locator("summary").click();
      await expect(advancedFilters).toHaveAttribute("open", "");
      await audit.capture("dictionary-advanced-filters-expanded-desktop-light");
      await advancedFilters.locator("summary").click();
      await expect(advancedFilters).not.toHaveAttribute("open", "");
    }

    const search = page.locator(".dictionary-page-search input");
    await search.fill("rinemi-no-matching-kanji-987654");
    await expect(page.locator(".kanji-catalog-tile")).toHaveCount(0, { timeout: 10000 });
    await audit.capture("dictionary-empty-search-results-desktop-light");
    await page.setViewportSize({ width: 390, height: 844 });
    await audit.capture("dictionary-empty-search-results-mobile-light");
    await page.setViewportSize({ width: 1440, height: 960 });
    await search.fill("学");
    await expect(page.locator(".kanji-catalog-tile").first()).toBeVisible({ timeout: 10000 });
    await page.locator(".kanji-catalog-tile").first().click();
    const dialog = page.locator(".dictionary-card-dialog:visible");
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await audit.capture("dictionary-detail-overview-desktop-light");

    const sections = ["structure", "writing", "vocabulary", "mnemonic"];
    for (const section of sections) {
      const tab = dialog.locator("#dictionary-section-tab-" + section);
      await expect(tab).toBeVisible();
      await tab.click();
      await expect(dialog.locator(".dictionary-card-content")).toHaveAttribute("data-active-section", section);
      await page.waitForTimeout(120);
      await audit.capture("dictionary-detail-" + section + "-desktop-light");
    }

    await page.setViewportSize({ width: 390, height: 844 });
    for (const section of ["overview", ...sections]) {
      const tab = dialog.locator("#dictionary-section-tab-" + section);
      await tab.click();
      await expect(dialog.locator(".dictionary-card-content")).toHaveAttribute("data-active-section", section);
      await page.waitForTimeout(100);
      await audit.capture("dictionary-detail-" + section + "-mobile-light");
    }
    await page.setViewportSize({ width: 320, height: 740 });
    await dialog.locator("#dictionary-section-tab-overview").click();
    await expect(dialog.locator(".dictionary-card-content")).toHaveAttribute("data-active-section", "overview");
    await audit.capture("dictionary-detail-overview-320px-light");

    await dialog.locator(".dialog-close").click();
    await expect(dialog).toBeHidden();
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.getByRole("button", { name: "More", exact: true }).click();
    const menu = page.locator("#header-tools-menu");
    await expect(menu).toBeVisible();
    await menu.getByRole("button", { name: "Dark", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await audit.capture("dictionary-catalog-desktop-dark");

    await page.locator(".kanji-catalog-tile").first().click();
    const darkDialog = page.locator(".dictionary-card-dialog:visible");
    await expect(darkDialog).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await audit.capture("dictionary-detail-overview-mobile-dark");
    await darkDialog.locator("#dictionary-section-tab-structure").click();
    await expect(darkDialog.locator(".dictionary-card-content")).toHaveAttribute("data-active-section", "structure");
    await audit.capture("dictionary-detail-structure-mobile-dark");

    await darkDialog.locator(".dialog-close").click();
    await expect(darkDialog).toBeHidden();
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.getByRole("button", { name: "More", exact: true }).click();
    const rtlMenu = page.locator("#header-tools-menu");
    await expect(rtlMenu).toBeVisible();
    await rtlMenu.getByRole("button", { name: "فارسی", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await audit.capture("dictionary-header-menu-dark-persian");
    await page.keyboard.press("Escape");
    await expect(rtlMenu).toBeHidden();
    await page.setViewportSize({ width: 390, height: 844 });
    await audit.capture("dictionary-catalog-mobile-dark-persian");
    await page.locator(".kanji-catalog-tile").first().click();
    const rtlDialog = page.locator(".dictionary-card-dialog:visible");
    await expect(rtlDialog).toBeVisible();
    for (const section of ["overview", "structure", "writing", "vocabulary", "mnemonic"]) {
      await rtlDialog.locator("#dictionary-section-tab-" + section).click();
      await expect(rtlDialog.locator(".dictionary-card-content")).toHaveAttribute("data-active-section", section);
      await audit.capture("dictionary-detail-" + section + "-mobile-dark-persian");
    }
  } finally {
    await audit.persist();
  }
  expect(audit.report.pageErrors, "Uncaught browser errors during dictionary visual coverage").toEqual([]);
});


test("visual coverage: responsive Dictionary control bar and browseable topics", async ({ page }, testInfo) => {
  test.setTimeout(300000);
  const audit = await createCapture(page, testInfo);
  const viewports = [
    { width: 320, height: 780 },
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 430, height: 880 },
    { width: 768, height: 900 },
    { width: 1024, height: 900 },
    { width: 1280, height: 960 },
    { width: 1440, height: 960 },
  ];
  const combinations = [
    { language: "en", theme: "light" },
    { language: "en", theme: "dark" },
    { language: "fa", theme: "light" },
    { language: "fa", theme: "dark" },
    { language: "en", theme: "system" },
    { language: "fa", theme: "system" },
  ];
  const assertNoHorizontalOverflow = async () => {
    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
    }));
    expect(dimensions.document, "Dictionary horizontal overflow at " + dimensions.viewport + "px")
      .toBeLessThanOrEqual(dimensions.viewport + 1);
  };
  const captureName = (prefix, language, width, theme) =>
    prefix + "-" + language + "-" + width + "px-" + theme;

  try {
    for (const combination of combinations) {
      await startApp(page, combination);
      const nav = page.locator(".experience-nav .experience-tab");
      await expect(nav).toHaveCount(3);
      await nav.nth(2).click();
      await expect(page.locator(".dictionary-page")).toBeVisible({ timeout: 15000 });
      await expect(page.locator(".dictionary-level-filter button")).toHaveCount(6);
      await expect(page.locator(".dictionary-view-button")).toHaveCount(2);
      await expect(page.locator(".dictionary-sort select option")).toHaveCount(5);

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await assertNoHorizontalOverflow();
        await expect(page.locator(".dictionary-topic-trigger")).toBeAttached();
        if (combination.theme === "light") {
          await audit.capture(captureName("dictionary-default", combination.language, viewport.width, combination.theme));
        }
      }

      for (const width of [320, 390, 768, 1440]) {
        const viewport = viewports.find(item => item.width === width);
        if (!viewport) throw new Error("Missing planned viewport " + width);
        await page.setViewportSize(viewport);
        const advanced = page.locator("details.dictionary-advanced-filters");
        if (await advanced.getAttribute("open") === null) await advanced.locator("summary").click();
        await expect(advanced).toHaveAttribute("open", "");
        await expect(page.locator(".dictionary-advanced-group")).toHaveCount(3);
        await assertNoHorizontalOverflow();
        if (width === 390 || width === 1440) {
          await audit.capture(captureName("dictionary-advanced", combination.language, width, combination.theme));
        }

        const trigger = page.locator("#dictionary-topic-trigger");
        await trigger.click();
        const selector = page.locator("#dictionary-topic-dialog");
        await expect(selector).toBeVisible();
        await expect(selector.getByRole("heading", {
          name: combination.language === "fa" ? "انتخاب موضوع" : "Choose a topic",
        })).toBeVisible();
        await expect(selector.locator('[data-topic-id="all"]')).toHaveAttribute("aria-pressed", "true");
        await expect(selector.locator('.dictionary-topic-choice[data-topic-id]:not([data-topic-id="all"])')).toHaveCount(24);
        await expect(selector.locator(".dictionary-topic-coverage-note")).toBeVisible();
        await expect(selector.locator(".dictionary-topic-groups")).toBeVisible();
        const dialogBounds = await selector.evaluate(element => {
          const rect = element.getBoundingClientRect();
          return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
        });
        expect(dialogBounds.left).toBeGreaterThanOrEqual(-1);
        expect(dialogBounds.right).toBeLessThanOrEqual(width + 1);
        expect(dialogBounds.top).toBeGreaterThanOrEqual(-1);
        expect(dialogBounds.bottom).toBeLessThanOrEqual(viewport.height + 1);
        await assertNoHorizontalOverflow();
        if ([320, 390, 768, 1440].includes(width)) {
          await audit.capture(captureName("dictionary-topic-browse", combination.language, width, combination.theme));
        }

        const topicSearch = selector.locator("#dictionary-topic-search");
        await expect(topicSearch).toBeFocused();
        await topicSearch.fill(combination.language === "fa" ? "طبیعت" : "nature");
        await expect(selector.locator('[data-topic-id="nature"]')).toBeVisible();
        await expect(selector.locator(".dictionary-topic-no-results")).toHaveCount(0);
        if (width === 390) await audit.capture(captureName("dictionary-topic-query", combination.language, width, combination.theme));
        await topicSearch.fill("rinemi-no-matching-topic-90817");
        await expect(selector.locator(".dictionary-topic-no-results")).toBeVisible();
        if (width === 390) await audit.capture(captureName("dictionary-topic-empty", combination.language, width, combination.theme));
        await selector.getByRole("button", {
          name: combination.language === "fa" ? "پاک‌کردن جست‌وجوی موضوع" : "Clear topic search",
        }).click();
        await expect(selector.locator('.dictionary-topic-choice[data-topic-id]:not([data-topic-id="all"])')).toHaveCount(24);

        if (width === 390) {
          await page.keyboard.press("Escape");
          await expect(selector).toBeHidden();
          await expect(trigger).toBeFocused();
          await trigger.focus();
          await page.keyboard.press("Enter");
          await expect(selector).toBeVisible();
          await expect(selector.locator('[data-topic-id="nature"]')).toHaveAttribute("aria-pressed", "false");
          await selector.locator('[data-topic-id="nature"]').click();
          await expect(selector).toBeHidden();
          await expect(trigger).toContainText(combination.language === "fa" ? "طبیعت و زمین" : "Nature & land");
          await expect(page.locator(".dictionary-active-filter-chips .dictionary-filter-chip")).toHaveCount(1);
          await expect(trigger).toHaveAttribute("aria-expanded", "false");
          await expect(trigger).toBeFocused();
          if (combination.theme === "light") {
            await audit.capture(captureName("dictionary-topic-selected", combination.language, width, combination.theme));
          }

          await trigger.click();
          await expect(selector.locator('[data-topic-id="nature"]')).toHaveAttribute("aria-pressed", "true");
          await selector.locator('[data-topic-id="all"]').click();
          await expect(selector).toBeHidden();
          await expect(trigger).toContainText(combination.language === "fa" ? "همهٔ موضوع‌ها" : "All topics");
          await expect(page.locator(".dictionary-active-filter-chips .dictionary-filter-chip")).toHaveCount(0);
          await expect(trigger).toBeFocused();
        } else {
          await selector.getByRole("button", {
            name: combination.language === "fa" ? "بستن" : "Close",
            exact: true,
          }).click();
          await expect(selector).toBeHidden();
          await expect(trigger).toBeFocused();
        }
        await assertNoHorizontalOverflow();
      }
    }

    // Preserve intersection behavior and the distinction between advanced clear and Clear all.
    await startApp(page, { language: "en", theme: "light" });
    await page.locator(".experience-nav .experience-tab").nth(2).click();
    const query = page.locator(".dictionary-page-search input");
    await query.fill("学");
    await page.getByRole("button", { name: "N5", exact: true }).click();
    const advanced = page.locator("details.dictionary-advanced-filters");
    if (await advanced.getAttribute("open") === null) await advanced.locator("summary").click();
    await advanced.locator("#dictionary-mastery-filter").selectOption("unseen");
    await advanced.locator("#dictionary-grade-filter").selectOption("1");
    await page.locator("#dictionary-topic-trigger").click();
    await page.locator("#dictionary-topic-dialog #dictionary-topic-search").fill("school");
    await page.locator('#dictionary-topic-dialog [data-topic-id="school"]').click();
    await expect(page.locator(".dictionary-topic-dialog")).toBeHidden();
    await expect(page.locator(".dictionary-active-filters")).toBeVisible();
    await expect(page.locator(".dictionary-active-filter-chips .dictionary-filter-chip")).toHaveCount(5);
    await expect(page.locator(".dictionary-active-filter-chips")).toContainText("N5");
    await expect(page.locator(".dictionary-active-filter-chips")).toContainText("School & learning");
    await advanced.getByRole("button", { name: "Clear extra filters" }).click();
    await expect(query).toHaveValue("学");
    await expect(page.getByRole("button", { name: "N5", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".dictionary-active-filter-chips .dictionary-filter-chip")).toHaveCount(2);
    await page.locator("#dictionary-topic-trigger").click();
    await page.locator("#dictionary-topic-dialog [data-topic-id='all']").click();
    await expect(query).toHaveValue("学");
    await expect(page.getByRole("button", { name: "N5", exact: true })).toHaveAttribute("aria-pressed", "true");

    const sort = page.locator(".dictionary-sort select");
    for (const value of ["level-asc", "level-desc", "mastery-desc", "mastery-asc", "order"]) {
      await sort.selectOption(value);
      await expect(sort).toHaveValue(value);
    }
    await page.getByRole("button", { name: "Detailed view", exact: true }).click();
    await expect(page.getByRole("button", { name: "Detailed view", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "Detailed view", exact: true })).toContainText("Detailed");
    await page.getByRole("button", { name: "Matrix view", exact: true }).click();
    await expect(page.getByRole("button", { name: "Matrix view", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "Matrix view", exact: true })).toContainText("Matrix");
    await page.getByRole("button", { name: "Clear all", exact: true }).click();
    await expect(query).toHaveValue("");
    await expect(page.getByRole("button", { name: "All", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".dictionary-active-filters")).toHaveCount(0);
  } finally {
    await audit.persist();
  }
  expect(audit.report.pageErrors, "Uncaught browser errors during Dictionary control-bar coverage").toEqual([]);
});
