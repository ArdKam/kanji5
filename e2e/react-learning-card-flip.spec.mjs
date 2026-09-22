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
  await expect(card.locator(".rating-grid")).toBeVisible();

  const metrics = await card.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const back = el.querySelector(".learning-card-back");
    const backStyle = back ? getComputedStyle(back) : null;
    return {
      height: r.height,
      viewport: window.innerHeight,
      overflow: getComputedStyle(el).overflow,
      backPosition: backStyle?.position ?? "",
      backTop: backStyle?.top ?? "",
      backRight: backStyle?.right ?? "",
      backBottom: backStyle?.bottom ?? "",
      backLeft: backStyle?.left ?? "",
    };
  });
  expect(metrics.overflow).toBe("hidden");
  expect(metrics.height).toBeLessThanOrEqual(metrics.viewport);
  expect(metrics.backPosition).toBe("absolute");
  expect(metrics.backTop).toBe("0px");
  expect(metrics.backRight).toBe("0px");
  expect(metrics.backBottom).toBe("0px");
  expect(metrics.backLeft).toBe("0px");
});
