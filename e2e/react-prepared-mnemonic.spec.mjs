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
  const panel = dialog.locator(".prepared-mnemonic-panel");
  await expect(panel).toBeVisible();
  await expect(panel.locator(".prepared-mnemonic-scaffold-label")).toHaveText(/Guided scaffold|Scaffold/i);
  await expect(panel.getByRole("button", { name: "Use" })).toHaveCount(0);
});
