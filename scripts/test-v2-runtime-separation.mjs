import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html');
const review=read('review-runtime.js');
const storage=read('v1.3-storage-bridge.js');
const session=read('v1.6-session.js');
const p0=read('v1.5-p0.js');
const v2=read('v2-presentation.js');
const boundary=read('v1.9-v2-boundary.js');

assert.ok(index.includes('<script type="module" src="./review-runtime.js"></script>'));
assert.doesNotMatch(index,/<script type="module">/);
assert.match(index,/href='\.\/legacy\.css'/);
assert.match(review,/const IS_LEGACY = .*legacy.*=== '1'/);
assert.match(review,/if\(IS_LEGACY\)\{/);
assert.match(storage,/if\(new URLSearchParams\(location\.search\)\.get\('legacy'\)!=='1'\)return;/);
assert.match(session,/const IS_LEGACY = .*legacy.*=== '1'/);
assert.match(session,/if\(!IS_LEGACY\)return null;/);
assert.match(p0,/currentReviewCharacter/);
assert.match(p0,/__KANJI5_REVIEW_RUNTIME__/);
assert.match(v2,/openV2Settings/);
assert.doesNotMatch(v2,/getElementById\(['"]statsBtn['"]\)/);
assert.doesNotMatch(v2,/getElementById\(['"]settingsBtn['"]\)/);
assert.match(boundary,/runtimePresentationData/);
assert.match(boundary,/buildDailySummaryViewModel/);

console.log('v2 runtime separation contract passed.');
