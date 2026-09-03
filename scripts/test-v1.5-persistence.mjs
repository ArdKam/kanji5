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
const stateApi = boot(storage);
const state = stateApi.createInitial({
  settings: { dailyNew: 7 },
  cards: { a: { card: { due: '2026-09-04T00:00:00.000Z' }, reviews: 1 } },
  knowledge: { a: { meaning: { day: 1 } } },
  reviews: [{ id: 'a', eventId: 'e1', at: '2026-09-04T00:00:00.000Z', rating: 'Good' }],
  today: stateApi.todayKey()
});
stateApi.saveState(state);
assert.ok(storage.getItem(stateApi.SNAPSHOT_STORAGE));
assert.ok(storage.getItem(stateApi.SNAPSHOT_COMMIT));
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
  [stateApi.SNAPSHOT_STORAGE]: storage.getItem(stateApi.SNAPSHOT_STORAGE),
  [stateApi.SNAPSHOT_COMMIT]: storage.getItem(stateApi.SNAPSHOT_COMMIT)
});
const tornApi = boot(torn);
const recovered = tornApi.loadState();
console.log('persistence recovery reviews:', JSON.stringify(recovered.reviews));
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
  [stateApi.SNAPSHOT_COMMIT]: storage.getItem(stateApi.SNAPSHOT_COMMIT)
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
  [stateApi.SNAPSHOT_STORAGE]: storage.getItem(stateApi.SNAPSHOT_STORAGE),
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

console.log('Kanji 5 v1.5 local persistence hardening tests passed.');
