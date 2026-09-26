import { test, expect } from "@playwright/test";

const KANJI_VG_URL =
  "https://raw.githubusercontent.com/KanjiVG/kanjivg/422b5538595676da918c288a4230cb5e22a1ee7e/kanji/05b66.svg";

async function referenceStrokes(page) {
  await page.goto(KANJI_VG_URL);
  return page.evaluate(() => [...document.querySelectorAll("path[id]")]
    .map(node => {
      const id = node.getAttribute("id") || "";
      const match = id.match(/-s(\d+)$/);
      if (!match) return null;
      const path = node;
      const total = path.getTotalLength();
      const count = 48;
      const points = Array.from({ length: count }, (_, index) => {
        const p = path.getPointAtLength((total * index) / Math.max(1, count - 1));
        return { x: p.x, y: p.y };
      });
      return { strokeNumber: Number(match[1]), points };
    })
    .filter(Boolean)
    .sort((a, b) => a.strokeNumber - b.strokeNumber)
    .map(({ points }) => points));
}

async function cleanStart(page) {
  await page.goto("/");
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("kanji5-")) localStorage.removeItem(key);
    }
    sessionStorage.clear();
  });
  await page.reload();
  await expect(page.locator("#root .app-shell")).toBeVisible({ timeout: 20000 });
}

async function drawStrokes(page, canvas, strokes, order = strokes) {
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Handwriting canvas has no layout box");
  for (const stroke of order) {
    const first = stroke[0];
    await page.mouse.move(
      box.x + (first.x / 109) * box.width,
      box.y + (first.y / 109) * box.height,
    );
    await page.mouse.down();
    for (let i = 1; i < stroke.length; i += 1) {
      const point = stroke[i];
      await page.mouse.move(
        box.x + (point.x / 109) * box.width,
        box.y + (point.y / 109) * box.height,
      );
    }
    await page.mouse.up();
  }
}

test("real KanjiVG trace reaches the React handwriting grader", async ({ page }) => {
  const strokes = await referenceStrokes(page);
  expect(strokes).toHaveLength(8);

  await cleanStart(page);
  await page.getByRole("button", { name: "فرهنگ کانجی" }).click();
  const search = page.getByRole("textbox", { name: "کانجی، خوانش یا معنی را جست‌وجو کن" });
  await search.fill("学");
  const tile = page.locator(".kanji-catalog-tile").filter({ hasText: "学" }).first();
  await expect(tile).toBeVisible({ timeout: 15000 });
  await tile.click();

  const dialog = page.locator(".dictionary-card-dialog:visible");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "تمرین دست‌خط" }).click();
  const canvas = dialog.locator("canvas.handwriting-canvas");
  await expect(canvas).toBeVisible();
  await expect(dialog.locator(".handwriting-stroke-count")).toContainText("۸");

  await drawStrokes(page, canvas, strokes);
  await dialog.getByRole("button", { name: "ارزیابی دست‌خط" }).click();
  const result = dialog.locator(".handwriting-result");
  await expect(result).toBeVisible();
  const perfectScore = Number(await result.getAttribute("data-score"));
  expect(perfectScore).toBeGreaterThanOrEqual(94);

  await dialog.getByRole("button", { name: "پاک کردن" }).click();
  await drawStrokes(page, canvas, strokes, [...strokes].reverse());
  await dialog.getByRole("button", { name: "ارزیابی دست‌خط" }).click();
  const reversedScore = Number(await result.getAttribute("data-score"));
  expect(reversedScore).toBeLessThan(perfectScore - 20);
  await expect(result).toHaveAttribute("role", "status");
});
