import { test, expect } from "@playwright/test";

test("personal mnemonic can be saved, edited, cleared, and survives a reload", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("kanji5-ui-language", "en"));
  await page.goto("/");
  const card = page.locator("#root .learning-card");
  await expect(card).toBeVisible({ timeout: 20000 });

  await page.getByRole("button", { name: "Show kanji information" }).click();
  await expect(card).toHaveClass(/is-revealed/, { timeout: 10000 });

  const editor = card.locator(".mnemonic-editor textarea");
  await expect(editor).toBeVisible();
  await editor.fill("A student learning under a roof.");
  await card.getByRole("button", { name: "Save mnemonic" }).click();
  await expect(card.locator(".mnemonic-saved p")).toHaveText("A student learning under a roof.");

  await page.reload();
  const reloadedCard = page.locator("#root .learning-card");
  await expect(reloadedCard).toBeVisible({ timeout: 20000 });
  if (!(await reloadedCard.evaluate((el) => el.classList.contains("is-revealed")))) {
    await reloadedCard.getByRole("button", { name: "Show kanji information" }).click();
  }
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
