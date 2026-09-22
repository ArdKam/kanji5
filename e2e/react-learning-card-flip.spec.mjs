import { test, expect } from "@playwright/test";

test("learning card flips to a compact back face without card overflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#root .app-shell")).toBeVisible({ timeout: 20000 });
  const card = page.locator("#root .learning-card");
  await expect(card).toBeVisible({ timeout: 10000 });
  await expect(card).not.toHaveClass(/is-revealed/);

  await page.getByRole("button", { name: /نمایش (پاسخ|اطلاعات کانجی)/ }).dispatchEvent("click");
  await expect(card).toHaveClass(/is-revealed/, { timeout: 10000 });
  await expect(card.locator(".learning-card-back")).toBeVisible();
  await expect(card.locator(".learning-back-kanji")).toBeVisible();
  await expect(card.locator(".meanings")).toBeVisible();
  await expect(card.locator(".readings")).toBeVisible();
  await expect(card.locator(".rating-grid")).toBeVisible();
  const exampleCount = await card.locator(".example-row").count();
  expect(exampleCount).toBeLessThanOrEqual(2);

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
});

test("empty session progress indicator is hidden until a session has planned work", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#root .app-shell")).toBeVisible({ timeout: 20000 });
  await page.waitForTimeout(1500);

  await page.evaluate(() => {
    const base = window.__KANJI5_V19_V2_LAST_SNAPSHOT__ || {};
    document.dispatchEvent(new CustomEvent("kanji5:v1.9-v2-view-models", {
      detail: {
        ...base,
        session: {
          ...(base.session || {}),
          status: "active",
          plannedTotal: 0,
          remainingTotal: 0,
          completionFraction: 0,
        },
      },
    }));
  });
  await expect(page.locator(".session-progress")).toHaveCount(0);

  await page.evaluate(() => {
    const base = window.__KANJI5_V19_V2_LAST_SNAPSHOT__ || {};
    document.dispatchEvent(new CustomEvent("kanji5:v1.9-v2-view-models", {
      detail: {
        ...base,
        session: {
          ...(base.session || {}),
          status: "active",
          plannedTotal: 5,
          remainingTotal: 4,
          completionFraction: 0.2,
        },
      },
    }));
  });
  await expect(page.locator(".session-progress")).toBeVisible();
});
