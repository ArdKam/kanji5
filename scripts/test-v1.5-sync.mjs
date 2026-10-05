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

// Keep this logical fixture on a fixed date so the test is deterministic across CI days.
const fixtureNow = new Date('2026-09-04T12:00:00Z');
const local = { reviewSummary: { schemaVersion: 1, totalReviews: 120, nonAgainReviews: 96, daily: [{ date: '2026-09-04', count: 5, nonAgain: 4 }], knownEventIds: ['A1'], deviceTotals: { 'device-a': { total: 120, nonAgain: 96 } }, dailyByDevice: { '2026-09-04': { 'device-a': { count: 5, nonAgain: 4 } } } }, settings: { retention: .9, maxInterval: 36500, leechThreshold: 8 }, today: '2026-09-04', todayNew: 2, todayReviewCount: 3, goalCelebrated: false, streak: { current: 4, longest: 7, lastActiveDate: '2026-09-03' }, cards: { 学: eventA.resultRecord }, reviews: [eventA], queue: ['学'], current: '学', revealed: true, examples: { 学: [] } };
const remote = { ...structuredClone(local), reviewSummary: { schemaVersion: 1, totalReviews: 140, nonAgainReviews: 110, daily: [{ date: '2026-09-04', count: 7, nonAgain: 6 }], knownEventIds: ['A1','B1'], deviceTotals: { 'device-a': { total: 120, nonAgain: 96 }, 'device-b': { total: 20, nonAgain: 14 } }, dailyByDevice: { '2026-09-04': { 'device-a': { count: 5, nonAgain: 4 }, 'device-b': { count: 2, nonAgain: 2 } } } }, todayNew: 4, todayReviewCount: 5, goalCelebrated: true, cards: { 校: eventB.resultRecord }, reviews: [eventB], queue: ['校'], current: '校', revealed: true, examples: { 校: [] } };

const merged = mergeState(local, remote, fixtureNow);
assert.deepEqual(new Set(merged.reviews.map(event => event.eventId)), new Set(['A1', 'B1']));
assert.equal(merged.reviewSummary.totalReviews, 140, 'Sync must not lose the higher cumulative review aggregate');
assert.equal(merged.reviewSummary.daily.find(row => row.date === '2026-09-04')?.count, 7, 'Sync must preserve merged bounded daily aggregate');
const disjointLocal = { reviewSummary: { schemaVersion: 1, totalReviews: 10, nonAgainReviews: 8, daily: [{ date: '2026-09-04', count: 10, nonAgain: 8 }], knownEventIds: [], deviceTotals: { A: { total: 10, nonAgain: 8 } }, dailyByDevice: { '2026-09-04': { A: { count: 10, nonAgain: 8 } } } } };
const disjointRemote = { reviewSummary: { schemaVersion: 1, totalReviews: 7, nonAgainReviews: 5, daily: [{ date: '2026-09-04', count: 7, nonAgain: 5 }], knownEventIds: [], deviceTotals: { B: { total: 7, nonAgain: 5 } }, dailyByDevice: { '2026-09-04': { B: { count: 7, nonAgain: 5 } } } } };
const disjoint = mergeState({ ...local, ...disjointLocal }, { ...remote, ...disjointRemote }, fixtureNow);
assert.equal(disjoint.reviewSummary.totalReviews, 17, 'Disjoint device counters must union, not max');
const legacyOnly = { reviewSummary: { schemaVersion: 1, totalReviews: 12, nonAgainReviews: 8, daily: [{ date: '2026-09-04', count: 12, nonAgain: 8 }], knownEventIds: [] } };
const modernOnly = { reviewSummary: { schemaVersion: 1, totalReviews: 4, nonAgainReviews: 3, daily: [], knownEventIds: [], deviceTotals: { B: { total: 4, nonAgain: 3 } }, dailyByDevice: { '2026-09-04': { B: { count: 4, nonAgain: 3 } } } } };
const legacyMerged = mergeState({ ...local, ...legacyOnly }, { ...remote, ...modernOnly }, fixtureNow);
assert.equal(legacyMerged.reviewSummary.totalReviews, 16, 'Legacy aggregate must union with modern device counters');
assert.equal(legacyMerged.reviewSummary.daily.find(row => row.date === '2026-09-04')?.count, 16, 'Legacy daily rollup must survive migration during sync');
const legacyRemoteWithoutSummary = mergeState(
  local,
  { ...remote, reviewSummary: undefined },
  fixtureNow
);
assert.equal(legacyRemoteWithoutSummary.reviewSummary.totalReviews, 121, 'Legacy remote reviews must populate the new aggregate during first sync');
assert.equal(legacyRemoteWithoutSummary.reviewSummary.knownEventIds.includes('B1'), true, 'Legacy remote review ids must be retained for bounded dedupe');

const duplicateLegacyRemoteWithoutSummary = mergeState(
  local,
  { ...local, reviewSummary: undefined, reviews: [eventA] },
  fixtureNow
);
assert.equal(duplicateLegacyRemoteWithoutSummary.reviewSummary.totalReviews, 120, 'Legacy review migration must not double-count events already represented by the local aggregate');
const sameCardRemoteEvent = {
  ...eventA,
  eventId: 'A2',
  at: '2026-09-04T11:00:00Z',
  resultRecord: {
    ...structuredClone(eventA.resultRecord),
    learnedAt: '2026-09-04T11:00:00Z',
    card: { ...structuredClone(eventA.resultRecord.card), due: new Date('2026-09-06T11:00:00Z') }
  }
};
const sameCardMerged = mergeState(
  { ...local, reviews: [eventA], cards: { 学: eventA.resultRecord } },
  { ...remote, reviews: [sameCardRemoteEvent], cards: { 学: sameCardRemoteEvent.resultRecord } },
  fixtureNow
);
assert.equal(sameCardMerged.cards["学"].reviews, 2, 'Same-card merge must replay both review events');
assert.equal(sameCardMerged.cards["学"].card.last_review.toISOString(), '2026-09-04T11:00:00.000Z', 'Same-card merge must apply the newest review timestamp');

assert.ok(merged.cards.学 && merged.cards.校, 'Concurrent device changes must be preserved');
assert.equal(merged.todayNew, 4, 'Daily new count must merge without double-counting across devices');
assert.equal(merged.todayReviewCount, 5, 'Daily review count must merge without double-counting across devices');
assert.equal(merged.goalCelebrated, true, 'Goal completion must survive concurrent merge');
assert.deepEqual(merged.queue, [], 'Ephemeral queue state must never enter persisted sync payload');
assert.equal(merged.current, null, 'Ephemeral current-card state must never enter persisted sync payload');
assert.equal(merged.revealed, false, 'Ephemeral reveal state must never enter persisted sync payload');
assert.deepEqual(merged.examples, {}, 'Fetched examples must never enter persisted sync payload');

const payload = mergeSyncPayload({ state: local, knowledge: { 学: { meaning: { attempts: 1, correct: 1 } } }, deckVersion: 'v1' }, { state: remote, knowledge: { 学: { meaning: { attempts: 2, correct: 1 } } }, deckVersion: 'v1', educationSchemaVersion: 2 }, fixtureNow);
assert.equal(payload.syncSchemaVersion, SYNC_SCHEMA_VERSION);
assert.equal(payload.deckVersion, 'v1');
assert.equal(payload.state.todayNew, 4);
assert.equal(payload.knowledge.学.meaning.attempts, 3, 'Education stats must union rather than last-write-win');

assert.deepEqual(stablePayload(payload), stablePayload({ ...payload, transient: Date.now() }), 'Stable payload must exclude transient metadata');
assert.equal(hashPayload(payload), hashPayload(stablePayload(payload)), 'Payload hashing must ignore transient metadata');
assert.equal(hashPayload(payload), hashPayload(payload), 'Payload hash must be deterministic');
assert.equal(stablePayload(payload).state.reviewSummary.totalReviews, 140, 'Review aggregate must remain in the canonical sync payload');


console.log('Kanji 5 v1.5 persistence/sync hardening tests passed.');