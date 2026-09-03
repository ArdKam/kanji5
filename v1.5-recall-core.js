export const RECALL_MODES = Object.freeze(['meaning', 'reading']);

export function normalize(value) {
  return String(value ?? '').trim().toLowerCase().normalize('NFKC').replace(/[\s\u3000]+/g, '');
}

export function componentAccuracy(stats) {
  const attempts = Math.max(0, Number(stats?.attempts) || 0);
  if (!attempts) return 0;
  const correct = Math.min(attempts, Math.max(0, Number(stats?.correct) || 0));
  const score = Number.isFinite(Number(stats?.score))
    ? Math.max(0, Math.min(attempts, Number(stats.score)))
    : correct;
  return (score + 1) / (attempts + 2);
}

export function componentSignal(entry) {
  const out = {};
  for (const mode of RECALL_MODES) {
    const values = Object.values(entry?.[mode] || {}).filter(value =>
      value && typeof value === 'object' && (Number(value.attempts) || 0) > 0
    );
    if (!values.length) {
      out[mode] = { accuracy: null, weakness: null, attempts: 0, lastAt: null };
      continue;
    }
    let weight = 0;
    let total = 0;
    let lastAt = null;
    for (const value of values) {
      const attempts = Math.max(0, Number(value.attempts) || 0);
      weight += attempts;
      total += componentAccuracy(value) * attempts;
      const at = typeof value.lastAt === 'string' ? value.lastAt : '';
      if (at && (lastAt === null || at > lastAt)) lastAt = at;
    }
    const accuracy = weight ? total / weight : 0;
    out[mode] = {
      accuracy,
      weakness: Math.max(0, Math.min(1, 1 - accuracy)),
      attempts: weight,
      lastAt
    };
  }
  return out;
}

export function selectFocus(item, mode, componentState = {}) {
  if (!item || !RECALL_MODES.includes(mode)) return null;
  const state = componentState && typeof componentState === 'object' ? componentState : {};
  const values = mode === 'reading'
    ? [...(item.on || []), ...(item.kun || [])]
    : [...(item.meaning || [])];
  const candidates = values.map(raw => ({
    raw,
    key: normalize(raw),
    accuracy: componentAccuracy(state[normalize(raw)] || {})
  }));
  candidates.sort((a, b) => a.accuracy - b.accuracy || a.key.localeCompare(b.key));
  return candidates[0] || null;
}

export function applyRecallOutcome(entry, mode, focus, outcome, at) {
  if (!focus || !RECALL_MODES.includes(mode)) return entry;
  const next = entry && typeof entry === 'object'
    ? structuredClone(entry)
    : { meaning: {}, reading: {} };
  next[mode] = next[mode] && typeof next[mode] === 'object' ? next[mode] : {};
  const key = normalize(focus);
  const stats = next[mode][key] && typeof next[mode][key] === 'object'
    ? next[mode][key]
    : { attempts: 0, correct: 0, unknown: 0, score: 0, lastAt: null };
  stats.attempts = Number(stats.attempts) + 1;
  if (outcome === 'correct') {
    stats.correct = Number(stats.correct) + 1;
    stats.score = Number(stats.score) + 1;
  } else if (outcome === 'unknown') {
    stats.unknown = Number(stats.unknown || 0) + 1;
    stats.score = Number(stats.score || 0) + 0.25;
  }
  stats.lastAt = at || new Date().toISOString();
  next[mode][key] = stats;
  next.updatedAt = stats.lastAt;
  return next;
}
