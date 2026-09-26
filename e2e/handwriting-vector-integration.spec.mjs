import { test, expect } from "@playwright/test";

const KANJI_VG_URL =
  "https://raw.githubusercontent.com/KanjiVG/kanjivg/422b5538595676da918c288a4230cb5e22a1ee7e/kanji/05b66.svg";

async function referenceStrokes(page) {
  const response = await page.request.get(KANJI_VG_URL);
  expect(response.ok()).toBe(true);
  const svgText = await response.text();
  return page.evaluate((source) => {
    const SVG_NS = "http://www.w3.org/2000/svg";
    const holder = document.createElement("div");
    holder.style.cssText = "position:absolute;left:-10000px;top:-10000px;width:109px;height:109px;visibility:hidden;";
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 109 109");
    const byStroke = new Map();
    const pattern = /<path\s+id="([^"]+-s(\d+))"[^>]*\bd="([^"]+)"/g;
    for (const match of source.matchAll(pattern)) {
      const strokeNumber = Number(match[2]);
      const d = String(match[3] || "").trim();
      if (!Number.isInteger(strokeNumber) || strokeNumber < 1 || !d) continue;
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("id", match[1]);
      path.setAttribute("d", d);
      svg.appendChild(path);
      byStroke.set(strokeNumber, path);
    }
    holder.appendChild(svg);
    document.body.appendChild(holder);
    try {
      return [...byStroke.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([, path]) => {
          const total = path.getTotalLength();
          const count = 48;
          return Array.from({ length: count }, (_, index) => {
            const p = path.getPointAtLength((total * index) / Math.max(1, count - 1));
            return { x: p.x, y: p.y };
          });
        });
    } finally {
      holder.remove();
    }
  }, svgText);
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
  await dialog.locator(".handwriting-header").click();
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
