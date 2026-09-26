import assert from "node:assert/strict";
import { HANDWRITING_GRADER_VERSION, gradeHandwriting, preprocessStrokes } from "../frontend/src/app/handwriting-grader.js";

assert.equal(HANDWRITING_GRADER_VERSION, "1.0.0");

const point = (x, y) => ({ x, y });
const line = (x1, y1, x2, y2, n = 24) =>
  Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    return point(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t);
  });
const polyline = (...coords) => coords.map(([x, y]) => point(x, y));

const reference = [
  line(20, 20, 50, 20),
  line(50, 20, 50, 55),
  line(20, 55, 50, 55),
  line(20, 80, 50, 80),
];

const perfect = gradeHandwriting(reference, reference);
assert.equal(perfect.score, 100, "perfect reference trace must score 100");
assert.equal(perfect.strokeCount.ratio, 1);
assert.equal(perfect.scoreReliability, "high");
assert.equal(perfect.lengthIntegrity, 1);

const translated = reference.map(stroke => stroke.map(p => point(p.x + 3, p.y + 2)));
const translatedGrade = gradeHandwriting(translated, reference);
assert.ok(translatedGrade.score >= 90, `small translation should remain high; got ${translatedGrade.score}`);

const scaled = reference.map(stroke => stroke.map(p => point(54.5 + (p.x - 54.5) * 0.94, 54.5 + (p.y - 54.5) * 0.94)));
const scaledGrade = gradeHandwriting(scaled, reference);
assert.ok(scaledGrade.score >= 88, `small scale change should remain high; got ${scaledGrade.score}`);

const noisy = reference.map(stroke => stroke.map((p, i) => point(
  p.x + (i % 3 === 0 ? 0.8 : -0.4),
  p.y + (i % 4 === 0 ? 0.6 : -0.3),
)));
const noisyGrade = gradeHandwriting(noisy, reference);
assert.ok(noisyGrade.score >= 85, `small jitter should remain high; got ${noisyGrade.score}`);

const missing = gradeHandwriting(reference.slice(0, -1), reference);
assert.ok(missing.score < 85, `missing stroke must be materially penalized; got ${missing.score}`);
assert.equal(missing.strokeCount.missing, 1);

const extra = gradeHandwriting(reference.concat([line(75, 75, 85, 85)]), reference);
assert.ok(extra.score < 85, `extra stroke must be materially penalized; got ${extra.score}`);
assert.equal(extra.strokeCount.extra, 1);

const reversed = gradeHandwriting([...reference].reverse(), reference);
assert.ok(reversed.score < perfect.score - 20, `wrong stroke order must materially lower score; got ${reversed.score}`);
assert.ok(reversed.orderScore < perfect.orderScore - 0.20, `wrong order signal should be lower; got ${reversed.orderScore}`);

const wrongShape = [
  line(20, 20, 85, 20),
  line(50, 20, 50, 25),
  line(20, 55, 50, 30),
  polyline([80, 5], [85, 5], [90, 20]),
];

const wrongKanji = [
  line(80, 8, 80, 42),
  line(64, 28, 94, 28),
  line(64, 48, 94, 48),
  line(72, 64, 86, 82),
];
const wrongShapeGrade = gradeHandwriting(wrongShape, reference);
assert.ok(wrongShapeGrade.score < 70, `wrong shape must score clearly lower; got ${wrongShapeGrade.score}`);

const wrongKanjiGrade = gradeHandwriting(wrongKanji, reference);
assert.ok(wrongKanjiGrade.score < 65, `unrelated character geometry must not score as a good match; got ${wrongKanjiGrade.score}`);

const wrongCount = gradeHandwriting([reference[0]], reference);
assert.ok(wrongCount.score < 40, `severe stroke-count mismatch must score low; got ${wrongCount.score}`);


const reversedStroke = reference.map(stroke => stroke.slice().reverse());
const reversedStrokeGrade = gradeHandwriting(reversedStroke, reference);
assert.ok(reversedStrokeGrade.score < 80, `reversing stroke direction must be penalized; got ${reversedStrokeGrade.score}`);

const shortStroke = [
  line(20, 20, 38, 20),
  ...reference.slice(1),
];
const shortStrokeGrade = gradeHandwriting(shortStroke, reference);
assert.ok(shortStrokeGrade.score < 80, `a materially short stroke must not receive a good score; got ${shortStrokeGrade.score}`);

const largeScale = reference.map(stroke => stroke.map(p => point(
  54.5 + (p.x - 54.5) * 1.45,
  54.5 + (p.y - 54.5) * 1.45,
)));
const largeScaleGrade = gradeHandwriting(largeScale, reference);
assert.ok(largeScaleGrade.score < 85, `large scale deviation must be visible; got ${largeScaleGrade.score}`);

const rotated = reference.map(stroke => stroke.map(p => point(
  54.5 - (p.y - 54.5),
  54.5 + (p.x - 54.5),
)));
const rotatedGrade = gradeHandwriting(rotated, reference);
assert.ok(rotatedGrade.score < 65, `90-degree rotation must not score as a good match; got ${rotatedGrade.score}`);

const highPointStroke = line(20, 20, 50, 20, 1000);
const highPointInput = [highPointStroke, ...reference.slice(1)];
const highPointGrade = gradeHandwriting(highPointInput, reference);
assert.ok(Number.isFinite(highPointGrade.score), "high-point input must remain gradeable");
assert.equal(highPointGrade.strokeCount.user, reference.length);
const processedHighPointInput = preprocessStrokes([highPointStroke]);
assert.equal(processedHighPointInput.length, 1);
assert.ok(processedHighPointInput[0].length <= 96, "preprocessing should cap deterministic resampling density");

const empty = gradeHandwriting([], reference);
assert.equal(empty.score, 0);
assert.equal(empty.feedbackCode, "empty");
assert.equal(empty.lengthIntegrity, 0);

const invalid = gradeHandwriting([[point(NaN, 1)], []], reference);
assert.equal(invalid.score, 0);
assert.equal(invalid.feedbackCode, "empty");
assert.equal(invalid.lengthIntegrity, 0);

console.log("Handwriting grader unit contract passed.");
