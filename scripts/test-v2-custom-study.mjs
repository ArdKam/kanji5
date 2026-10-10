import { normalizeCustomStudyFilter, selectCustomStudyItems } from "../v2-custom-study-core.js";
import { readFile } from "node:fs/promises";

const reviewRuntimeSource = await readFile(new URL("../review-runtime.js", import.meta.url), "utf8");
const boundarySource = await readFile(new URL("../v1.9-v2-boundary.js", import.meta.url), "utf8");
const serviceWorkerSource = await readFile(new URL("../sw.js", import.meta.url), "utf8");
new Function(reviewRuntimeSource);
new Function(boundarySource);
if (!serviceWorkerSource.includes(""./v2-custom-study-core.js"")) throw new Error("Custom study core is not precached by the service worker");

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
const mistakes = selectCustomStudyItems({ deck, cards, learner, components: { v19ContentEvidence: { "x": { character: "森", recentWrongCount: 2 }, "y": { character: "語", recentWrongCount: 1 } } }, filter: { focus: "mistakes", limit: 10 }, now });
if (JSON.stringify(mistakes.characters) !== JSON.stringify(["森", "語"])) throw new Error("Content mistake focus failed");

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


// Topic scoping is a content constraint layered ahead of the existing scheduler filters.
const normalizedTopic = normalizeCustomStudyFilter({
  topicId: "nature",
  topicCharacters: ["森", "学", "森", "", "not-a-kanji"],
  focus: "available",
  limit: 20,
});
if (normalizedTopic.topicId !== "nature" || JSON.stringify(normalizedTopic.topicCharacters) !== JSON.stringify(["森", "学"])) {
  throw new Error(`Topic filter normalization failed: ${JSON.stringify(normalizedTopic)}`);
}

const topicOnly = selectCustomStudyItems({
  deck,
  cards,
  learner,
  filter: { topicId: "nature", topicCharacters: ["森"], focus: "available", limit: 20 },
  now,
  dailyNew: 5,
  todayNew: 0,
});
if (JSON.stringify(topicOnly.characters) !== JSON.stringify(["森"])) {
  throw new Error(`Topic scoping must exclude all non-topic cards: ${JSON.stringify(topicOnly.characters)}`);
}

const topicDue = selectCustomStudyItems({
  deck,
  cards,
  learner,
  filter: { topicId: "school", topicCharacters: ["学", "校", "語"], level: "N5", focus: "due", limit: 20 },
  now,
});
if (JSON.stringify(topicDue.characters) !== JSON.stringify(["学"])) {
  throw new Error(`Topic, JLPT, and due filters must compose: ${JSON.stringify(topicDue.characters)}`);
}

const emptyTopic = selectCustomStudyItems({
  deck,
  cards,
  learner,
  filter: { topicId: "empty-topic", topicCharacters: [], focus: "available", limit: 20 },
  now,
});
if (emptyTopic.characters.length !== 0) {
  throw new Error("An empty selected topic must never fall back to an unrestricted deck");
}

const invalidTopic = normalizeCustomStudyFilter({ topicId: "../all", topicCharacters: ["学"] });
if (invalidTopic.topicId !== undefined || invalidTopic.topicCharacters !== undefined) {
  throw new Error("Invalid topic IDs must not smuggle a character filter into an unscoped session");
}

const legacyTopic = normalizeCustomStudyFilter({ characterScope: ["森", "森", "not-a-kanji"] });
if (JSON.stringify(legacyTopic.topicCharacters) !== JSON.stringify(["森"])) {
  throw new Error("The deprecated characterScope migration alias must remain normalized");
}

console.log("Custom study filtering core contracts passed.");
