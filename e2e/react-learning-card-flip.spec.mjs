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

async function mouseSwipePager(page, pager, fromRatio, toRatio) {
  const box = await pager.boundingBox();
  if (!box) throw new Error("Pager bounds unavailable");
  const y = box.y + box.height * 0.5;
  const fromX = box.x + box.width * fromRatio;
  const toX = box.x + box.width * toRatio;
  await page.mouse.move(fromX, y);
  await page.mouse.down();
  await page.mouse.move(toX, y, { steps: 5 });
  await page.mouse.up();
}

let nextTouchPointerId = 1;

async function swipePager(page, pager, fromRatio, toRatio) {
  const pointerId = nextTouchPointerId++;
  const box = await pager.boundingBox();
  if (!box) throw new Error("Pager bounds unavailable");
  const y = box.y + box.height * 0.5;
  const fromX = box.x + box.width * fromRatio;
  const toX = box.x + box.width * toRatio;
  await pager.dispatchEvent("pointerdown", {
    pointerType: "touch",
    pointerId,
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: fromX,
    clientY: y,
  });
  await pager.dispatchEvent("pointermove", {
    pointerType: "touch",
    pointerId,
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: fromX + (toX - fromX) * 0.5,
    clientY: y,
  });
  await pager.dispatchEvent("pointerup", {
    pointerType: "touch",
    pointerId,
    isPrimary: true,
    button: 0,
    buttons: 0,
    clientX: toX,
    clientY: y,
  });
  await page.waitForTimeout(520);
}

async function revealLearningCard(page, language = "fa") {
  await page.addInitScript((value) => localStorage.setItem("kanji5-ui-language", value), language);
  await page.goto("/");
  await expect(page.locator("#root .app-shell")).toBeVisible({ timeout: 20000 });
  const card = page.locator("#root .learning-card");
  await expect(card).toBeVisible({ timeout: 10000 });
  const revealButton = page.getByRole("button", { name: /(نمایش (پاسخ|اطلاعات کانجی)|Show (answer|kanji information))/ });
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

test("learning card keeps dense information on separate back pages in Persian and English", async ({ page }) => {
  await routeExamples(page, 5);
  for (const language of ["fa", "en"]) {
    for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      const card = await revealLearningCard(page, language);

    const identityCount = await card.locator(".learning-back-kanji, .component-breakdown-target").count();
    expect(identityCount).toBe(1);
    await expect(card.locator(".meanings")).toBeVisible();
    await expect(card.locator(".readings")).toBeVisible();
    await expect(card).toHaveAttribute("data-back-page-count", "2");
    await expect(card.locator(".learning-back-page-nav")).toBeVisible();
    await expect(card.locator(".pager-indicators .pager-dot")).toHaveCount(2);
    await expect(card.locator(".pager-dot.active")).toHaveCount(1);
    if (viewport.width <= 760) {
      await expect(card.locator(".pager-button").first()).toBeHidden();
      await expect(card.locator(".pager-indicators")).toBeVisible();
    } else {
      await expect(card.locator(".pager-button").first()).toBeVisible();
      await expect(card.locator(".pager-button").nth(1)).toBeVisible();
    }
    await expect(card.locator(".learning-back-page.active .learning-back-overview")).toBeVisible();
    await expect(card.locator(".learning-back-page.active .example-row")).toHaveCount(0);
    const totalExampleCount = await card.locator(".example-row").count();
    expect(totalExampleCount).toBeGreaterThan(2);
      await expect(card.locator(".learning-back-page").nth(1).locator(".example-row")).toHaveCount(totalExampleCount);

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
    expect(pageMetrics[0].visible).toBe("visible");
    expect(pageMetrics[1].visible).toBe("hidden");
    pageMetrics.forEach((metrics, index) => {
      expect(metrics.scrollHeight, "page "+index+" metrics: "+JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.clientHeight + 2);
    });

    await assertCardBounds(card);
    const nextButton = card.locator(".pager-button").nth(1);
    const previousButton = card.locator(".pager-button").nth(0);
    await expect(previousButton).toBeDisabled();
    if (viewport.width <= 760) {
      const pager = card.locator(".learning-back-pager-shell");
      await swipePager(page, pager, 0.75, 0.25);
    } else {
      await nextButton.click();
    }
      await expect(card.locator(".learning-back-page.active")).toHaveAttribute("aria-label", /(نمونهٔ واژگانی|Vocabulary examples)/);
    await expect(card.locator(".learning-back-page.active .example-row")).toHaveCount(totalExampleCount);
    await expect(previousButton).toBeEnabled();
    await expect(nextButton).toBeDisabled();
    await expect(card.locator(".pager-dot.active")).toHaveCount(1);
    await assertCardBounds(card);

    const pager = card.locator(".learning-back-pager-shell");
    if (viewport.width <= 760) {
      await swipePager(page, pager, 0.25, 0.75);
    } else {
      await mouseSwipePager(page, pager, 0.25, 0.75);
    }
    await expect(card.locator(".learning-back-page.active")).toHaveAttribute("aria-label", /^(Core information|صفحه اطلاعات اصلی)$/);
    await expect(previousButton).toBeDisabled();
    await expect(nextButton).toBeEnabled();

    if (viewport.width <= 760) {
      await swipePager(page, pager, 0.75, 0.25);
      await expect(card.locator(".learning-back-page.active")).toHaveAttribute("aria-label", /(نمونهٔ واژگانی|Vocabulary examples)/);
      await expect(previousButton).toBeEnabled();
      await expect(nextButton).toBeDisabled();
      await swipePager(page, pager, 0.25, 0.75);
      await expect(card.locator(".learning-back-page.active")).toHaveAttribute("aria-label", /^(Core information|صفحه اطلاعات اصلی)$/);
      await expect(previousButton).toBeDisabled();
      await expect(nextButton).toBeEnabled();
    }

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
  }
});

test("learning card exposes a playable KanjiVG stroke-order viewer", async ({ page }) => {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg">
<g id="kvg:StrokePaths_05b66">
  <path id="kvg:05b66-s1" d="M10,10 L30,30"/>
  <path id="kvg:05b66-s2" d="M30,30 L50,10"/>
  <path id="kvg:05b66-s3" d="M50,10 L70,30"/>
</g>
</svg>`;
  await page.route("https://raw.githubusercontent.com/KanjiVG/kanjivg/422b5538595676da918c288a4230cb5e22a1ee7e/kanji/**.svg", async route => {
    await route.fulfill({ status: 200, contentType: "image/svg+xml", body: svg });
  });
  await page.addInitScript(() => localStorage.setItem("kanji5-ui-language", "en"));
  await page.goto("/");
  const card = page.locator("#root .learning-card");
  await expect(card).toBeVisible({ timeout: 20000 });
  await card.getByRole("button", { name: "Show kanji information" }).click();
  await expect(card).toHaveClass(/is-revealed/, { timeout: 10000 });

  const panel = card.locator(".stroke-order-panel");
  await expect(panel).toBeVisible();
  await expect(panel.locator(".stroke-order-count")).toHaveText("3 strokes");
  await expect(panel.locator(".stroke-order-progress")).toHaveText("0 / 3");
  await expect(panel.getByRole("button", { name: "Play" })).toBeVisible();
  console.log("STROKE_CONTROLS_LAYOUT", JSON.stringify(await panel.locator(".stroke-order-controls").evaluate((el) => ({
    gridTemplateColumns: getComputedStyle(el).gridTemplateColumns,
    rects: Array.from(el.querySelectorAll("button")).map((button) => {
      const r = button.getBoundingClientRect();
      return { text: button.textContent, left: r.left, top: r.top, right: r.right, bottom: r.bottom, position: getComputedStyle(button).position, pointerEvents: getComputedStyle(button).pointerEvents, gridColumn: getComputedStyle(button).gridColumn };
    })
  }))));
  await panel.getByRole("button", { name: "Next" }).click();
  await expect(panel.locator(".stroke-order-progress")).toHaveText("1 / 3");
  await panel.getByRole("button", { name: "Previous" }).click();
  await expect(panel.locator(".stroke-order-progress")).toHaveText("0 / 3");
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
