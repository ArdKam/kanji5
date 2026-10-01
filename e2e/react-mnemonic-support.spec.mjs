test.use({ serviceWorkers: "allow" });

import { test, expect } from "@playwright/test";

async function goToBackPage(card, targetIndex) {
  for (let index = 0; index < targetIndex; index += 1) {
    await card.locator(".pager-button").nth(1).click();
  }
  await expect(card.locator(".learning-back-page.active")).toHaveCount(1);
}

test("learning card exposes reading and vocabulary memory bridges without altering grading", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem("kanji5-ui-language", "en");
  });
  await page.goto("/");
  const card = page.locator("#root .learning-card");
  await expect(card).toBeVisible({ timeout: 20000 });

  await card.getByRole("button", { name: "Show kanji information" }).click();
  await expect(card).toHaveClass(/is-revealed/, { timeout: 10000 });

  await expect(card.locator(".learning-back-page").nth(0).locator(".learning-back-meaning")).toBeVisible();
  await expect(card.locator(".learning-back-page").nth(0).locator(".learning-back-readings")).toBeVisible();
  await card.locator(".learning-back-page-nav .learning-back-page-shortcut").nth(2).click();
  const support = card.locator(".learning-back-page.active .mnemonic-support");
  await expect(support).toBeVisible();
  await expect(support).toHaveAttribute("data-hint-stage", /^(new|recovery|early|stable)$/);
  await expect(support.locator(".mnemonic-support-reading")).toHaveText(/\S+/);
  await expect(support.locator(".mnemonic-support-item p")).not.toHaveCount(0);
 
});


test("component-aware mnemonic data remains available from the offline service-worker cache", async ({ page, context }) => {
  await page.goto("/");
  await expect(page.locator("#root .app-shell")).toBeVisible({ timeout: 20000 });
  await expect.poll(async () => page.evaluate(() => Boolean(navigator.serviceWorker?.controller))).toBe(true);
  await page.evaluate(() => navigator.serviceWorker.ready);

  await context.setOffline(true);
  const result = await page.evaluate(async () => {
    const response = await fetch("./kanji-components.json");
    const data = await response.json();
    return {
      ok: response.ok,
      status: response.status,
      hasLake: Array.isArray(data?.components?.["湖"]),
    };
  });
  expect(result).toEqual({ ok: true, status: 200, hasLake: true });
});
