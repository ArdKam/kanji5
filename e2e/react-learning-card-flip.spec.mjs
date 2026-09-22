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
    return { top: r.top, bottom: r.bottom, height: r.height, viewport: window.innerHeight, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight };
  });
  expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight + 2);
  expect(metrics.height).toBeLessThanOrEqual(metrics.viewport);
});
