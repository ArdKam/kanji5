import assert from "node:assert/strict";
import { normalizeCustomStudyFilter, selectCustomStudyItems } from "../v2-custom-study-core.js";

const now = Date.now();
const deck = [
  { id: "山", character: "山", jlpt: "N5" },
  { id: "川", character: "川", jlpt: "N5" },
  { id: "木", character: "木", jlpt: "N5" },
  { id: "学", character: "学", jlpt: "N4" },
];
const cards = {
  川: { card: { due: new Date(now - 60_000).toISOString() } },
  木: { card: { due: new Date(now - 60_000).toISOString() } },
};
const scoped = normalizeCustomStudyFilter({
  focus: "available",
  limit: 20,
  topicCharacters: ["山", "川", "山", "𠮟", "not-a-kanji", ""],
  topicId: "nature",
});
assert.deepEqual(scoped.topicCharacters, ["山", "川", "𠮟"], "scope is unique and supports single Han characters, including supplementary-plane kanji");
assert.equal(scoped.topicId, "nature", "stable topic identity travels with the session filter");
const legacyScope = normalizeCustomStudyFilter({ characterScope: ["山", "川"] });
assert.deepEqual(legacyScope.topicCharacters, ["山", "川"], "legacy characterScope callers normalize to the stable topicCharacters contract");
assert.equal(normalizeCustomStudyFilter({ topicId: "nature & land" }).topicId, undefined, "topic identity accepts only a bounded stable ID");

const selected = selectCustomStudyItems({
  deck, cards, filter: { focus: "available", limit: 20, topicCharacters: ["山", "川"] },
  now, dailyNew: 5, todayNew: 0,
});
assert.deepEqual(new Set(selected.characters), new Set(["山", "川"]), "topic sessions include only allowed kanji");
assert.equal(selected.available, 2);

const noScope = selectCustomStudyItems({
  deck, cards, filter: { focus: "available", limit: 20 },
  now, dailyNew: 5, todayNew: 0,
});
assert.ok(noScope.characters.includes("木"), "ordinary custom study remains unscoped");

const emptyScope = selectCustomStudyItems({
  deck, cards, filter: { focus: "available", limit: 20, topicCharacters: [] },
  now, dailyNew: 5, todayNew: 0,
});
assert.equal(emptyScope.available, 0, "an explicitly empty scope must never fall back to the full catalog");

console.log("Topic-scoped custom-study selection contracts passed.");
