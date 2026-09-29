import { test, expect } from "@playwright/test";

async function goToBackPage(card, targetIndex) {
  for (let index = 0; index < targetIndex; index += 1) {
    const next = card.locator(".pager-button").nth(1);
    if (!(await next.isEnabled())) break;
    await next.click();
  }
  await expect(card.locator(".learning-back-page.active")).toHaveCount(1);
}

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
        const button = delta >= 0 ? card.locator(".pager-button").nth(1) : card.locator(".pager-button").nth(0);
        for (let step = 0; step < Math.abs(delta); step += 1) {
          await button.click();
        }
      }
      await expect(page).toHaveClass(/active/);
      return;
    }
  }
  throw new Error("Mnemonic page not found");
}

test("personal mnemonic can be saved, edited, cleared, and survives a reload", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("kanji5-ui-language", "en"));
  await page.goto("/");
  const card = page.locator("#root .learning-card");
  await expect(card).toBeVisible({ timeout: 20000 });

  await card.getByRole("button", { name: "Show kanji information" }).click();
  await expect(card).toHaveClass(/is-revealed/, { timeout: 10000 });
  await goToBackPage(card, 2);
  await card.getByRole("button", { name: "Personal mnemonic" }).click();
  const editor = card.locator(".mnemonic-editor textarea");
  await expect(editor).toBeVisible();

  await editor.fill("A student learning under a roof.");
  await card.getByRole("button", { name: "Save mnemonic" }).click();
  await expect(card.locator(".mnemonic-saved p")).toHaveText("A student learning under a roof.");
  const mnemonicGeometry = await card.evaluate(() => {
    const root = document.querySelector(".mnemonic-tool");
    const trigger = root?.querySelector(".mnemonic-trigger");
    const saved = root?.querySelector(".mnemonic-saved");
    if (!(root instanceof HTMLElement) || !(trigger instanceof HTMLElement) || !(saved instanceof HTMLElement)) throw new Error("mnemonic layout missing");
    const a = trigger.getBoundingClientRect();
    const b = saved.getBoundingClientRect();
    const overlap = Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
    return { overlap, triggerWidth: a.width, rootHeight: root.getBoundingClientRect().height };
  });
  expect(mnemonicGeometry.overlap).toBe(false);
  expect(mnemonicGeometry.triggerWidth).toBeGreaterThanOrEqual(44);
  expect(mnemonicGeometry.rootHeight).toBeGreaterThanOrEqual(44);

  await page.reload();
  const reloadedCard = page.locator("#root .learning-card");
  await expect(reloadedCard).toBeVisible({ timeout: 20000 });
  if (!(await reloadedCard.evaluate((el) => el.classList.contains("is-revealed")))) {
    await reloadedCard.getByRole("button", { name: "Show kanji information" }).click();
  }
  await goToMnemonicPage(reloadedCard);
  await expect(reloadedCard.locator(".mnemonic-saved p")).toHaveText("A student learning under a roof.");

  await reloadedCard.getByRole("button", { name: "Edit" }).click();
  await reloadedCard.locator(".mnemonic-editor textarea").fill("A different memory hook.");
  await reloadedCard.getByRole("button", { name: "Save mnemonic" }).click();
  await expect(reloadedCard.locator(".mnemonic-saved p")).toHaveText("A different memory hook.");

  await reloadedCard.getByRole("button", { name: "Edit" }).click();
  await reloadedCard.locator(".mnemonic-editor textarea").fill("");
  await reloadedCard.getByRole("button", { name: "Save mnemonic" }).click();
  await expect(reloadedCard.locator(".mnemonic-editor textarea")).toBeVisible();
  await expect(reloadedCard.locator(".mnemonic-saved")).toHaveCount(0);
});


test("dictionary personal mnemonic draft survives section remount", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("kanji5-ui-language", "en"));
  await page.goto("/");
  const dictionaryTab = page.locator(".experience-nav .experience-tab").nth(2);
  await expect(dictionaryTab).toBeVisible();
  await dictionaryTab.click();
  await expect(page.locator(".dictionary-page")).toBeVisible({ timeout: 10000 });

  const tile = page.locator(".kanji-catalog-tile").first();
  await expect(tile).toBeVisible({ timeout: 10000 });
  await tile.click();

  const card = page.locator(".dictionary-card-dialog:visible");
  await expect(card).toBeVisible();
  await card.getByRole("tab", { name: "Mnemonic", exact: true }).click();

  const editor = card.locator(".dictionary-personal-mnemonic-input");
  await expect(editor).toBeVisible();
  await editor.fill("Unsaved draft that must survive tab switches.");

  await card.getByRole("tab", { name: "Words", exact: true }).click();
  await expect(card.locator(".dictionary-personal-mnemonic-input")).toHaveCount(0);

  await card.getByRole("tab", { name: "Mnemonic", exact: true }).click();
  await expect(card.locator(".dictionary-personal-mnemonic-input")).toHaveValue("Unsaved draft that must survive tab switches.");
});
