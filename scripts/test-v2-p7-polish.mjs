import assert from 'node:assert/strict';
import fs from 'node:fs';

const presentation=fs.readFileSync('v2-presentation.js','utf8');
const css=fs.readFileSync('v2-presentation.css','utf8');
const workflow=fs.readFileSync('.github/workflows/v2-parity.yml','utf8');

assert.match(presentation,/id = 'v2OperationStatus'/);
assert.match(presentation,/aria-live','polite'/);
assert.match(presentation,/content\.setAttribute\('aria-busy','true'\)/);
assert.match(presentation,/function runBusy\(/);
assert.match(presentation,/در حال نمایش پاسخ/);
assert.match(presentation,/در حال ثبت مرور/);
assert.match(presentation,/function speechAvailable\(/);
assert.match(presentation,/صدا در این مرورگر در دسترس نیست/);
assert.match(presentation,/aria-disabled/);
assert.match(presentation,/function renderFatal\(/);

assert.match(css,/\.v2-operation-status\{/);
assert.match(css,/data-state="busy"/);
assert.match(css,/data-state="error"/);
assert.match(css,/text-wrap:balance/);
assert.match(css,/text-rendering:optimizeLegibility/);
assert.match(css,/font-variant-numeric:tabular-nums/);
assert.match(css,/prefers-reduced-motion:reduce/);

assert.match(workflow,/scripts\/test-v2-p7-polish\.mjs/);
assert.match(workflow,/e2e\/v2-p7-polish\.spec\.mjs/);
console.log('Kanji 5 v2 P7 polish contract passed.');
