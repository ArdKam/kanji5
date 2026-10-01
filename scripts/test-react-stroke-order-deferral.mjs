import assert from "node:assert/strict";
import fs from "node:fs";

const app=fs.readFileSync("frontend/src/app/App.tsx","utf8");
const vite=fs.readFileSync("frontend/vite.config.ts","utf8");

assert.match(app,/lazy\(\(\)=>import\(["']\.\/StrokeOrderViewer["']\)/);
assert.doesNotMatch(app,/import \{ StrokeOrderViewer \} from ["']\.\/StrokeOrderViewer["']/);
assert.match(app,/<Suspense fallback=\{null\}>\s*<StrokeOrderViewer/);
assert.match(vite,/dedupe:\s*\["react",\s*"react-dom"\]/);
assert.match(vite,/react-vendor/);
assert.match(vite,/\(\?:react\|react-dom\)/);

console.log("Stroke-order startup deferral contract passed.");
