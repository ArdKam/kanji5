import { buildLearnerContent } from "./v1.9-learner-content-core.js";

export const DIAGNOSTIC_LEVELS = Object.freeze(["N5", "N4", "N3", "N2"]);
export const PLACEMENT_ITEMS_PER_LEVEL = 5;
export const PLACEMENT_PASS_CORRECT = 4;
export const PLACEMENT_TOTAL_QUESTIONS = DIAGNOSTIC_LEVELS.length * PLACEMENT_ITEMS_PER_LEVEL;

const TOKEN_STOP_WORDS = new Set(["a", "an", "the", "to", "of", "for", "and", "or", "in", "on", "at"]);

function text(value) {
  return String(value ?? "").normalize("NFKC").replace(/[\t\r\n]+/g, " ").trim();
}

function meaningTokens(value) {
  return text(value)
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map(token => token.replace(/ies$/i, "y").replace(/(?:ing|ed|es|s)$/i, ""))
    .filter(token => token.length > 1 && !TOKEN_STOP_WORDS.has(token));
}

function overlapRatio(left, right) {
  const a = [...new Set(meaningTokens(left))];
  const b = [...new Set(meaningTokens(right))];
  if (!a.length || !b.length) return 0;
  const bSet = new Set(b);
  const shared = a.filter(token => bSet.has(token)).length;
  return shared / Math.min(a.length, b.length);
}

function meaningSetsAmbiguous(targetLabels, candidateLabels) {
  return targetLabels.some(target =>
    candidateLabels.some(candidate => overlapRatio(target, candidate) >= 0.8),
  );
}

function labelKey(value) {
  return text(value).toLowerCase().replace(/\s+/g, " ");
}

function stableHash(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededUnit(seed, salt) {
  let value = stableHash(String(seed >>> 0) + ":" + salt);
  value ^= value >>> 16;
  value = Math.imul(value, 0x85ebca6b);
  value ^= value >>> 13;
  value = Math.imul(value, 0xc2b2ae35);
  value ^= value >>> 16;
  return (value >>> 0) / 4294967296;
}

function shuffleWithSeed(values, seed, salt) {
  const result = values.slice();
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(seededUnit(seed, salt + ":" + i) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function orderValue(item) {
  const value = Number(item?.order ?? item?.frequency);
  return Number.isFinite(value) ? value : Number.POSITIVE_INFINITY;
}

function enrichItem(item) {
  const character = text(item?.character ?? item?.id);
  const meanings = Array.isArray(item?.meanings) ? item.meanings : item?.meaning;
  const learner = buildLearnerContent({
    character,
    meanings,
    on: item?.on,
    kun: item?.kun,
  });
  const primary = learner.meanings.primary.map(text).filter(Boolean);
  const secondary = learner.meanings.secondary.map(text).filter(Boolean);
  if (!character || !primary.length) return null;
  return {
    item,
    character,
    level: DIAGNOSTIC_LEVELS.includes(item?.jlpt) ? item.jlpt : null,
    primary,
    semanticLabels: [...new Set([...primary, ...secondary])],
    correctLabel: primary[0],
    correctKey: labelKey(primary[0]),
    order: orderValue(item),
  };
}

function canUseAsDistractor(target, candidate) {
  if (!candidate || candidate.character === target.character) return false;
  if (!candidate.correctLabel || labelKey(candidate.correctLabel) === target.correctKey) return false;
  if (target.semanticLabels.some(value => labelKey(value) === labelKey(candidate.correctLabel))) return false;
  return !meaningSetsAmbiguous(target.semanticLabels, candidate.semanticLabels);
}

function getDistractors(target, allItems, seed) {
  const seenLabels = new Set([target.correctKey, ...target.semanticLabels.map(labelKey)]);
  const eligible = allItems.filter(candidate => canUseAsDistractor(target, candidate));
  const sameBand = shuffleWithSeed(
    eligible.filter(candidate => candidate.level === target.level),
    seed,
    "placement-distractors-same:" + target.character,
  );
  const otherBands = shuffleWithSeed(
    eligible.filter(candidate => candidate.level !== target.level),
    seed,
    "placement-distractors-other:" + target.character,
  );
  const selected = [];
  for (const candidate of [...sameBand, ...otherBands]) {
    const key = labelKey(candidate.correctLabel);
    if (seenLabels.has(key)) continue;
    seenLabels.add(key);
    selected.push(candidate.correctLabel);
    if (selected.length === 3) break;
  }
  return selected;
}

function hasEnoughOptions(entry, allItems, seed) {
  return getDistractors(entry, allItems, seed).length === 3;
}

function pickStratifiedItems(pool, level, allItems, seed) {
  const sorted = pool.slice().sort((a, b) => a.order - b.order || a.character.localeCompare(b.character));
  const picked = [];
  const used = new Set();
  const strata = PLACEMENT_ITEMS_PER_LEVEL;

  for (let stratum = 0; stratum < strata; stratum += 1) {
    const start = Math.floor((stratum * sorted.length) / strata);
    const end = Math.floor(((stratum + 1) * sorted.length) / strata);
    const candidates = shuffleWithSeed(
      sorted.slice(start, end),
      seed,
      "placement-items:" + level + ":" + stratum,
    );
    const next = candidates.find(item =>
      !used.has(item.character) && hasEnoughOptions(item, allItems, seed),
    );
    if (next) {
      picked.push(next);
      used.add(next.character);
    }
  }

  if (picked.length < Math.min(PLACEMENT_ITEMS_PER_LEVEL, sorted.length)) {
    const remainder = shuffleWithSeed(
      sorted.filter(item => !used.has(item.character)),
      seed,
      "placement-items-backfill:" + level,
    );
    for (const item of remainder) {
      if (!hasEnoughOptions(item, allItems, seed)) continue;
      picked.push(item);
      used.add(item.character);
      if (picked.length >= PLACEMENT_ITEMS_PER_LEVEL) break;
    }
  }
  return picked.slice(0, PLACEMENT_ITEMS_PER_LEVEL);
}

function optionId(questionId, label) {
  return "option-" + stableHash(questionId + ":" + labelKey(label)).toString(16);
}

export function buildPlacementQuestionsCore(catalog, prompt, seed = 0) {
  const safeSeed = Number.isFinite(Number(seed)) ? Number(seed) >>> 0 : 0;
  const allItems = (Array.isArray(catalog) ? catalog : [])
    .map(enrichItem)
    .filter(Boolean);
  const byLevel = new Map(DIAGNOSTIC_LEVELS.map(level => [level, []]));
  for (const item of allItems) {
    if (item.level) byLevel.get(item.level).push(item);
  }

  const selected = [];
  for (const level of DIAGNOSTIC_LEVELS) {
    selected.push(...pickStratifiedItems(byLevel.get(level) ?? [], level, allItems, safeSeed));
  }

  return selected.map(entry => {
    const id = "placement-" + entry.level + "-" + entry.character;
    const distractors = getDistractors(entry, allItems, safeSeed);
    const labels = shuffleWithSeed(
      [entry.correctLabel, ...distractors],
      safeSeed,
      "placement-options:" + entry.character,
    );
    return {
      id,
      item: entry.item,
      level: entry.level,
      stimulus: entry.character,
      prompt: String(prompt ?? ""),
      options: labels.map(label => ({
        id: optionId(id, label),
        label,
        correct: labelKey(label) === entry.correctKey,
      })),
    };
  }).filter(question => question.options.length === 4 &&
    question.options.filter(option => option.correct).length === 1);
}

export function scorePlacementAnswersCore(questions, answers = {}) {
  const levelScores = Object.fromEntries(
    DIAGNOSTIC_LEVELS.map(level => [level, { correct: 0, total: 0 }]),
  );
  let score = 0;
  let answered = 0;

  for (const question of Array.isArray(questions) ? questions : []) {
    const level = question?.level;
    if (!Object.hasOwn(levelScores, level)) continue;
    const result = levelScores[level];
    result.total += 1;
    const chosen = answers?.[question.id];
    const validOption = question.options?.some(option => option.id === chosen);
    if (validOption) answered += 1;
    const correctId = question.options?.find(option => option.correct)?.id;
    if (correctId && chosen === correctId) {
      result.correct += 1;
      score += 1;
    }
  }

  const complete = (Array.isArray(questions) ? questions.length : 0) === PLACEMENT_TOTAL_QUESTIONS &&
    DIAGNOSTIC_LEVELS.every(level => levelScores[level].total === PLACEMENT_ITEMS_PER_LEVEL) &&
    answered === PLACEMENT_TOTAL_QUESTIONS;

  const boundaryLevels = DIAGNOSTIC_LEVELS.filter(level => {
    const result = levelScores[level];
    return result.total === PLACEMENT_ITEMS_PER_LEVEL &&
      (result.correct === PLACEMENT_PASS_CORRECT - 1 || result.correct === PLACEMENT_PASS_CORRECT);
  });

  let suggestedLevel = "N5";
  let allBandsPassed = true;
  for (let index = 0; index < DIAGNOSTIC_LEVELS.length; index += 1) {
    const level = DIAGNOSTIC_LEVELS[index];
    const result = levelScores[level];
    if (result.total !== PLACEMENT_ITEMS_PER_LEVEL || result.correct < PLACEMENT_PASS_CORRECT) {
      allBandsPassed = false;
      break;
    }
    suggestedLevel = DIAGNOSTIC_LEVELS[Math.min(index + 1, DIAGNOSTIC_LEVELS.length - 1)];
  }

  const confidence = !complete ? "limited" : boundaryLevels.length ? "boundary" : "provisional";
  const upperBoundReached = complete && allBandsPassed &&
    levelScores.N2.total === PLACEMENT_ITEMS_PER_LEVEL &&
    levelScores.N2.correct >= PLACEMENT_PASS_CORRECT;

  return {
    score,
    total: Array.isArray(questions) ? questions.length : 0,
    answered,
    levelScores,
    suggestedLevel,
    confidence,
    boundaryLevels,
    upperBoundReached,
  };
}
