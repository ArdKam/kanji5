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
  characterScope: ["山", "川", "山", "not-a-kanji", ""],
});
assert.deepEqual(scoped.characterScope, ["山", "川"], "scope is unique and contains only single CJK characters");

const selected = selectCustomStudyItems({
  deck, cards, filter: { focus: "available", limit: 20, characterScope: ["山", "川"] },
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
  deck, cards, filter: { focus: "available", limit: 20, characterScope: [] },
  now, dailyNew: 5, todayNew: 0,
});
assert.equal(emptyScope.available, 0, "an explicitly empty scope must never fall back to the full catalog");

console.log("Topic-scoped custom-study selection contracts passed.");
