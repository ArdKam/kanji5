import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [taxonomy, dataset] = await Promise.all([
  fs.readFile(path.join(root, "frontend/src/app/kanji-topics.json"), "utf8").then(value => JSON.parse(value)),
  fs.readFile(path.join(root, "kanji-data.json"), "utf8").then(value => JSON.parse(value)),
]);

assert.equal(taxonomy.version, 4, "Topic taxonomy version must be explicit");
assert.equal(dataset.count, 2136, "Expected the pinned catalog size");
assert.equal(dataset.kanji.length, dataset.count, "Dataset count must match its items");
assert.ok(Array.isArray(taxonomy.topics) && taxonomy.topics.length >= 20, "Expected a useful curated topic set");

const catalogCharacters = new Set(dataset.kanji.map(item => item.character));
const ids = taxonomy.topics.map(topic => topic.id);
assert.equal(new Set(ids).size, ids.length, "Topic IDs must be unique");

const expectedTopics = {
  numbers: "一",
  body: "手",
  nature: "山",
  time: "年",
  family: "母",
  people: "人",
  food: "食",
  school: "学",
  places: "駅",
  directions: "上",
  weather: "雨",
  animals: "犬",
  plants: "花",
  actions: "行",
  work: "事",
  emotions: "心",
  qualities: "大",
  government: "政",
  communication: "発",
  money: "価",
  transport: "車",
  health: "病",
  industry: "機",
  culture: "演",
};

const excludedOverbroadMemberships = {
  people: ["学"],
  school: ["明", "黒", "白"],
  places: ["銀", "物", "建"],
  government: ["庫"],
  emotions: ["絶"],
  culture: ["福", "授", "統", "産"],
};
for (const [topicId, excluded] of Object.entries(excludedOverbroadMemberships)) {
  const topic = taxonomy.topics.find(entry => entry.id === topicId);
  assert.ok(topic, `Missing topic for semantic QA guardrail: ${topicId}`);
  const characters = new Set(topic.characters.trim().split(/\s+/));
  for (const character of excluded) {
    assert.ok(!characters.has(character), `Overbroad membership regression: ${character} must not be in ${topicId}`);
  }
}

const expectedCoverageExpansion = {
  "numbers": [
    "点",
    "量",
    "率",
    "比",
    "差",
    "残",
    "周",
    "総"
  ],
  "nature": [
    "井",
    "河",
    "岡",
    "湾",
    "浜",
    "景",
    "幹",
    "藤",
    "沢"
  ],
  "time": [
    "初",
    "去",
    "旧",
    "未",
    "予"
  ],
  "family": [
    "育",
    "児",
    "婦",
    "郎"
  ],
  "people": [
    "位",
    "衆",
    "性",
    "独",
    "副",
    "師",
    "雄",
    "児",
    "婦",
    "郎",
    "将"
  ],
  "school": [
    "課",
    "例",
    "師",
    "講",
    "修"
  ],
  "places": [
    "宅",
    "境",
    "域",
    "線",
    "段",
    "席",
    "座",
    "韓",
    "欧",
    "井",
    "河",
    "岡",
    "湾",
    "浜"
  ],
  "directions": [
    "側",
    "逆",
    "対",
    "境",
    "界",
    "域"
  ],
  "weather": [
    "候"
  ],
  "plants": [
    "幹",
    "藤"
  ],
  "actions": [
    "参",
    "援",
    "施",
    "付",
    "配",
    "導",
    "備",
    "視",
    "断",
    "違",
    "去",
    "失",
    "整",
    "迎",
    "捜",
    "競",
    "育",
    "守",
    "捕",
    "撃",
    "殺",
    "与",
    "供",
    "遣",
    "献",
    "換"
  ],
  "work": [
    "案",
    "策",
    "件",
    "局",
    "企",
    "副",
    "労"
  ],
  "emotions": [
    "情"
  ],
  "qualities": [
    "常",
    "格",
    "状",
    "質",
    "形",
    "非",
    "負",
    "色",
    "白",
    "黒",
    "赤",
    "青",
    "型",
    "性",
    "独",
    "雄",
    "逆",
    "違",
    "比",
    "差"
  ],
  "government": [
    "反",
    "策",
    "証",
    "条",
    "票",
    "命",
    "訴",
    "盟",
    "将"
  ],
  "communication": [
    "声",
    "評",
    "写"
  ],
  "transport": [
    "線",
    "券",
    "票"
  ],
  "industry": [
    "型",
    "核"
  ],
  "money": [
    "融"
  ],
  "culture": [
    "和",
    "神",
    "写",
    "色",
    "形",
    "景",
    "調"
  ]
};
for (const [topicId, expectedCharacters] of Object.entries(expectedCoverageExpansion)) {
  const topic = taxonomy.topics.find(entry => entry.id === topicId);
  assert.ok(topic, `Missing expanded topic: ${topicId}`);
  const actual = new Set(topic.characters.trim().split(/\s+/));
  for (const character of expectedCharacters) {
    assert.ok(actual.has(character), `Coverage expansion regression: ${character} missing from ${topicId}`);
  }
}

const seenCharacters = new Set();
let assignmentCount = 0;

for (const topic of taxonomy.topics) {
  assert.match(topic.id, /^[a-z]+(?:-[a-z]+)*$/, `Invalid stable topic ID: ${topic.id}`);
  assert.ok(topic.label?.fa?.trim(), `Missing Persian label for ${topic.id}`);
  assert.ok(topic.label?.en?.trim(), `Missing English label for ${topic.id}`);
  const characters = topic.characters.trim().split(" ").filter(Boolean);
  assert.ok(characters.length >= 10, `Topic ${topic.id} is too small to be useful`);
  assert.equal(new Set(characters).size, characters.length, `Duplicate character within topic ${topic.id}`);
  for (const character of characters) {
    assert.equal(Array.from(character).length, 1, `Topic entries must be single Kanji: ${character}`);
    assert.ok(catalogCharacters.has(character), `Topic ${topic.id} contains a character outside the catalog: ${character}`);
    assignmentCount += 1;
    seenCharacters.add(character);
  }
}
for (const [topicId, sample] of Object.entries(expectedTopics)) {
  const topic = taxonomy.topics.find(entry => entry.id === topicId);
  assert.ok(topic, `Missing expected topic: ${topicId}`);
  assert.ok(topic.characters.trim().split(" ").includes(sample), `Topic ${topicId} is missing representative character ${sample}`);
}
assert.equal(assignmentCount, 1156, "Update the documented topic-assignment count when taxonomy coverage changes");
assert.equal(seenCharacters.size, 849, "Update the documented unique-character coverage when taxonomy changes");
assert.equal(taxonomy.topics.length, 24, "Update the topic audit when the topic set changes");
console.log(`Validated version ${taxonomy.version}: ${taxonomy.topics.length} curated topics after two semantic QA rounds, ${assignmentCount} topic assignments, and ${seenCharacters.size}/2136 unique kanji (${(seenCharacters.size / dataset.count * 100).toFixed(1)}% coverage).`);
