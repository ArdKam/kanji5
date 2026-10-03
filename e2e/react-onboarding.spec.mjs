import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    for (const key of ["kanji5-public-onboarding-v1", "kanji5-onboarding-v2", "kanji5-onboarding-complete", "kanji5-onboarding-seen"]) localStorage.removeItem(key);
  });
});


async function fresh(page) {
  await page.goto("/");
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("kanji5-")) localStorage.removeItem(key);
    }
    sessionStorage.clear();
    localStorage.setItem("kanji5-ui-language", "en");
  });
  await page.reload();
}

async function reachStartingPoint(page) {
  const onboarding = page.locator('[data-testid="onboarding-flow"]');
  await expect(onboarding).toBeVisible({ timeout: 20000 });
  await expect(page.locator("#root .app-shell")).toHaveCount(0);
  await onboarding.getByRole("button", { name: /Start today's learning/ }).click();
  await expect(onboarding.getByRole("heading", { name: "Learn, recall, review" })).toBeVisible();
  await onboarding.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(onboarding.getByRole("heading", { name: "Where should we start?" })).toBeVisible();
  return onboarding;
}

test("first-run onboarding is a dedicated full-page guest-first journey", async ({ page }) => {
  await fresh(page);
  const onboarding = await reachStartingPoint(page);
  await onboarding.getByRole("button", { name: /Start from the beginning/ }).click();
  await onboarding.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(onboarding.getByRole("heading", { name: "How many new kanji each day?" })).toBeVisible();
  await expect(onboarding.getByRole("button", { name: /^5 new kanji$/ })).toHaveAttribute("aria-pressed", "true");
  await onboarding.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(onboarding.getByRole("heading", { name: "An account is optional" })).toBeVisible();
  await expect(onboarding.getByRole("button", { name: "Continue as a guest", exact: true })).toBeVisible();
  await onboarding.getByRole("button", { name: "Continue as a guest", exact: true }).click();
  await expect(onboarding).toHaveCount(0);
  await expect(page.locator("#root .app-shell")).toBeVisible({ timeout: 20000 });
  await expect.poll(() => page.evaluate(() => localStorage.getItem("kanji5-onboarding-v2"))).toBe("complete");
});

test("placement path shares the existing kanji diagnostic contract", async ({ page }) => {
  await fresh(page);
  const onboarding = await reachStartingPoint(page);
  await onboarding.getByRole("button", { name: /Check my kanji level/ }).click();
  await onboarding.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(onboarding.locator(".kanji5-onboarding-stimulus")).toBeVisible({ timeout: 20000 });

  for (let index = 0; index < 12; index += 1) {
    await onboarding.locator(".kanji5-onboarding-option").first().click();
    if (index < 11) {
      await onboarding.getByRole("button", { name: "Next question", exact: true }).click();
    }
  }
  await onboarding.locator(".kanji5-onboarding-primary").click();

  await expect(onboarding.getByRole("heading", { name: "Here is a suggested starting point" })).toBeVisible();
  await expect(onboarding.locator(".kanji5-onboarding-result")).toContainText("N2");
  await onboarding.getByRole("button", { name: /Use this starting point/ }).click();
  await expect(onboarding.getByRole("heading", { name: "How many new kanji each day?" })).toBeVisible();
});

test("onboarding resumes its transient setup after reload", async ({ page }) => {
  await fresh(page);
  const onboarding = await reachStartingPoint(page);
  await onboarding.locator(".kanji5-onboarding-choice").filter({ hasText: "I know some kanji" }).click();
  await expect(onboarding.locator(".kanji5-onboarding-choice").filter({ hasText: "I know some kanji" })).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => page.evaluate(() => {
    const raw = localStorage.getItem("kanji5-onboarding-progress-v2");
    if (!raw) return null;
    try { return JSON.parse(raw)?.draft?.startingPoint ?? null; } catch { return null; }
  })).toBe("some-knowledge");
  await page.reload();
  await expect.poll(() => page.evaluate(() => {
    const raw = localStorage.getItem("kanji5-onboarding-progress-v2");
    if (!raw) return null;
    try { return JSON.parse(raw)?.draft?.startingPoint ?? null; } catch { return null; }
  })).toBe("some-knowledge");
  const resumed = page.locator('[data-testid="onboarding-flow"]');
  await expect(resumed).toBeVisible({ timeout: 20000 });
  await resumed.getByRole("button", { name: /Start today's learning/ }).click();
  await resumed.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(resumed.getByRole("heading", { name: "Where should we start?" })).toBeVisible();
  await expect(resumed.locator(".kanji5-onboarding-choice").filter({ hasText: "I know some kanji" })).toHaveAttribute("aria-pressed", "true");
});