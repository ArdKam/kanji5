import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("kanji5-onboarding-v2", "complete");
    localStorage.setItem("kanji5-ui-language", "en");
  });
});

test("learning front has one clear focal point and a descriptive reveal action", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const card = page.locator("#root .learning-card");
  await expect(card).toBeVisible({ timeout: 20000 });
  await expect(card.locator(".learning-card-front .learning-context-label")).toBeVisible();
  await expect(card.locator(".learning-card-front h2")).toHaveClass(/sr-only/);
  await expect(card.locator(".learning-card-front .first-readings")).toHaveCount(0);
  await expect(card.getByRole("button", { name: "Reveal meaning & readings" })).toBeVisible();
});

test("learning card and rating footer stay clear of the fixed bottom navigation", async ({ page }) => {
  for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }, { width: 390, height: 640 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const card = page.locator("#root .learning-card");
    await expect(card).toBeVisible({ timeout: 20000 });
    await page.getByRole("button", { name: "Reveal meaning & readings" }).click();
    await expect(card).toHaveClass(/is-revealed/);
    const geometry = await page.evaluate(() => {
      const card = document.querySelector("#root .learning-card");
      const footer = card?.querySelector(".learning-back-footer");
      const nav = document.querySelector("#root .experience-nav");
      if (!card || !footer || !nav) return null;
      return {
        cardBottom: card.getBoundingClientRect().bottom,
        footerBottom: footer.getBoundingClientRect().bottom,
        navTop: nav.getBoundingClientRect().top,
      };
    });
    if (!geometry) throw new Error("Card/footer/navigation geometry is unavailable");
    expect(geometry.footerBottom).toBeLessThanOrEqual(geometry.navTop);
    expect(geometry.cardBottom).toBeLessThanOrEqual(geometry.navTop);
  }
});

test("topic learning opens from Learning and starts a scoped topic session", async ({ page }) => {
  page.on("pageerror", error => console.log("[topic-learning pageerror]", error.stack || error.message));
  page.on("console", message => {
    if (message.type() === "error") console.log("[topic-learning console]", message.text());
  });
  page.on("requestfailed", request => console.log("[topic-learning requestfailed]", request.url(), request.failure()?.errorText || ""));

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await expect(page.locator("#root .learning-card")).toBeVisible({ timeout: 20000 });
  await page.getByRole("button", { name: "Learn by topic" }).click();

  const dialog = page.getByRole("dialog", { name: "Choose a learning topic" });
  await page.waitForTimeout(500);
  const reactEntryUrls = await page.evaluate(() =>
    performance.getEntriesByType("resource")
      .map(resource => resource.name)
      .filter(url => new URL(url).pathname.endsWith("/react-dist/kanji5-react.js"))
  );
  expect(reactEntryUrls.length).toBeGreaterThan(0);
  expect(new Set(reactEntryUrls.map(url => new URL(url).search)).size).toBe(1);
  expect(new URL(reactEntryUrls[0]).search).toBe("");
  if (!(await dialog.isVisible().catch(() => false))) {
    const state = await page.evaluate(() => ({
      rootPresent: Boolean(document.querySelector("#root .app-shell")),
      bodyText: document.body.innerText.slice(-1800),
      dialogs: [...document.querySelectorAll("dialog")].map(item => ({
        className: item.className,
        open: item.open,
        ariaLabelledBy: item.getAttribute("aria-labelledby"),
        text: item.innerText.slice(0, 500),
      })),
      topicResources: performance.getEntriesByType("resource")
        .map(item => item.name)
        .filter(name => name.includes("TopicLearningDialog")),
    }));
    console.log("[topic-learning state]", JSON.stringify(state));
  }
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".topic-learning-tile")).toHaveCount(24);
  await dialog.getByRole("button", { name: /Nature & land/ }).click();
  await expect(dialog.getByRole("button", { name: "Start learning this topic" })).toBeEnabled();
  await dialog.getByRole("button", { name: "Start learning this topic" }).click();
  await expect(dialog).toBeHidden({ timeout: 10000 });
  await expect(page.locator(".learning-session-context")).toContainText("Nature & land");
  await expect(page.locator(".learning-card-front .learning-context-label")).toContainText("Nature & land");
});
