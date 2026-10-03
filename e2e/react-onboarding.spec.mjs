import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem("kanji5-public-onboarding-v1");
    localStorage.removeItem("kanji5-onboarding-v2");
  });
});


async function fresh(page) {
  await page.addInitScript(() => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("kanji5-")) localStorage.removeItem(key);
    }
    sessionStorage.clear();
    localStorage.setItem("kanji5-ui-language", "en");
  });
  await page.goto("/");
}

async function reachStartingPoint(page) {
  const onboarding = page.locator('[data-testid="onboarding-flow"]');
  await expect(onboarding).toBeVisible({ timeout: 20000 });
  await expect(page.locator("#root .app-shell")).toHaveCount(0);
  await onboarding.getByRole("button", { name: /Start learning today/ }).click();
  await expect(onboarding.getByRole("heading", { name: "Learn, recall, review" })).toBeVisible();
  await onboarding.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(onboarding.getByRole("heading", { name: "Where should we start?" })).toBeVisible();
  return onboarding;
}

test("first-run onboarding is a dedicated full-page guest-first journey", async ({ page }) => {
  const onboarding = await reachStartingPoint(page);
  await onboarding.getByRole("button", { name: /Start from the beginning/ }).click();
  await onboarding.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(onboarding.getByRole("heading", { name: "How many new kanji each day?" })).toBeVisible();
  await expect(onboarding.getByRole("button", { name: /5 new kanji/, exact: true })).toHaveAttribute("aria-pressed", "true");
  await onboarding.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(onboarding.getByRole("heading", { name: "An account is optional" })).toBeVisible();
  await expect(onboarding.getByRole("button", { name: "Continue as a guest", exact: true })).toBeVisible();
  await onboarding.getByRole("button", { name: "Continue as a guest", exact: true }).click();
  await expect(onboarding).toHaveCount(0);
  await expect(page.locator("#root .app-shell")).toBeVisible({ timeout: 20000 });
  await expect.poll(() => page.evaluate(() => localStorage.getItem("kanji5-onboarding-v2"))).toBe("complete");
});

test("placement path shares the existing kanji diagnostic contract", async ({ page }) => {
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

  await expect(onboarding.getByRole("heading", { name: "Here is a suggested starting point" })).toBeVisible();
  await expect(onboarding.locator(".kanji5-onboarding-result")).toContainText("N2");
  await onboarding.getByRole("button", { name: /Use this starting point/ }).click();
  await expect(onboarding.getByRole("heading", { name: "How many new kanji each day?" })).toBeVisible();
});

test("onboarding resumes its transient setup after reload", async ({ page }) => {
  const onboarding = await reachStartingPoint(page);
  await onboarding.getByRole("button", { name: "I know some kanji", exact: true }).click();
  await expect(onboarding.getByRole("button", { name: "I know some kanji", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  const resumed = page.locator('[data-testid="onboarding-flow"]');
  await expect(resumed).toBeVisible({ timeout: 20000 });
  await expect(resumed.getByRole("heading", { name: "Where should we start?" })).toBeVisible();
  await expect(resumed.getByRole("button", { name: "I know some kanji", exact: true })).toHaveAttribute("aria-pressed", "true");
});
