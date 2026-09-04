import assert from 'node:assert/strict';
import { hashPayload, mergeState, mergeSyncPayload, stablePayload, SYNC_SCHEMA_VERSION } from '../v1.5-sync-core.js';

const baseCard = { state: 0, due: new Date('2026-09-03T10:00:00Z'), last_review: null };
const eventA = {
  eventId: 'A1', deviceId: 'device-a', id: '学', at: '2026-09-03T10:01:00Z', rating: 'Good', parentEventId: null,
  eventSchemaVersion: 2, baseRecord: { id: '学', card: structuredClone(baseCard), reviews: 0, lapses: 0, learnedAt: null, leech: false },
  resultRecord: { id: '学', card: { ...structuredClone(baseCard), state: 2, due: new Date('2026-09-04T10:01:00Z'), last_review: new Date('2026-09-03T10:01:00Z') }, reviews: 1, lapses: 0, learnedAt: '2026-09-03T10:01:00Z', leech: false }
};
const eventB = {
  eventId: 'B1', deviceId: 'device-b', id: '校', at: '2026-09-03T10:02:00Z', rating: 'Again', parentEventId: null,
  eventSchemaVersion: 2, baseRecord: { id: '校', card: structuredClone(baseCard), reviews: 0, lapses: 0, learnedAt: null, leech: false },
  resultRecord: { id: '校', card: { ...structuredClone(baseCard), state: 1, due: new Date('2026-09-03T10:12:00Z'), last_review: new Date('2026-09-03T10:02:00Z') }, reviews: 1, lapses: 1, learnedAt: '2026-09-03T10:02:00Z', leech: false }
};

// Keep the logical “same day” merge fixture aligned with the current test date.
const local = { settings: { retention: .9, maxInterval: 36500, leechThreshold: 8 }, today: '2026-09-04', todayNew: 2, todayReviewCount: 3, goalCelebrated: false, streak: { current: 4, longest: 7, lastActiveDate: '2026-09-03' }, cards: { 学: eventA.resultRecord }, reviews: [eventA], queue: ['学'], current: '学', revealed: true, examples: { 学: [] } };
const remote = { ...structuredClone(local), todayNew: 4, todayReviewCount: 5, goalCelebrated: true, cards: { 校: eventB.resultRecord }, reviews: [eventB], queue: ['校'], current: '校', revealed: true, examples: { 校: [] } };

const merged = mergeState(local, remote);
assert.deepEqual(new Set(merged.reviews.map(event => event.eventId)), new Set(['A1', 'B1']));
assert.ok(merged.cards.学 && merged.cards.校, 'Concurrent device changes must be preserved');
assert.equal(merged.todayNew, 4, 'Daily new count must merge without double-counting across devices');
assert.equal(merged.todayReviewCount, 5, 'Daily review count must merge without double-counting across devices');
assert.equal(merged.goalCelebrated, true, 'Goal completion must survive concurrent merge');
assert.deepEqual(merged.queue, [], 'Ephemeral queue state must never enter persisted sync payload');
assert.equal(merged.current, null, 'Ephemeral current-card state must never enter persisted sync payload');
assert.equal(merged.revealed, false, 'Ephemeral reveal state must never enter persisted sync payload');
assert.deepEqual(merged.examples, {}, 'Fetched examples must never enter persisted sync payload');

const payload = mergeSyncPayload({ state: local, knowledge: { 学: { meaning: { attempts: 1, correct: 1 } } }, deckVersion: 'v1' }, { state: remote, knowledge: { 学: { meaning: { attempts: 2, correct: 1 } } }, deckVersion: 'v1', educationSchemaVersion: 2 });
assert.equal(payload.syncSchemaVersion, SYNC_SCHEMA_VERSION);
assert.equal(payload.deckVersion, 'v1');
assert.equal(payload.state.todayNew, 4);
assert.equal(payload.knowledge.学.meaning.attempts, 3, 'Education stats must union rather than last-write-win');

assert.deepEqual(stablePayload(payload), stablePayload({ ...payload, transient: Date.now() }), 'Stable payload must exclude transient metadata');
assert.equal(hashPayload(payload), hashPayload(stablePayload(payload)), 'Payload hashing must ignore transient metadata');
assert.equal(hashPayload(payload), hashPayload(payload), 'Payload hash must be deterministic');

console.log('Kanji 5 v1.5 persistence/sync hardening tests passed.');