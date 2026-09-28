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


async function goToBackPage(page, card, targetIndex) {
  const currentIndex = await card.locator(".learning-back-page.active").evaluate((el) =>
    Array.from(el.parentElement?.children ?? []).indexOf(el),
  );
  const delta = targetIndex - currentIndex;
  const direction = delta >= 0 ? 1 : -1;
  const steps = Math.abs(delta);
  for (let index = 0; index < steps; index += 1) {
    const button = card.locator(".pager-button").nth(direction > 0 ? 1 : 0);
    await expect(button).toBeEnabled();
    await button.dispatchEvent("click");
    await page.waitForTimeout(520);
  }
  await expect(card.locator(".learning-back-page").nth(targetIndex)).toHaveClass(/active/);
  await expect(card.locator(".learning-back-page.active")).toHaveCount(1);
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

test("learning card exposes five full-content back pages in Persian and English", async ({ page }) => {
  await routeExamples(page, 5);
  for (const language of ["fa", "en"]) {
    for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      const card = await revealLearningCard(page, language);

      expect(await card.locator(".learning-back-page").count()).toBe(4);
      await expect(card).toHaveAttribute("data-back-page-count", "4");
      await expect(card.locator(".learning-back-tab")).toHaveCount(4);
      await expect(card.locator('.learning-back-tab[role="tab"]')).toHaveCount(4);
      await expect(card.locator(".learning-back-tab.active")).toHaveCount(1);
      await expect(card.locator(".learning-back-page").nth(0).locator(".meanings")).toBeVisible();
      await expect(card.locator(".learning-back-page").nth(0).locator(".readings")).toHaveCount(1);
      const exampleCount = await card.locator(".learning-back-page").nth(1).locator(".example-row").count();
      expect(exampleCount).toBeGreaterThan(2);
      await expect(card.locator(".learning-back-page").nth(2).locator(".mnemonic-page")).toHaveCount(1);
      await expect(card.locator(".learning-back-page").nth(3).locator(".stroke-page")).toHaveCount(1);
      await expect(card.locator(".learning-back-page").nth(0).locator(".example-row")).toHaveCount(0);
      await expect(card.locator(".learning-back-page").nth(2).locator(".example-row")).toHaveCount(0);
      await expect(card.locator(".learning-back-page").nth(3).locator(".example-row")).toHaveCount(0);
      await assertCardBounds(card);

      for (let pageIndex = 1; pageIndex < 4; pageIndex += 1) {
        await goToBackPage(page, card, pageIndex);
        await expect(card.locator(".learning-back-page.active")).toHaveAttribute(
          "aria-label",
          pageIndex === 1 ? /(نمونهٔ واژگانی|Vocabulary examples)/ :
          pageIndex === 2 ? /(یادسپار|Mnemonic|Personal mnemonic)/ :
          /(ترتیب نوشتن|Stroke order)/,
        );
        await expect(card.locator(".learning-back-tab.active")).toHaveCount(1);
        await expect(card.locator(".learning-back-tab.active")).toHaveAttribute("aria-selected","true");
        await assertCardBounds(card);
      }

      const pageMetrics = await card.locator(".learning-back-page").evaluateAll((pages) =>
        pages.map((page) => {
          const scroll = page.querySelector(".learning-back-scroll");
          return { visible: getComputedStyle(page).visibility, clientHeight: scroll?.clientHeight ?? 0, scrollHeight: scroll?.scrollHeight ?? 0 };
        }),
      );
      expect(pageMetrics.filter((m) => m.visible === "visible")).toHaveLength(1);
      expect(pageMetrics).toHaveLength(4);
    }
  }
});

test("learning card exposes an immediately visible KanjiVG stroke-order viewer", async ({ page }) => {
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

  await goToBackPage(page, card, 3);
  const panel = card.locator(".learning-back-page.active .stroke-order-panel.is-expanded");
  await expect(panel).toBeVisible();
  await expect(card.locator(".learning-back-page.active .stroke-order-tool")).toHaveCount(0);
  await expect(panel.locator(".stroke-order-toggle")).toHaveAttribute("aria-expanded", "true");
  await expect(panel.locator(".stroke-order-toggle")).toHaveAttribute("aria-controls", "stroke-order-content");
  await expect(panel.locator(".stroke-order-count")).toHaveText("3 strokes");
  await expect(panel.locator(".stroke-order-progress")).toHaveText("0 / 3");
  await expect(panel.locator(".stroke-order-active")).toHaveCount(1);

  const expandedStage = await panel.locator(".stroke-order-stage svg").boundingBox();
  expect(expandedStage?.width ?? 0).toBeGreaterThan(120);
  const singleColumnLayout = await card.evaluate(() => {
    const strokePanel = document.querySelector(".learning-card-back .learning-back-page.active .stroke-order-panel.is-expanded");
    const columns = (el) => el ? getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length : 0;
    return { strokePanelColumns: strokePanel ? columns(strokePanel) : 0 };
  });
  expect(singleColumnLayout.strokePanelColumns).toBe(1);

  await panel.getByRole("button", { name: "Next" }).click();
  await expect(panel.locator(".stroke-order-progress")).toHaveText("1 / 3");
  await panel.getByRole("button", { name: "Previous" }).click();
  await expect(panel.locator(".stroke-order-progress")).toHaveText("0 / 3");
});

test("learning card back navigation uses labeled tabs without losing swipe/pager controls", async ({ page }) => {
  await routeExamples(page, 5);
  for (const language of ["fa", "en"]) {
    for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      const card = await revealLearningCard(page, language);
      await expect(card.locator(".learning-card-front h2")).toHaveCount(0);
      await expect(card.locator(".learning-card-context")).toBeVisible();
      const counter = card.locator(".learning-card-counter");
      const counterCount = await counter.count();
      expect(counterCount).toBeLessThanOrEqual(1);
      if (counterCount === 1) await expect(counter).toHaveText(/\d+\s*\/\s*\d+/);
      await expect(card.locator(".learning-back-tabs .learning-back-tab")).toHaveCount(4);

      for (let index = 0; index < 4; index += 1) {
        const tab = card.locator(".learning-back-tab").nth(index);
        await expect(tab).toHaveAttribute("role", "tab");
        await expect(tab).toHaveAttribute("aria-controls", "learning-back-page-"+index);
        await tab.click();
        await expect(tab).toHaveAttribute("aria-selected", "true");
        await expect(card.locator(".learning-back-page.active")).toHaveCount(1);
        await expect(card.locator(".learning-back-page.active")).toHaveAttribute("id", "learning-back-page-"+index);
      }
    }
  }
});

test("stroke-order entry auto-scrolls the visible viewer fully into view", async ({ page }) => {
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
  await page.setViewportSize({ width: 390, height: 640 });
  await page.addInitScript(() => localStorage.setItem("kanji5-ui-language", "en"));
  await page.goto("/");

  const card = page.locator("#root .learning-card");
  await expect(card).toBeVisible({ timeout: 20000 });
  await card.getByRole("button", { name: "Show kanji information" }).click();
  await expect(card).toHaveClass(/is-revealed/, { timeout: 10000 });

  const strokePage = card.locator(".learning-back-page").nth(3);
  const scrollContainer = strokePage.locator(".learning-back-scroll");
  await scrollContainer.evaluate((el) => { el.scrollTop = 0; });
  const scrollBefore = await scrollContainer.evaluate((el) => el.scrollTop);

  await page.evaluate(() => {
    const calls = [];
    const scroll = document.querySelector(".learning-back-page.active .learning-back-scroll");
    if (!(scroll instanceof HTMLElement)) throw new Error("Learning scroll container not found");
    const original = scroll.scrollTo.bind(scroll);
    window.__kanji5ScrollToCalls = calls;
    window.__kanji5ScrollTarget = scroll;
    window.__kanji5ScrollOriginal = original;
    scroll.scrollTo = function (options) {
      calls.push(typeof options === "object" ? { ...options } : { left: arguments[0], top: arguments[1] });
      return original(options);
    };
  });

  await card.locator(".learning-back-tab").nth(3).click();
  const panel = card.locator(".learning-back-page.active .stroke-order-panel.is-expanded");
  await expect(panel).toBeVisible();

  await expect.poll(async () => {
    return await panel.evaluate((el) => {
      const target = el.getBoundingClientRect();
      const scroll = el.closest(".learning-back-scroll")?.getBoundingClientRect();
      if (!scroll) return false;
      return target.top >= scroll.top - 1 && target.bottom <= scroll.bottom + 1;
    });
  }, { timeout: 1800, intervals: [50, 100, 200] }).toBe(true);

  const scrollAfter = await scrollContainer.evaluate((el) => el.scrollTop);
  expect(scrollAfter).toBeGreaterThanOrEqual(scrollBefore);

  const calls = await page.evaluate(() => window.__kanji5ScrollToCalls || []);
  expect(calls.some((call) => call.behavior === "smooth")).toBe(true);

  await page.evaluate(() => {
    const target = window.__kanji5ScrollTarget;
    const original = window.__kanji5ScrollOriginal;
    if (target instanceof HTMLElement && typeof original === "function") target.scrollTo = original;
  });
});

test("personal mnemonic editor auto-scrolls fully into view when opened", async ({ page }) => {
  await routeExamples(page, 5);
  await page.addInitScript(() => {
    localStorage.setItem("kanji5-ui-language", "en");
  });

  for (const viewport of [
    { width: 390, height: 640 },
    { width: 1280, height: 640 },
  ]) {
    await page.setViewportSize(viewport);
  await page.goto("/");

  const card = page.locator("#root .learning-card");
  await expect(card).toBeVisible({ timeout: 20000 });
  await card.getByRole("button", { name: "Show kanji information" }).click();
  await expect(card).toHaveClass(/is-revealed/, { timeout: 10000 });

  await goToBackPage(page, card, 2);
  const scrollContainer = card.locator(".learning-back-page.active .learning-back-scroll");
  const mnemonic = card.locator(".learning-back-page.active .mnemonic-tool");
  const trigger = mnemonic.getByRole("button", { name: "Personal mnemonic" });
  await expect(trigger).toBeVisible();

  await scrollContainer.evaluate((el) => { el.scrollTop = 0; });

  await page.evaluate(() => {
    const calls = [];
    const original = Element.prototype.scrollTo;
    window.__kanji5MnemonicScrollToCalls = calls;
    window.__kanji5MnemonicOriginalScrollTo = original;
    Element.prototype.scrollTo = function (options) {
      if (this instanceof HTMLElement && this.classList.contains("learning-back-scroll")) {
        calls.push(typeof options === "object" ? { ...options } : { left: arguments[0], top: arguments[1] });
      }
      return original.apply(this, arguments);
    };
  });

  await trigger.click();
  await expect(mnemonic).toHaveClass(/is-open/);
  await expect(mnemonic.locator("textarea")).toBeVisible();
  await expect(mnemonic.locator(".mnemonic-editor-footer .actions")).toBeVisible();

  await expect.poll(async () => {
    return await mnemonic.evaluate((el) => {
      const target = el.getBoundingClientRect();
      const scroll = el.closest(".learning-back-scroll")?.getBoundingClientRect();
      if (!scroll) return false;
      return target.top >= scroll.top - 1 && target.bottom <= scroll.bottom + 1;
    });
  }, { timeout: 1800, intervals: [50, 100, 200] }).toBe(true);

  const calls = await page.evaluate(() => window.__kanji5MnemonicScrollToCalls || []);
  expect(calls.some((call) => call.behavior === "smooth")).toBe(true);

    await page.evaluate(() => {
      if (window.__kanji5MnemonicOriginalScrollTo) {
        Element.prototype.scrollTo = window.__kanji5MnemonicOriginalScrollTo;
      }
    });
  }
});

test("short learning cards stay single-page and keep examples with core information", async ({ page }) => {
  await routeExamples(page, 1);
  await page.setViewportSize({ width: 390, height: 844 });
  const card = await revealLearningCard(page);
  await expect(card).toHaveAttribute("data-back-page-count", "4");
  await expect(card.locator(".learning-back-page-nav")).toBeVisible();
  await expect(card.locator(".learning-back-page.active .learning-back-overview")).toBeVisible();
  await goToBackPage(page, card, 1);
  await expect(card.locator(".learning-back-page.active .example-row")).toHaveCount(1);
  await assertCardBounds(card);
});


test("learning rating feedback controls stay fully inside the card on mobile",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  const card=await revealLearningCard(page,"en");
  const grid=card.locator(".rating-grid");
  await expect(grid).toBeVisible();
  const metrics=await grid.evaluate(el=>{
    const gridRect=el.getBoundingClientRect();
    const buttons=[...el.querySelectorAll("button")].map(button=>{
      const r=button.getBoundingClientRect();
      return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,visible:r.width>0&&r.height>0};
    });
    return {left:gridRect.left,right:gridRect.right,buttons};
  });
  expect(metrics.buttons).toHaveLength(4);
  for(const button of metrics.buttons){
    expect(button.visible).toBe(true);
    expect(button.left).toBeGreaterThanOrEqual(metrics.left-1);
    expect(button.right).toBeLessThanOrEqual(metrics.right+1);
    expect(button.width).toBeGreaterThanOrEqual(44);
    expect(button.height).toBeGreaterThanOrEqual(44);
  }
  const navTop = await page.locator(".experience-nav").evaluate(el => el.getBoundingClientRect().top);
  expect(Math.max(...metrics.buttons.map(button => button.bottom))).toBeLessThanOrEqual(navTop + 1);
});


test("critical header title and drawer direction stay on the correct viewport edges", async ({ page }) => {
  for (const scenario of [
    { language: "en", menu: "More", expectedSide: "left" },
    { language: "fa", menu: "بیشتر", expectedSide: "right" },
  ]) {
    await page.addInitScript((value) => localStorage.setItem("kanji5-ui-language", value), scenario.language);
    for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      await page.goto("/");
      await expect(page.locator("#root .app-shell")).toBeVisible({ timeout: 20000 });

      const titleBounds = await page.locator(".header-brand h1").boundingBox();
      if (!titleBounds) throw new Error("Header title bounds unavailable");
      expect(Math.abs((titleBounds.x + titleBounds.width / 2) - viewport.width / 2)).toBeLessThanOrEqual(1.5);

      await page.getByRole("button", { name: scenario.menu, exact: true }).click();
      const drawer = page.locator("#header-tools-menu");
      await expect(drawer).toBeVisible();
      await page.waitForTimeout(350);

      const drawerBounds = await drawer.boundingBox();
      const triggerBounds = await page.getByRole("button", { name: scenario.menu, exact: true }).boundingBox();
      if (!drawerBounds || !triggerBounds) throw new Error("Header menu geometry unavailable");
      if (viewport.width >= 761) {
        if (scenario.expectedSide === "left") {
          expect(Math.abs(drawerBounds.x - triggerBounds.x)).toBeLessThanOrEqual(1);
        } else {
          expect(Math.abs((drawerBounds.x + drawerBounds.width) - (triggerBounds.x + triggerBounds.width))).toBeLessThanOrEqual(1);
        }
      } else if (scenario.expectedSide === "left") {
        expect(drawerBounds.x).toBeLessThanOrEqual(1);
      } else {
        expect(drawerBounds.x + drawerBounds.width).toBeGreaterThanOrEqual(viewport.width - 1);
      }
    }
  }
});

test("structured header menu keeps account accessible and exposes inline preferences", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("kanji5-ui-language", "en");
    localStorage.setItem("kanji5-theme", "light");
  });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");
  await expect(page.locator("#root .app-shell")).toBeVisible({ timeout: 20000 });

  await page.getByRole("button", { name: "More", exact: true }).click();
  const menu = page.locator("#header-tools-menu");
  await expect(menu).toBeVisible();
  await expect(page.locator(".account-button:visible")).toBeVisible();
  await expect(menu.locator(".header-tools-menu-section").nth(0)).toContainText("Learning tools");
  await expect(menu.getByRole("button", { name: "Grammar guide", exact: true })).toBeVisible();
  await expect(menu.getByRole("button", { name: "Reading lab", exact: true })).toBeVisible();
  await expect(menu.getByRole("button", { name: "Prepared mnemonics", exact: true })).toBeVisible();
  await expect(menu.getByRole("button", { name: "Stats", exact: true })).toBeVisible();

  await menu.getByRole("button", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await menu.getByRole("button", { name: "فارسی", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator(".account-button:visible")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(page.getByRole("button", { name: "بیشتر", exact: true })).toBeFocused();
});

test("mobile menu leaves the account control above the drawer and clickable", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("kanji5-ui-language", "fa"));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("#root .app-shell")).toBeVisible({ timeout: 20000 });

  await page.getByRole("button", { name: "بیشتر", exact: true }).click();
  await expect(page.locator("#header-tools-menu")).toBeVisible();
  const account = page.locator(".account-button:visible");
  await expect(account).toBeVisible();

  const accountBounds = await account.boundingBox();
  if (!accountBounds) throw new Error("Account bounds unavailable");
  expect(await account.evaluate((el) => getComputedStyle(el).zIndex)).toBe("130");
  await account.click();
  await expect(page.locator(".account-dialog:visible")).toBeVisible();
});

test("menu sections open as in-flow pages rather than centered overlays", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("kanji5-ui-language", "en"));
  await page.goto("/");
  await expect(page.locator("#root .learning-card")).toBeVisible({ timeout: 10000 });

  await page.getByRole("button", { name: "More", exact: true }).click();
  await page.locator("#header-tools-menu").getByRole("button", { name: "Settings", exact: true }).click();

  const pageDialog = page.locator(".secondary-page-dialog");
  await expect(pageDialog).toBeVisible();
  await expect(pageDialog).toHaveAttribute("open", "");
  await expect(page.locator("#root .learning-card")).toHaveCount(0);

  const position = await pageDialog.evaluate((el) => getComputedStyle(el).position);
  expect(position).toBe("static");

  await page.getByRole("button", { name: "Back to learning card", exact: true }).click();
  await expect(page.locator("#root .learning-card")).toBeVisible({ timeout: 10000 });
  await expect(page.locator(".secondary-page-dialog")).toHaveCount(0);
});

test("a short fast horizontal touch flick advances the learning-card pager", async ({ page }) => {
  await routeExamples(page, 5);
  await page.setViewportSize({ width: 390, height: 844 });
  const card = await revealLearningCard(page, "en");
  const pager = card.locator(".learning-back-pager-shell");
  await expect(card.locator(".learning-back-page").nth(0)).toHaveClass(/active/);

  await swipePager(page, pager, 0.55, 0.47);
  await expect(card.locator(".learning-back-page").nth(1)).toHaveClass(/active/);
});
