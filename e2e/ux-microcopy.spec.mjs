import { test, expect } from "@playwright/test";

async function clean(page) {
  await page.addInitScript(() => {
    localStorage.setItem("kanji5-ui-language", "en");
    localStorage.setItem("kanji5-onboarding-v2", "complete");
  });
  await page.goto("/");
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) if (key.startsWith("kanji5-")) localStorage.removeItem(key);
    sessionStorage.clear();
    localStorage.setItem("kanji5-ui-language", "en");
    localStorage.setItem("kanji5-onboarding-v2", "complete");
  });
  await page.reload();
  await expect(page.locator("#root .app-shell")).toBeVisible({ timeout: 20000 });
}

async function openMenuItem(page, index) {
  await page.getByRole("button", { name: "More", exact: true }).click();
  const menu = page.locator("#header-tools-menu");
  await expect(menu).toHaveClass(/open/);
  const item = menu.locator(".menu-nav-item").nth(index);
  await expect(item).toBeVisible();
  await item.click();
  return page.getByRole("dialog").last();
}

test("microcopy cleanup is reflected in rendered UI at mobile and desktop breakpoints", async ({ page }) => {
  test.setTimeout(90000);
  await clean(page);

  for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
    await page.setViewportSize(viewport);

    await page.locator(".experience-tab").nth(1).click();
    const practice = page.locator("#root .practice-home");
    await expect(practice).toBeVisible();
    await expect(practice.getByText("Use active recall to find skills that need more practice.", { exact: true })).toBeVisible();
    await expect(practice.getByText("Choose a focused way to study, or start with a topic that interests you.", { exact: true })).toHaveCount(0);
    await expect(practice.getByText("Choose a topic and study its kanji through the existing learning and review flow.", { exact: true })).toHaveCount(0);

    await page.locator(".experience-tab").nth(2).click();
    const dictionaryInput = page.locator(".dictionary-page-search input");
    await expect(dictionaryInput).toBeVisible();
    await expect(dictionaryInput).toHaveAttribute("placeholder", "Search kanji, reading, or meaning");
    await expect(page.getByRole("textbox", { name: "Search kanji, reading, or meaning" })).toBeVisible();
    await expect(page.locator(".dictionary-search-hint")).toHaveCount(0);

    const menu = page.locator("#header-tools-menu");
    await page.getByRole("button", { name: "More", exact: true }).click();
    await expect(menu).toHaveClass(/open/);
    await expect(menu.locator(".menu-nav-copy small")).toHaveCount(0);
    await expect(menu.locator(".menu-nav-item").nth(0)).toHaveAttribute("aria-label", "Grammar guide");
    await expect(menu.locator(".menu-nav-item").nth(1)).toHaveAttribute("aria-label", "Japanese text reader");
    await expect(menu.locator(".menu-nav-item").nth(3)).toHaveAttribute("aria-label", "Stats");
    await expect(menu.locator(".menu-nav-item").nth(4)).toHaveAttribute("aria-label", "Settings");
    await menu.locator(".menu-nav-item").nth(1).click();
    const reader = page.getByRole("dialog").last();
    await expect(reader).toBeVisible();
    await expect(reader.getByText("Enter Japanese text or import subtitles to see its kanji coverage.", { exact: true })).toBeVisible();
    await expect(reader.getByText("Paste a dialogue, article, or subtitle. Rinemi will map it against your current mastery.", { exact: true })).toHaveCount(0);
    await reader.locator(".dialog-close").click();

    const stats = await openMenuItem(page, 3);
    await expect(stats.locator(".stats-header h2")).toHaveText("Your learning progress");
    await expect(stats.locator(".stats-header > p")).toHaveCount(0);
    await expect(stats.locator(".stats-activity-section .eyebrow")).toHaveCount(0);
    await stats.locator(".dialog-close").click();

    const settings = await openMenuItem(page, 4);
    await expect(settings.locator("#settings-title")).toBeVisible();
    await expect(settings.locator(".settings-section-heading > p")).toHaveCount(0);
    await expect(settings.locator("#settings-learning-heading")).toBeVisible();
    await expect(settings.locator("#settings-scheduling-heading")).toBeVisible();
    await expect(settings.locator("#settings-data-heading")).toBeVisible();
    await expect(settings.locator("#settings-support-heading")).toBeVisible();
    await settings.locator(".dialog-close").click();
  }
});

test("Persian microcopy remains readable and accessible in RTL layouts", async ({ page }) => {
  test.setTimeout(90000);
  await clean(page);
  await page.setViewportSize({ width: 390, height: 844 });

  await page.getByRole("button", { name: "More", exact: true }).click();
  const menu = page.locator("#header-tools-menu");
  await expect(menu).toHaveClass(/open/);
  await menu.getByRole("button", { name: "فارسی", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "fa");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.getByRole("button", { name: "بیشتر", exact: true }).click();

  const assertNoHorizontalOverflow = async () => {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(overflow).toBe(false);
  };
  const openMenuItemAt = async (index) => {
    await page.getByRole("button", { name: "بیشتر", exact: true }).click();
    const toolsMenu = page.locator("#header-tools-menu");
    await expect(toolsMenu).toHaveClass(/open/);
    const item = toolsMenu.locator(".menu-nav-item").nth(index);
    await expect(item).toBeVisible();
    await item.click();
    const dialog = page.getByRole("dialog").last();
    await expect(dialog).toBeVisible();
    return dialog;
  };

  for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
    await page.setViewportSize(viewport);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

    await page.locator(".experience-tab").nth(1).click();
    await expect(page.locator("#root .practice-home")).toBeVisible();
    await assertNoHorizontalOverflow();

    await page.locator(".experience-tab").nth(2).click();
    const dictionaryInput = page.locator(".dictionary-page-search input");
    await expect(dictionaryInput).toBeVisible();
    await expect(dictionaryInput).toHaveAttribute("placeholder", /.+/);
    await expect(page.locator(".dictionary-search-hint")).toHaveCount(0);
    await assertNoHorizontalOverflow();

    await page.getByRole("button", { name: "بیشتر", exact: true }).click();
    const toolsMenu = page.locator("#header-tools-menu");
    await expect(toolsMenu.locator(".menu-nav-copy small")).toHaveCount(0);
    await expect(toolsMenu.locator(".menu-nav-item").nth(1)).toHaveAttribute("aria-label", "خواندن متن ژاپنی");
    await toolsMenu.locator(".menu-nav-item").nth(1).click();
    let dialog = page.getByRole("dialog").last();
    await expect(dialog.locator(".reading-lab")).toBeVisible();
    await expect(dialog.locator("h2")).toBeVisible();
    await assertNoHorizontalOverflow();
    await dialog.locator(".dialog-close").click();
    await expect(dialog).toBeHidden();

    dialog = await openMenuItemAt(3);
    await expect(dialog.locator(".stats-header h2")).toBeVisible();
    await assertNoHorizontalOverflow();
    await dialog.locator(".dialog-close").click();
    await expect(dialog).toBeHidden();

    dialog = await openMenuItemAt(4);
    await expect(dialog.locator("#settings-title")).toBeVisible();
    for (const id of ["settings-learning-heading", "settings-scheduling-heading", "settings-data-heading", "settings-support-heading"]) {
      const section = dialog.locator("section[aria-labelledby='" + id + "']");
      await expect(section).toBeVisible();
      await expect(section.locator("#" + id)).toBeVisible();
    }
    await assertNoHorizontalOverflow();
    await dialog.locator(".dialog-close").click();
    await expect(dialog).toBeHidden();
  }
});

