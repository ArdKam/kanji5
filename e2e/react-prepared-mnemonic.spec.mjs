import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("kanji5-onboarding-v2", "complete");
  });
});

async function goToMnemonicPage(card) {
  const pages = card.locator(".learning-back-page");
  const count = await pages.count();
  for (let index = 0; index < count; index += 1) {
    const page = pages.nth(index);
    if (await page.locator(".mnemonic-page").count()) {
      const active = await page.evaluate((el) => el.classList.contains("active"));
      if (!active) {
        const current = await card.locator(".learning-back-page.active").evaluate((el) =>
          Array.from(el.parentElement?.children ?? []).indexOf(el),
        );
        const delta = index - current;
        const button = card.locator(".learning-back-page-nav .learning-back-page-shortcut").nth(index);
        await button.click();
      }
      await expect(page).toHaveClass(/active/);
      await page.locator(".learning-back-scroll").evaluate(async (el) => {
        const animations = el.getAnimations({ subtree: true });
        await Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)));
      });
      return;
    }
  }
  throw new Error("Mnemonic page not found");
}

test("prepared mnemonic is available on every learning card and can be saved as personal", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem("kanji5-onboarding-v2", "complete");
    localStorage.setItem("kanji5-ui-language", "en");
  });
  await page.goto("/");
  const card = page.locator("#root .learning-card");
  await expect(card).toBeVisible({ timeout: 20000 });

  await card.getByRole("button", { name: "Show kanji information" }).click();
  await expect(card).toHaveClass(/is-revealed/, { timeout: 10000 });

  await goToMnemonicPage(card);
  const prepared = card.locator(".mnemonic-prepared");
  await expect(prepared).toBeVisible();
  await prepared.evaluate((el) => {
    const scroll = el.closest(".learning-back-scroll");
    if (!(scroll instanceof HTMLElement)) return;
    scroll.scrollTop = scroll.scrollHeight - scroll.clientHeight;
  });
  const preparedViewport = await prepared.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    const scroll = el.closest(".learning-back-scroll")?.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      top: rect.top,
      bottom: rect.bottom,
      scrollTop: scroll?.top ?? 0,
      scrollBottom: scroll?.bottom ?? 0,
      display: style.display,
      visibility: style.visibility,
      opacity: Number(style.opacity || 1)
    };
  });
  expect(preparedViewport.width).toBeGreaterThan(0);
  expect(preparedViewport.height).toBeGreaterThan(0);
  expect(preparedViewport.visibility).toBe("visible");
  expect(preparedViewport.opacity).toBeGreaterThan(0);
  expect(preparedViewport.top).toBeGreaterThanOrEqual(preparedViewport.scrollTop - 1);
  expect(preparedViewport.bottom).toBeLessThanOrEqual(preparedViewport.scrollBottom + 1);
  const mnemonicGeometry = await card.evaluate(() => {
    const root = document.querySelector(".mnemonic-tool");
    if (!root) throw new Error("mnemonic tool missing");
    const selectors = [".mnemonic-prepared", ".mnemonic-trigger", ".mnemonic-saved", ".mnemonic-editor"];
    const visible = selectors
      .map(selector => document.querySelector(selector))
      .filter(el => {
        if (!(el instanceof HTMLElement)) return false;
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
      })
      .map(el => {
        const rect = el.getBoundingClientRect();
        return { name: el.className, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
      });
    const overlaps = [];
    for (let i = 0; i < visible.length; i += 1) {
      for (let j = i + 1; j < visible.length; j += 1) {
        const a = visible[i], b = visible[j];
        const overlap = Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1
          && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
        if (overlap) overlaps.push([a.name, b.name]);
      }
    }
    return { visible, overlaps };
  });
  expect(mnemonicGeometry.overlaps).toEqual([]);
  const preparedText = prepared.locator(".mnemonic-prepared-copy p");
  await expect(preparedText).toHaveText(/\S+/);

  const source = await prepared.getAttribute("data-mnemonic-source");
  if (source === "curated") {
    const useButton = prepared.getByRole("button", { name: "Use" });
    await expect(useButton).toBeVisible();
    await useButton.scrollIntoViewIfNeeded();
    await useButton.click();
    await expect(card.locator(".mnemonic-saved p")).toHaveText(await preparedText.innerText());
  } else {
    const makeOwn = prepared.getByRole("button", { name: /Make your own mnemonic/i });
    await expect(makeOwn).toBeVisible();
    await makeOwn.click();
    const editor = card.locator("#personal-mnemonic-editor textarea");
    await expect(editor).toBeVisible();
    await editor.fill("My own memory cue for this kanji.");
    await card.getByRole("button", { name: /Save mnemonic/i }).click();
    await expect(card.locator(".mnemonic-saved p")).toHaveText("My own memory cue for this kanji.");
  }
});


test("generated mnemonic scaffolds are non-persistent prompts rather than direct personal-mnemonic values", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem("kanji5-ui-language", "en");
  });
  await page.goto("/");
  await expect(page.locator(".experience-nav")).toBeVisible({ timeout: 10000 });
  const dictionaryTab = page.locator(".experience-nav .experience-tab").nth(2);
  await dictionaryTab.click();
  await expect(page.locator(".dictionary-page")).toBeVisible({ timeout: 10000 });

  const search = page.locator(".dictionary-page-search input");
  await search.fill("湖");
  const tile = page.locator(".kanji-catalog-tile").filter({ hasText: "湖" });
  await expect(tile).toHaveCount(1);
  await tile.click();

  const dialog = page.locator(".dictionary-card-dialog");
  await expect(dialog).toBeVisible();
  const mnemonicButton = dialog.getByRole("tab", { name: /Personal mnemonic|Mnemonic/, exact: true });
  await mnemonicButton.click();
  await expect(mnemonicButton).toHaveAttribute("aria-selected", "true");
  let nativeDialogCount = 0;
  page.on("dialog", async dialogEvent => {
    nativeDialogCount += 1;
    await dialogEvent.dismiss();
  });
  const panel = dialog.locator(".prepared-mnemonic-panel");
  await expect(panel).toBeVisible();
  await expect(panel.locator(".dictionary-personal-mnemonic-input")).toBeVisible();
  await expect(panel.getByRole("button",{name:"Save mnemonic",exact:true})).toBeVisible();
  await expect(panel.getByRole("button",{name:"Use",exact:true})).toHaveCount(0);
  const copyCurated = panel.getByRole("button",{name:"Copy curated story",exact:true});
  if (await copyCurated.count()) await copyCurated.click();
  expect(nativeDialogCount).toBe(0);
});
