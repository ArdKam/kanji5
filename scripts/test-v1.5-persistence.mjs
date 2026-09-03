import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../v1.5-state.js', import.meta.url), 'utf8');

class MemoryStorage {
  constructor(seed = {}) { this.map = new Map(Object.entries(seed)); this.fail = false; this.failKeys = new Set(); }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { if (this.fail || this.failKeys.has(key)) throw new Error(`write failed: ${key}`); this.map.set(key, String(value)); }
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

const storage = new MemoryStorage();
let stateApi = boot(storage);
const state = stateApi.createInitial({
  settings: { dailyNew: 7 },
  cards: { a: { card: { due: '2026-09-04T00:00:00.000Z' }, reviews: 1 } },
  reviews: [{ id: 'a', eventId: 'e1', at: '2026-09-04T00:00:00.000Z', rating: 'Good' }],
  today: stateApi.todayKey()
});
stateApi.saveState(state);
assert.ok(storage.getItem(stateApi.SNAPSHOT_STORAGE));
assert.ok(storage.getItem(stateApi.SNAPSHOT_COMMIT));

const reloadedApi = boot(storage);
const loaded = reloadedApi.loadState();
assert.equal(loaded.settings.dailyNew, 7);
assert.deepEqual(JSON.parse(JSON.stringify(loaded.cards)), JSON.parse(JSON.stringify(state.cards)));
assert.equal(loaded.reviews.length, 1);

const torn = new MemoryStorage({
  [stateApi.STORAGE]: storage.getItem(stateApi.STORAGE),
  [stateApi.CARDS_STORAGE]: '{not-json',
  [stateApi.REVIEWS_STORAGE]: '[]',
  [stateApi.SNAPSHOT_STORAGE]: storage.getItem(stateApi.SNAPSHOT_STORAGE),
  [stateApi.SNAPSHOT_COMMIT]: storage.getItem(stateApi.SNAPSHOT_COMMIT)
});
const tornApi = boot(torn);
const recovered = tornApi.loadState();
assert.equal(recovered.settings.dailyNew, 7);
assert.equal(Object.keys(recovered.cards).length, 1);
assert.equal(recovered.reviews.length, 1);

const corrupt = new MemoryStorage({
  [stateApi.STORAGE]: storage.getItem(stateApi.STORAGE),
  [stateApi.CARDS_STORAGE]: storage.getItem(stateApi.CARDS_STORAGE),
  [stateApi.REVIEWS_STORAGE]: storage.getItem(stateApi.REVIEWS_STORAGE),
  [stateApi.SNAPSHOT_STORAGE]: JSON.stringify({ schemaVersion: 1, payload: { cards: {}, reviews: [] }, checksum: 'bad' }),
  [stateApi.SNAPSHOT_COMMIT]: storage.getItem(stateApi.SNAPSHOT_COMMIT)
});
const corruptApi = boot(corrupt);
const legacyRecovered = corruptApi.loadState();
assert.equal(legacyRecovered.settings.dailyNew, 7);
assert.equal(Object.keys(legacyRecovered.cards).length, 1);

const uncommitted = new MemoryStorage({
  [stateApi.SNAPSHOT_STORAGE]: storage.getItem(stateApi.SNAPSHOT_STORAGE),
  [stateApi.SNAPSHOT_COMMIT]: ''
});
const uncommittedApi = boot(uncommitted);
const fallback = uncommittedApi.loadState();
assert.deepEqual(fallback.cards, {});
assert.equal(fallback.reviews.length, 0);

const txStorage = new MemoryStorage();
const txApi = boot(txStorage);
txApi.saveState(txApi.createInitial({ today: txApi.todayKey(), cards: { one: { card: {} } } }));
const txResult = txApi.transaction(draft => {
  draft.todayNew = 3;
  draft.cards.two = { card: {} };
  return draft;
});
assert.equal(txResult.todayNew, 3);
const txReload = boot(txStorage).loadState();
assert.equal(txReload.todayNew, 3);
assert.ok(txReload.cards.two);

const failed = new MemoryStorage();
const failedApi = boot(failed);
const failedState = failedApi.createInitial({ today: failedApi.todayKey(), cards: { ok: { card: {} } }, reviews: [] });
failed.failKeys.add(failedApi.SNAPSHOT_COMMIT);
assert.doesNotThrow(() => failedApi.saveState(failedState));
failed.failKeys.clear();
assert.ok(failed.getItem(failedApi.STORAGE));
assert.ok(failed.getItem(failedApi.CARDS_STORAGE));

console.log('Kanji 5 v1.5 local persistence hardening tests passed.');
