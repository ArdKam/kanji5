import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync('frontend/src/app/SettingsDialog.tsx','utf8');
for (const required of ['settings-support-section','PUBLIC-PRODUCT.md','BROWSER-SUPPORT.md','PRIVACY-AND-DATA.md','issues/new/choose']) assert.ok(source.includes(required), `Missing public support link: ${required}`);
const css=fs.readFileSync('frontend/src/styles.css','utf8');
assert.ok(css.includes('.settings-support-links{'));
console.log('Kanji 5 public help/support links contract passed.');
