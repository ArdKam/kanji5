import { mergeKnowledge } from './v1.5-education-sync-core.js';
import { mergeReviewEvents, replayCards } from './v1.5-fsrs-sync-core.js';
import { fsrs } from './vendor/ts-fsrs-5.4.1.mjs';

export const SYNC_SCHEMA_VERSION = 1;
const REVIEW_HISTORY_LIMIT = 2000;
const REVIEW_EVENT_IDS_LIMIT = REVIEW_HISTORY_LIMIT;
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

function reviewSummaryFromReviews(reviews) {
  const events = Array.isArray(reviews) ? reviews.slice(-REVIEW_HISTORY_LIMIT) : [];
  const deviceTotals = {}, dailyByDevice = {}, knownEventIds = [];
  for (const event of events) {
    if (!event || typeof event !== 'object') continue;
    const eventId = String(event.eventId || event.id || '');
    const device = String(event.deviceId || 'legacy').slice(0, 160) || 'legacy';
    const date = String(event.at || '').slice(0, 10);
    if (!eventId || date.length !== 10 || date[4] !== '-' || date[7] !== '-') continue;
    const totals = deviceTotals[device] || (deviceTotals[device] = { total: 0, nonAgain: 0 });
    totals.total += 1;
    if (String(event.rating || '') !== 'Again') totals.nonAgain += 1;
    const dateRows = dailyByDevice[date] || (dailyByDevice[date] = {});
    const daily = dateRows[device] || (dateRows[device] = { count: 0, nonAgain: 0 });
    daily.count += 1;
    if (String(event.rating || '') !== 'Again') daily.nonAgain += 1;
    knownEventIds.push(eventId);
  }
  const totalReviews = Object.values(deviceTotals).reduce((sum, row) => sum + row.total, 0);
  const nonAgainReviews = Math.min(totalReviews, Object.values(deviceTotals).reduce((sum, row) => sum + Math.min(row.total, row.nonAgain), 0));
  const daily = Object.entries(dailyByDevice).sort(([a], [b]) => a.localeCompare(b)).slice(-90).map(([date, devices]) => ({
    date,
    count: Object.values(devices).reduce((sum, row) => sum + row.count, 0),
    nonAgain: Object.values(devices).reduce((sum, row) => sum + Math.min(row.count, row.nonAgain), 0)
  }));
  return { schemaVersion: 1, totalReviews, nonAgainReviews, daily, lastReviewKey: knownEventIds.at(-1) || null, lastReviewAt: events.at(-1)?.at || null, knownEventIds: [...new Set(knownEventIds)].slice(-REVIEW_EVENT_IDS_LIMIT), deviceTotals, dailyByDevice };
}

function mergeReviewSummary(local, remote, localReviews = [], remoteReviews = []) {
  const a = local && typeof local === 'object'
    ? local
    : (!local && Array.isArray(localReviews) && localReviews.length ? reviewSummaryFromReviews(localReviews) : null);
  const b = remote && typeof remote === 'object'
    ? remote
    : (!remote && Array.isArray(remoteReviews) && remoteReviews.length ? reviewSummaryFromReviews(remoteReviews) : null);
  if (!a) return b ? clone(b) : null;
  if (!b) return clone(a);
  const deviceTotals = {}, dailyByDevice = {};
  for (const source of [a,b]) {
    const sourceTotals = source.deviceTotals && typeof source.deviceTotals === 'object' && Object.keys(source.deviceTotals).length
      ? source.deviceTotals
      : { legacy: { total: Math.max(0, Number(source.totalReviews) || 0), nonAgain: Math.max(0, Number(source.nonAgainReviews) || 0) } };
    const sourceDailyByDevice = source.dailyByDevice && typeof source.dailyByDevice === 'object' && Object.keys(source.dailyByDevice).length
      ? source.dailyByDevice
      : Object.fromEntries((Array.isArray(source.daily) ? source.daily : []).map(row => [String(row?.date || '').slice(0, 10), { legacy: { count: Math.max(0, Number(row?.count) || 0), nonAgain: Math.max(0, Number(row?.nonAgain) || 0) } }]));
    for (const [device,value] of Object.entries(sourceTotals)) {
      const current=deviceTotals[device]; const candidate={total:Math.max(0,Number(value?.total)||0),nonAgain:Math.max(0,Number(value?.nonAgain)||0)};
      if (!current || candidate.total>current.total || (candidate.total===current.total && candidate.nonAgain>current.nonAgain)) deviceTotals[device]=candidate;
    }
    for (const [date,devices] of Object.entries(sourceDailyByDevice)) {
      const target=dailyByDevice[date]||(dailyByDevice[date]={});
      for (const [device,value] of Object.entries(devices && typeof devices === 'object' ? devices : {})) {
        const current=target[device],candidate={count:Math.max(0,Number(value?.count)||0),nonAgain:Math.max(0,Number(value?.nonAgain)||0)};
        if(!current||candidate.count>current.count||(candidate.count===current.count&&candidate.nonAgain>current.nonAgain))target[device]=candidate;
      }
    }
  }
  const totalReviews=Object.values(deviceTotals).reduce((sum,row)=>sum+row.total,0);
  const nonAgainReviews=Math.min(totalReviews,Object.values(deviceTotals).reduce((sum,row)=>sum+Math.min(row.total,row.nonAgain),0));
  const daily=[...Object.keys(dailyByDevice)].sort().slice(-90).map(date=>{
    const devices=dailyByDevice[date]||{},row={date,count:0,nonAgain:0};
    for(const value of Object.values(devices)){row.count+=Math.max(0,Number(value?.count)||0);row.nonAgain+=Math.max(0,Math.min(Number(value?.count)||0,Number(value?.nonAgain)||0))}
    return row;
  });
  const knownEventIds=[...new Set([...(Array.isArray(a.knownEventIds)?a.knownEventIds:[]),...(Array.isArray(b.knownEventIds)?b.knownEventIds:[])].map(String))].slice(-REVIEW_EVENT_IDS_LIMIT);
  const last = String(a.lastReviewAt||'') >= String(b.lastReviewAt||'') ? a : b;
  return {schemaVersion:1,totalReviews,nonAgainReviews,daily,lastReviewKey:last.lastReviewKey||null,lastReviewAt:last.lastReviewAt||null,knownEventIds,deviceTotals,dailyByDevice};
}

export function stablePayload(payload) {
  return {
    state: payload?.state || null,
    knowledge: payload?.knowledge || {},
    deckVersion: payload?.deckVersion || null,
    educationSchemaVersion: Number(payload?.educationSchemaVersion) || 2,
    syncSchemaVersion: Number(payload?.syncSchemaVersion) || SYNC_SCHEMA_VERSION,
    v16SyncSchemaVersion: Number(payload?.v16SyncSchemaVersion) || 1,
    sessionHistory: Array.isArray(payload?.sessionHistory) ? payload.sessionHistory : [],
    components: payload?.components && typeof payload.components === 'object' ? payload.components : {},
    skillProfile: payload?.skillProfile && typeof payload.skillProfile === 'object' ? payload.skillProfile : null
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

export function mergeState(local, remote, now = new Date()) {
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
  merged.reviews = mergeReviewEvents(reviewsFor(local), reviewsFor(remote), REVIEW_HISTORY_LIMIT);
  merged.reviewSummary = mergeReviewSummary(local.reviewSummary, remote.reviewSummary, reviewsFor(local), reviewsFor(remote));
  if (merged.reviews.some(event => event?.eventId && event?.baseRecord)) {
    merged.cards = replayCards(merged.cards, merged.reviews, () => schedulerFactory(merged.settings), Number(merged.settings?.leechThreshold) || 8);
  }
  const today = todayKey(now);
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

export function mergeSyncPayload(localPayload, remotePayload, now = new Date()) {
  const local = stablePayload(localPayload || {}), remote = stablePayload(remotePayload || {});
  return {
    state: mergeState(local.state, remote.state, now),
    knowledge: mergeKnowledge(local.knowledge, remote.knowledge),
    deckVersion: local.deckVersion || remote.deckVersion || null,
    educationSchemaVersion: Math.max(Number(local.educationSchemaVersion) || 2, Number(remote.educationSchemaVersion) || 2),
    syncSchemaVersion: SYNC_SCHEMA_VERSION,
    v16SyncSchemaVersion: Math.max(Number(local.v16SyncSchemaVersion) || 1, Number(remote.v16SyncSchemaVersion) || 1),
    sessionHistory: mergeV16History(local.sessionHistory, remote.sessionHistory),
    components: { ...local.components, ...remote.components },
    skillProfile: newerProfile(local.skillProfile, remote.skillProfile)
  };
}

function mergeV16History(local, remote) {
  const combined = [...(Array.isArray(local) ? local : []), ...(Array.isArray(remote) ? remote : [])];
  const map = new Map();
  for (const row of combined) {
    const key = String(row?.sessionId || row?.id || (String(row?.startedAt || '') + '|' + String(row?.endedAt || '')));
    map.set(key, clone(row));
  }
  return [...map.values()]
    .sort((a, b) => String(a?.endedAt || a?.startedAt || '').localeCompare(String(b?.endedAt || b?.startedAt || '')))
    .slice(-30);
}

function newerProfile(local, remote) {
  if (!local) return remote ? clone(remote) : null;
  if (!remote) return clone(local);
  return String(local.updatedAt || '') >= String(remote.updatedAt || '') ? clone(local) : clone(remote);
}
