import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync('scripts/stage-pages-site.mjs','utf8');
for (const doc of ['docs/PUBLIC-PRODUCT.md','docs/BROWSER-SUPPORT.md','docs/PRIVACY-AND-DATA.md','docs/FEEDBACK.md']) assert.ok(source.includes(doc), `Pages staging must include ${doc}`);
console.log('Kanji 5 public documentation staging contract passed.');
