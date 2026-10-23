import { DOMAIN_SCHEMA_VERSION, legacyEducationDefinition } from './v2-domain-core.js';
import { buildEvidenceEnvelope } from './v2-evidence-core.js';

const OUTCOME_SCHEMA_VERSION = 1;
const GRADER_VERSION = '1.9.0';
const MODES = Object.freeze(['meaning','reading','production','vocabulary','context']);
const OUTCOMES = Object.freeze(['correct','wrong','unknown','empty','invalid']);

function normalizeMode(mode) { return String(mode ?? '').trim().toLowerCase(); }
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
  const fallbackGraderVersion = GRADER_VERSION + '-' + normalizedMode;
  if (!source) {
    return Object.freeze({
      schemaVersion: OUTCOME_SCHEMA_VERSION,
      graderVersion: fallbackGraderVersion,
      mode: normalizedMode,
      outcome: 'invalid',
      correct: false,
      quality: 'invalid',
      score: 0,
      evidence: Object.freeze({}),
      evidenceEnvelope: buildEvidenceEnvelope({
        domain: meta?.domain || 'kanji', contentId: meta?.contentId, cardId: meta?.cardId,
        mode: normalizedMode, attribute: meta?.attribute, outcome: 'invalid', score: 0,
        graderVersion: meta?.graderVersion || fallbackGraderVersion,
        learnerModelVersion: meta?.learnerModelVersion, plannerVersion: meta?.plannerVersion,
        attemptId: meta?.attemptId, timestamp: meta?.timestamp
      })
    });
  }
  const outcome = resolveOutcome(source);
  const correct = outcome === 'correct';
  const definition = legacyEducationDefinition(normalizedMode);
  const domain = String(meta?.domain || definition.domain).trim().slice(0,40) || definition.domain;
  const skill = String(meta?.skill || definition.skill).trim().slice(0,80) || definition.skill;
  const exercise = String(meta?.exercise || definition.exercise).trim().slice(0,80) || definition.exercise;
  const contentId = typeof meta?.contentId === 'string' ? meta.contentId.trim().slice(0,240) : '';
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
  const graderVersion = typeof meta?.graderVersion === 'string' && meta.graderVersion.trim()
    ? String(meta.graderVersion) : fallbackGraderVersion;
  return Object.freeze({
    schemaVersion: OUTCOME_SCHEMA_VERSION,
    domainSchemaVersion: DOMAIN_SCHEMA_VERSION,
    graderVersion, mode: normalizedMode, domain, skill, exercise, contentId,
    outcome, correct, quality, score: normalizeScore(source.score),
    evidence: Object.freeze(evidence),
    evidenceEnvelope: buildEvidenceEnvelope({
      domain, contentId, cardId: meta?.cardId, mode: normalizedMode,
      attribute: meta?.attribute || skill, outcome, score: normalizeScore(source.score),
      graderVersion, learnerModelVersion: meta?.learnerModelVersion,
      plannerVersion: meta?.plannerVersion, attemptId: meta?.attemptId,
      timestamp: meta?.timestamp, evidence
    })
  });
}

function isKnownOutcome(value) { return OUTCOMES.includes(String(value ?? '')); }
export { OUTCOME_SCHEMA_VERSION, GRADER_VERSION, MODES, OUTCOMES, normalizeOutcome, isKnownOutcome };
