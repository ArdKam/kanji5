import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("kanji5-onboarding-v2", "complete"));
});

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
  const shortcut = card.locator(".learning-back-page-shortcut").nth(targetIndex);
  await expect(shortcut).toBeVisible();
  await shortcut.dispatchEvent("click");
  await page.waitForTimeout(520);
  await expect(card.locator(".learning-back-page").nth(targetIndex)).toHaveClass(/active/);
  await expect(card.locator(".learning-back-page.active")).toHaveCount(1);
}

async function revealLearningCard(page, language = "fa") {
  await page.addInitScript((value) => { localStorage.setItem("kanji5-ui-language", value); localStorage.setItem("kanji5-onboarding-v2", "complete"); }, language);
  await page.goto("/");
  await expect(page.locator("#root .app-shell")).toBeVisible({ timeout: 20000 });
  const card = page.locator("#root .learning-card");
  await expect(card).toBeVisible({ timeout: 10000 });
  const revealButton = page.getByRole("button", { name: /(نمایش (پاسخ|اطلاعات کانجی|معنی و خوانش‌ها)|Reveal meaning & readings|Show (answer|kanji information))/ });
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

test("learning-card answer presents kanji, meaning, readings and structure in a stable hierarchy", async ({ browser }) => {
  await Promise.all(["en", "fa"].map(async (language) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    try {
      const page = await context.newPage();
      await routeExamples(page, 2);
      const card = await revealLearningCard(page, language);
      const overview = card.locator(".learning-back-page").nth(0);
      const identityHeading = overview.locator(".learning-back-identity-heading");
      const glyph = identityHeading.locator(".learning-back-kanji");
      const meaningLabel = identityHeading.getByRole("heading", { level: 3 });
      const primaryMeaning = identityHeading.locator(".learning-back-meaning");
      const readings = overview.locator(".learning-back-readings-block");
      const structure = overview.locator(".learning-back-identity-visual");

      await expect(glyph).toBeVisible();
      await expect(glyph).toHaveAttribute("lang", "ja");
      await expect(glyph).toHaveAttribute("dir", "ltr");
      expect((await glyph.innerText()).trim()).not.toBe("");
      await expect(meaningLabel).toBeVisible();
      await expect(primaryMeaning).toBeVisible();
      await expect(readings).toBeVisible();
      await expect(structure).toBeVisible();

      for (const viewport of [
        { width: 1280, height: 720 },
        { width: 390, height: 844 },
        { width: 320, height: 844 },
      ]) {
        await page.setViewportSize(viewport);
        await expect(glyph).toBeVisible();
        const geometry = await overview.evaluate((pageEl) => {
          const rect = (selector) => {
            const element = pageEl.querySelector(selector);
            if (!(element instanceof HTMLElement)) throw new Error("Missing hierarchy element: " + selector);
            const r = element.getBoundingClientRect();
            return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
          };
          const scroll = pageEl.querySelector(".learning-back-scroll");
          if (!(scroll instanceof HTMLElement)) throw new Error("Learning overview scroll container unavailable");
          const scrollRect = scroll.getBoundingClientRect();
          return {
            glyph: rect(".learning-back-kanji"),
            heading: rect(".learning-back-identity-heading"),
            label: rect(".learning-back-section-label"),
            meaning: rect(".learning-back-meaning"),
            readings: rect(".learning-back-readings-block"),
            structure: rect(".learning-back-identity-visual"),
            scroll: { left: scrollRect.left, right: scrollRect.right, bottom: scrollRect.bottom, clientWidth: scroll.clientWidth, scrollWidth: scroll.scrollWidth },
          };
        });
        expect(geometry.glyph.width).toBeGreaterThanOrEqual(44);
        expect(geometry.glyph.height).toBeGreaterThanOrEqual(44);
        expect(geometry.heading.right).toBeLessThanOrEqual(geometry.scroll.right + 1);
        expect(geometry.label.top).toBeLessThanOrEqual(geometry.meaning.top + 1);
        expect(geometry.heading.bottom).toBeLessThanOrEqual(geometry.readings.top + 2);
        expect(geometry.readings.bottom).toBeLessThanOrEqual(geometry.structure.top + 2);
        expect(geometry.structure.bottom).toBeLessThanOrEqual(geometry.scroll.bottom + 1);
        expect(geometry.scroll.scrollWidth).toBeLessThanOrEqual(geometry.scroll.clientWidth + 1);
      }
    } finally {
      await context.close();
    }
  }));
});

test("Learning card styles are ready before reveal and the flip preserves interactive faces", async ({ page }) => {
  await routeExamples(page, 5);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    const language = new URL(window.location.href).searchParams.get("rinemi-test-language");
    if (language === "fa" || language === "en") localStorage.setItem("kanji5-ui-language", language);
    localStorage.setItem("kanji5-onboarding-v2", "complete");
  });

  for (const scenario of [
    { language: "en", viewport: { width: 1280, height: 720 } },
    { language: "fa", viewport: { width: 390, height: 844 } },
    { language: "en", viewport: { width: 844, height: 390 } },
    { language: "fa", viewport: { width: 1280, height: 720 } },
    { language: "en", viewport: { width: 390, height: 844 } },
    { language: "fa", viewport: { width: 844, height: 390 } },
  ]) {
    await page.setViewportSize(scenario.viewport);
    await page.goto("/?rinemi-test-language=" + scenario.language);

    const card = page.locator("#root .learning-card");
    await expect(card).toBeVisible({ timeout: 20000 });

    const before = await card.evaluate(el => {
      const flip = el.querySelector(".learning-card-flip");
      const front = el.querySelector(".learning-card-front");
      const back = el.querySelector(".learning-card-back");
      const preview = el.querySelector(".kanji-structure-preview");
      const reveal = el.querySelector(".learning-card-front .button.primary");
      if (!(flip instanceof HTMLElement) || !(front instanceof HTMLElement) ||
          !(back instanceof HTMLElement) || !(preview instanceof HTMLElement) ||
          !(reveal instanceof HTMLElement)) throw new Error("Learning card flip elements are incomplete");
      const rect = reveal.getBoundingClientRect();
      const revealInViewport = rect.bottom > 0 && rect.right > 0 &&
        rect.top < window.innerHeight && rect.left < window.innerWidth;
      const duration = getComputedStyle(flip).transitionDuration.split(",")[0].trim();
      const transitionSeconds = duration.endsWith("ms")
        ? Number.parseFloat(duration) / 1000
        : Number.parseFloat(duration);
      return {
        previewDisplay: getComputedStyle(preview).display,
        lateStyleInjector: Boolean(document.querySelector("style[data-rinemi-learning-card-styles]")),
        transitionSeconds,
        frontBackface: getComputedStyle(front).backfaceVisibility,
        backBackface: getComputedStyle(back).backfaceVisibility,
        frontAriaHidden: front.getAttribute("aria-hidden"),
        frontInert: front.inert,
        backAriaHidden: back.getAttribute("aria-hidden"),
        backInert: back.inert,
        revealInViewport,
        revealBounds: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height },
      };
    });

    expect(before.previewDisplay).toBe("grid");
    expect(before.lateStyleInjector).toBe(false);
    expect(before.transitionSeconds).toBeGreaterThan(0.01);
    expect(before.frontBackface).toBe("hidden");
    expect(before.backBackface).toBe("hidden");
    expect(before.frontAriaHidden).toBe("false");
    expect(before.frontInert).toBe(false);
    expect(before.backAriaHidden).toBe("true");
    expect(before.backInert).toBe(true);
    expect(before.revealInViewport, JSON.stringify(before)).toBe(true);

    await page.evaluate(() => {
      const flip = document.querySelector("#root .learning-card-flip");
      if (!(flip instanceof HTMLElement)) throw new Error("Learning card flip is unavailable for sampling");
      const frames = [];
      const start = performance.now();
      const sample = () => {
        frames.push(getComputedStyle(flip).transform);
        if (performance.now() - start < 900) requestAnimationFrame(sample);
        else window.__rinemiLearningCardFlipFrames = frames;
      };
      window.__rinemiLearningCardFlipFrames = frames;
      requestAnimationFrame(sample);
    });

    const reveal = page.getByRole("button", {
      name: /(نمایش (پاسخ|اطلاعات کانجی|معنی و خوانش‌ها)|Reveal meaning & readings|Show (answer|kanji information))/,
    });
    await expect(reveal).toBeInViewport();
    await reveal.click();
    await expect(card).toHaveClass(/is-revealed/, { timeout: 10000 });
    await page.waitForTimeout(950);

    const after = await card.evaluate(el => {
      const flip = el.querySelector(".learning-card-flip");
      const front = el.querySelector(".learning-card-front");
      const back = el.querySelector(".learning-card-back");
      const activePage = el.querySelector(".learning-back-page.active");
      const meaning = el.querySelector(".learning-back-page.active .learning-back-meaning");
      const readings = el.querySelector(".learning-back-page.active .learning-back-readings");
      const pageLabels = Array.from(el.querySelectorAll(".learning-back-page")).map(node => node.getAttribute("aria-label"));
      const shortcutLabels = Array.from(el.querySelectorAll(".learning-back-page-shortcut")).map(node => node.getAttribute("aria-label"));
      if (!(flip instanceof HTMLElement) || !(front instanceof HTMLElement) ||
          !(back instanceof HTMLElement) || !activePage || !meaning || !readings) {
        throw new Error("Learning card content is incomplete after reveal");
      }
      const matrix = new DOMMatrixReadOnly(getComputedStyle(flip).transform);
      const rect = el.getBoundingClientRect();
      return {
        transformM11: matrix.m11,
        frontAriaHidden: front.getAttribute("aria-hidden"),
        frontInert: front.inert,
        backAriaHidden: back.getAttribute("aria-hidden"),
        backInert: back.inert,
        meaningText: meaning.textContent?.trim() || "",
        meaningVisible: getComputedStyle(meaning).display !== "none" && meaning.getBoundingClientRect().height > 0,
        readingsVisible: getComputedStyle(readings).display !== "none" && readings.getBoundingClientRect().height > 0,
        pageLabels,
        shortcutLabels,
        cardLeft: rect.left,
        cardRight: rect.right,
        viewportWidth: window.innerWidth,
      };
    });
    const frames = await page.evaluate(() => window.__rinemiLearningCardFlipFrames || []);
    expect(new Set(frames).size).toBeGreaterThan(2);
    expect(after.transformM11).toBeLessThan(-0.99);
    expect(after.frontAriaHidden).toBe("true");
    expect(after.frontInert).toBe(true);
    expect(after.backAriaHidden).toBe("false");
    expect(after.backInert).toBe(false);
    expect(after.meaningText.length).toBeGreaterThan(0);
    expect(after.meaningVisible).toBe(true);
    expect(after.readingsVisible).toBe(true);
    expect(after.shortcutLabels).toHaveLength(4);
    expect(after.shortcutLabels).toEqual(after.pageLabels);
    expect(after.cardLeft).toBeGreaterThanOrEqual(-1);
    expect(after.cardRight).toBeLessThanOrEqual(after.viewportWidth + 1);
    await assertCardBounds(card);
  }
});

test("Learning card remains interactive when reduced motion is requested", async ({ page }) => {
  await routeExamples(page, 5);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem("kanji5-ui-language", "fa");
    localStorage.setItem("kanji5-onboarding-v2", "complete");
  });
  await page.goto("/");
  const card = page.locator("#root .learning-card");
  await expect(card).toBeVisible({ timeout: 20000 });
  const reveal = page.getByRole("button", { name: /(نمایش (پاسخ|اطلاعات کانجی|معنی و خوانش‌ها)|Reveal meaning & readings|Show (answer|kanji information))/ });
  await reveal.click();
  await expect(card).toHaveClass(/is-revealed/, { timeout: 10000 });
  const result = await card.evaluate(el => {
    const flip = el.querySelector(".learning-card-flip");
    const front = el.querySelector(".learning-card-front");
    const back = el.querySelector(".learning-card-back");
    if (!(flip instanceof HTMLElement) || !(front instanceof HTMLElement) || !(back instanceof HTMLElement)) {
      throw new Error("Learning card state is unavailable after a reduced-motion reveal");
    }
    const duration = getComputedStyle(flip).transitionDuration.split(",")[0].trim();
    const seconds = duration.endsWith("ms") ? Number.parseFloat(duration) / 1000 : Number.parseFloat(duration);
    return {
      seconds,
      m11: new DOMMatrixReadOnly(getComputedStyle(flip).transform).m11,
      frontInert: front.inert,
      backInert: back.inert,
    };
  });
  expect(result.seconds).toBeLessThan(0.01);
  expect(result.m11).toBeLessThan(-0.99);
  expect(result.frontInert).toBe(true);
  expect(result.backInert).toBe(false);
  await expect(card.locator(".learning-back-meaning")).toBeVisible();
});

test("learning first page keeps readings above the rating footer on desktop", async ({ page }) => {
  await routeExamples(page, 2);
  await page.setViewportSize({ width: 1280, height: 720 });
  const card = await revealLearningCard(page, "en");
  const activePage = card.locator(".learning-back-page").nth(0);
  const readings = activePage.locator(".learning-back-readings-block");
  const footer = card.locator(".learning-back-footer");
  await expect(readings).toBeVisible();
  await expect(footer).toBeVisible();
  const readingsBounds = await readings.boundingBox();
  const footerBounds = await footer.boundingBox();
  if (!readingsBounds || !footerBounds) throw new Error("Learning readings/footer geometry unavailable");
  expect(readingsBounds.y + readingsBounds.height).toBeLessThanOrEqual(footerBounds.y + 1);
});

test("reference meanings and readings open in a keyboard-accessible modal", async ({ page }) => {
  for (const scenario of [
    { language: "en", viewport: { width: 1280, height: 720 }, closeLabel: "Close" },
    { language: "fa", viewport: { width: 390, height: 844 }, closeLabel: "بستن" },
  ]) {
    await page.setViewportSize(scenario.viewport);
    const card = await revealLearningCard(page, scenario.language);
    const trigger = card.locator(".learning-reference-trigger");
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toHaveAttribute("aria-controls", "learning-reference-info");
    await expect(trigger).toHaveAccessibleName(scenario.language === "fa" ? "معنی‌ها و خوانش‌های بیشتر" : "More meanings & readings");

    await trigger.click();
    const dialog = page.locator("#learning-reference-info");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("aria-labelledby", "learning-reference-info-title");
    await expect.poll(() => dialog.evaluate(el => el.matches(":modal"))).toBe(true);
    await expect(dialog.getByRole("heading", { name: scenario.language === "fa" ? "معنی‌ها و خوانش‌های بیشتر" : "More meanings & readings" })).toBeVisible();
    const rows = dialog.locator(".learning-reference-info-grid .stat-row");
    await expect.poll(async () => rows.count()).toBeGreaterThan(0);

    const metrics = await dialog.evaluate(el => {
      const rect = el.getBoundingClientRect();
      const content = el.querySelector(".learning-reference-info-grid");
      const contentStyle = content ? getComputedStyle(content) : null;
      return {
        left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom,
        viewportWidth: window.innerWidth, viewportHeight: window.innerHeight,
        overflowY: contentStyle?.overflowY ?? "",
      };
    });
    expect(metrics.left).toBeGreaterThanOrEqual(0);
    expect(metrics.right).toBeLessThanOrEqual(metrics.viewportWidth + 1);
    expect(metrics.top).toBeGreaterThanOrEqual(0);
    expect(metrics.bottom).toBeLessThanOrEqual(metrics.viewportHeight + 1);
    expect(metrics.overflowY).toBe("auto");

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();

    await trigger.click();
    await dialog.getByRole("button", { name: scenario.closeLabel, exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  }
});

test("learning card stays within a short desktop landscape viewport", async ({ page }) => {
  await routeExamples(page, 2);
  await page.setViewportSize({ width: 844, height: 390 });
  const card = await revealLearningCard(page, "en");
  const metrics = await card.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    const navigation = document.querySelector(".experience-nav");
    const navigationRect = navigation instanceof HTMLElement ? navigation.getBoundingClientRect() : null;
    return {
      top: rect.top,
      bottom: rect.bottom,
      height: rect.height,
      viewportHeight: window.innerHeight,
      minHeight: parseFloat(style.minHeight),
      navigationTop: navigationRect?.top ?? window.innerHeight,
    };
  });
  expect(metrics.height).toBeLessThanOrEqual(metrics.viewportHeight - 32 + 1);
  expect(metrics.height).toBeGreaterThanOrEqual(220);
  expect(metrics.minHeight).toBeLessThanOrEqual(metrics.viewportHeight - 32 + 1);
  expect(metrics.top).toBeGreaterThanOrEqual(-1);
  expect(metrics.bottom).toBeLessThanOrEqual(metrics.navigationTop - 1);
  await expect(card.locator(".learning-back-page.active")).toBeVisible();
});

test("learning card exposes four full-content back pages in Persian and English", async ({ page }) => {
  await routeExamples(page, 5);
  for (const language of ["fa", "en"]) {
    for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      const card = await revealLearningCard(page, language);

      expect(await card.locator(".learning-back-page").count()).toBe(4);
      await expect(card).toHaveAttribute("data-back-page-count", "4");
      await expect(card.locator(".learning-back-page-shortcut")).toHaveCount(4);
      await expect(card.locator(".learning-back-page-shortcut.active")).toHaveCount(1);
      await expect(card.locator(".learning-back-page").nth(0).locator(".meanings")).toBeVisible();
      await expect(card.locator(".learning-back-page").nth(0).locator(".learning-back-readings").first()).toBeVisible();
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
        await expect(card.locator(".learning-back-page-shortcut.active")).toHaveCount(1);
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

test("learning card keeps the Stroke Order page directly open", async ({ page }) => {
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
  for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.addInitScript(() => localStorage.setItem("kanji5-ui-language", "en"));
    await page.goto("/");
    const card = page.locator("#root .learning-card");
    await expect(card).toBeVisible({ timeout: 20000 });
    await card.getByRole("button", { name: "Reveal meaning & readings" }).click();
    await expect(card).toHaveClass(/is-revealed/, { timeout: 10000 });
    await goToBackPage(page, card, 3);

    const panel = card.locator(".learning-back-page.active .stroke-order-panel");
    await expect(panel).toBeVisible();
    await expect(panel).toHaveClass(/is-expanded/);
    await expect(panel).toHaveAttribute("data-stroke-order-open", "true");
    await expect(card.locator(".stroke-order-tool-trigger")).toHaveCount(0);
    await expect(panel.locator(".stroke-order-toggle")).toHaveCount(0);
    await expect(panel.locator(".stroke-order-count")).toHaveText("3 strokes");
    await expect(panel.locator(".stroke-order-progress")).toHaveText("0 / 3");
    const stage = await panel.locator(".stroke-order-stage svg").boundingBox();
    expect(stage?.width ?? 0).toBeGreaterThan(120);

    const controls = panel.locator(".stroke-order-controls .button");
    await expect(controls).toHaveCount(3);
    await controls.nth(1).click();
    await expect.poll(async () => panel.getAttribute("data-stroke-order-playing")).toBe("true");
    await controls.nth(1).click();
    await expect.poll(async () => panel.getAttribute("data-stroke-order-playing")).toBe("false");
  }
});

test("learning card replaces passive pager dots with direct page shortcuts", async ({ page }) => {
  await routeExamples(page, 5);
  for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    const card = await revealLearningCard(page, "en");
    await expect(card).toHaveAttribute("data-back-page-count", "4", { timeout: 10000 });

    const nav = card.locator(".learning-back-page-nav");
    await expect(nav).toBeVisible();
    const shortcuts = nav.locator(".learning-back-page-shortcut");
    await expect(shortcuts).toHaveCount(4);
    await expect(nav).toHaveCSS("direction", "ltr");
    await expect(shortcuts.nth(2)).toBeEnabled({ timeout: 10000 });
    await expect(shortcuts.nth(0)).toHaveAttribute("aria-label", "Meaning & structure");
    await expect(shortcuts.nth(1)).toHaveAttribute("aria-label", "Vocabulary examples");
    await expect(shortcuts.nth(2)).toHaveAttribute("aria-label", "Personal mnemonic");
    await expect(shortcuts.nth(3)).toHaveAttribute("aria-label", "Stroke order");
    await expect(shortcuts.nth(0)).toHaveClass(/active/);
    await expect(shortcuts.nth(0)).toHaveAttribute("aria-current", "page");
    await expect(nav.locator(".pager-dot")).toHaveCount(0);

    const metrics = await shortcuts.evaluateAll((buttons) => buttons.map((button) => {
      const style = getComputedStyle(button);
      const rect = button.getBoundingClientRect();
      return { width: rect.width, height: rect.height, opacity: style.opacity };
    }));
    for (const metric of metrics) {
      expect(metric.width).toBeGreaterThanOrEqual(44);
      expect(metric.height).toBeGreaterThanOrEqual(44);
    }
    expect(metrics[0].opacity).toBe("1");
    expect(Number(metrics[1].opacity)).toBeLessThan(1);

    for (const [index, label] of [
      [0, "Meaning & structure"],
      [1, "Vocabulary examples"],
      [2, "Personal mnemonic"],
      [3, "Stroke order"],
    ]) {
      await shortcuts.nth(index).click();
      await expect(shortcuts.nth(index)).toHaveClass(/active/);
      await expect(shortcuts.nth(index)).toHaveAttribute("aria-current", "page");
      await expect(card.locator(".learning-back-page.active")).toHaveAttribute("aria-label", label);
    }
    await expect(shortcuts.nth(3)).toHaveClass(/active/);
  }
});

test("personal mnemonic editor is a usable modal and cancel restores unsaved changes", async ({ page }) => {
  await routeExamples(page, 5);
  await page.addInitScript(() => localStorage.setItem("kanji5-ui-language", "en"));
  await page.setViewportSize({ width: 390, height: 640 });
  const card = await revealLearningCard(page, "en");
  await goToBackPage(page, card, 2);

  const trigger = card.locator(".mnemonic-action");
  await expect(trigger).toBeVisible();
  await trigger.click();

  const dialog = page.locator(".mnemonic-edit-dialog");
  const textarea = dialog.locator("#personal-mnemonic-textarea");
  await expect(dialog).toBeVisible();
  await expect.poll(() => dialog.evaluate(el => el.matches(":modal"))).toBe(true);
  await expect(textarea).toBeVisible();
  await expect(textarea).toHaveAttribute("maxlength", "600");
  const editorHeight = await textarea.evaluate(el => el.getBoundingClientRect().height);
  expect(editorHeight).toBeGreaterThanOrEqual(180);
  const originalValue = await textarea.inputValue();

  await textarea.fill("unsaved mnemonic draft that must be discarded");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await expect(dialog).toBeVisible();
  await expect(textarea).toHaveValue(originalValue);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("vocabulary example page shows an explicit empty state without losing its navigation slot", async ({ page }) => {
  await routeExamples(page, 0);
  await page.setViewportSize({ width: 390, height: 844 });
  const card = await revealLearningCard(page, "en");
  await goToBackPage(page, card, 1);
  await expect(card.locator(".learning-back-page.active .learning-examples-empty")).toBeVisible();
  await expect(card.locator(".learning-back-page.active .example-row")).toHaveCount(0);
  await expect(card.locator(".learning-back-page-nav .learning-back-page-shortcut")).toHaveCount(4);
  await expect(card.locator(".learning-back-page-nav .learning-back-page-shortcut").nth(1)).toHaveClass(/active/);
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


test("learning-card structure is a compact preview with full details in a modal", async ({ page }) => {
  await routeExamples(page, 5);
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    const card = await revealLearningCard(page, "en");
    const nav = card.locator(".learning-back-page-nav .learning-back-page-shortcut");
    await expect(nav).toHaveCount(4);
    const previewPage = card.locator(".learning-back-page.active");
    const preview = previewPage.locator(".kanji-structure-preview-action");
    await expect(preview).toBeVisible({ timeout: 10000 });
    const metrics = await previewPage.evaluate(pageEl => {
      const scroll = pageEl.querySelector(".learning-back-scroll");
      const overview = pageEl.querySelector(".learning-back-overview");
      const scrollRect = scroll?.getBoundingClientRect();
      const overviewRect = overview?.getBoundingClientRect();
      return {
        overflowY: scroll ? getComputedStyle(scroll).overflowY : "",
        scrollTop: scroll?.scrollTop ?? -1,
        scrollBottom: scrollRect?.bottom ?? Infinity,
        overviewBottom: overviewRect?.bottom ?? Infinity,
      };
    });
    expect(metrics.overflowY).toBe("auto");
    expect(metrics.overviewBottom).toBeLessThanOrEqual(metrics.scrollBottom + 1);

    await preview.click();
    const dialog = page.locator(".kanji-structure-dialog");
    await expect(dialog).toBeVisible();
    await expect.poll(() => dialog.evaluate(el => el.matches(":modal"))).toBe(true);
    await expect(dialog).toContainText("KanjiVG · CC BY-SA 3.0");
    await expect(dialog.locator(".kanji-structure-dialog-body")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(preview).toBeFocused();
  }
});

test("learning session feedback stays compact and auto-dismisses", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const card = await revealLearningCard(page, "en");
  await card.locator(".rating-grid button").nth(2).click();
  const feedback = page.locator(".session-feedback");
  await expect(feedback).toBeVisible({ timeout: 10000 });
  await expect(feedback.locator("strong")).toHaveCount(1);
  await expect(feedback.locator("span")).toHaveCount(1);
  await expect(feedback.locator("button,details,.insights")).toHaveCount(0);
  await expect(feedback).toBeHidden({ timeout: 6000 });
});

test("learning rating feedback controls stay fully inside the card on narrow mobile widths",async({page})=>{
  const card=await revealLearningCard(page,"en");
  const grid=card.locator(".rating-grid");
  for(const viewport of [{width:390,height:844},{width:360,height:844},{width:320,height:844}]){
    await page.setViewportSize(viewport);
    await expect(grid).toBeVisible();
    const metrics=await grid.evaluate(el=>{
      const gridRect=el.getBoundingClientRect();
      const cardRect=el.closest(".learning-card").getBoundingClientRect();
      const buttons=[...el.querySelectorAll("button")].map(button=>{
        const r=button.getBoundingClientRect();
        return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,visible:r.width>0&&r.height>0};
      });
      return {left:gridRect.left,right:gridRect.right,cardLeft:cardRect.left,cardRight:cardRect.right,buttons};
    });
    expect(metrics.buttons).toHaveLength(4);
    expect(metrics.left).toBeGreaterThanOrEqual(metrics.cardLeft-1);
    expect(metrics.right).toBeLessThanOrEqual(metrics.cardRight+1);
    expect(metrics.left).toBeGreaterThanOrEqual(0);
    expect(metrics.right).toBeLessThanOrEqual(viewport.width);
    for(const button of metrics.buttons){
      expect(button.visible).toBe(true);
      expect(button.left).toBeGreaterThanOrEqual(metrics.left-1);
      expect(button.right).toBeLessThanOrEqual(metrics.right+1);
      expect(button.width).toBeGreaterThanOrEqual(44);
      expect(button.height).toBeGreaterThanOrEqual(44);
      expect(button.left).toBeGreaterThanOrEqual(0);
      expect(button.right).toBeLessThanOrEqual(viewport.width);
    }
    const navTop = await page.locator(".experience-nav").evaluate(el => el.getBoundingClientRect().top);
    expect(Math.max(...metrics.buttons.map(button => button.bottom))).toBeLessThanOrEqual(navTop + 1);
  }
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

test("structured header menu keeps account inactive until the menu closes and exposes inline preferences", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("kanji5-ui-language", "en");
    localStorage.setItem("kanji5-theme", "light");
  });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");
  await expect(page.locator("#root .app-shell")).toBeVisible({ timeout: 20000 });

  const account = page.locator(".account-button");
  await expect(account).toBeVisible();
  await page.getByRole("button", { name: "More", exact: true }).click();
  const menu = page.locator("#header-tools-menu");
  await expect(menu).toBeVisible();
  await expect(account).toBeVisible();
  await expect(account).toHaveCSS("visibility", "visible");
  await expect(account).toHaveCSS("pointer-events", "none");
  await expect(menu.locator(".header-tools-menu-section").nth(0)).toContainText("Learning tools");
  await expect(menu.getByRole("button", { name: "Grammar guide", exact: true })).toBeVisible();
  await expect(menu.getByRole("button", { name: "Japanese text reader", exact: true })).toBeVisible();
  await expect(menu.getByRole("button", { name: "Prepared mnemonics", exact: true })).toBeVisible();
  await expect(menu.getByRole("button", { name: "Stats", exact: true })).toBeVisible();

  await menu.getByRole("button", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await menu.getByRole("button", { name: "فارسی", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(account).toBeVisible();
  await expect(account).toHaveCSS("visibility", "visible");
  await expect(account).toHaveCSS("pointer-events", "none");

  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(page.getByRole("button", { name: "بیشتر", exact: true })).toBeFocused();
  await expect(account).toBeVisible();
});

test("mobile menu prevents account click-through until the drawer closes", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("kanji5-ui-language", "fa"));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("#root .app-shell")).toBeVisible({ timeout: 20000 });

  const account = page.locator(".account-button");
  const accountBounds = await account.boundingBox();
  if (!accountBounds) throw new Error("Account bounds unavailable before opening the menu");

  await page.getByRole("button", { name: "بیشتر", exact: true }).click();
  const menu = page.locator("#header-tools-menu");
  await expect(menu).toBeVisible();
  await expect(account).toBeVisible();
  await expect(account).toHaveCSS("visibility", "visible");
  await expect(account).toHaveCSS("pointer-events", "none");

  // Click the account button's screen position. It stays visible, but the open-menu
  // state must prevent click-through and must not open the account dialog.
  await page.mouse.click(
    accountBounds.x + accountBounds.width / 2,
    accountBounds.y + accountBounds.height / 2
  );
  await expect(page.locator(".account-dialog:visible")).toHaveCount(0);
  await expect(menu).toBeHidden();

  await expect(account).toBeVisible();
  await account.click();
  await expect(page.locator(".account-dialog:visible")).toBeVisible();
});

test("menu sections open as centered tool dialogs on desktop", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("kanji5-ui-language", "en"));
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");
  await expect(page.locator("#root .learning-card")).toBeVisible({ timeout: 10000 });

  for (const tool of ["Stats", "Grammar guide", "Japanese text reader", "Prepared mnemonics", "Settings"]) {
    await page.getByRole("button", { name: "More", exact: true }).click();
    const menu = page.locator("#header-tools-menu");
    await expect(menu).toBeVisible();
    await menu.getByRole("button", { name: tool, exact: true }).click();

    const pageDialog = page.locator(".secondary-page-dialog");
    await expect(pageDialog).toBeVisible();
    await expect(pageDialog).toHaveAttribute("open", "");
    await expect(page.locator("#root .learning-card")).toHaveCount(0);

    const geometry = await page.evaluate(() => {
      const dialog = document.querySelector(".secondary-page-dialog");
      if (!(dialog instanceof HTMLElement)) throw new Error("Secondary dialog unavailable");
      const rect = dialog.getBoundingClientRect();
      return {
        position: getComputedStyle(dialog).position,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      };
    });
    expect(geometry.position).toBe("fixed");
    expect(Math.abs((geometry.left + geometry.right) / 2 - geometry.viewportWidth / 2)).toBeLessThanOrEqual(2);
    expect(Math.abs((geometry.top + geometry.bottom) / 2 - geometry.viewportHeight / 2)).toBeLessThanOrEqual(2);
    expect(geometry.left).toBeGreaterThanOrEqual(0);
    expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth);
    expect(geometry.top).toBeGreaterThanOrEqual(0);
    expect(geometry.bottom).toBeLessThanOrEqual(geometry.viewportHeight);

    await pageDialog.getByRole("button", { name: "Close", exact: true }).first().click();
    await expect(page.locator("dialog.secondary-page-dialog[open]")).toHaveCount(0);
    await expect(page.locator("#root .learning-card")).toBeVisible({ timeout: 10000 });
  }
});

test("tool dialogs remain usable within a narrow mobile viewport", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("kanji5-ui-language", "en"));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("#root .learning-card")).toBeVisible({ timeout: 10000 });

  for (const tool of ["Stats", "Grammar guide", "Japanese text reader", "Prepared mnemonics", "Settings"]) {
    await page.getByRole("button", { name: "More", exact: true }).click();
    const menu = page.locator("#header-tools-menu");
    await expect(menu).toBeVisible();
    await menu.getByRole("button", { name: tool, exact: true }).click();

    const dialog = page.locator(".secondary-page-dialog");
    await expect(dialog).toBeVisible({ timeout: 10000 });
    const metrics = await dialog.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        overflowX: el.scrollWidth > el.clientWidth + 1,
      };
    });
    expect(metrics.left).toBeGreaterThanOrEqual(0);
    expect(metrics.right).toBeLessThanOrEqual(metrics.viewportWidth + 1);
    expect(metrics.top).toBeGreaterThanOrEqual(0);
    expect(metrics.bottom).toBeLessThanOrEqual(metrics.viewportHeight + 1);
    expect(metrics.overflowX).toBe(false);

    await dialog.getByRole("button", { name: "Close", exact: true }).first().click();
    await expect(page.locator("dialog.secondary-page-dialog[open]")).toHaveCount(0);
    await expect(page.locator("#root .learning-card")).toBeVisible({ timeout: 10000 });
  }
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

test("rating buttons keep the same hardest-to-easiest physical order in English and Persian", async ({ browser }) => {
  for (const language of ["en", "fa"]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    try {
      const page = await context.newPage();
      await routeExamples(page, 2);
      const card = await revealLearningCard(page, language);
      await expect(card.locator(".learning-back-readings bdi[lang=\"ja\"][dir=\"ltr\"]")).toHaveCount(2);
      const physicalOrder = await card.locator(".rating-grid button").evaluateAll((buttons) =>
        buttons.map((button) => {
          const rect = button.getBoundingClientRect();
          const rating = [...button.classList].find((name) => /^rating-(again|hard|good|easy)$/.test(name))?.slice("rating-".length);
          return { rating, top: rect.top, left: rect.left };
        }).sort((a, b) => a.top - b.top || a.left - b.left).map((item) => item.rating)
      );

      expect(physicalOrder).toEqual(["again", "hard", "good", "easy"]);
      await expect(card.locator(".rating-grid .rating-again")).toHaveAttribute("dir", language === "fa" ? "rtl" : "ltr");
      await expect(card.locator(".rating-grid .rating-easy")).toHaveAttribute("dir", language === "fa" ? "rtl" : "ltr");
    } finally {
      await context.close();
    }
  }
});
