import assert from "node:assert/strict";
import fs from "node:fs";
import {
  buildPlacementQuestionsCore,
  scorePlacementAnswersCore,
  DIAGNOSTIC_LEVELS,
  PLACEMENT_ITEMS_PER_LEVEL,
  PLACEMENT_TOTAL_QUESTIONS,
} from "../placement-assessment-core.js";
import { buildLearnerContent } from "../v1.9-learner-content-core.js";

const catalog = JSON.parse(fs.readFileSync("kanji-data.json", "utf8")).kanji;
const positionCounts = [0, 0, 0, 0];
const layouts = new Set();
const seeds = 100;

for (let offset = 0; offset < seeds; offset += 1) {
  const seed = 71000 + offset;
  const questions = buildPlacementQuestionsCore(catalog, "Choose the primary meaning", seed);
  assert.equal(questions.length, PLACEMENT_TOTAL_QUESTIONS, "actual catalog must support the full 20-item contract");

  assert.deepEqual(
    DIAGNOSTIC_LEVELS.map(level => questions.filter(question => question.level === level).length),
    [5, 5, 5, 5],
    "actual catalog must preserve five-item coverage in each supported band",
  );

  const layout = [];
  for (const question of questions) {
    assert.equal(question.options.length, 4, question.id + " must have four options");
    assert.equal(question.options.filter(option => option.correct).length, 1, question.id + " must have one correct key");
    assert.equal(new Set(question.options.map(option => option.label.trim().toLowerCase())).size, 4, question.id + " must have unique labels");

    const learner = buildLearnerContent({
      character: question.item.character,
      meanings: question.item.meanings ?? question.item.meaning,
      on: question.item.on,
      kun: question.item.kun,
    });
    assert.equal(
      question.options.find(option => option.correct)?.label,
      learner.meanings.primary[0],
      question.id + " must use the learner-priority meaning as answer key",
    );

    const targetLabels = [...learner.meanings.primary, ...learner.meanings.secondary].map(value =>
      String(value).normalize("NFKC").trim().toLowerCase(),
    );
    for (const option of question.options.filter(option => !option.correct)) {
      assert.ok(!targetLabels.includes(option.label.normalize("NFKC").trim().toLowerCase()),
        question.id + " must not mark an alternate target gloss as an incorrect answer");
      const position = question.options.indexOf(option);
      assert.ok(position >= 0 && position < 4);
    }
    positionCounts[question.options.findIndex(option => option.correct)] += 1;
    layout.push(question.id + ":" + question.options.map(option => option.label).join("|"));
  }

  layouts.add(layout.join(";;"));
  const correctAnswers = Object.fromEntries(questions.map(question => [
    question.id,
    question.options.find(option => option.correct).id,
  ]));
  const score = scorePlacementAnswersCore(questions, correctAnswers);
  assert.equal(score.confidence, "provisional", "complete clean scores are not described as psychometrically high-confidence");
  assert.equal(score.answered, PLACEMENT_TOTAL_QUESTIONS);
}

const total = seeds * PLACEMENT_TOTAL_QUESTIONS;
const expected = total / 4;
const chiSquare = positionCounts.reduce((sum, observed) => sum + ((observed - expected) ** 2) / expected, 0);
const maxRelativeDeviation = Math.max(...positionCounts.map(observed => Math.abs(observed - expected) / expected));
assert.ok(chiSquare < 16.27, "actual-catalog answer-position chi-square too high: " + chiSquare);
assert.ok(maxRelativeDeviation < 0.12, "actual-catalog answer-position deviation too high: " + maxRelativeDeviation);
assert.ok(layouts.size >= 95, "retake forms must vary by sampled Kanji, not only answer order: " + layouts.size);

const allCorrectPaper = buildPlacementQuestionsCore(catalog, "Choose the primary meaning", 99001);
const perfectAnswers = Object.fromEntries(allCorrectPaper.map(question => [
  question.id,
  question.options.find(option => option.correct).id,
]));
const topEnd = scorePlacementAnswersCore(allCorrectPaper, perfectAnswers);
assert.equal(topEnd.suggestedLevel, "N2");
assert.equal(topEnd.upperBoundReached, true);

console.log(JSON.stringify({
  questionsPerForm: PLACEMENT_TOTAL_QUESTIONS,
  itemsPerBand: PLACEMENT_ITEMS_PER_LEVEL,
  formsChecked: seeds,
  positionCounts,
  proportions: positionCounts.map(value => value / total),
  chiSquare,
  maxRelativeDeviation,
  uniqueForms: layouts.size,
}, null, 2));
console.log("C4 placement empirical screen against the actual Kanji catalog passed.");
