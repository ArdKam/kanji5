import { test, expect } from "@playwright/test";

const KANJI_VG_BASE =
  "https://raw.githubusercontent.com/KanjiVG/kanjivg/422b5538595676da918c288a4230cb5e22a1ee7e/kanji";

type Stroke = { d: string; points: { x: number; y: number }[] };

async function readStrokes(page, codePointHex: string): Promise<Stroke[]> {
  await page.goto(`${KANJI_VG_BASE}/${codePointHex}.svg`);
  return page.evaluate(() => {
    const svgPaths = [...document.querySelectorAll("path[id]")]
      .map((node) => {
        const id = node.getAttribute("id") || "";
        const match = id.match(/-s(\d+)$/);
        if (!match) return null;
        const path = node as SVGPathElement;
        const d = path.getAttribute("d") || "";
        const total = path.getTotalLength();
        const count = Math.max(8, Math.min(80, Math.ceil(total / 2)));
        const points = Array.from({ length: count }, (_, index) => {
          const p = path.getPointAtLength((total * index) / Math.max(1, count - 1));
          return { x: p.x, y: p.y };
        });
        return { strokeNumber: Number(match[1]), d, points };
      })
      .filter((value): value is { strokeNumber: number; d: string; points: { x: number; y: number }[] } => Boolean(value))
      .sort((a, b) => a.strokeNumber - b.strokeNumber);
    return svgPaths.map(({ d, points }) => ({ d, points }));
  });
}

async function legacyScore(
  page: import("@playwright/test").Page,
  target: Stroke[],
  user: { points: { x: number; y: number }[] }[],
): Promise<number> {
  return page.evaluate(({ target, user }) => {
    const size = 220;
    const targetCanvas = document.createElement("canvas");
    const userCanvas = document.createElement("canvas");
    targetCanvas.width = targetCanvas.height = userCanvas.width = userCanvas.height = size;
    const targetCtx = targetCanvas.getContext("2d");
    const userCtx = userCanvas.getContext("2d");
    if (!targetCtx || !userCtx) return 0;

    targetCtx.fillStyle = "#1c1a17";
    const scale = size / 109;
    targetCtx.save();
    targetCtx.scale(scale, scale);
    for (const stroke of target) targetCtx.fill(new Path2D(stroke.d));
    targetCtx.restore();

    userCtx.save();
    userCtx.scale(scale, scale);
    userCtx.strokeStyle = "#1c1a17";
    userCtx.lineWidth = 8;
    userCtx.lineCap = "round";
    userCtx.lineJoin = "round";
    for (const stroke of user) {
      if (!stroke.points.length) continue;
      userCtx.beginPath();
      userCtx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i += 1) {
        userCtx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      userCtx.stroke();
    }
    userCtx.restore();

    const targetPixels = targetCtx.getImageData(0, 0, size, size).data;
    const userPixels = userCtx.getImageData(0, 0, size, size).data;
    let targetCount = 0;
    let userCount = 0;
    let intersection = 0;
    for (let i = 3; i < targetPixels.length; i += 4) {
      const targetInk = targetPixels[i] > 20;
      const userInk = userPixels[i] > 20;
      if (targetInk) targetCount += 1;
      if (userInk) userCount += 1;
      if (targetInk && userInk) intersection += 1;
    }
    if (!targetCount || !userCount || !intersection) return 0;
    const overlapScore = (2 * intersection) / (targetCount + userCount);
    const strokeRatio =
      Math.min(user.length, target.length) / Math.max(user.length, target.length);
    return Math.round((overlapScore * 0.82 + strokeRatio * 0.18) * 100);
  }, { target, user });
}

test("legacy handwriting grader baseline exposes the current scoring defects", async ({ page }) => {
  const gakuen = await readStrokes(page, "05b66");
  const ko = await readStrokes(page, "06746");
  expect(gakuen.length).toBe(8);
  expect(ko.length).toBeGreaterThan(0);

  const perfect = await legacyScore(page, gakuen, gakuen);
  const reversedOrder = await legacyScore(page, gakuen, [...gakuen].reverse());
  const missingStroke = await legacyScore(page, gakuen, gakuen.slice(0, -1));
  const wrongKanji = await legacyScore(page, gakuen, ko);

  console.log(JSON.stringify({
    grader: "legacy-v1",
    character: "学",
    perfectReferenceTrace: perfect,
    reversedStrokeOrder: reversedOrder,
    missingLastStroke: missingStroke,
    unrelatedKanjiTrace: wrongKanji,
  }, null, 2));

  // The existing implementation must be demonstrably known-bad:
  // even a geometrically exact trace should not remain the baseline contract.
  expect(perfect).toBeLessThan(80);

  // The existing scorer is image-overlap based and therefore blind to stroke order.
  expect(reversedOrder).toBe(perfect);

  // The baseline should at least react to an omitted stroke.
  expect(missingStroke).toBeLessThan(perfect);

  // Record whether unrelated input can still obtain non-trivial overlap.
  expect(wrongKanji).toBeGreaterThanOrEqual(0);
});
