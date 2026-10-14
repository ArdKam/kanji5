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
      const controlRect = dictionaryControls?.getBoundingClientRect();
      const firstKanjiRect = document.querySelector(".kanji-catalog-tile")?.getBoundingClientRect();
      const topicTrigger = document.querySelector(".dictionary-topic-filter-trigger");
      const topicDialog = document.querySelector(".dictionary-topic-dialog[open]");
      const mainSearch = document.querySelector(".dictionary-page-search input");
      const topicSearch = document.querySelector(".dictionary-topic-search-input");
      const activeView = document.querySelector(".dictionary-view-button.active .dictionary-view-label");
      const selectedLevel = document.querySelector(".dictionary-filter-button.active");
      return {
        title: document.title,
        language: document.documentElement.lang,
        direction: document.documentElement.dir,
        theme: document.documentElement.dataset.theme || null,
        viewport: { width: innerWidth, height: innerHeight },
        document: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
        dictionaryControlBar: controlRect ? {
          x: Math.round(controlRect.x),
          y: Math.round(controlRect.y),
          width: Math.round(controlRect.width),
          height: Math.round(controlRect.height),
          bottom: Math.round(controlRect.bottom),
        } : null,
        firstKanjiDistanceFromControls: controlRect && firstKanjiRect ? Math.round(firstKanjiRect.top - controlRect.bottom) : null,
        dictionaryState: {
          query: mainSearch?.value ?? "",
          selectedJlpt: selectedLevel?.textContent?.trim() ?? null,
          advancedFiltersOpen: document.querySelector("details.dictionary-advanced-filters")?.open ?? false,
          activeFilterChips: [...document.querySelectorAll(".dictionary-active-filters .badge")].map(element => element.textContent?.trim() ?? ""),
          sort: document.querySelector(".dictionary-sort select")?.value ?? null,
          viewMode: activeView?.textContent?.trim() ?? null,
          selectedTopic: topicTrigger?.textContent?.trim() ?? null,
          topicPickerOpen: Boolean(topicDialog),
          topicQuery: topicSearch?.value ?? null,
        },
        bodyBackground: getComputedStyle(document.body).backgroundColor,
        visibleDialogs: dialog,
        learningCardRevealed: Boolean(card?.classList.contains("is-revealed")),
        activeLearningPage: activeBackPage?.getAttribute("aria-label") || null,
        activeDictionarySection: dictionaryContent?.getAttribute("data-active-section") || null,
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

test("visual coverage: Dictionary control bar topic browsing across breakpoints, locales and themes", async ({ page }, testInfo) => {
  test.setTimeout(240000);
  const audit = await createCapture(page, testInfo);
  const topics = JSON.parse(await fs.readFile(path.resolve("frontend/src/app/kanji-topics.json"), "utf8"));
  const viewports = [
    { width: 320, height: 740 },
    { width: 360, height: 780 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
    { width: 768, height: 1024 },
    { width: 1024, height: 900 },
    { width: 1280, height: 900 },
    { width: 1440, height: 960 },
  ];
  const variants = [
    { language: "en", theme: "light", prefix: "en-light", widths: viewports },
    { language: "en", theme: "dark", prefix: "en-dark", widths: viewports },
    { language: "fa", theme: "light", prefix: "fa-light", widths: viewports },
    { language: "fa", theme: "dark", prefix: "fa-dark", widths: viewports },
    { language: "en", theme: "system", prefix: "en-system", widths: [viewports[0], viewports[7]] },
  ];

  const openDictionary = async (language, theme) => {
    await startApp(page, { language, theme });
    const nav = page.locator(".experience-nav .experience-tab");
    await expect(nav).toHaveCount(3);
    await nav.nth(2).click();
    await expect(page.locator(".dictionary-page")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".dictionary-controls")).toBeVisible();
  };

  try {
    for (const variant of variants) {
      await openDictionary(variant.language, variant.theme);
      for (const viewport of variant.widths) {
        await page.setViewportSize(viewport);
        await expect(page.locator(".dictionary-controls")).toBeVisible();
        const dimensions = await page.evaluate(() => ({
          viewport: innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          controlWidth: Math.round(document.querySelector(".dictionary-controls")?.getBoundingClientRect().width ?? 0),
        }));
        expect(dimensions.documentWidth, variant.prefix + " horizontal overflow at " + viewport.width + "px").toBeLessThanOrEqual(viewport.width + 1);
        expect(dimensions.controlWidth, variant.prefix + " controls should fill their content area").toBeGreaterThan(0);
        await audit.capture("dictionary-controlbar-" + variant.prefix + "-" + viewport.width);
      }

      for (const width of [320, 390, 1440]) {
        await page.setViewportSize(width === 1440 ? { width, height: 960 } : { width, height: width === 320 ? 740 : 844 });
        const advanced = page.locator("details.dictionary-advanced-filters");
        if (!(await advanced.evaluate(element => element.open))) await advanced.locator("summary").click();
        await expect(advanced).toHaveAttribute("open", "");
        await audit.capture("dictionary-advanced-open-" + variant.prefix + "-" + width);
        const topicTrigger = page.locator(".dictionary-topic-filter-trigger");
        await topicTrigger.click();
        const dialog = page.locator(".dictionary-topic-dialog");
        await expect(dialog).toBeVisible();
        await expect(dialog.locator(".dictionary-topic-option[data-topic-id]:not([data-topic-id='all'])")).toHaveCount(24);
        await audit.capture("dictionary-topic-picker-" + variant.prefix + "-" + width);
        await page.keyboard.press("Escape");
        await expect(dialog).toBeHidden();
        await expect(topicTrigger).toBeFocused();
        await advanced.locator("summary").click();
        await expect(advanced).not.toHaveAttribute("open", "");
      }
    }

    // English interaction: browse every topic without typing, verify filtering, and keep
    // the existing Dictionary query/JLPT/grade/mastery intersection authoritative.
    await openDictionary("en", "light");
    await page.setViewportSize({ width: 320, height: 740 });
    const advanced = page.locator("details.dictionary-advanced-filters");
    await advanced.locator("summary").click();
    await expect(advanced).toHaveAttribute("open", "");
    const topicTrigger = page.locator(".dictionary-topic-filter-trigger");
    await topicTrigger.click();
    const dialog = page.locator(".dictionary-topic-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator(".dictionary-topic-option[data-topic-id]:not([data-topic-id='all'])")).toHaveCount(topics.topics.length);
    await expect(dialog.locator('[data-topic-id="all"]')).toBeVisible();
    const browseList = dialog.locator(".dictionary-topic-browser-list");
    const scrollMetrics = await browseList.evaluate(element => ({ scrollHeight: element.scrollHeight, clientHeight: element.clientHeight }));
    expect(scrollMetrics.scrollHeight).toBeGreaterThan(scrollMetrics.clientHeight);
    for (const topic of topics.topics) {
      const option = dialog.locator('[data-topic-id="' + topic.id + '"]');
      await option.scrollIntoViewIfNeeded();
      await expect(option, "Browseable topic " + topic.id).toBeVisible();
    }
    await dialog.locator(".dictionary-topic-browser-list").evaluate(element => { element.scrollTop = 0; });
    await audit.capture("dictionary-topic-picker-en-light-full-browse-320");
    await page.setViewportSize({ width: 390, height: 844 });
    await audit.capture("dictionary-topic-picker-en-light-full-browse-390");
    await page.setViewportSize({ width: 1440, height: 960 });
    await audit.capture("dictionary-topic-picker-en-light-full-browse-1440");

    const topicSearch = dialog.locator(".dictionary-topic-search-input");
    await topicSearch.fill("plants");
    await expect(dialog.locator(".dictionary-topic-option[data-topic-id]:not([data-topic-id='all'])")).toHaveCount(1);
    await expect(dialog.locator('[data-topic-id="plants"]')).toHaveAttribute("aria-pressed", "false");
    await audit.capture("dictionary-topic-picker-en-light-query");
    await topicSearch.fill("not-a-real-topic-987654");
    await expect(dialog.getByRole("status")).toContainText("No topics match this search.");
    await audit.capture("dictionary-topic-picker-en-light-empty-query");
    await topicSearch.fill("");
    await expect(dialog.locator(".dictionary-topic-option[data-topic-id]:not([data-topic-id='all'])")).toHaveCount(24);
    await expect(dialog.locator('[data-topic-id="all"]')).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(topicTrigger).toBeFocused();

    await topicTrigger.click();
    await dialog.locator('[data-topic-id="plants"]').click();
    await expect(dialog).toBeHidden();
    await expect(topicTrigger).toContainText("Plants & trees");
    await expect(topicTrigger).toBeFocused();
    await expect(page.locator(".dictionary-active-filters")).toContainText("Plants & trees");
    await audit.capture("dictionary-topic-selected-en-light-1440");
    await topicTrigger.click();
    await expect(dialog.locator('[data-topic-id="plants"]')).toHaveAttribute("aria-pressed", "true");
    await audit.capture("dictionary-topic-picker-en-light-selected-state");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(topicTrigger).toBeFocused();

    const search = page.locator(".dictionary-page-search input");
    await search.fill("学");
    const levelButtons = page.locator(".dictionary-level-filter .dictionary-filter-button");
    for (const level of ["All", "N5", "N4", "N3", "N2", "N1"]) {
      await levelButtons.filter({ hasText: new RegExp("^" + level + "$") }).click();
      await expect(page.locator(".dictionary-filter-button.active")).toHaveText(level);
    }
    await levelButtons.filter({ hasText: /^N5$/ }).click();
    const advancedSelects = advanced.locator(".dictionary-select-filter select");
    await advancedSelects.nth(0).selectOption("learning");
    await advancedSelects.nth(1).selectOption("1");
    await expect(advanced.locator(".dictionary-filter-count")).toHaveText("3");
    await expect(page.locator(".dictionary-count")).toContainText("/");
    await audit.capture("dictionary-intersection-en-light-1440");

    // All topics clears only topic state; query, JLPT, grade and mastery remain.
    await topicTrigger.click();
    await expect(dialog.locator('[data-topic-id="plants"]')).toHaveAttribute("aria-pressed", "true");
    await dialog.locator('[data-topic-id="all"]').click();
    await expect(dialog).toBeHidden();
    await expect(topicTrigger).toContainText("All topics");
    await expect(topicTrigger).toBeFocused();
    await expect(search).toHaveValue("学");
    await expect(page.locator(".dictionary-filter-button.active")).toHaveText("N5");
    await expect(advancedSelects.nth(0)).toHaveValue("learning");
    await expect(advancedSelects.nth(1)).toHaveValue("1");
    await expect(advanced.locator(".dictionary-filter-count")).toHaveText("2");
    await audit.capture("dictionary-all-topics-preserves-other-filters");

    // Re-select the topic, then test independent active-chip removal separately.
    await topicTrigger.click();
    await dialog.locator('[data-topic-id="plants"]').click();
    await expect(topicTrigger).toContainText("Plants & trees");
    await expect(advanced.locator(".dictionary-filter-count")).toHaveText("3");
    await audit.capture("dictionary-topic-reselected-with-other-filters");

    // Removing a single active topic chip preserves all the other filters.
    await page.locator(".dictionary-active-filters .badge").filter({ hasText: "Plants & trees" }).click();
    await expect(topicTrigger).toContainText("All topics");
    await expect(search).toHaveValue("学");
    await expect(page.locator(".dictionary-filter-button.active")).toHaveText("N5");
    await expect(advancedSelects.nth(0)).toHaveValue("learning");
    await expect(advancedSelects.nth(1)).toHaveValue("1");
    await audit.capture("dictionary-topic-chip-removed-preserves-other-filters");

    await advanced.locator("button").filter({ hasText: "Clear extra filters" }).click();
    await expect(advancedSelects.nth(0)).toHaveValue("all");
    await expect(advancedSelects.nth(1)).toHaveValue("all");
    await expect(topicTrigger).toContainText("All topics");
    await expect(search).toHaveValue("学");
    await expect(page.locator(".dictionary-filter-button.active")).toHaveText("N5");
    await expect(advanced.locator(".dictionary-filter-count")).toHaveCount(0);
    await audit.capture("dictionary-clear-advanced-preserves-query-jlpt");
    await page.locator(".dictionary-clear-all-filters").click();
    await expect(search).toHaveValue("");
    await expect(page.locator(".dictionary-filter-button.active")).toHaveText("All");
    await expect(page.locator(".dictionary-active-filters")).toHaveCount(0);
    await advanced.locator("summary").click();
    await expect(advanced).not.toHaveAttribute("open", "");

    const sort = page.locator(".dictionary-sort select");
    for (const value of ["level-asc", "level-desc", "mastery-desc", "mastery-asc", "order"]) {
      await sort.selectOption(value);
      await expect(sort).toHaveValue(value);
    }
    const viewButtons = page.locator(".dictionary-view-toggle .dictionary-view-button");
    await expect(viewButtons).toHaveCount(2);
    await viewButtons.filter({ hasText: "Detailed" }).click();
    await expect(viewButtons.filter({ hasText: "Detailed" })).toHaveAttribute("aria-pressed", "true");
    await audit.capture("dictionary-view-detailed-en-light-1440");
    await page.setViewportSize({ width: 390, height: 844 });
    await audit.capture("dictionary-view-detailed-en-light-390");
    await viewButtons.filter({ hasText: "Matrix" }).click();
    await expect(viewButtons.filter({ hasText: "Matrix" })).toHaveAttribute("aria-pressed", "true");
    await page.setViewportSize({ width: 1440, height: 960 });
    await search.fill("rinemi-no-matching-kanji-987654");
    await expect(page.locator(".kanji-catalog-tile")).toHaveCount(0);
    await audit.capture("dictionary-empty-search-en-light");
    await page.locator(".dictionary-search-clear").click();
    await expect(page.locator(".kanji-catalog-tile").first()).toBeVisible();

    // Persian topic search matches only the currently active UI language.
    await openDictionary("fa", "light");
    await page.setViewportSize({ width: 390, height: 844 });
    const faAdvanced = page.locator("details.dictionary-advanced-filters");
    await faAdvanced.locator("summary").click();
    const faTrigger = page.locator(".dictionary-topic-filter-trigger");
    await faTrigger.click();
    const faDialog = page.locator(".dictionary-topic-dialog");
    const faSearch = faDialog.locator(".dictionary-topic-search-input");
    await faSearch.fill("گیاهان");
    await expect(faDialog.locator(".dictionary-topic-option[data-topic-id]:not([data-topic-id='all'])")).toHaveCount(1);
    await expect(faDialog.locator('[data-topic-id="plants"]')).toContainText("گیاهان و درختان");
    await audit.capture("dictionary-topic-picker-fa-light-query");
    await faSearch.fill("");
    await faDialog.locator('[data-topic-id="plants"]').click();
    await expect(faTrigger).toContainText("گیاهان و درختان");
    await expect(page.locator(".dictionary-active-filters")).toContainText("گیاهان و درختان");
    await audit.capture("dictionary-topic-selected-fa-light");

    // System theme is included separately from the explicit light/dark matrix above.
    await expect(audit.report.pageErrors, "Uncaught browser errors during Dictionary control-bar coverage").toEqual([]);
  } finally {
    await audit.persist();
  }
});
