import { test, expect } from "@playwright/test";

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

test("engine feedback is rendered through the React feedback contract", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#root .app-shell")).toBeVisible({ timeout: 20_000 });
  await waitForBoundary(page);

  const snapshot = await page.evaluate(async () => {
    const boundary = window.__KANJI5_V19_V2_BOUNDARY__;
    await boundary.setExercise({
      mode: "meaning",
      prompt: "Meaning",
      character: "学",
      stimulus: {
        kind: "kanji",
        primary: "学",
        inputPlaceholder: "school",
      },
      choices: [],
      answerHint: "school",
      contentId: "release-gate-meaning",
    });
    await boundary.setFeedback({
      mode: "meaning",
      outcome: "wrong",
      correct: false,
      quality: "wrong",
      score: 0,
      graderVersion: "1.9.0",
      schemaVersion: 1,
      reason: "Release gate feedback",
    });
    return boundary.snapshot();
  });

  expect(snapshot?.feedback?.outcome).toBe("wrong");
  await expect(page.locator("#exercise")).toBeVisible({ timeout: 5_000 });
  await expect(page.locator("#exercise")).toHaveAttribute("data-result", "wrong");
  await expect(page.locator(".exercise-feedback[role='status']")).toBeVisible();
});
