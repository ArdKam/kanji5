import { test, expect } from "@playwright/test";

const KANJI_VG_BASE =
  "https://raw.githubusercontent.com/KanjiVG/kanjivg/422b5538595676da918c288a4230cb5e22a1ee7e/kanji";

async function readStrokes(page, codePointHex) {
  const response = await page.request.get(`${KANJI_VG_BASE}/${codePointHex}.svg`);
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
      byStroke.set(strokeNumber, { d, path });
    }

    holder.appendChild(svg);
    document.body.appendChild(holder);
    try {
      return [...byStroke.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([, value]) => {
          const total = value.path.getTotalLength();
          const count = 48;
          const points = Array.from({ length: count }, (_, index) => {
            const p = value.path.getPointAtLength((total * index) / Math.max(1, count - 1));
            return { x: p.x, y: p.y };
          });
          return { d: value.d, points };
        });
    } finally {
      holder.remove();
    }
  }, svgText);
}

async function legacyScore(page, target, user, userLineWidth = 8) {
  return page.evaluate(({ target, user }) => {
    const size = 220;
    const targetCanvas = document.createElement("canvas");
    const userCanvas = document.createElement("canvas");
    targetCanvas.width = targetCanvas.height = userCanvas.width = userCanvas.height = size;

    const targetCtx = targetCanvas.getContext("2d");
    const userCtx = userCanvas.getContext("2d");
    if (!targetCtx || !userCtx) return 0;

    const scale = size / 109;

    targetCtx.fillStyle = "#1c1a17";
    targetCtx.save();
    targetCtx.scale(scale, scale);
    for (const stroke of target) targetCtx.fill(new Path2D(stroke.d));
    targetCtx.restore();

    userCtx.save();
    userCtx.scale(scale, scale);
    userCtx.strokeStyle = "#1c1a17";
    userCtx.lineWidth = userLineWidth;
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

  const perfect = await legacyScore(
    page,
    gakuen,
    gakuen.map(stroke => ({ points: stroke.points })),
  );

  const reversedOrder = await legacyScore(
    page,
    gakuen,
    [...gakuen].reverse().map(stroke => ({ points: stroke.points })),
  );

  const missingStroke = await legacyScore(
    page,
    gakuen,
    gakuen.slice(0, -1).map(stroke => ({ points: stroke.points })),
  );

  const wrongKanji = await legacyScore(
    page,
    gakuen,
    ko.map(stroke => ({ points: stroke.points })),
  );
  const thinUser = await legacyScore(
    page,
    gakuen,
    gakuen.map(stroke => ({ points: stroke.points })),
    4,
  );
  const thickUser = await legacyScore(
    page,
    gakuen,
    gakuen.map(stroke => ({ points: stroke.points })),
    16,
  );

  console.log(JSON.stringify({
    grader: "legacy-v1",
    character: "学",
    perfectReferenceTrace: perfect,
    reversedStrokeOrder: reversedOrder,
    missingLastStroke: missingStroke,
    unrelatedKanjiTrace: wrongKanji,
    thinReferenceTrace: thinUser,
    thickReferenceTrace: thickUser,
  }, null, 2));

  expect(perfect).toBeLessThan(80);
  expect(reversedOrder).toBe(perfect);
  expect(missingStroke).toBeLessThan(perfect);
  expect(wrongKanji).toBeGreaterThanOrEqual(0);
});
