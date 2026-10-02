import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('frontend/src/app/SettingsDialog.tsx','utf8');
assert.match(source,/settings-support-section/);
assert.match(source,/\.\/docs\/PUBLIC-PRODUCT\.md/);
assert.match(source,/\.\/docs\/BROWSER-SUPPORT\.md/);
assert.match(source,/\.\/docs\/PRIVACY-AND-DATA\.md/);
assert.match(source,/https:\/\/github\.com\/ArdKam\/kanji5\/issues\/new\/choose/);

const css=fs.readFileSync('frontend/src/styles.css','utf8');
assert.match(css,/\.settings-support-links\{/);
assert.match(css,/@media\(max-width:520px\)[\s\S]*\.settings-support-links \{display:grid;\}/);

console.log('Kanji 5 public help/support links contract passed.');
