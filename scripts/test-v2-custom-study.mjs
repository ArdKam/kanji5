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

const normalized = normalizeCustomStudyFilter({ level: "bad", focus: "bad", limit: 1000 });
if (normalized.level !== "all" || normalized.focus !== "available" || normalized.limit !== 100) {
  throw new Error("Filter normalization bounds failed");
}

const n5 = selectCustomStudyItems({ deck, cards, learner, filter: { level: "N5", focus: "available", limit: 20 }, now, dailyNew: 2, todayNew: 0 });
if (JSON.stringify(n5.characters) !== JSON.stringify(["学", "森"])) {
  throw new Error(`N5 available selection failed: ${JSON.stringify(n5.characters)}`);
}

const due = selectCustomStudyItems({ deck, cards, learner, filter: { focus: "due", limit: 20 }, now, dailyNew: 5, todayNew: 0 });
if (JSON.stringify(due.characters) !== JSON.stringify(["語", "学"])) {
  throw new Error(`Due selection failed: ${JSON.stringify(due.characters)}`);
}

const fresh = selectCustomStudyItems({ deck, cards, learner, filter: { focus: "new", limit: 20 }, now, dailyNew: 2, todayNew: 0 });
if (JSON.stringify(fresh.characters) !== JSON.stringify(["森", "猫"])) {
  throw new Error(`New selection failed: ${JSON.stringify(fresh.characters)}`);
}

const weak = selectCustomStudyItems({ deck, cards, learner, filter: { focus: "weak", limit: 20 }, now });
if (JSON.stringify(weak.characters) !== JSON.stringify(["語", "学"])) {
  throw new Error(`Weak selection failed: ${JSON.stringify(weak.characters)}`);
}

const capped = selectCustomStudyItems({ deck, cards, learner, filter: { focus: "due", limit: 1 }, now });
if (JSON.stringify(capped.characters) !== JSON.stringify(["語"])) {
  throw new Error(`Limit cap failed: ${JSON.stringify(capped.characters)}`);
}

const exhaustedNew = selectCustomStudyItems({ deck, cards, learner, filter: { focus: "new", limit: 20 }, now, dailyNew: 2, todayNew: 2 });
if (exhaustedNew.characters.length !== 0) throw new Error("Daily new budget was not respected");

console.log("Custom study filtering core contracts passed.");
