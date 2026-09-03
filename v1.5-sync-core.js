import { mergeKnowledge } from './v1.5-education-sync-core.js';
import { mergeReviewEvents, replayCards } from './v1.5-fsrs-sync-core.js';
import { fsrs } from './vendor/ts-fsrs-5.4.1.mjs';

export const SYNC_SCHEMA_VERSION = 1;
const clone = value => structuredClone(value);
const todayKey = date => new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date instanceof Date ? date : new Date(date));
const reviewsFor = state => Array.isArray(state?.reviews) ? state.reviews : [];
const lastReviewAt = (state, id) => {
  let latest = '';
  for (const review of reviewsFor(state)) if (review?.id === id && review?.at && review.at > latest) latest = review.at;
  const card = state?.cards?.[id];
  if (card?.learnedAt && card.learnedAt > latest) latest = card.learnedAt;
  return latest;
};

const schedulerFactory = settings => {
  const scheduler = fsrs({
    request_retention: Number(settings?.retention) || 0.9,
    maximum_interval: Number(settings?.maxInterval) || 36500,
    enable_fuzz: true,
    enable_short_term: true,
    learning_steps: ['1m', '10m'],
    relearning_steps: ['10m']
  });
  return { next: scheduler.next.bind(scheduler), Rating: { Again: 1, Hard: 2, Good: 3, Easy: 4 } };
};

export function stablePayload(payload) {
  return {
    state: payload?.state || null,
    knowledge: payload?.knowledge || {},
    deckVersion: payload?.deckVersion || null,
    educationSchemaVersion: Number(payload?.educationSchemaVersion) || 2,
    syncSchemaVersion: Number(payload?.syncSchemaVersion) || SYNC_SCHEMA_VERSION
  };
}

export function hashPayload(payload) {
  const input = JSON.stringify(stablePayload(payload));
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

export function mergeState(local, remote) {
  if (!local) return remote ? clone(remote) : null;
  if (!remote) return clone(local);
  const merged = { ...clone(local), ...clone(remote), settings: { ...(local.settings || {}), ...(remote.settings || {}) } };
  const ids = new Set([...Object.keys(local.cards || {}), ...Object.keys(remote.cards || {})]);
  merged.cards = {};
  for (const id of ids) {
    const lc = local.cards?.[id], rc = remote.cards?.[id];
    if (!lc) merged.cards[id] = clone(rc);
    else if (!rc) merged.cards[id] = clone(lc);
    else merged.cards[id] = lastReviewAt(local, id) >= lastReviewAt(remote, id) ? clone(lc) : clone(rc);
  }
  merged.reviews = mergeReviewEvents(reviewsFor(local), reviewsFor(remote), 5000);
  if (merged.reviews.some(event => event?.eventId && event?.baseRecord)) {
    merged.cards = replayCards(merged.cards, merged.reviews, () => schedulerFactory(merged.settings), Number(merged.settings?.leechThreshold) || 8);
  }
  const today = todayKey(new Date());
  const localToday = String(local.today || ''), remoteToday = String(remote.today || '');
  merged.today = [localToday, remoteToday, today].filter(Boolean).sort().at(-1) || today;
  const sameLocal = localToday === merged.today, sameRemote = remoteToday === merged.today;
  merged.todayNew = Math.max(sameLocal ? Number(local.todayNew) || 0 : 0, sameRemote ? Number(remote.todayNew) || 0 : 0);
  merged.todayReviewCount = Math.max(sameLocal ? Number(local.todayReviewCount) || 0 : 0, sameRemote ? Number(remote.todayReviewCount) || 0 : 0);
  merged.goalCelebrated = Boolean((sameLocal && local.goalCelebrated) || (sameRemote && remote.goalCelebrated));
  const localStreakAt = String(local.streak?.lastActiveDate || ''), remoteStreakAt = String(remote.streak?.lastActiveDate || '');
  merged.streak = localStreakAt >= remoteStreakAt ? clone(local.streak || {}) : clone(remote.streak || {});
  merged.queue = [];
  merged.current = null;
  merged.revealed = false;
  merged.examples = {};
  return merged;
}

export function mergeSyncPayload(localPayload, remotePayload) {
  const local = stablePayload(localPayload || {}), remote = stablePayload(remotePayload || {});
  return {
    state: mergeState(local.state, remote.state),
    knowledge: mergeKnowledge(local.knowledge, remote.knowledge),
    deckVersion: local.deckVersion || remote.deckVersion || null,
    educationSchemaVersion: Math.max(Number(local.educationSchemaVersion) || 2, Number(remote.educationSchemaVersion) || 2),
    syncSchemaVersion: SYNC_SCHEMA_VERSION
  };
}
