import { test, expect } from "@playwright/test";

async function goToBackPage(card, targetIndex) {
  for (let index = 0; index < targetIndex; index += 1) {
    await card.locator(".pager-button").nth(1).click();
  }
  await expect(card.locator(".learning-back-page.active")).toHaveCount(1);
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
  await goToBackPage(reloadedCard, 3);
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
