import { test, expect } from "@playwright/test";

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

  const prepared = card.locator(".mnemonic-prepared");
  await expect(prepared).toBeVisible();
  const preparedText = prepared.locator(".mnemonic-prepared-copy p");
  await expect(preparedText).toHaveText(/\S+/);

  const useButton = prepared.getByRole("button", { name: "Use" });
  await expect(useButton).toBeVisible();
  await useButton.click();

  await expect(card.locator(".mnemonic-saved p")).toHaveText(await preparedText.innerText());
});
