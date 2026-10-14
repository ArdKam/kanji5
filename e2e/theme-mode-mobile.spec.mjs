import { test, expect } from "@playwright/test";

test("System onboarding follows OS changes without darkening System-Light", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: "light" });
  await page.addInitScript(() => {
    for (const key of ["kanji5-public-onboarding-v1", "kanji5-onboarding-v2", "kanji5-onboarding-complete", "kanji5-onboarding-seen"]) {
      localStorage.removeItem(key);
    }
    localStorage.setItem("kanji5-ui-language", "en");
    localStorage.setItem("kanji5-theme", "system");
  });

  await page.goto("/");
  const onboarding = page.locator('[data-testid="onboarding-flow"]');
  await expect(onboarding).toBeVisible({ timeout: 20000 });
  await onboarding.getByRole("button", { name: /Let's begin/ }).click();
  await expect(onboarding.getByRole("heading", { name: "How you learn each kanji" })).toBeVisible();
  await onboarding.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(onboarding.getByRole("heading", { name: "Where should we start?" })).toBeVisible();
  const choice = onboarding.locator(".kanji5-onboarding-choice").first();
  await expect(choice).toBeVisible();
  const choiceBackground = () => choice.evaluate((element) => getComputedStyle(element).backgroundColor);

  await expect.poll(choiceBackground).toBe("rgba(253, 251, 247, 0.58)");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect.poll(choiceBackground).toBe("rgba(35, 33, 30, 0.82)");
  await page.emulateMedia({ colorScheme: "light" });
  await expect.poll(choiceBackground).toBe("rgba(253, 251, 247, 0.58)");
});

test("mobile Light/System selection does not leave OS dark surfaces behind", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.addInitScript(() => {
    localStorage.setItem("kanji5-onboarding-v2", "complete");
    localStorage.setItem("kanji5-ui-language", "en");
    localStorage.setItem("kanji5-theme", "dark");
  });

  await page.goto("/");
  await expect(page.locator("#root .app-shell")).toBeVisible({ timeout: 20000 });
  const surface = page.locator("#root .surface").first();
  const nav = page.locator("#root .experience-nav");
  await expect(surface).toBeVisible({ timeout: 10000 });
  await expect(nav).toBeVisible();

  const background = async (locator) =>
    locator.evaluate((element) => getComputedStyle(element).backgroundColor);
  const isDarkSurface = async () =>
    (await background(surface)).includes("35, 33, 30");

  await expect.poll(isDarkSurface).toBe(true);

  const chooseTheme = async (label) => {
    const menu = page.locator("#header-tools-menu");
    if (!(await menu.isVisible())) await page.locator(".header-menu-trigger").click();
    await expect(menu).toBeVisible();
    await menu.getByRole("button", { name: label, exact: true }).click();
  };

  await chooseTheme("Light");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect.poll(isDarkSurface).toBe(false);
  expect(await background(nav)).not.toContain("35, 33, 30");

  await chooseTheme("Dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect.poll(isDarkSurface).toBe(true);

  // A primary action must stay readable when global dark-mode button rules apply.
  const card = page.locator("#root .learning-card");
  const primary = card.locator(".learning-card-front .button.primary").first();
  await expect(primary).toBeVisible();
  const contrastRatio = async (locator) => locator.evaluate((element) => {
    const rgb = (value) => (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
    const luminance = (value) => rgb(value).map(channel => {
      const normalized = channel / 255;
      return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    }).reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index], 0);
    const foreground = getComputedStyle(element).color;
    const background = getComputedStyle(element).backgroundColor;
    const pair = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    return {
      ratio: (pair[0] + 0.05) / (pair[1] + 0.05),
      borderWidth: parseFloat(getComputedStyle(element).borderTopWidth),
      foreground,
      background,
    };
  });
  expect((await contrastRatio(primary)).ratio).toBeGreaterThanOrEqual(4.5);
  await primary.click();
  await expect(card).toHaveClass(/is-revealed/);
  const ratings = card.locator(".learning-back-footer .rating-grid .rating");
  await expect(ratings).toHaveCount(4);
  for (const rating of await ratings.all()) {
    const metrics = await contrastRatio(rating);
    expect(metrics.ratio, JSON.stringify(metrics)).toBeGreaterThanOrEqual(4.5);
    expect(metrics.borderWidth, JSON.stringify(metrics)).toBeLessThanOrEqual(1.5);
  }

  await chooseTheme("Light");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect.poll(isDarkSurface).toBe(false);
  for (const rating of await ratings.all()) {
    const metrics = await contrastRatio(rating);
    expect(metrics.ratio, JSON.stringify(metrics)).toBeGreaterThanOrEqual(4.5);
    expect(metrics.borderWidth, JSON.stringify(metrics)).toBeLessThanOrEqual(1.5);
  }

  await chooseTheme("System");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "system");
  await expect.poll(isDarkSurface).toBe(true);

  // In System mode, changing the device scheme should move all tracked surfaces.
  await page.emulateMedia({ colorScheme: "light" });
  await expect.poll(isDarkSurface).toBe(false);
  expect(await background(nav)).not.toContain("35, 33, 30");
});
