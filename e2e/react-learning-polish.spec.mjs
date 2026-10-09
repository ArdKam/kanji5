import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("kanji5-onboarding-v2", "complete"));
});

test("learning front has one clear focal point and a descriptive reveal action", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const card = page.locator("#root .learning-card");
  await expect(card).toBeVisible({ timeout: 20000 });
  await expect(card.locator(".learning-card-front .learning-context-label")).toBeVisible();
  await expect(card.locator(".learning-card-front h2")).toBeHidden();
  await expect(card.locator(".learning-card-front .first-readings")).toHaveCount(0);
  await expect(card.getByRole("button", { name: "Reveal meaning & readings" })).toBeVisible();
});

test("topic learning opens from Learning and starts a scoped topic session", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await expect(page.locator("#root .learning-card")).toBeVisible({ timeout: 20000 });
  await page.getByRole("button", { name: "Learn by topic" }).click();

  const dialog = page.getByRole("dialog", { name: "Choose a learning topic" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".topic-learning-tile")).toHaveCount(24);
  await dialog.getByRole("button", { name: /Nature & land/ }).click();
  await expect(dialog.getByRole("button", { name: "Start learning this topic" })).toBeEnabled();
  await dialog.getByRole("button", { name: "Start learning this topic" }).click();
  await expect(dialog).toBeHidden({ timeout: 10000 });
  await expect(page.locator(".learning-session-context")).toContainText("Nature & land");
  await expect(page.locator(".learning-card-front .learning-context-label")).toContainText("Nature & land");
});
