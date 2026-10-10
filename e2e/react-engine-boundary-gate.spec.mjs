import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("kanji5-onboarding-v2", "complete");
  });
});

const waitForBoundary = async (page) => {
  await expect.poll(async () => page.evaluate(() => Boolean(window.__KANJI5_V19_V2_BOUNDARY__))).toBe(true);
};

test("engine snapshot reaches the React learning surface through the v2 boundary", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#root .app-shell")).toBeVisible({ timeout: 20_000 });
  await waitForBoundary(page);

  const snapshot = await page.evaluate(async () => window.__KANJI5_V19_V2_BOUNDARY__.snapshot());
  expect(snapshot?.learning?.character).toBeTruthy();
  expect(snapshot?.learning?.meanings?.length ?? 0).toBeGreaterThan(0);
  expect(page.locator(".learning-card")).toBeVisible();
  await expect(page.locator(".kanji-display")).toHaveText(snapshot.learning.character);
});

test("engine exercise state reaches React and remains isolated from the Learning surface", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#root .app-shell")).toBeVisible({ timeout: 20_000 });
  await waitForBoundary(page);

  await expect(page.locator(".learning-card")).toBeVisible({ timeout: 10_000 });
  const character = await page.locator(".learning-card .kanji-display").textContent();
  await page.locator(".learning-card .button.wide").click();
  await expect(page.locator(".learning-card .rating-good")).toBeVisible({ timeout: 5_000 });
  const reviewsBefore = await page.evaluate(() => JSON.parse(localStorage.getItem("kanji5-v1-reviews") || "[]").length);
  await page.locator(".learning-card .rating-good").click();
  await expect.poll(async (before) => page.evaluate((value) => JSON.parse(localStorage.getItem("kanji5-v1-reviews") || "[]").length > value, reviewsBefore)).toBe(true, { timeout: 10_000 });
  await expect.poll(async (target) => page.evaluate((value) => {
    const cards = JSON.parse(localStorage.getItem("kanji5-v1-cards") || "{}");
    return Object.prototype.hasOwnProperty.call(cards, value);
  }, String(character || "").trim())).toBe(true, { timeout: 10_000 });
  await expect.poll(async () => page.evaluate(async () => Boolean((await window.__KANJI5_V19_V2_BOUNDARY__.snapshot()).session?.status))).not.toBe("");
  await page.evaluate((target) => {
    window.__KANJI5_V19_RECOVERY_TARGET__ = { character: target, mode: "reading", contentId: target };
  }, String(character || "").trim());

  await page.getByRole("button", { name: /^(?:Practice|تمرین)$/i }).click();
  await expect(page.locator(".practice-start-button")).toBeVisible({ timeout: 5_000 });
  await page.locator(".practice-start-button").click();
  await expect(page.locator("#exercise")).toBeVisible({ timeout: 15_000 });

  const snapshot = await page.evaluate(async () => {
    const boundary = window.__KANJI5_V19_V2_BOUNDARY__;
    const learning = await boundary.snapshot();
    await boundary.setExercise({
      mode: "reading",
      prompt: "Reading",
      character: learning.learning?.character || "学",
      stimulus: {
        kind: "reading",
        primary: (learning.learning?.on?.[0] || learning.learning?.kun?.[0] || "がく"),
        inputPlaceholder: "Type your answer",
      },
      choices: [],
      answerHint: learning.learning?.on?.[0] || learning.learning?.kun?.[0] || "がく",
      contentId: "release-gate-reading",
    });
    return boundary.snapshot();
  });

  expect(snapshot?.exercise?.mode).toBe("reading");
  await expect(page.locator("#exercise")).toBeVisible({ timeout: 5_000 });
  await expect(page.locator(".learning-card")).toHaveCount(0);
  await expect(page.locator(".active-recall-task")).toBeVisible();
  await expect(page.locator(".active-recall-task")).not.toHaveText("");
});
