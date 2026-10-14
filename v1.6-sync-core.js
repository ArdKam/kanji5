const clone = value => structuredClone(value);
export const V16_SYNC_SCHEMA_VERSION = 2;
const MODES = ['meaning', 'reading', 'production', 'vocabulary', 'context'];
const COMPLETED_LIMIT = 30;

const completed = history => Array.isArray(history)
  ? history.filter(row => row && row.status !== 'active' && row.endedAt)
  : [];
const validProfile = profile => Boolean(
  profile && [1, 2].includes(Number(profile.schemaVersion)) &&
  profile.skills && typeof profile.skills === 'object'
);
const timestamp = value => String(value || '');
const jsonEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function sanitizeSessionHistory(history, limit = COMPLETED_LIMIT) {
  const map = new Map();
  for (const row of completed(history)) {
    const key = String(row.sessionId || `${row.startedAt || ''}|${row.endedAt || ''}`);
    map.set(key, clone(row));
  }
  return [...map.values()]
    .sort((a, b) => timestamp(a.endedAt).localeCompare(timestamp(b.endedAt)))
    .slice(-Math.max(1, Number(limit) || COMPLETED_LIMIT));
}

export function mergeSessionHistory(local, remote, limit = COMPLETED_LIMIT) {
  return sanitizeSessionHistory([
    ...sanitizeSessionHistory(local, limit),
    ...sanitizeSessionHistory(remote, limit)
  ], limit);
}

function newer(local, remote) {
  return timestamp(local?.updatedAt) >= timestamp(remote?.updatedAt) ? local : remote;
}

export function mergeSkillProfile(local, remote) {
  if (!validProfile(local)) return validProfile(remote) ? clone(remote) : null;
  if (!validProfile(remote)) return clone(local);
  if (jsonEqual(local, remote)) return clone(local);

  // Schema 2 profiles are cumulative summaries built from session history.
  // Never add two cumulative summaries: shared sessions would be counted twice.
  if (Number(local.schemaVersion) >= 2 || Number(remote.schemaVersion) >= 2) {
    return clone(newer(local, remote));
  }

  const recentSource = newer(local, remote);
  const out = {
    schemaVersion: 1,
    updatedAt: timestamp(local.updatedAt) >= timestamp(remote.updatedAt) ? local.updatedAt : remote.updatedAt,
    sessions: Math.max(Number(local.sessions) || 0, Number(remote.sessions) || 0),
    skills: {}
  };
  for (const mode of MODES) {
    const a = local.skills?.[mode] || {};
    const b = remote.skills?.[mode] || {};
    const attempts = (Number(a.attempts) || 0) + (Number(b.attempts) || 0);
    const correct = Math.min(attempts, (Number(a.correct) || 0) + (Number(b.correct) || 0));
    const r = recentSource.skills?.[mode] || {};
    const recentAttempts = Math.max(0, Number(r.recentAttempts) || 0);
    const recentCorrect = Math.min(recentAttempts, Math.max(0, Number(r.recentCorrect) || 0));
    const recentAccuracy = recentAttempts ? recentCorrect / recentAttempts * 100 : Math.max(0, Number(r.recentAccuracy) || 0);
    const momentum = Math.max(-1, Math.min(1, Number(r.momentum) || 0));
    out.skills[mode] = {
      attempts, correct, accuracy: attempts ? correct / attempts * 100 : 0,
      mastery: (correct + 1) / (attempts + 2),
      recentAttempts, recentCorrect, recentAccuracy, momentum
    };
  }
  return out;
}

function norm(value) {
  const attempts = Math.max(0, Number(value?.attempts) || 0);
  const correct = Math.min(attempts, Math.max(0, Number(value?.correct) || 0));
  return { attempts, correct, accuracy: attempts ? correct / attempts * 100 : 0, mastery: (correct + 1) / (attempts + 2) };
}

function buildSkillProfileFromHistory(history, localProfile, remoteProfile) {
  const rows = (Array.isArray(history) ? history : [])
    .filter(row => row && !row.status && row.endedAt && row.modeResults)
    .sort((a, b) => Date.parse(a.endedAt) - Date.parse(b.endedAt));
  if (!rows.length) return null;

  const all = {}, recent = {}, skills = {};
  for (const mode of MODES) {
    all[mode] = { attempts: 0, correct: 0 };
    recent[mode] = { attempts: 0, correct: 0 };
    for (const row of rows) {
      const value = norm(row.modeResults?.[mode]);
      all[mode].attempts += value.attempts;
      all[mode].correct += value.correct;
    }
    for (const row of rows.slice(-3)) {
      const value = norm(row.modeResults?.[mode]);
      recent[mode].attempts += value.attempts;
      recent[mode].correct += value.correct;
    }
    all[mode] = norm(all[mode]);
    recent[mode] = norm(recent[mode]);

    const source = rows.slice(-8).map(row => row.modeResults?.[mode])
      .filter(value => value && typeof value.lastCorrect === 'boolean');
    let recentErrors = 0, recoveryOpportunities = 0, recoveries = 0;
    for (let i = 0; i < source.length; i += 1) {
      if (source[i].lastCorrect === false) {
        recentErrors += 1;
        const next = source[i + 1];
        if (next) {
          recoveryOpportunities += 1;
          if (next.lastCorrect === true) recoveries += 1;
        }
      }
    }
    const base = all[mode], window = recent[mode];
    const momentum = base.attempts && window.attempts
      ? Math.max(-1, Math.min(1, (window.accuracy - base.accuracy) / 100))
      : 0;
    skills[mode] = {
      ...base,
      recentAttempts: window.attempts,
      recentCorrect: window.correct,
      recentAccuracy: window.accuracy,
      momentum,
      recentErrors,
      recoveryOpportunities,
      recoveries,
      recoveryRate: recoveryOpportunities ? recoveries / recoveryOpportunities : 0
    };
  }

  const updatedAt = [
    timestamp(localProfile?.updatedAt),
    timestamp(remoteProfile?.updatedAt),
    timestamp(rows.at(-1)?.endedAt)
  ].sort().at(-1) || '';
  return { schemaVersion: 2, updatedAt, sessions: rows.length, skills };
}

function mergeTimestampMaps(local = {}, remote = {}) {
  const out = {};
  for (const key of new Set([...Object.keys(local || {}), ...Object.keys(remote || {})])) {
    const a = timestamp(local?.[key]), b = timestamp(remote?.[key]);
    const value = a >= b ? a : b;
    if (value) out[key] = value;
  }
  return out;
}

function mergeRecordMap(local = {}, remote = {}) {
  const out = {};
  for (const key of new Set([...Object.keys(local || {}), ...Object.keys(remote || {})])) {
    const a = local?.[key], b = remote?.[key];
    if (!a) out[key] = clone(b);
    else if (!b) out[key] = clone(a);
    else out[key] = clone(timestamp(a.updatedAt) >= timestamp(b.updatedAt) ? a : b);
  }
  return out;
}

function mergeComponents(local = {}, remote = {}, localClocks = {}, remoteClocks = {}) {
  const out = {};
  const clockMap = mergeTimestampMaps(localClocks, remoteClocks);
  const keys = new Set([
    ...Object.keys(local || {}), ...Object.keys(remote || {}),
    ...Object.keys(localClocks || {}), ...Object.keys(remoteClocks || {})
  ]);
  for (const key of keys) {
    const hasLocal = Object.prototype.hasOwnProperty.call(local || {}, key);
    const hasRemote = Object.prototype.hasOwnProperty.call(remote || {}, key);
    const a = local?.[key], b = remote?.[key];
    const localAt = timestamp(localClocks?.[key]), remoteAt = timestamp(remoteClocks?.[key]);

    if (key === 'v19ContentEvidence' && hasLocal && hasRemote) {
      out[key] = mergeRecordMap(a, b);
      continue;
    }
    if (hasLocal && hasRemote) {
      if (jsonEqual(a, b)) out[key] = clone(a);
      else if (localAt && remoteAt) out[key] = clone(localAt >= remoteAt ? a : b);
      else if (localAt) out[key] = clone(a);
      else if (remoteAt) out[key] = clone(b);
      else if (timestamp(a?.updatedAt) || timestamp(b?.updatedAt)) out[key] = clone(newer(a, b));
      else out[key] = clone(a); // Legacy collisions prefer local instead of blindly overwriting it.
      continue;
    }
    if (hasLocal) {
      if (!(remoteAt && (!localAt || remoteAt > localAt))) out[key] = clone(a);
      continue;
    }
    if (hasRemote) {
      if (!(localAt && (!remoteAt || localAt > remoteAt))) out[key] = clone(b);
    }
  }
  return { components: out, componentUpdatedAtByKey: clockMap };
}

export function mergeV16SyncData(local = {}, remote = {}) {
  const sessionHistory = mergeSessionHistory(local.sessionHistory, remote.sessionHistory);
  const fallbackProfile = mergeSkillProfile(local.skillProfile, remote.skillProfile);
  const skillProfile = buildSkillProfileFromHistory(sessionHistory, local.skillProfile, remote.skillProfile) || fallbackProfile;
  const mergedComponents = mergeComponents(
    local.components,
    remote.components,
    local.componentUpdatedAtByKey,
    remote.componentUpdatedAtByKey
  );
  if (skillProfile) mergedComponents.components.v16SkillProfile = clone(skillProfile);
  return {
    v16SyncSchemaVersion: V16_SYNC_SCHEMA_VERSION,
    sessionHistory,
    components: mergedComponents.components,
    componentUpdatedAtByKey: mergedComponents.componentUpdatedAtByKey,
    skillProfile
  };
}
