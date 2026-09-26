import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

const BASE =
  "https://raw.githubusercontent.com/KanjiVG/kanjivg/422b5538595676da918c288a4230cb5e22a1ee7e/kanji";

const cases = [
  ["学", "05b66"],
  ["日", "065e5"],
  ["木", "06708"],
  ["人", "04eba"],
  ["語", "08a9e"],
];

async function sampleStrokes(page, svgText) {
  return page.evaluate((source) => {
    const SVG_NS = "http://www.w3.org/2000/svg";
    const holder = document.createElement("div");
    holder.style.cssText = "position:absolute;left:-10000px;top:-10000px;width:109px;height:109px;visibility:hidden;";
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 109 109");

    const paths = new Map();
    const pattern = /<path\s+id="([^"]+-s(\d+))"[^>]*\bd="([^"]+)"/g;
    for (const match of source.matchAll(pattern)) {
      const number = Number(match[2]);
      const d = String(match[3] || "").trim();
      if (!Number.isInteger(number) || number < 1 || !d) continue;
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("id", match[1]);
      path.setAttribute("d", d);
      svg.appendChild(path);
      paths.set(number, path);
    }

    holder.appendChild(svg);
    document.body.appendChild(holder);
    try {
      return [...paths.entries()]
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

function transform(strokes, fn) {
  return strokes.map(stroke => stroke.map(fn));
}

test("vector grader calibrates across real KanjiVG characters", async ({ page }) => {
  const graderSource = await readFile(
    new URL("../frontend/src/app/handwriting-grader.js", import.meta.url),
    "utf8",
  );

  await page.goto("about:blank");

  const results = [];
  for (const [character, codePoint] of cases) {
    const response = await page.request.get(`${BASE}/${codePoint}.svg`);
    expect(response.ok()).toBe(true);
    const svgText = await response.text();
    const reference = await sampleStrokes(page, svgText);
    expect(reference.length).toBeGreaterThan(0);

    const score = (strokes) => page.evaluate(({ source, strokes, reference }) => {
      const executable = source
        .replace(/export\s+const\s+/g, "const ")
        .replace(/export\s+function\s+/g, "function ");
      return new Function("strokes", "reference", executable + "\nreturn gradeHandwriting(strokes, reference);")(strokes, reference);
    }, { source: graderSource, strokes, reference });

    const perfect = await score(reference);
    const translated = await score(transform(reference, p => ({ x: p.x + 3, y: p.y + 2 })));
    const scaled = await score(transform(reference, p => ({
      x: 54.5 + (p.x - 54.5) * 0.94,
      y: 54.5 + (p.y - 54.5) * 0.94,
    })));
    const rotated = await score(transform(reference, p => ({
      x: 54.5 - (p.y - 54.5),
      y: 54.5 + (p.x - 54.5),
    })));

    results.push({
      character,
      strokes: reference.length,
      perfect: perfect.score,
      translated: translated.score,
      scaled: scaled.score,
      rotated: rotated.score,
      feedback: { perfect: perfect.feedbackCode, rotated: rotated.feedbackCode },
    });

    expect(perfect.score).toBeGreaterThanOrEqual(98);
    expect(translated.score).toBeGreaterThanOrEqual(90);
    expect(scaled.score).toBeGreaterThanOrEqual(90);
    expect(rotated.score).toBeLessThan(65);
  }

  console.log(JSON.stringify(results, null, 2));
});
