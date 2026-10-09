import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [taxonomy, dataset] = await Promise.all([
  fs.readFile(path.join(root, "frontend/src/app/kanji-topics.json"), "utf8").then(value => JSON.parse(value)),
  fs.readFile(path.join(root, "kanji-data.json"), "utf8").then(value => JSON.parse(value)),
]);

assert.equal(taxonomy.version, 1, "Topic taxonomy version must be explicit");
assert.equal(dataset.count, 2136, "Expected the pinned Jōyō catalog size");
assert.equal(dataset.kanji.length, dataset.count, "Dataset count must match its items");
assert.ok(Array.isArray(taxonomy.topics) && taxonomy.topics.length >= 12, "Expected a useful curated topic set");

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
};
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
    assert.ok(catalogCharacters.has(character), `Topic ${topic.id} contains a character outside kanji-data.json: ${character}`);
    assignmentCount += 1;
    seenCharacters.add(character);
  }
}
for (const [topicId, sample] of Object.entries(expectedTopics)) {
  const topic = taxonomy.topics.find(entry => entry.id === topicId);
  assert.ok(topic, `Missing expected topic: ${topicId}`);
  assert.ok(topic.characters.trim().split(" ").filter(Boolean).includes(sample), `Topic ${topicId} is missing its representative character ${sample}`);
}
assert.equal(seenCharacters.size, 422, "Update the documented curated coverage when topic coverage changes");
assert.equal(taxonomy.topics.length, 16, "Update the taxonomy audit when the initial topic set changes");
console.log(`Validated ${taxonomy.topics.length} curated topics, ${assignmentCount} topic assignments, and ${seenCharacters.size}/${dataset.count} unique Jōyō kanji.`);
