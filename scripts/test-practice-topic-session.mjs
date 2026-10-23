import assert from "node:assert/strict";
import { normalizeCustomStudyFilter, selectCustomStudyItems } from "../v2-custom-study-core.js";

const now = Date.parse("2026-09-24T18:00:00Z");
const deck = [
  { id: "学", character: "学", jlpt: "N5", frequency: 1 },
  { id: "校", character: "校", jlpt: "N5", frequency: 2 },
  { id: "語", character: "語", jlpt: "N4", frequency: 3 },
  { id: "森", character: "森", jlpt: "N5", frequency: 4 },
  { id: "猫", character: "猫", jlpt: "N3", frequency: 5 },
];
const cards = {
  学: { card: { due: new Date(now - 3600000).toISOString() } },
  校: { card: { due: new Date(now + 3600000).toISOString() } },
  語: { card: { due: new Date(now - 7200000).toISOString() } },
};
const learner = {
  kanji: {
    学: { attributes: { meaning: { state: "weak", attempts: 3, accuracy: 0.5 } } },
    語: { attributes: { meaning: { state: "weak", attempts: 3, accuracy: 0.5 } } },
  },
};

const normalized = normalizeCustomStudyFilter({
  topicId: "nature",
  topicCharacters: ["森", "山", "森", "", "not-a-kanji"],
  focus: "available",
  limit: 20,
});
assert.equal(normalized.topicId, "nature");
assert.deepEqual(normalized.topicCharacters, ["森", "山"]);

const topicAvailable = selectCustomStudyItems({
  deck, cards, learner,
  filter: { topicId: "nature", topicCharacters: ["森", "山"], focus: "available", limit: 20 },
  now, dailyNew: 5, todayNew: 0,
});
assert.deepEqual(topicAvailable.characters, ["森"], "Topic sessions must exclude content outside the selected topic.");

const topicDue = selectCustomStudyItems({
  deck, cards, learner,
  filter: { topicId: "school", topicCharacters: ["学", "校", "語"], level: "N5", focus: "due", limit: 20 },
  now,
});
assert.deepEqual(topicDue.characters, ["学"], "Topic, JLPT, and due filters must compose.");

const topicWeak = selectCustomStudyItems({
  deck, cards, learner,
  filter: { topicId: "school", topicCharacters: ["学", "校"], focus: "weak", limit: 20 },
  now,
});
assert.deepEqual(topicWeak.characters, ["学"], "Weak-item selection must remain inside the selected topic.");

const emptyTopic = selectCustomStudyItems({
  deck, cards, learner,
  filter: { topicId: "empty-topic", topicCharacters: [], focus: "available", limit: 20 },
  now,
});
assert.deepEqual(emptyTopic.characters, [], "An empty topic must not fall back to the full deck.");

const invalidTopic = normalizeCustomStudyFilter({ topicId: "../all", topicCharacters: ["学"] });
assert.equal(invalidTopic.topicId, undefined);
assert.equal(invalidTopic.topicCharacters, undefined);

console.log("Practice topic-session selection contracts passed.");
