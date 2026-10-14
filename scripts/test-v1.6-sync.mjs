import assert from 'node:assert/strict';
import { mergeV16SyncData, mergeSessionHistory, mergeSkillProfile, sanitizeSessionHistory, V16_SYNC_SCHEMA_VERSION } from '../v1.6-sync-core.js';
assert.equal(V16_SYNC_SCHEMA_VERSION,2);
const a={sessionId:'a',endedAt:'2026-09-01T10:00:00Z',modeResults:{reading:{attempts:2,correct:1}}};
const b={sessionId:'b',endedAt:'2026-09-02T10:00:00Z',modeResults:{reading:{attempts:3,correct:3}}};
assert.equal(sanitizeSessionHistory([{status:'active',sessionId:'x',endedAt:'2026-09-03'},a]).length,1);
assert.deepEqual(mergeSessionHistory([a],[a,b]).map(x=>x.sessionId),['a','b']);
const p1={schemaVersion:1,updatedAt:'2026-09-01T00:00:00Z',sessions:1,skills:{reading:{attempts:2,correct:1,recentAttempts:2,recentCorrect:1,recentAccuracy:50,momentum:-0.1}}};
const p2={schemaVersion:1,updatedAt:'2026-09-02T00:00:00Z',sessions:2,skills:{reading:{attempts:3,correct:3,recentAttempts:3,recentCorrect:3,recentAccuracy:100,momentum:0.4}}};
const p=mergeSkillProfile(p1,p2);assert.equal(p.skills.reading.attempts,5);assert.equal(p.skills.reading.correct,4);assert.equal(p.sessions,2);assert.equal(p.skills.reading.recentAttempts,3);assert.equal(p.skills.reading.recentCorrect,3);assert.equal(p.skills.reading.recentAccuracy,100);assert.equal(p.skills.reading.momentum,0.4);
const merged=mergeV16SyncData({sessionHistory:[a],components:{x:1},skillProfile:p1},{sessionHistory:[b],components:{y:2},skillProfile:p2});
assert.equal(merged.v16SyncSchemaVersion,2);assert.deepEqual(merged.sessionHistory.map(x=>x.sessionId),['a','b']);assert.deepEqual(merged.components,{x:1,y:2});assert.equal(merged.skillProfile.skills.reading.attempts,5);assert.equal(merged.skillProfile.skills.reading.recentAccuracy,80);assert.equal(merged.skillProfile.skills.reading.momentum,0);
console.log('v1.6 sync contract: OK');

const identical = mergeSkillProfile(p2, p2);
assert.deepEqual(identical, p2, 'Merging an identical cumulative profile must be idempotent');
assert.deepEqual(mergeV16SyncData(merged, merged), merged, 'Repeated V16 sync must not alter an already merged payload');

const componentMerge = mergeV16SyncData(
  {
    sessionHistory: [],
    componentUpdatedAtByKey: { profile: '2026-10-01T00:00:00Z', deleted: '2026-10-05T00:00:00Z' },
    components: {
      profile: { value: 'old-local' },
      v19ContentEvidence: {
        a: { updatedAt: '2026-10-01T00:00:00Z', practiceCount: 1 },
        localOnly: { updatedAt: '2026-10-01T00:00:00Z', practiceCount: 2 }
      }
    }
  },
  {
    sessionHistory: [],
    componentUpdatedAtByKey: { profile: '2026-10-02T00:00:00Z', deleted: '2026-10-04T00:00:00Z' },
    components: {
      profile: { value: 'new-remote' },
      deleted: { value: 'stale-value' },
      v19ContentEvidence: {
        a: { updatedAt: '2026-10-02T00:00:00Z', practiceCount: 3 },
        remoteOnly: { updatedAt: '2026-10-02T00:00:00Z', practiceCount: 4 }
      }
    }
  }
);
assert.equal(componentMerge.components.profile.value, 'new-remote', 'A newer component clock must win');
assert.equal('deleted' in componentMerge.components, false, 'A newer tombstone must not resurrect a deleted component');
assert.deepEqual(
  Object.keys(componentMerge.components.v19ContentEvidence).sort(),
  ['a', 'localOnly', 'remoteOnly'],
  'Content evidence records must merge independently by content ID'
);
assert.equal(componentMerge.components.v19ContentEvidence.a.practiceCount, 3, 'The newest content evidence record must win');

const legacyComponentConflict = mergeV16SyncData(
  { sessionHistory: [], components: { legacyConflict: { value: 'local' } } },
  { sessionHistory: [], components: { legacyConflict: { value: 'remote' } } }
);
assert.equal(legacyComponentConflict.components.legacyConflict.value, 'local');
assert.ok(legacyComponentConflict.componentUpdatedAtByKey.legacyConflict, 'A legacy component conflict must gain a clock to ensure convergence');
assert.deepEqual(mergeV16SyncData(legacyComponentConflict, legacyComponentConflict), legacyComponentConflict, 'A resolved legacy component conflict must remain idempotent');

console.log('v1.6 sync idempotency and component clock regressions: OK');
