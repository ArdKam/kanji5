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
  const controlStyle = async (locator) => locator.evaluate((element) => {
    const channels = (value) => {
      const srgb = value.match(/^color\(srgb\s+([\d.e+-]+)\s+([\d.e+-]+)\s+([\d.e+-]+)/i);
      if (srgb) return srgb.slice(1, 4).map((channel) => Number(channel) * 255);
      const rgb = value.match(/^rgba?\(([^)]+)\)$/i);
      if (rgb) return rgb[1].split(/[,\s/]+/).filter(Boolean).slice(0, 3).map(Number);
      throw new Error("Unsupported computed CSS color: " + value);
    };
    const luminance = (value) => channels(value).map((channel) => {
      const normalized = channel / 255;
      return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
    const style = getComputedStyle(element);
    const pair = [luminance(style.color), luminance(style.backgroundColor)].sort((a, b) => b - a);
    return {
      background: style.backgroundColor,
      backgroundRGB: channels(style.backgroundColor).map(Math.round),
      foreground: style.color,
      contrast: (pair[0] + 0.05) / (pair[1] + 0.05),
      outlineColor: style.outlineColor,
      outlineRGB: style.outlineStyle === "none" || style.outlineColor === "auto"
        ? null
        : channels(style.outlineColor).map(Math.round),
      outlineWidth: style.outlineWidth,
      outlineStyle: style.outlineStyle
    };
  });
  const assertTextContrast = async (locator, context) => {
    const result = await controlStyle(locator);
    expect(result.contrast, `${context} text must meet WCAG AA contrast`).toBeGreaterThanOrEqual(4.5);
    return result;
  };
  const primaryButton = page.locator("#root .learning-card .button.primary.wide");
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
  const lightPrimary = await assertTextContrast(primaryButton, "Manual Light primary button");
  expect(lightPrimary.background, "Manual Light must retain the Light-mode palette").toBe("rgb(80, 95, 131)");
  expect(lightPrimary.foreground).toBe("rgb(253, 251, 247)");
  expect(await background(nav)).not.toContain("35, 33, 30");

  await chooseTheme("Dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect.poll(isDarkSurface).toBe(true);
  const manualDarkPrimary = await assertTextContrast(primaryButton, "Manual Dark primary button");
  expect(manualDarkPrimary.background, "Manual Dark primary must use brand red").toBe("rgb(224, 106, 95)");
  expect(manualDarkPrimary.foreground).toBe("rgb(23, 22, 20)");

  await chooseTheme("System");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "system");
  await expect.poll(isDarkSurface).toBe(true);
  const systemDarkPrimary = await assertTextContrast(primaryButton, "System + OS Dark primary button");
  expect(systemDarkPrimary.background, "System + OS Dark primary must use brand red").toBe("rgb(224, 106, 95)");
  expect(systemDarkPrimary.foreground).toBe("rgb(23, 22, 20)");

  // In System mode, changing the device scheme should move all tracked surfaces.
  await page.emulateMedia({ colorScheme: "light" });
  await expect.poll(isDarkSurface).toBe(false);
  expect(await background(nav)).not.toContain("35, 33, 30");
  const systemLightPrimary = await assertTextContrast(primaryButton, "System + OS Light primary button");
  expect(systemLightPrimary.background, "System + OS Light must not inherit Dark brand-red styling").toBe("rgb(80, 95, 131)");
  expect(systemLightPrimary.foreground).toBe("rgb(253, 251, 247)");

  // Switch back to System + OS Dark before measuring dark-mode contrast.
  await page.emulateMedia({ colorScheme: "dark" });
  await expect.poll(isDarkSurface).toBe(true);
  const systemDarkAfterOsChange = await assertTextContrast(primaryButton, "System after switching back to OS Dark");
  expect(systemDarkAfterOsChange.background).toBe("rgb(224, 106, 95)");
  const selectedThemeControl = page.locator("#header-tools-menu .menu-theme-button.active");
  await expect(selectedThemeControl).toBeVisible();
  await assertTextContrast(selectedThemeControl, "Selected theme control");
  await page.keyboard.press("Tab");
  await selectedThemeControl.focus();
  const selectedThemeFocus = await controlStyle(selectedThemeControl);
  expect(selectedThemeFocus.outlineWidth).toBe("3px");
  expect(selectedThemeFocus.outlineRGB).toEqual([233, 148, 140]);
  const menuClose = page.locator(".header-tools-menu-close");
  await expect(menuClose).toBeVisible();
  await menuClose.hover();
  await assertTextContrast(menuClose, "Tools-menu close control in hover state");
  await menuClose.click();
  await expect(page.locator("#header-tools-menu")).toHaveCount(0);

  const reveal = primaryButton;
  await expect(reveal).toBeVisible({ timeout: 10_000 });
  const revealNormal = await assertTextContrast(reveal, "System Dark primary button");
  expect(revealNormal.background).toBe("rgb(224, 106, 95)");
  expect(revealNormal.foreground).toBe("rgb(23, 22, 20)");

  await reveal.hover();
  const revealHover = await assertTextContrast(reveal, "System Dark primary hover state");
  expect(revealHover.backgroundRGB, "Hover must retain the accessible brand-red palette").toEqual([228, 124, 114]);

  await page.keyboard.press("Tab");
  await reveal.focus();
  const revealFocus = await assertTextContrast(reveal, "System Dark primary focus state");
  expect(revealFocus.outlineWidth).toBe("3px");
  expect(revealFocus.outlineStyle).toBe("solid");
  expect(revealFocus.outlineRGB).toEqual([233, 148, 140]);

  await reveal.click();
  await expect(reveal, "The reveal control must enter a real disabled state after activation").toBeDisabled();
  expect(await reveal.evaluate(element => getComputedStyle(element).cursor)).toBe("not-allowed");
  expect(await reveal.evaluate(element => getComputedStyle(element).opacity)).toBe("0.58");
  const backAudio = page.locator("#root .learning-card-back .audio-button").first();
  await expect(backAudio).toBeVisible({ timeout: 10_000 });
  await assertTextContrast(backAudio, "System Dark learning-card audio control");
  await backAudio.hover();
  const audioHover = await assertTextContrast(backAudio, "System Dark audio hover state");
  expect(audioHover.background).toBe("rgb(23, 22, 20)");
  await page.keyboard.press("Tab");
  await backAudio.focus();
  const audioFocus = await assertTextContrast(backAudio, "System Dark audio focus state");
  expect(audioFocus.outlineWidth).toBe("3px");
  expect(audioFocus.outlineStyle).toBe("solid");
  expect(audioFocus.outlineRGB).toEqual([233, 148, 140]);

  const ratings = page.locator("#root .learning-card .rating-grid .rating");
  await expect(ratings).toHaveCount(4, { timeout: 10_000 });
  const assertRatingPalette = async () => {
    const palette = await ratings.evaluateAll((elements) => elements.map((element) => {
      const rgb = (value) => value.match(/\d+/g).slice(0, 3).map(Number);
      const luminance = (value) => value.map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      }).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
      const style = getComputedStyle(element);
      const pair = [luminance(rgb(style.color)), luminance(rgb(style.backgroundColor))].sort((a, b) => b - a);
      return { background: style.backgroundColor, contrast: (pair[0] + 0.05) / (pair[1] + 0.05) };
    }));
    expect(palette.map((item) => item.background), "Feedback ratings must preserve distinct Easy/Good/Hard/Again colors").toEqual([
      "rgb(39, 48, 59)",
      "rgb(40, 49, 40)",
      "rgb(51, 47, 39)",
      "rgb(51, 39, 36)",
    ]);
    expect(palette.every((item) => item.contrast >= 4.5), "Every feedback rating label must meet WCAG AA contrast").toBe(true);
  };

  await assertRatingPalette(); // System + OS Dark
  await chooseTheme("Dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await assertRatingPalette(); // Manually selected Dark
});
