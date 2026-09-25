import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../frontend/src/app/StrokeOrderViewer.tsx", import.meta.url), "utf8");

assert.match(source, /viewerRef = useRef<HTMLElement \| null>\(null\)/);
assert.match(source, /scrollAfterExpandRef = useRef\(false\)/);
assert.match(source, /closest<HTMLElement>\("\.learning-back-scroll"\)/);
assert.match(source, /behavior: reducedMotion \? "auto" : "smooth"/);
assert.match(source, /scrollContainer\.scrollTo\(\{/);
assert.match(source, /requestAnimationFrame\(\(\) => \{/);
assert.match(source, /const targetTop = scrollContainer\.scrollTop \+ \(targetRect\.top - containerRect\.top\) - edgePadding/);
assert.match(source, /ref=\{viewerRef\}/);

const styles = await readFile(new URL("../frontend/src/styles.css", import.meta.url), "utf8");
assert.match(styles, /\.learning-card-back \.learning-back-overview,/);
assert.match(styles, /\.learning-card\[data-card-density="dense"\] \.learning-back-overview/);
assert.match(styles, /grid-template-columns:minmax\(0,1fr\);/);
assert.doesNotMatch(styles, /\.learning-card\[data-card-density="dense"\] \.learning-back-overview\{[\\s\\S]*?grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/);

const e2e = await readFile(new URL("../e2e/react-learning-card-flip.spec.mjs", import.meta.url), "utf8");
assert.match(e2e, /stroke-order replay auto-scrolls the expanded viewer fully into view/);
assert.match(e2e, /call\.behavior === "smooth"/);

console.log("Stroke-order auto-scroll source and regression contracts passed.");
