import assert from 'node:assert/strict';
import fs from 'node:fs';

const presentation=fs.readFileSync('v2-presentation.js','utf8');
const css=fs.readFileSync('v2-presentation.css','utf8');

assert.match(presentation,/async function openV2Settings\(\)[\s\S]*ui\.card\(/);
assert.match(presentation,/async function openV2Settings\(\)[\s\S]*ui\.button\(/);
assert.match(presentation,/await boundary\.updateSettings\(\{/);
assert.match(presentation,/boundary\.resetProgress\?\.\(\)/);
assert.match(css,/\.v2-settings-surface/);
assert.match(css,/\.v2-setting-row/);
assert.match(css,/\.v2-settings-form \.v2-actions/);
console.log('Kanji 5 Settings visual primitive contract passed.');
