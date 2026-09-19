import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const js=read('v2-presentation.js');
const css=read('v2-presentation.css');
const index=read('index.html');
const contract=read('v1.9-v2-contract-core.js');
const sw=read('sw.js');

for(const token of ['v2Stats','v2Settings','renderDailySummary','dueCount','newCount','masteredCount','streakCount']){
  assert.ok(js.includes(token), 'v2 presentation must expose/consume '+token);
}
for(const token of ['v2-daily-summary','v2-daily-stat','v2-header-tool']){
  assert.ok(css.includes(token), 'v2 presentation CSS must style '+token);
}
assert.ok(index.includes('./v2-presentation.js'),'default route must load v2 presentation');
assert.ok(index.includes('./v1.5-education-ui.js'),'default route must load the education bridge');
assert.ok(index.includes('./v1.9-v2-boundary.js'),'default route must load the v2 presentation boundary');
assert.ok(index.includes('./review-runtime.js'),'default route must load the shared review runtime');
assert.ok(index.includes('./legacy.css'),'legacy stylesheet must remain available for compatibility');
assert.ok(sw.includes('"./review-runtime.js"'),'shared review runtime must be in the active shell cache');
assert.match(js,/openV2Stats/);
assert.match(js,/nonAgainRate/);
assert.match(js,/openV2Settings/);
assert.ok(sw.includes("kanji5-shell-v99"),'PWA shell cache must be v99 after the current entrypoint changes');
assert.ok(contract.includes("kind:'learning-card'"),'learning card contract must remain available');
assert.ok(contract.includes('choices'),'exercise contract must carry MCQ choices');
assert.ok(index.includes('id="statsBtn"')&&index.includes('id="settingsBtn"'),'legacy Stats/Settings controls must remain available for legacy mode');
assert.doesNotMatch(js,/getElementById\(['"]statsBtn['"]\)/,'v2 must not proxy Stats through legacy DOM');
assert.doesNotMatch(js,/getElementById\(['"]settingsBtn['"]\)/,'v2 must not proxy Settings through legacy DOM');
for(const token of ['speechSynthesis','audioButton','renderUpcomingReviews','v2-upcoming-reviews']){
  assert.ok(js.includes(token)||css.includes(token), 'v2 presentation parity must preserve '+token);
}

console.log('Kanji 5 v2/v1.8 presentation parity contract passed.');