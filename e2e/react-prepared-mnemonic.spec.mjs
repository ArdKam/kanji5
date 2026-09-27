import { test, expect } from "@playwright/test";

async function goToBackPage(card, targetIndex) {
  for (let index = 0; index < targetIndex; index += 1) {
    await card.locator(".pager-button").nth(1).click();
  }
  await expect(card.locator(".learning-back-page.active")).toHaveCount(1);
}

test("prepared mnemonic is available on every learning card and can be saved as personal", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem("kanji5-ui-language", "en");
  });
  await page.goto("/");
  const card = page.locator("#root .learning-card");
  await expect(card).toBeVisible({ timeout: 20000 });

  await card.getByRole("button", { name: "Show kanji information" }).click();
  await expect(card).toHaveClass(/is-revealed/, { timeout: 10000 });

  await goToBackPage(card, 3);
  const prepared = card.locator(".mnemonic-prepared");
  await expect(prepared).toBeVisible();
  await prepared.evaluate((el) => {
    const scroll = el.closest(".learning-back-scroll");
    if (!(scroll instanceof HTMLElement)) return;
    const rect = el.getBoundingClientRect();
    const viewport = scroll.getBoundingClientRect();
    scroll.scrollTop += rect.bottom - viewport.bottom;
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
  await dialog.getByRole("button", { name: "Mnemonic", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Mnemonic", exact: true })).toHaveAttribute("aria-expanded", "true");
  const panel = dialog.locator(".prepared-mnemonic-panel");
  await expect(panel).toBeVisible();
  await expect(panel.locator(".prepared-mnemonic-scaffold-label")).toHaveText(/Guided scaffold|Scaffold/i);
  await expect(panel.getByRole("button", { name: "Use" })).toHaveCount(0);
});
