import { test, expect } from "@playwright/test";

async function clean(page, language = "en") {
  await page.addInitScript((value) => localStorage.setItem("kanji5-ui-language", value), language);
  await page.goto("/");
  await page.evaluate((value) => {
    for (const key of Object.keys(localStorage)) if (key.startsWith("kanji5-")) localStorage.removeItem(key);
    localStorage.setItem("kanji5-ui-language", value);
    sessionStorage.clear();
    localStorage.setItem("kanji5-onboarding-v2", "complete");
  }, language);
  await page.reload();
  await expect(page.locator("#root .app-shell")).toBeVisible({ timeout: 20000 });
}

async function openReadingLab(page) {
  await page.getByRole("button", { name: "More", exact: true }).click();
  const menu = page.locator("#header-tools-menu");
  await expect(menu).toHaveClass(/open/);
  await menu.getByRole("button", { name: "Reading lab", exact: true }).click();
  const dialog = page.getByRole("dialog").last();
  await expect(dialog.locator(".reading-lab")).toBeVisible({ timeout: 10000 });
  return dialog.locator(".reading-lab");
}

test("Reading Lab keeps a calm start state and a single-scroll focused Reader on desktop and mobile", async ({ page }) => {
  await clean(page);
  const lab = await openReadingLab(page);
  const input = lab.locator(".reading-lab-input");

  await expect(input).toBeVisible();
  expect(await input.evaluate(el => el.getBoundingClientRect().height)).toBeLessThanOrEqual(155);
  const headingBottom = await lab.locator(".reading-lab-section-heading").first().evaluate(el => el.getBoundingClientRect().bottom);
  const inputTop = await input.evaluate(el => el.getBoundingClientRect().top);
  expect(inputTop - headingBottom).toBeLessThanOrEqual(34);
  await expect(lab.locator(".reading-lab-empty")).toBeHidden();
  await expect(lab.locator(".reading-lab-listen")).toBeHidden();

  await input.fill("今日は学校に行きます。\n私は日本語を勉強します。");
  await expect(lab.locator(".reading-lab-reader")).toBeVisible();
  await expect(lab.locator(".reading-lab-listen")).toBeVisible();
  await expect(lab.locator(".reading-lab-reader-sentence")).toHaveCount(2);

  async function assertFlowOrder() {
    const positions = await Promise.all([
      lab.locator(".reading-lab-source").evaluate(el => el.getBoundingClientRect().top),
      lab.locator(".reading-lab-reader").evaluate(el => el.getBoundingClientRect().top),
      lab.locator(".reading-lab-analysis").evaluate(el => el.getBoundingClientRect().top),
      lab.locator(".reading-lab-listen").evaluate(el => el.getBoundingClientRect().top),
    ]);
    expect(positions[1]).toBeGreaterThan(positions[0]);
    expect(positions[2]).toBeGreaterThan(positions[1]);
    expect(positions[3]).toBeGreaterThan(positions[2]);
  }

  await assertFlowOrder();
  await expect(lab.locator(".reading-lab-sentence-list")).toHaveCSS("overflow-y", "visible");
  expect(await lab.locator(".reading-lab-sentence-list").evaluate(el => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(2);

  await page.setViewportSize({ width: 390, height: 844 });
  await assertFlowOrder();
  expect(await lab.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(2);
});
