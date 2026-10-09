import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../frontend/src/app/StrokeOrderViewer.tsx", import.meta.url), "utf8");

assert.doesNotMatch(source, /stroke-order-tool-trigger/);
assert.doesNotMatch(source, /const \[expanded/);
assert.doesNotMatch(source, /scrollAfterExpandRef/);
assert.doesNotMatch(source, /openLearningTool/);
assert.doesNotMatch(source, /closeLearningTool/);
assert.match(source, /className="stroke-order-panel is-expanded"/);
assert.match(source, /data-stroke-order-open="true"/);

const app = await readFile(new URL("../frontend/src/app/App.tsx", import.meta.url), "utf8");
assert.match(app, /mnemonicToolRef=useRef<HTMLElement\|null>\(null\)/);
assert.match(app, /scrollMnemonicEditorIntoView=useCallback\(\(\)=>/);
assert.match(app, /closest<HTMLElement>\("\.learning-back-scroll"\)/);
assert.match(app, /const scrollBounds=scrollContainer\.getBoundingClientRect\(\)/);
assert.match(app, /const targetBounds=target\.getBoundingClientRect\(\)/);
assert.match(app, /const bottomOverflow=targetBounds\.bottom-\(scrollBounds\.bottom-10\)/);
assert.match(app, /const nextTop=Math\.max\(0,Math\.min\(maxScrollTop,scrollContainer\.scrollTop\+delta\)\)/);
assert.match(app, /scrollContainer\.scrollTo\(\{top:nextTop,behavior:"auto"\}\)/);
assert.match(app, /mnemonicEditing\?" has-open-mnemonic":""/);
assert.match(app, /if\(!mnemonicEditing\)return;/);
assert.match(app, /ref=\{mnemonicToolRef\}/);

const styles = await readFile(new URL("../frontend/src/styles.css", import.meta.url), "utf8");
assert.match(styles, /\.learning-card-back \.learning-back-overview,/);
assert.match(styles, /\.learning-card\[data-card-density="dense"\] \.learning-back-overview/);
assert.match(styles, /grid-template-columns:minmax\(0,1fr\);/);
assert.doesNotMatch(styles, /\.learning-card\[data-card-density="dense"\] \.learning-back-overview\{[^}]*grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/);

const e2e = await readFile(new URL("../e2e/react-learning-card-flip.spec.mjs", import.meta.url), "utf8");
assert.match(e2e, /learning card keeps the Stroke Order page directly open/);
assert.match(e2e, /learning card exposes five full-content back pages in Persian and English/);
assert.match(e2e, /learning card keeps the Stroke Order page directly open/);
assert.doesNotMatch(e2e, /stroke-order replay auto-scrolls the expanded viewer fully into view/);
assert.match(e2e, /personal mnemonic editor auto-scrolls fully into view when opened/);

console.log("Stroke-order auto-scroll source and regression contracts passed.");
