const OUTCOME_SCHEMA_VERSION = 1;
const GRADER_VERSION = '1.9.0';
const MODES = Object.freeze(['meaning','reading','production','vocabulary','context']);
const OUTCOMES = Object.freeze(['correct','wrong','unknown','empty','invalid']);

function normalizeMode(mode) {
  return String(mode ?? '').trim().toLowerCase();
}

function normalizeScore(value) {
  const score = Number(value);
  return Number.isFinite(score) ? Math.max(0, Math.min(1, score)) : 0;
}

function resolveOutcome(result) {
  const source = result && typeof result === 'object' ? result : null;
  if (!source) return 'invalid';
  if (OUTCOMES.includes(source.outcome)) return source.outcome;
  if (source.quality === 'empty') return 'empty';
  if (source.quality === 'invalid') return 'invalid';
  if (source.quality === 'unknown') return 'unknown';
  if (source.quality === 'wrong') return 'wrong';
  if (source.correct === true) return 'correct';
  if (source.correct === false) return 'wrong';
  return 'invalid';
}

function normalizeOutcome(mode, result, meta = {}) {
  const normalizedMode = normalizeMode(mode);
  if (!MODES.includes(normalizedMode)) throw new Error('UNSUPPORTED_EDUCATION_MODE');
  const source = result && typeof result === 'object' ? result : null;
  if (!source) {
    return Object.freeze({
      schemaVersion: OUTCOME_SCHEMA_VERSION,
      graderVersion: `${GRADER_VERSION}-${normalizedMode}`,
      mode: normalizedMode,
      outcome: 'invalid',
      correct: false,
      quality: 'invalid',
      score: 0,
      evidence: Object.freeze({})
    });
  }
  const outcome = resolveOutcome(source);
  const correct = outcome === 'correct';
  const quality = String(source.quality || outcome);
  const evidence = {};
  if (meta?.inputKind) evidence.inputKind = String(meta.inputKind);
  if (meta?.answerSource) evidence.answerSource = String(meta.answerSource);
  if (source.evidence && typeof source.evidence === 'object') {
    for (const [key, value] of Object.entries(source.evidence)) {
      if (['input','answer','rawAnswer','rawInput'].includes(key)) continue;
      if (value == null || ['string','number','boolean'].includes(typeof value)) evidence[key] = value;
    }
  }
  return Object.freeze({
    schemaVersion: OUTCOME_SCHEMA_VERSION,
    graderVersion: typeof meta?.graderVersion === 'string' && meta.graderVersion.trim()
      ? String(meta.graderVersion)
      : `${GRADER_VERSION}-${normalizedMode}`,
    mode: normalizedMode,
    outcome,
    correct,
    quality,
    score: normalizeScore(source.score),
    evidence: Object.freeze(evidence)
  });
}

function isKnownOutcome(value) {
  return OUTCOMES.includes(String(value ?? ''));
}

export { OUTCOME_SCHEMA_VERSION, GRADER_VERSION, MODES, OUTCOMES, normalizeOutcome, isKnownOutcome };
