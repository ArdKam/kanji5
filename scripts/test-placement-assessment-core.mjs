import assert from "node:assert/strict";
import {
  buildPlacementQuestionsCore,
  scorePlacementAnswersCore,
  DIAGNOSTIC_LEVELS,
  PLACEMENT_ITEMS_PER_LEVEL,
  PLACEMENT_TOTAL_QUESTIONS,
} from "../placement-assessment-core.js";

function fixtureCatalog(perLevel = 40) {
  const catalog = [];
  let index = 0;
  for (const level of DIAGNOSTIC_LEVELS) {
    for (let local = 0; local < perLevel; local += 1) {
      const character = String.fromCodePoint(0x5000 + index);
      catalog.push({
        id: character,
        character,
        meanings: ["gloss " + level.toLowerCase() + " token" + String(local).padStart(2, "0")],
        on: ["オン"],
        kun: ["かな"],
        jlpt: level,
        order: index + 1,
      });
      index += 1;
    }
  }
  return catalog;
}

function allCorrectAnswers(questions, correctByLevel = {}) {
  const answers = {};
  const used = Object.fromEntries(DIAGNOSTIC_LEVELS.map(level => [level, 0]));
  for (const question of questions) {
    const target = correctByLevel[question.level] ?? PLACEMENT_ITEMS_PER_LEVEL;
    const shouldBeCorrect = used[question.level] < target;
    used[question.level] += 1;
    const option = question.options.find(item => item.correct);
    answers[question.id] = shouldBeCorrect
      ? option.id
      : question.options.find(item => !item.correct).id;
  }
  return answers;
}

const catalog = fixtureCatalog();
const first = buildPlacementQuestionsCore(catalog, "Choose the primary meaning", 101);
const sameSeed = buildPlacementQuestionsCore(catalog, "Choose the primary meaning", 101);
const retake = buildPlacementQuestionsCore(catalog, "Choose the primary meaning", 202);

assert.equal(first.length, PLACEMENT_TOTAL_QUESTIONS, "full banks should yield 20 items");
assert.deepEqual(
  first.map(question => [question.id, question.options.map(option => option.label)]),
  sameSeed.map(question => [question.id, question.options.map(option => option.label)]),
  "a persisted seed must reproduce an identical questionnaire after reload",
);
assert.notDeepEqual(
  first.map(question => question.id),
  retake.map(question => question.id),
  "retaking with a new seed must sample different Kanji, not only reshuffle options",
);
assert.deepEqual(
  DIAGNOSTIC_LEVELS.map(level => first.filter(question => question.level === level).length),
  [5, 5, 5, 5],
  "each band must have five items and must not be filled with out-of-band fallback items",
);

for (const question of first) {
  assert.equal(question.options.length, 4, question.id + " must have four options");
  assert.equal(question.options.filter(option => option.correct).length, 1, question.id + " must have exactly one key");
  assert.equal(new Set(question.options.map(option => option.label.trim().toLowerCase())).size, 4, question.id + " must have unique labels");
  assert.equal(question.item.character, question.stimulus);
}

const allPass = scorePlacementAnswersCore(first, allCorrectAnswers(first));
assert.equal(allPass.suggestedLevel, "N2");
assert.equal(allPass.upperBoundReached, true);
assert.equal(allPass.confidence, "provisional", "complete perfect scores are still only provisional without empirical calibration");

const mixed = scorePlacementAnswersCore(first, allCorrectAnswers(first, { N5: 4, N4: 5, N3: 3, N2: 5 }));
assert.equal(mixed.suggestedLevel, "N3", "a strong upper-band score must not jump over a failed lower band");
assert.equal(mixed.confidence, "boundary");
assert.deepEqual(mixed.boundaryLevels.sort(), ["N3", "N5"].sort());

const conservative = scorePlacementAnswersCore(first, allCorrectAnswers(first, { N5: 2, N4: 5, N3: 5, N2: 5 }));
assert.equal(conservative.suggestedLevel, "N5", "the recommendation must be contiguous from the lowest band");
assert.equal(conservative.upperBoundReached, false);

const truncated = scorePlacementAnswersCore(first.slice(0, -1), allCorrectAnswers(first.slice(0, -1)));
assert.equal(truncated.confidence, "limited", "missing bands/items must never be reported as high confidence");
assert.equal(truncated.upperBoundReached, false);

const incompleteAnswers = allCorrectAnswers(first);
delete incompleteAnswers[first[0].id];
assert.equal(scorePlacementAnswersCore(first, incompleteAnswers).confidence, "limited", "unanswered items must make confidence limited");

const short = buildPlacementQuestionsCore(fixtureCatalog(3), "Choose the primary meaning", 7);
assert.equal(short.some(question => question.level === "N1" || !DIAGNOSTIC_LEVELS.includes(question.level)), false);
assert.equal(scorePlacementAnswersCore(short, {}).confidence, "limited", "thin level pools must remain explicitly limited");

const ambiguityCatalog = [
  { character: "会", meanings: ["meeting", "meet", "party"], jlpt: "N4", order: 1 },
  { character: "学", meanings: ["study", "learning", "learn"], jlpt: "N5", order: 2 },
  ...fixtureCatalog(8).map((item, i) => ({ ...item, order: i + 3 })),
];
const ambiguityQuestions = buildPlacementQuestionsCore(ambiguityCatalog, "Choose the primary meaning", 17);
const kai = ambiguityQuestions.find(question => question.item.character === "会");
if (kai) {
  assert.equal(kai.options.find(option => option.correct).label, "meet", "the key must use learner-priority meaning, not raw source order");
  assert.equal(kai.options.some(option => ["meeting", "party"].includes(option.label)), false, "alternate accepted/source glosses must not appear as wrong options");
}

console.log("Placement assessment core: 20-item stratified sampling, key validity, retake randomization, contiguous level recommendation, and uncertainty checks passed.");
