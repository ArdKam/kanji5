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
  await onboarding.getByRole("button", { name: /Set up my first session/ }).click();
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
    // Chromium may serialize color-mix() results as Oklab instead of RGB.
    // Convert computed CSS colors to sRGB before calculating WCAG luminance.
    const channels = (value) => {
      const srgb = value.match(/^color\(srgb\s+([\d.e+-]+)\s+([\d.e+-]+)\s+([\d.e+-]+)/i);
      if (srgb) return srgb.slice(1, 4).map((channel) => Math.min(255, Math.max(0, Number(channel) * 255)));
      const rgb = value.match(/^rgba?\(([^)]+)\)$/i);
      if (rgb) return rgb[1].split(/[,\s]+/).filter(Boolean).slice(0, 3).map(Number);
      const oklab = value.match(/^oklab\(\s*([\d.e+-]+)\s+([+-]?[\d.e+-]+)\s+([+-]?[\d.e+-]+)(?:\s*\/\s*[\d.e+-]+)?\s*\)$/i);
      if (oklab) {
        const [L, a, b] = oklab.slice(1, 4).map(Number);
        const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
        const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
        const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
        const l = l_ ** 3;
        const m = m_ ** 3;
        const s = s_ ** 3;
        const linearRGB = [
          4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
          -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
          -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
        ];
        return linearRGB.map((channel) => {
          const encoded = channel <= 0.0031308
            ? 12.92 * channel
            : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055;
          return Math.min(255, Math.max(0, encoded * 255));
        });
      }
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
    expect(result.contrast, `${context} text must meet WCAG AA contrast (foreground=${result.foreground}; background=${result.background}; opacity=${await locator.evaluate(element => getComputedStyle(element).opacity)})`).toBeGreaterThanOrEqual(4.5);
    return result;
  };
  const primaryButton = page.locator("#root .learning-card .button.primary.wide");
  const expectPrimaryColors = async (context, expectedBackground, expectedForeground) => {
    await expect.poll(() => background(primaryButton)).toBe(expectedBackground);
    await expect.poll(() => primaryButton.evaluate((element) => getComputedStyle(element).color)).toBe(expectedForeground);
    return assertTextContrast(primaryButton, context);
  };
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
  await expectPrimaryColors("Manual Light primary button", "rgb(80, 95, 131)", "rgb(253, 251, 247)");
  expect(await background(nav)).not.toContain("35, 33, 30");

  await chooseTheme("Dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect.poll(isDarkSurface).toBe(true);
  await expectPrimaryColors("Manual Dark primary button", "rgb(224, 106, 95)", "rgb(23, 22, 20)");

  await chooseTheme("System");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "system");
  await expect.poll(isDarkSurface).toBe(true);
  await expectPrimaryColors("System + OS Dark primary button", "rgb(224, 106, 95)", "rgb(23, 22, 20)");

  // In System mode, changing the device scheme should move all tracked surfaces.
  await page.emulateMedia({ colorScheme: "light" });
  await expect.poll(isDarkSurface).toBe(false);
  expect(await background(nav)).not.toContain("35, 33, 30");
  await expectPrimaryColors("System + OS Light primary button", "rgb(80, 95, 131)", "rgb(253, 251, 247)");

  // Switch back to System + OS Dark before measuring dark-mode contrast.
  await page.emulateMedia({ colorScheme: "dark" });
  await expect.poll(isDarkSurface).toBe(true);
  await expectPrimaryColors("System after switching back to OS Dark", "rgb(224, 106, 95)", "rgb(23, 22, 20)");
  const selectedThemeControl = page.locator("#header-tools-menu .menu-theme-button.active");
  await expect(selectedThemeControl).toBeVisible();
  await assertTextContrast(selectedThemeControl, "Selected theme control");
  await page.keyboard.press("Tab");
  await selectedThemeControl.focus();
  const selectedThemeFocus = await controlStyle(selectedThemeControl);
  expect(selectedThemeFocus.outlineWidth).toBe("3px");
  expect(selectedThemeFocus.outlineRGB).toEqual([255, 155, 145]);
  const menuClose = page.locator(".header-tools-menu-close");
  await expect(menuClose).toBeVisible();
  await menuClose.hover();
  await assertTextContrast(menuClose, "Tools-menu close control in hover state");
  await menuClose.click();
  await expect(page.locator("#header-tools-menu")).toHaveCount(0);

  // Exercise the topic-selection dialog in a real Dark-mode browser state.
  const topicLauncher = page.locator("#root .learning-route-button");
  await expect(topicLauncher).toBeVisible({ timeout: 10_000 });
  await topicLauncher.click();
  const topicDialog = page.locator("dialog.topic-learning-dialog");
  await expect(topicDialog).toBeVisible();
  const topicSearch = topicDialog.locator(".topic-learning-search input");
  const topicSearchContainer = topicDialog.locator(".topic-learning-search");
  await topicSearch.focus();
  const topicSearchFocus = await controlStyle(topicSearchContainer);
  expect(topicSearchFocus.outlineWidth, "Topic search must expose a visible keyboard focus ring").toBe("3px");
  expect(topicSearchFocus.outlineStyle).toBe("solid");
  expect(topicSearchFocus.outlineRGB).toEqual([255, 155, 145]);
  const firstTopicBeforeSearch = topicDialog.locator(".topic-learning-tile").first();
  const topicLabel = await firstTopicBeforeSearch.locator("strong").innerText();
  await topicSearch.fill(topicLabel);
  await expect(topicDialog.locator(".topic-learning-tile")).toHaveCount(1);
  const selectedTopicTile = topicDialog.locator(".topic-learning-tile").first();
  await selectedTopicTile.click();
  await expect(selectedTopicTile).toHaveAttribute("aria-pressed", "true");
  await assertTextContrast(selectedTopicTile, "Selected topic tile");
  const activeFocusOption = topicDialog.locator(".topic-learning-focus-option.active");
  await expect(activeFocusOption).toBeVisible();
  await expect(activeFocusOption).toHaveAttribute("aria-pressed", "true");
  await assertTextContrast(activeFocusOption, "Selected topic-focus option");
  await activeFocusOption.hover();
  await assertTextContrast(activeFocusOption, "Selected topic-focus option hover state");
  const topicClose = topicDialog.locator(".topic-learning-close");
  await expect(topicClose).toBeVisible();
  await topicClose.hover();
  await assertTextContrast(topicClose, "Topic-dialog close control hover state");
  await topicClose.click();
  await expect(topicDialog).toBeHidden();

  const reveal = primaryButton;
  await expect(reveal).toBeVisible({ timeout: 10_000 });
  await expectPrimaryColors("System Dark primary button", "rgb(224, 106, 95)", "rgb(23, 22, 20)");

  await reveal.hover();
  await expect.poll(async () => (await controlStyle(reveal)).backgroundRGB).toEqual([228, 124, 114]);
  const revealHover = await assertTextContrast(reveal, "System Dark primary hover state");
  expect(revealHover.backgroundRGB, "Hover must retain the accessible brand-red palette").toEqual([228, 124, 114]);

  await page.keyboard.press("Tab");
  await reveal.focus();
  const revealFocus = await assertTextContrast(reveal, "System Dark primary focus state");
  expect(revealFocus.outlineWidth).toBe("3px");
  expect(revealFocus.outlineStyle).toBe("solid");
  expect(revealFocus.outlineRGB).toEqual([255, 155, 145]);

  await reveal.click();
  await expect(reveal, "The reveal control must enter a real disabled state after activation").toBeDisabled();
  expect(await reveal.evaluate(element => getComputedStyle(element).cursor)).toBe("not-allowed");
  expect(await reveal.evaluate(element => getComputedStyle(element).opacity)).toBe("0.58");
  const backAudio = page.locator("#root .learning-card-back .audio-button").first();
  await expect(backAudio).toBeVisible({ timeout: 10_000 });
  await assertTextContrast(backAudio, "System Dark learning-card audio control");
  await backAudio.hover();
  await expect.poll(() => background(backAudio)).toBe("rgb(23, 22, 20)");
  const audioHover = await assertTextContrast(backAudio, "System Dark audio hover state");
  expect(audioHover.background).toBe("rgb(23, 22, 20)");
  await page.keyboard.press("Tab");
  await backAudio.focus();
  const audioFocus = await assertTextContrast(backAudio, "System Dark audio focus state");
  expect(audioFocus.outlineWidth).toBe("3px");
  expect(audioFocus.outlineStyle).toBe("solid");
  expect(audioFocus.outlineRGB).toEqual([255, 155, 145]);

  const ratings = page.locator("#root .learning-card .rating-grid .rating");
  await expect(ratings).toHaveCount(4, { timeout: 10_000 });
  const readRatingPalette = () => {
    // Read clean, off-screen copies so a menu click cannot leave the pointer over
    // a rating and make :hover/:active styles masquerade as the base theme token.
    return ratings.evaluateAll((elements) => {
      const host = document.createElement("div");
      host.className = "learning-card";
      host.style.cssText = "position:fixed;left:-10000px;top:0;visibility:hidden;pointer-events:none";
      const grid = document.createElement("div");
      grid.className = "rating-grid";
      const clones = elements.map((element) => element.cloneNode(true));
      for (const clone of clones) grid.append(clone);
      host.append(grid);
      const appShell = document.querySelector("#root .app-shell");
      if (!(appShell instanceof HTMLElement)) throw new Error("Learning app shell missing while reading theme palette");
      appShell.append(host);
      const rgb = (value) => {
        const srgb = value.match(/^color\(srgb\s+([\d.e+-]+)\s+([\d.e+-]+)\s+([\d.e+-]+)/i);
        if (srgb) return srgb.slice(1, 4).map(Number).map((channel) => channel * 255);
        const match = value.match(/^rgba?\(([^)]+)\)$/i);
        if (match) return match[1].split(/[ ,\s]+/).filter(Boolean).slice(0, 3).map(Number);
        throw new Error("Unsupported computed CSS color: " + value);
      };
      const luminance = (value) => rgb(value).map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      }).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
      const palette = clones.map((element) => {
        const style = getComputedStyle(element);
        const pair = [luminance(style.color), luminance(style.backgroundColor)].sort((a, b) => b - a);
        const rating = [...element.classList].find((name) => /^rating-(again|hard|good|easy)$/.test(name));
        return { rating, background: rgb(style.backgroundColor).map(Math.round), contrast: (pair[0] + 0.05) / (pair[1] + 0.05) };
      });
      host.remove();
      return palette;
    });
  };
  const expectedBackgrounds = {
    "rating-again": [51, 39, 36],
    "rating-hard": [51, 47, 39],
    "rating-good": [40, 49, 40],
    "rating-easy": [39, 48, 59],
  };
  const assertRatingPalette = async () => {
    // Leave the hover state before checking base tokens; a pointer left on a
    // rating after the theme-menu click legitimately produces a color-mixed hover surface.
    await page.mouse.move(0, 0);
    // Theme tokens transition between schemes; wait for the full target values
    // instead of sampling an in-flight color midway through the CSS transition.
    await expect.poll(async () => Object.fromEntries((await readRatingPalette()).map((item) => [item.rating, item.background]))).toEqual(expectedBackgrounds);
    const palette = await readRatingPalette();
    expect(Object.fromEntries(palette.map((item) => [item.rating, item.background]))).toEqual(expectedBackgrounds);
    expect(palette.every((item) => item.contrast >= 4.5), "Every feedback rating label must meet WCAG AA contrast").toBe(true);
  };

  await assertRatingPalette(); // System + OS Dark
  await chooseTheme("Dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await assertRatingPalette(); // Manually selected Dark
});
