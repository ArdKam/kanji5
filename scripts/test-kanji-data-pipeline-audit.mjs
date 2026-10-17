import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const readJSON = async path => JSON.parse(await readFile(new URL("../" + path, import.meta.url), "utf8"));
const [catalog, radicalCatalog, radicalMap, componentData, visualData, taxonomy] = await Promise.all([
  readJSON("kanji-data.json"),
  readJSON("kanji-radicals.json"),
  readJSON("kanji-radical-map.json"),
  readJSON("kanji-components.json"),
  readJSON("kanji-visual-structure.json"),
  readJSON("frontend/src/app/kanji-topics.json"),
]);

const records = catalog.kanji;
const characters = records.map(entry => entry.character);
const characterSet = new Set(characters);
const topicIds = taxonomy.topics.map(topic => topic.id);
const topicAssignments = taxonomy.topics.flatMap(topic =>
  topic.characters.trim().split(/\s+/).filter(Boolean).map(character => ({ topicId: topic.id, character }))
);
const uniqueTopicCharacters = new Set(topicAssignments.map(entry => entry.character));
const onAtLimit = records.filter(entry => entry.on.length === 4).length;
const kunAtLimit = records.filter(entry => entry.kun.length === 4).length;
const meaningsAtLimit = records.filter(entry => entry.meaning.length === 3).length;
const validReadingToken = /^[\u3040-\u30ff・ー〜～.·-]+$/u;
const radicalIds = new Set(radicalCatalog.radicals.map(radical => radical.id));
const radicalGlyphs = new Set(radicalCatalog.radicals.map(radical => radical.glyph));
const radicalAssignments = radicalMap.kanji;
const componentMap = componentData.components;
const componentMissing = componentData.missing;

assert.equal(catalog.count, 2136, "Catalog count metadata must remain 2,136");
assert.equal(records.length, 2136, "Expected 2,136 catalog records");
assert.equal(characterSet.size, 2136, "Catalog characters must be unique");
assert.equal(new Set(records.map(entry => entry.id)).size, 2136, "Stable card IDs must be unique");
assert.ok(records.every(entry => entry.id === entry.character), "Catalog IDs must remain character-based to preserve card identity");
assert.ok(records.every((entry, index) => entry.order === index + 1), "Catalog order must be a contiguous 1-based ordering");
assert.ok(records.every(entry =>
  Array.isArray(entry.meaning) && entry.meaning.length > 0 &&
  entry.meaning.every(value => typeof value === "string" && value.trim())
), "Every kanji needs at least one non-empty meaning gloss");
assert.ok(records.every(entry =>
  Array.isArray(entry.on) && Array.isArray(entry.kun) &&
  entry.on.every(value => typeof value === "string" && validReadingToken.test(value)) &&
  entry.kun.every(value => typeof value === "string" && validReadingToken.test(value))
), "Readings must remain in their expected kana/okurigana notation");
assert.ok(records.every(entry => Number.isInteger(entry.strokes) && entry.strokes > 0), "Every stroke count must be a positive integer");
assert.ok(records.every(entry => [1, 2, 3, 4, 5, 6, 8].includes(entry.grade)), "Jōyō grade values must be 1–6 or 8");
assert.ok(records.every(entry => entry.jlpt === null || ["N1", "N2", "N3", "N4", "N5"].includes(entry.jlpt)), "JLPT metadata must be valid or explicitly null");
assert.ok(records.every(entry => entry.frequency === null || (Number.isFinite(entry.frequency) && entry.frequency > 0)), "Frequency metadata must be positive or explicitly null");
for (const entry of records) {
  assert.equal(new Set(entry.meaning).size, entry.meaning.length, "Duplicate glosses for " + entry.character);
  assert.equal(new Set(entry.on).size, entry.on.length, "Duplicate on'yomi for " + entry.character);
  assert.equal(new Set(entry.kun).size, entry.kun.length, "Duplicate kun'yomi for " + entry.character);
}

assert.equal(radicalCatalog.schema, "kanji-radicals/v1");
assert.equal(radicalCatalog.radicals.length, 214, "Expected the 214 Kangxi radical definitions");
assert.equal(radicalIds.size, 214, "Radical IDs must be unique");
assert.equal(radicalGlyphs.size, 214, "Radical catalog glyphs must be unique");
assert.equal(radicalMap.schema, "kanji-radical-map/v1");
assert.equal(Object.keys(radicalAssignments).length, 2136, "Every catalog kanji must have one classical-radical assignment");
assert.ok(records.every(entry => Number.isInteger(radicalAssignments[entry.character]) && radicalIds.has(radicalAssignments[entry.character])),
  "Every catalog kanji must map to a defined classical radical");

assert.equal(componentData.schema, "kanji-components/v1");
assert.equal(componentData.target.count, 2136);
assert.equal(componentData.coverage.available, Object.keys(componentMap).length);
assert.equal(componentData.coverage.total, 2136);
assert.equal(componentMissing.length, 36, "Source gaps must stay explicit rather than being silently fabricated");
assert.equal(new Set(componentMissing).size, componentMissing.length, "Component source-gap list must be unique");
assert.ok(componentMissing.every(character => characterSet.has(character) && !(character in componentMap)),
  "Missing component records must be valid Jōyō characters absent from the component map");
assert.ok(Object.entries(componentMap).every(([character, values]) =>
  characterSet.has(character) && Array.isArray(values) && new Set(values).size === values.length &&
  values.every(value => typeof value === "string" && value.length > 0 && value !== "0")
), "Learning dependencies must contain unique, non-empty component identifiers");

assert.equal(visualData.schema, "kanji-visual-structure/v1");
assert.equal(visualData.coverage.available, 2136);
assert.equal(visualData.coverage.total, 2136);
assert.equal(Object.keys(visualData.structures).length, 2136, "Every Jōyō kanji must have a visual-structure record");
assert.ok(records.every(entry => visualData.structures[entry.character]?.character === entry.character),
  "Visual structure roots must match their catalog character");

assert.equal(taxonomy.topics.length, 24, "Topic taxonomy count changes require intentional review");
assert.equal(new Set(topicIds).size, topicIds.length, "Topic IDs must be unique");
assert.equal(topicAssignments.length, 1156, "Topic-assignment changes require reviewed audit-count updates");
assert.equal(uniqueTopicCharacters.size, 849, "Unique topic coverage changes require reviewed audit-count updates");
assert.ok(taxonomy.topics.every(topic => topic.label?.fa?.trim() && topic.label?.en?.trim()),
  "Every topic needs Persian and English labels");
assert.ok(topicAssignments.every(entry => characterSet.has(entry.character)),
  "Topics must not contain characters outside the authoritative Jōyō catalog");
for (const topic of taxonomy.topics) {
  const members = topic.characters.trim().split(/\s+/).filter(Boolean);
  assert.equal(new Set(members).size, members.length, "Duplicate membership within topic " + topic.id);
}

assert.equal(meaningsAtLimit, 1492, "Update the source-cap review count when the source snapshot changes");
assert.equal(onAtLimit, 22, "Update the source-cap review count when the source snapshot changes");
assert.equal(kunAtLimit, 273, "Update the source-cap review count when the source snapshot changes");

const audit = {
  catalog: {
    count: records.length,
    uniqueCharacters: characterSet.size,
    duplicateCharacters: records.length - characterSet.size,
    emptyMeaningEntries: records.filter(entry => !entry.meaning.length).length,
    emptyOnReadings: records.filter(entry => !entry.on.length).length,
    emptyKunReadings: records.filter(entry => !entry.kun.length).length,
    recordsAtCurrentMeaningCap: meaningsAtLimit,
    recordsAtCurrentOnReadingCap: onAtLimit,
    recordsAtCurrentKunReadingCap: kunAtLimit,
    nullFrequency: records.filter(entry => entry.frequency === null).length,
    nullJlpt: records.filter(entry => entry.jlpt === null).length,
  },
  radicalClassification: {
    definitions: radicalCatalog.radicals.length,
    mappedKanji: Object.keys(radicalAssignments).length,
    unmappedKanji: records.filter(entry => !(entry.character in radicalAssignments)).length,
    semantics: radicalCatalog.semantics,
  },
  learningComponents: {
    available: Object.keys(componentMap).length,
    total: componentData.coverage.total,
    missingSourceRecords: componentMissing.length,
    sourceSemantics: componentData.source.semantics,
  },
  visualStructure: {
    available: Object.keys(visualData.structures).length,
    total: visualData.coverage.total,
    source: visualData.source.name,
  },
  topics: {
    topicCount: taxonomy.topics.length,
    assignments: topicAssignments.length,
    uniqueCharacters: uniqueTopicCharacters.size,
    unassignedCharacters: records.length - uniqueTopicCharacters.size,
    coverageFraction: Number((uniqueTopicCharacters.size / records.length).toFixed(6)),
  },
  reviewRequired: [
    "The builder currently caps English glosses at 3 and each reading class at 4; records at those limits are candidates for comparison with the pinned source, not proof that source values were lost.",
    "kanjiapi.dev vocabulary and Tatoeba sentence results are runtime-fetched; their full live result sets are not frozen by this offline static-dataset audit.",
    "Topic associations are curated partial coverage, not a completeness requirement for all 2,136 kanji.",
  ],
};

console.log("Rinemi Japanese data pipeline audit: PASS");
console.log(JSON.stringify(audit, null, 2));
