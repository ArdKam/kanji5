import { test, expect } from "@playwright/test";

test("Learning Card review buttons remain tappable and keyboard reachable in compact layouts", async ({ browser }) => {
  for (const scenario of [
    { language: "en", theme: "light", reducedMotion: "no-preference", viewport: { width: 360, height: 640 } },
    { language: "fa", theme: "dark", reducedMotion: "reduce", viewport: { width: 844, height: 390 } },
  ]) {
    const context = await browser.newContext({ viewport: scenario.viewport });
    try {
      await context.addInitScript(({ language, theme }) => {
        localStorage.setItem("kanji5-onboarding-v2", "complete");
        localStorage.setItem("kanji5-ui-language", language);
        localStorage.setItem("kanji5-theme", theme);
      }, scenario);
      const page = await context.newPage();
      await page.emulateMedia({
        colorScheme: scenario.theme,
        reducedMotion: scenario.reducedMotion,
      });
      await page.goto("/");
      await expect(page.locator("#root .app-shell")).toBeVisible({ timeout: 20000 });

      const card = page.locator("#root .learning-card");
      await expect(card).toBeVisible({ timeout: 10000 });
      await card.locator(".learning-card-front .button.primary.wide").click();
      await expect(card).toHaveClass(/is-revealed/, { timeout: 10000 });

      const ratings = card.locator(".learning-back-footer .rating-grid .rating");
      await expect(ratings).toHaveCount(4);
      for (const rating of await ratings.all()) {
        const bounds = await rating.boundingBox();
        expect(bounds, "Each review button must have measurable rendered bounds").not.toBeNull();
        expect(bounds.width, "Review buttons should be at least 44px wide where practical").toBeGreaterThanOrEqual(44);
        expect(bounds.height, "Review buttons should be at least 44px tall where practical").toBeGreaterThanOrEqual(44);
        await expect(rating).toBeEnabled();
      }

      await ratings.nth(0).focus();
      await expect(ratings.nth(0)).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(ratings.nth(1)).toBeFocused();
      const focus = await ratings.nth(1).evaluate(element => {
        const style = getComputedStyle(element);
        return {
          outlineStyle: style.outlineStyle,
          outlineWidth: Number.parseFloat(style.outlineWidth),
        };
      });
      expect(focus.outlineStyle).not.toBe("none");
      expect(focus.outlineWidth).toBeGreaterThanOrEqual(2);
    } finally {
      await context.close();
    }
  }
});
