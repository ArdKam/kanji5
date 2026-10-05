import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../v1.5-state.js', import.meta.url), 'utf8');

class MemoryStorage {
  constructor(seed = {}) { this.map = new Map(Object.entries(seed)); this.fail = false; this.failKeys = new Set(); this.failOnceKeys = new Set(); }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { if (this.fail || this.failKeys.has(key)) throw new Error(`write failed: ${key}`); if (this.failOnceKeys.has(key)) { this.failOnceKeys.delete(key); throw new Error(`write failed once: ${key}`); } this.map.set(key, String(value)); }
  removeItem(key) { this.map.delete(key); }
}

function boot(storage) {
  const context = vm.createContext({
    window: {},
    localStorage: storage,
    crypto: { randomUUID: () => 'device-test' },
    structuredClone,
    Intl,
    Date,
    Math,
    JSON,
    String,
    Number,
    Boolean,
    Object,
    Array,
    Set,
    Map,
    TypeError
  });
  vm.runInContext(source, context, { filename: 'v1.5-state.js' });
  return context.window.__KANJI5_STATE__;
}

const base = boot(new MemoryStorage());
assert.equal(base.PERSISTENCE_SCHEMA_VERSION, 1);
assert.equal(typeof base.transaction, 'function');
assert.equal(typeof base.loadState, 'function');
assert.equal(typeof base.saveState, 'function');
assert.equal(typeof base.readDeck, 'function');
assert.equal(typeof base.readKnowledge, 'function');
assert.equal(typeof base.writeKnowledge, 'function');
assert.equal(typeof base.readComponents, 'function');
assert.equal(typeof base.writeComponents, 'function');
assert.equal(typeof base.writeLastAttempt, 'function');
assert.equal(typeof base.clearRuntimeKnowledge, 'function');

const boundaryStorage = new MemoryStorage({
  'kanji5-deck': JSON.stringify([{ character: '学' }]),
  'kanji5-v1.2-knowledge': JSON.stringify({ 学: { meaning: { school: 2 } } }),
  'kanji5-v1.5-components': JSON.stringify({ 学: { meaning: { school: { attempts: 2 } } } })
});
const boundaryApi = boot(boundaryStorage);
assert.deepEqual(boundaryApi.readDeck(), [{ character: '学' }]);
assert.equal(boundaryApi.readKnowledge().学.meaning.school, 2);
assert.equal(boundaryApi.readComponents().学.meaning.school.attempts, 2);
assert.equal(boundaryApi.writeKnowledge({ 学: { reading: { gaku: 1 } } }), true);
assert.equal(boundaryApi.writeComponents({ 学: { reading: { gaku: { attempts: 1 } } } }), true);
assert.equal(boundaryApi.writeLastAttempt({ character: '学', unknown: true }), true);
assert.equal(JSON.parse(boundaryStorage.getItem('kanji5-v1.2-knowledge')).学.reading.gaku, 1);
assert.equal(JSON.parse(boundaryStorage.getItem('kanji5-v1.5-components')).学.reading.gaku.attempts, 1);
assert.equal(JSON.parse(boundaryStorage.getItem('kanji5-v1.2-last-attempt')).unknown, true);
assert.equal(boundaryApi.clearRuntimeKnowledge(), true);
assert.equal(boundaryStorage.getItem('kanji5-v1.2-knowledge'), null);
assert.equal(boundaryStorage.getItem('kanji5-v1.5-components'), null);
assert.equal(boundaryStorage.getItem('kanji5-v1.2-last-attempt'), null);

const storage = new MemoryStorage();
const stateApi = boot(storage);
const state = stateApi.createInitial({
  settings: { dailyNew: 7 },
  cards: { a: { card: { due: '2026-09-04T00:00:00.000Z' }, reviews: 1 } },
  knowledge: { a: { meaning: { day: 1 } } },
  reviews: [{ id: 'a', eventId: 'e1', at: '2026-09-04T00:00:00.000Z', rating: 'Good' }],
  today: stateApi.todayKey()
});
stateApi.saveState(state);
const baselineSnapshot = storage.getItem(stateApi.SNAPSHOT_STORAGE);
const baselineCommit = storage.getItem(stateApi.SNAPSHOT_COMMIT);
assert.ok(baselineSnapshot);
assert.ok(baselineCommit);
assert.ok(storage.getItem(stateApi.KNOWLEDGE_STORAGE));

const reloadedApi = boot(storage);
const loaded = reloadedApi.loadState();
assert.equal(loaded.settings.dailyNew, 7);
assert.equal(JSON.stringify(loaded.cards), JSON.stringify(state.cards));
assert.equal(JSON.stringify(loaded.knowledge), JSON.stringify(state.knowledge));
assert.equal(loaded.reviews.length, 1);

storage.setItem(stateApi.CARDS_STORAGE, JSON.stringify({ ...state.cards, b: { card: {} } }));
storage.setItem(stateApi.KNOWLEDGE_STORAGE, JSON.stringify({ ...state.knowledge, b: { meaning: { night: 1 } } }));
const reconciled = boot(storage).loadState();
assert.ok(reconciled.cards.b);
assert.ok(reconciled.knowledge.b);

const torn = new MemoryStorage({
  [stateApi.STORAGE]: storage.getItem(stateApi.STORAGE),
  [stateApi.CARDS_STORAGE]: '{not-json',
  [stateApi.REVIEWS_STORAGE]: '[]',
  [stateApi.KNOWLEDGE_STORAGE]: '{not-json',
  [stateApi.SNAPSHOT_STORAGE]: baselineSnapshot,
  [stateApi.SNAPSHOT_COMMIT]: baselineCommit
});
const tornApi = boot(torn);
const recovered = tornApi.loadState();
assert.equal(recovered.settings.dailyNew, 7);
assert.equal(Object.keys(recovered.cards).length, 1);
assert.equal(recovered.reviews.length, 1);
assert.ok(recovered.knowledge.a);

const corrupt = new MemoryStorage({
  [stateApi.STORAGE]: storage.getItem(stateApi.STORAGE),
  [stateApi.CARDS_STORAGE]: storage.getItem(stateApi.CARDS_STORAGE),
  [stateApi.REVIEWS_STORAGE]: storage.getItem(stateApi.REVIEWS_STORAGE),
  [stateApi.KNOWLEDGE_STORAGE]: storage.getItem(stateApi.KNOWLEDGE_STORAGE),
  [stateApi.SNAPSHOT_STORAGE]: JSON.stringify({ schemaVersion: 1, payload: { cards: {}, reviews: [] }, checksum: 'bad' }),
  [stateApi.SNAPSHOT_COMMIT]: baselineCommit
});
const corruptApi = boot(corrupt);
const legacyRecovered = corruptApi.loadState();
assert.equal(legacyRecovered.settings.dailyNew, 7);
assert.ok(legacyRecovered.knowledge.a);

const legacyOnly = new MemoryStorage({
  [stateApi.STORAGE]: JSON.stringify({ settings: { dailyNew: 9 }, today: stateApi.todayKey(), cards: { legacy: { card: {} } } }),
  [stateApi.CARDS_STORAGE]: JSON.stringify({ legacy: { card: {} } }),
  [stateApi.REVIEWS_STORAGE]: JSON.stringify([{ id: 'legacy', eventId: 'legacy-e1', at: '2026-09-04T00:00:00.000Z', rating: 'Again' }]),
  [stateApi.KNOWLEDGE_STORAGE]: JSON.stringify({ legacy: { reading: { on: 1 } } })
});
const legacyApi = boot(legacyOnly);
const migrated = legacyApi.loadState();
assert.equal(migrated.settings.dailyNew, 9);
assert.ok(migrated.cards.legacy);
assert.ok(migrated.knowledge.legacy);
assert.ok(legacyOnly.getItem(legacyApi.SNAPSHOT_STORAGE));
assert.ok(legacyOnly.getItem(legacyApi.SNAPSHOT_COMMIT));

const uncommitted = new MemoryStorage({
  [stateApi.SNAPSHOT_STORAGE]: baselineSnapshot,
  [stateApi.SNAPSHOT_COMMIT]: ''
});
const uncommittedApi = boot(uncommitted);
const fallback = uncommittedApi.loadState();
assert.equal(JSON.stringify(fallback.cards), JSON.stringify({}));
assert.equal(fallback.reviews.length, 0);

const txStorage = new MemoryStorage();
const txApi = boot(txStorage);
txApi.saveState(txApi.createInitial({ today: txApi.todayKey(), cards: { one: { card: {} } } }));
const txResult = txApi.transaction(draft => {
  draft.todayNew = 3;
  draft.cards.two = { card: {} };
  draft.knowledge.two = { meaning: { two: 1 } };
  return draft;
});
assert.equal(txResult.todayNew, 3);
const txReload = boot(txStorage).loadState();
assert.equal(txReload.todayNew, 3);
assert.ok(txReload.cards.two);
assert.ok(txReload.knowledge.two);

const failed = new MemoryStorage();
const failedApi = boot(failed);
const failedState = failedApi.createInitial({ today: failedApi.todayKey(), cards: { ok: { card: {} } }, reviews: [] });
failed.failKeys.add(failedApi.SNAPSHOT_COMMIT);
assert.doesNotThrow(() => failedApi.saveState(failedState));
failed.failKeys.clear();
assert.ok(failed.getItem(failedApi.STORAGE));
assert.ok(failed.getItem(failedApi.CARDS_STORAGE));


const backupStorage = new MemoryStorage();
const backupApi = boot(backupStorage);
backupApi.writeSettings({ production: false, vocabulary: true, context: false });
const backupState = backupApi.createInitial({
  settings: { dailyNew: 7, dailyGoal: 31 },
  cards: { a: { card: { due: '2026-09-04T00:00:00.000Z' } } },
  reviews: [{ id: 'a', eventId: 'backup-e1', at: '2026-09-04T00:00:00.000Z', rating: 'Good' }],
  knowledge: { v2Mnemonics: { a: 'A personal school memory' } },
  today: backupApi.todayKey(),
});
backupApi.saveState(backupState);
backupApi.writeSessionHistory([{ status: 'done', sessionId: 'session-1', endedAt: '2026-09-04T00:00:00.000Z', reviews: 1 }]);
backupApi.writeComponents({ a: { meaning: { school: { attempts: 2 } } } });
const portable = backupApi.portableBackup();
assert.equal(portable.format, 'kanji5-backup');
assert.equal(portable.version, 2);
assert.equal(portable.data.core.reviewSummary.totalReviews, 1);
assert.equal(portable.summary.cards, 1);
assert.equal(portable.summary.reviews, 1);
assert.equal(portable.summary.personalMnemonics, 1);
assert.equal(portable.summary.completedSessions, 1);
assert.ok(typeof portable.checksum === 'string' && portable.checksum.length > 0);
assert.equal(backupApi.readReviewSummary().totalReviews, 1);

const changed = backupApi.loadState();
changed.settings.dailyNew = 14;
backupApi.saveState(changed);
backupApi.writeSettings({ production: true, vocabulary: false, context: true });
backupApi.writeSessionHistory([]);
backupApi.writeComponents({});
const restoredSummary = backupApi.restorePortableBackup(portable);
assert.deepEqual(restoredSummary, portable.summary);
const restored = boot(backupStorage).loadState();
assert.equal(restored.settings.dailyNew, 7);
assert.equal(restored.settings.dailyGoal, 31);
assert.equal(JSON.stringify(restored.cards.a), JSON.stringify(backupState.cards.a));
assert.equal(restored.reviews.length, 1);
assert.equal(restored.knowledge.v2Mnemonics.a, 'A personal school memory');
assert.equal(boot(backupStorage).readSettings().production, false);
assert.equal(boot(backupStorage).readSettings().context, false);
assert.equal(boot(backupStorage).readSessionHistory().length, 1);
assert.equal(boot(backupStorage).readComponents().a.meaning.school.attempts, 2);
assert.equal(boot(backupStorage).readReviewSummary().totalReviews, 1);

const legacyBackup = structuredClone(portable);
legacyBackup.version = 1;
delete legacyBackup.data.core.reviewSummary;
legacyBackup.metadata = {...legacyBackup.metadata, backupSchemaVersion: 1};
legacyBackup.checksum = (()=>{const input=JSON.stringify({data:legacyBackup.data,metadata:legacyBackup.metadata});let hash=2166136261;for(let i=0;i<input.length;i++){hash^=input.charCodeAt(i);hash=Math.imul(hash,16777619)}return(hash>>>0).toString(16)})();
backupApi.restorePortableBackup(legacyBackup);
assert.equal(boot(backupStorage).readReviewSummary().totalReviews, 1);

const mismatch = structuredClone(portable);
mismatch.version = 99;
mismatch.checksum = (()=>{const input=JSON.stringify({data:mismatch.data,metadata:mismatch.metadata});let hash=2166136261;for(let i=0;i<input.length;i++){hash^=input.charCodeAt(i);hash=Math.imul(hash,16777619)}return(hash>>>0).toString(16)})();
const protectedKeys = [backupApi.STORAGE, backupApi.CARDS_STORAGE, backupApi.REVIEWS_STORAGE, backupApi.KNOWLEDGE_STORAGE, backupApi.REVIEW_SUMMARY_STORAGE, backupApi.SETTINGS_KEY];
const beforeMismatch = protectedKeys.map(key=>[key,backupStorage.getItem(key)]);
assert.throws(() => boot(backupStorage).restorePortableBackup(mismatch), /KANJI5_BACKUP_VERSION_UNSUPPORTED/);
assert.deepEqual(protectedKeys.map(key=>[key,backupStorage.getItem(key)]), beforeMismatch);

const failedRestoreStorage = new MemoryStorage();
const failedRestoreApi = boot(failedRestoreStorage);
const protectedState = failedRestoreApi.createInitial({today:failedRestoreApi.todayKey(),settings:{dailyNew:11},cards:{safe:{card:{}}},reviews:[{id:'safe',eventId:'safe-1',at:'2026-09-04T00:00:00.000Z',rating:'Good'}]});
failedRestoreApi.saveState(protectedState);
failedRestoreApi.writeSettings({production:false,vocabulary:false,context:true});
const rollbackKeys = [failedRestoreApi.STORAGE, failedRestoreApi.CARDS_STORAGE, failedRestoreApi.REVIEWS_STORAGE, failedRestoreApi.KNOWLEDGE_STORAGE, failedRestoreApi.REVIEW_SUMMARY_STORAGE, failedRestoreApi.SETTINGS_KEY, failedRestoreApi.SNAPSHOT_STORAGE, failedRestoreApi.SNAPSHOT_COMMIT];
const beforeRollback = rollbackKeys.map(key=>[key,failedRestoreStorage.getItem(key)]);
failedRestoreStorage.failOnceKeys.add(failedRestoreApi.CARDS_STORAGE);
assert.throws(() => failedRestoreApi.restorePortableBackup(portable), /write failed once/);
assert.deepEqual(rollbackKeys.map(key=>[key,failedRestoreStorage.getItem(key)]), beforeRollback);

const bulkStorage = new MemoryStorage();
const bulkApi = boot(bulkStorage);
const firstReviews = Array.from({length: 1990},(_,i)=>({id:'bulk-'+i,eventId:'bulk-'+i,at:new Date(Date.UTC(2026,8,1)+i*60000).toISOString(),rating:i%2?'Good':'Again'}));
const bulkState = bulkApi.createInitial({today:bulkApi.todayKey(),reviews:firstReviews});
bulkApi.saveState(bulkState);
const moreReviews = Array.from({length: 115},(_,i)=>({id:'bulk-'+(1990+i),eventId:'bulk-'+(1990+i),at:new Date(Date.UTC(2026,8,1)+(1990+i)*60000).toISOString(),rating:i%2?'Good':'Again'}));
const continued = bulkApi.loadState();
continued.reviews.push(...moreReviews);
continued.reviewSummary = bulkApi.updateReviewSummary(moreReviews, continued.reviewSummary);
bulkApi.saveState(continued);
assert.equal(continued.reviews.length, 2000);
assert.equal(bulkApi.readReviewSummary().totalReviews, 2105);
assert.equal(bulkApi.readReviewSummary().knownEventIds.length, 2000);

const reintroduced = bulkApi.loadState();
reintroduced.reviews.push(firstReviews[0]);
bulkApi.saveState(reintroduced);
assert.equal(bulkApi.readReviewSummary().totalReviews, 2105);
assert.equal(bulkApi.loadState().reviewSummary.totalReviews, 2105);

const tampered = structuredClone(portable);
tampered.data.core.settings.dailyNew = 99;
assert.throws(() => boot(backupStorage).restorePortableBackup(tampered), /KANJI5_INVALID_BACKUP/);
assert.equal(boot(backupStorage).loadState().settings.dailyNew, 7);

console.log('Kanji 5 v1.5 local persistence hardening tests passed.');
