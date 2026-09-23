import { test, expect } from "@playwright/test";

test("learning card flips to a compact back face without card overflow", async ({ page }) => {
  await page.route("https://kanjiapi.dev/v1/words/**", async (route) => {
    const url = new URL(route.request().url());
    const character = decodeURIComponent(url.pathname.split("/").pop() || "学");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        { variants: [{ written: character + "生", pronounced: "がくせい" }], meanings: [{ glosses: ["student"] }] },
        { variants: [{ written: character + "校", pronounced: "がっこう" }], meanings: [{ glosses: ["school"] }] }
      ]),
    });
  });
  for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
  await expect(page.locator("#root .app-shell")).toBeVisible({ timeout: 20000 });
  const card = page.locator("#root .learning-card");
  await expect(card).toBeVisible({ timeout: 10000 });
  await expect(card).not.toHaveClass(/is-revealed/);

  const revealButton = page.getByRole("button", { name: /نمایش (پاسخ|اطلاعات کانجی)/ });
  const frontLayout = await card.evaluate((el) => {
    const readings = el.querySelector(".first-readings")?.getBoundingClientRect();
    const button = el.querySelector(".learning-card-front .button.wide")?.getBoundingClientRect();
    return { readingsBottom: readings?.bottom ?? 0, buttonTop: button?.top ?? 0 };
  });
  expect(frontLayout.buttonTop).toBeGreaterThanOrEqual(frontLayout.readingsBottom);
  await revealButton.dispatchEvent("click");
  await expect(card).toHaveClass(/is-revealed/, { timeout: 10000 });
  await expect(card.locator(".learning-card-back")).toBeVisible();
  await expect(card.locator(".learning-back-kanji")).toBeVisible();
  await expect(card.locator(".meanings")).toBeVisible();
  await expect(card.locator(".readings")).toBeVisible();
  await expect(card.locator(".rating-grid")).toBeVisible();
  const exampleCount = await card.locator(".example-row").count();
  expect(exampleCount).toBeLessThanOrEqual(2);
  if (exampleCount > 0) {
    await expect(card.locator(".example-meaning").first()).toBeVisible();
    const exampleMeanings = await card.locator(".example-meaning").allTextContents();
    expect(exampleMeanings).toContain("student");
  }

  const metrics = await card.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const back = el.querySelector(".learning-card-back");
    const br = back?.getBoundingClientRect();
    return {
      top: r.top,
      bottom: r.bottom,
      height: r.height,
      viewport: window.innerHeight,
      pageScrollHeight: document.scrollingElement?.scrollHeight ?? document.body.scrollHeight,
      overflow: getComputedStyle(el).overflow,
    };
  });
  expect(metrics.overflow).toBe("hidden");
  expect(metrics.height).toBeLessThanOrEqual(metrics.viewport);
  const ratingBounds = await card.locator(".rating-grid").evaluate((el) => {
    const r = el.getBoundingClientRect();
    const c = el.closest(".learning-card")?.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, cardTop: c?.top ?? 0, cardBottom: c?.bottom ?? 0 };
  });
  expect(ratingBounds.top).toBeGreaterThanOrEqual(ratingBounds.cardTop);
  expect(ratingBounds.bottom).toBeLessThanOrEqual(ratingBounds.cardBottom);
  }
});
