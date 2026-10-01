import assert from "node:assert/strict";
import fs from "node:fs";

const app=fs.readFileSync("frontend/src/app/HandwritingPractice.tsx","utf8");
const css=fs.readFileSync("frontend/src/app/dictionary.css","utf8");

assert.match(app,/Math\.min\(3,window\.devicePixelRatio\|\|1\)/);
const feedbackIndex=app.indexOf('className="handwriting-live-feedback"');
const canvasIndex=app.indexOf('className="handwriting-canvas-wrap"');
assert.ok(feedbackIndex>=0&&canvasIndex>=0&&feedbackIndex<canvasIndex,"Live stroke feedback must render before the canvas.");
assert.match(app,/className=\{"handwriting-live-feedback-slot"/);
assert.match(css,/\.handwriting-live-feedback-slot\{/);
assert.match(css,/\.handwriting-live-feedback-slot:not\(\.is-active\)\{/);
console.log("Handwriting retina/feedback contract passed.");
