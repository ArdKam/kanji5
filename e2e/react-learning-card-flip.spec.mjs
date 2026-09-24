import { test, expect } from "@playwright/test";

async function routeExamples(page, count) {
  await page.route("https://kanjiapi.dev/v1/words/**", async (route) => {
    const url = new URL(route.request().url());
    const character = decodeURIComponent(url.pathname.split("/").pop() || "学");
    const pool = [
      [character + "生", "がくせい", "student"],
      [character + "校", "がっこう", "school"],
      [character + "語", "ご", "language"],
      [character + "習", "がくしゅう", "study"],
      [character + "室", "しつ", "room"],
    ];
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        pool.slice(0, count).map(([written, pronounced, gloss]) => ({
          variants: [{ written, pronounced }],
          meanings: [{ glosses: [gloss] }],
        })),
      ),
    });
  });
}

async function revealLearningCard(page) {
  await page.goto("/");
  await expect(page.locator("#root .app-shell")).toBeVisible({ timeout: 20000 });
  const card = page.locator("#root .learning-card");
  await expect(card).toBeVisible({ timeout: 10000 });
  const revealButton = page.getByRole("button", { name: /نمایش (پاسخ|اطلاعات کانجی)/ });
  await revealButton.click();
  await expect(card).toHaveClass(/is-revealed/, { timeout: 10000 });
  await page.waitForTimeout(600);
  return card;
}

async function assertCardBounds(card) {
  const metrics = await card.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return {
      bottom: r.bottom,
      height: r.height,
      viewport: window.innerHeight,
      overflow: getComputedStyle(el).overflow,
    };
  });
  expect(metrics.overflow).toBe("hidden");
  expect(metrics.bottom).toBeLessThanOrEqual(metrics.viewport + 1);
  expect(metrics.height).toBeLessThanOrEqual(metrics.viewport);
}

test("learning card keeps dense information on separate back pages without vertical page overflow", async ({ page }) => {
  await routeExamples(page, 5);
  for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    const card = await revealLearningCard(page);

    const identityCount = await card.locator(".learning-back-kanji, .component-breakdown-target").count();
    expect(identityCount).toBe(1);
    await expect(card.locator(".meanings")).toBeVisible();
    await expect(card.locator(".readings")).toBeVisible();
    await expect(card).toHaveAttribute("data-back-page-count", "2");
    await expect(card.locator(".learning-back-page-nav")).toBeVisible();
    await expect(card.locator(".learning-back-page.active .learning-back-overview")).toBeVisible();
    await expect(card.locator(".learning-back-page.active .example-row")).toHaveCount(0);
    await expect(card.locator(".learning-back-page").nth(1).locator(".example-row")).toHaveCount(5);

    const pageMetrics = await card.locator(".learning-back-page").evaluateAll((pages) =>
      pages.map((page) => {
        const scroll = page.querySelector(".learning-back-scroll");
        return {
          visible: getComputedStyle(page).visibility,
          clientHeight: scroll?.clientHeight ?? 0,
          scrollHeight: scroll?.scrollHeight ?? 0,
        };
      }),
    );
    for (const metrics of pageMetrics) {
      expect(metrics.visible).toBe("visible");
      expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight + 2);
    }

    await assertCardBounds(card);
    const nextButton = card.locator(".pager-button").nth(1);
    const previousButton = card.locator(".pager-button").nth(0);
    await expect(previousButton).toBeDisabled();
    await nextButton.click();
    await expect(card.locator(".learning-back-page.active")).toHaveAttribute("aria-label", "نمونهٔ واژگانی");
    await expect(card.locator(".learning-back-page.active .example-row")).toHaveCount(5);
    await expect(previousButton).toBeEnabled();
    await expect(nextButton).toBeDisabled();
    await assertCardBounds(card);

    const pager = card.locator(".learning-back-pager-shell");
    const box = await pager.boundingBox();
    if (!box) throw new Error("Pager bounds unavailable");
    await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.5, { steps: 4 });
    await page.mouse.up();
    await expect(card.locator(".learning-back-page.active")).toHaveAttribute("aria-label", /Core information/);
    await expect(previousButton).toBeDisabled();
    await expect(nextButton).toBeEnabled();

    const footerBounds = await card.locator(".learning-back-footer").evaluate((el) => {
      const footer = el.getBoundingClientRect();
      const rating = el.querySelector(".rating-grid")?.getBoundingClientRect();
      const cardRect = el.closest(".learning-card")?.getBoundingClientRect();
      return {
        footerTop: footer.top,
        footerBottom: footer.bottom,
        ratingTop: rating?.top ?? 0,
        ratingBottom: rating?.bottom ?? 0,
        cardTop: cardRect?.top ?? 0,
        cardBottom: cardRect?.bottom ?? 0,
      };
    });
    expect(footerBounds.footerTop).toBeGreaterThanOrEqual(footerBounds.cardTop - 1);
    expect(footerBounds.footerBottom).toBeLessThanOrEqual(footerBounds.cardBottom + 1);
    expect(footerBounds.ratingTop).toBeGreaterThanOrEqual(footerBounds.footerTop - 1);
    expect(footerBounds.ratingBottom).toBeLessThanOrEqual(footerBounds.footerBottom + 1);
  }
});

test("short learning cards stay single-page and keep examples with core information", async ({ page }) => {
  await routeExamples(page, 1);
  await page.setViewportSize({ width: 390, height: 844 });
  const card = await revealLearningCard(page);
  await expect(card).toHaveAttribute("data-back-page-count", "1");
  await expect(card.locator(".learning-back-page-nav")).toHaveCount(0);
  await expect(card.locator(".learning-back-page.active .example-row")).toHaveCount(1);
  await expect(card.locator(".learning-back-page.active .learning-back-overview")).toBeVisible();
  await assertCardBounds(card);
});
