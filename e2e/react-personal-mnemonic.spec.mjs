import { test, expect } from "@playwright/test";

async function goToMnemonicPage(card) {
  const mnemonicShortcut = card.locator('.learning-back-page-shortcut[aria-label="Personal mnemonic"]');
  await expect(mnemonicShortcut).toBeVisible({ timeout: 10000 });
  await mnemonicShortcut.click();
  await expect(card.locator(".learning-back-page.active .mnemonic-page")).toHaveCount(1);
}


test("personal mnemonic can be saved, edited, cleared, and survives a reload", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("kanji5-ui-language", "en"));
  await page.goto("/");
  const card = page.locator("#root .learning-card");
  await expect(card).toBeVisible({ timeout: 20000 });

  await card.getByRole("button", { name: "Show kanji information" }).click();
  await expect(card).toHaveClass(/is-revealed/, { timeout: 10000 });
  await goToMnemonicPage(card);
  await card.locator(".mnemonic-trigger").click();
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

test("unsaved dictionary mnemonic drafts survive tab switches", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("kanji5-ui-language", "en"));
  await page.goto("/");
  await expect(page.locator("#root .app-shell")).toBeVisible({ timeout: 20000 });
  await page.getByRole("button", { name: "Kanji dictionary" }).click();
  await expect(page.locator(".dictionary-page")).toBeVisible({ timeout: 10000 });
  const tile = page.locator(".kanji-catalog-tile").first();
  await expect(tile).toBeVisible({ timeout: 10000 });
  await tile.click();
  const card = page.locator(".dictionary-card-dialog:visible");
  await expect(card).toBeVisible();
  await card.getByRole("tab", { name: "Mnemonic", exact: true }).click();
  const editor = card.locator(".dictionary-personal-mnemonic-input");
  await expect(editor).toBeVisible({ timeout: 10000 });
  await editor.fill("Unsaved draft that must survive tab switches.");
  await card.getByRole("tab", { name: "Words", exact: true }).click();
  await expect(card.locator(".dictionary-personal-mnemonic-input")).toHaveCount(0);
  await card.getByRole("tab", { name: "Mnemonic", exact: true }).click();
  await expect(card.locator(".dictionary-personal-mnemonic-input")).toHaveValue("Unsaved draft that must survive tab switches.");
});
