import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const presentation=read('v2-presentation.js');
const components=read('v2-components.js');
const css=read('v2-presentation.css');
const index=read('index.html');
const sw=read('sw.js');
const migration=read('V2-LOVABLE-MIGRATION.md');

assert.match(presentation,/window\.__KANJI5_V19_V2_BOUNDARY__/);
assert.match(presentation,/window\.__KANJI5_V2_COMPONENTS__/);
assert.match(presentation,/const ui = window\.__KANJI5_V2_COMPONENTS__/);
assert.doesNotMatch(presentation,/localStorage|sessionStorage/);
assert.doesNotMatch(components,/localStorage|sessionStorage/);

assert.match(css,/--v2-bg:/);
assert.match(css,/--v2-surface:/);
assert.match(css,/--v2-text:/);
assert.match(css,/--v2-accent:/);
assert.match(css,/--v2-success:/);
assert.match(css,/--v2-motion-rise:/);
assert.match(css,/--v2-motion-stamp:/);

assert.match(index,/v1\.9-v2-boundary\.js/);
assert.match(index,/v2-components\.js/);
assert.match(index,/v2-presentation\.js/);
assert.match(sw,/"\.\/v2-components\.js"/);
assert.match(sw,/"\.\/v2-presentation\.js"/);
assert.match(sw,/"\.\/v2-presentation\.css"/);

assert.match(migration,/Lovable.*visual\/interaction language/s);
assert.match(migration,/Lovable's progress scheduling semantics are explicitly \*\*not\*\* authoritative/);
assert.match(migration,/Never import:/);
assert.match(migration,/Review = \+8 hours/);
assert.match(migration,/Known = \+7 days/);

console.log('Kanji 5 v2 Lovable migration regression guard passed.');
