import assert from "node:assert/strict";
import { buildLearnerContent } from "../v1.9-learner-content-core.js";
import { buildLearningCardViewModel } from "../v1.9-v2-contract-core.js";

const source = buildLearnerContent({
  character: "日",
  meanings: ["day", "sun", "Japan"],
  on: ["ニチ", "ジツ"],
  kun: ["ひ", "-び", "-か"],
  meaningLanguage: "en",
  meaningProvenance: {
    source: "KANJIDIC2 via jkindrix/japanese-language-data",
    version: "kanji-data.json:v1",
    entryId: "日",
  },
});
assert.deepEqual(source.meanings.primary, ["day", "sun"]);
assert.deepEqual(source.meanings.secondary, ["Japan"]);

const referenceOnly = buildLearnerContent({
  character: "箇",
  meanings: ["counter for articles"],
  meaningLanguage: "en",
  meaningProvenance: { source: "KANJIDIC2 via jkindrix/japanese-language-data", version: "kanji-data.json:v1", entryId: "箇" },
});
assert.deepEqual(referenceOnly.meanings.primary, []);
assert.deepEqual(referenceOnly.meanings.reference, ["counter for articles"]);
assert.equal(referenceOnly.meaningRecords[0].priority, "reference");
assert.equal(source.meaningRecords.length, 3);
for (const record of source.meaningRecords) {
  assert.equal(record.language, "en");
  assert.equal(record.reviewStatus, "unreviewed");
  assert.equal(record.provenance.source, "KANJIDIC2 via jkindrix/japanese-language-data");
  assert.match(record.reviewNotes, /not been independently reviewed/);
  assert.equal(record.reviewedBy, null);
  assert.equal(record.reviewedAt, null);
}

// A record cannot claim review verification without a reviewer and timestamp.
const unsubstantiatedVerified = buildLearnerContent({
  character: "日",
  meanings: ["day"],
  meaningLanguage: "en",
  meaningRecords: [{
    text: "day",
    language: "en",
    priority: "primary",
    provenance: { source: "fixture-source" },
    reviewStatus: "verified",
  }],
});
assert.equal(unsubstantiatedVerified.meaningRecords[0].reviewStatus, "unreviewed");
assert.equal(unsubstantiatedVerified.meaningRecords[0].reviewedBy, null);
assert.equal(unsubstantiatedVerified.meaningRecords[0].reviewedAt, null);

// Missing Persian must be represented explicitly, not fabricated.
const missingPersian = buildLearnerContent({
  character: "日",
  meanings: ["day"],
  meaningLanguage: "en",
  meaningRecords: [{
    text: null,
    language: "fa",
    priority: "primary",
    provenance: { source: "human-translation-review" },
    reviewStatus: "unavailable",
    reviewNotes: "Awaiting human Persian translation review.",
  }],
});
assert.equal(missingPersian.meaningRecords.find(record => record.language === "fa")?.text, null);
assert.equal(missingPersian.meaningRecords.find(record => record.language === "fa")?.reviewStatus, "unavailable");

// The card view-model exposes records without altering the existing learner-content contract.
const card = buildLearningCardViewModel({
  character: "日",
  meanings: ["day", "sun", "Japan"],
  on: ["ニチ", "ジツ"],
  kun: ["ひ", "-び", "-か"],
});
assert.deepEqual(card.learnerMeaningRecords.map(record => record.text), ["day", "sun", "Japan"]);
assert.ok(card.learnerMeaningRecords.every(record => record.reviewStatus === "unreviewed"));
assert.deepEqual(card.learnerMeanings.primary, ["day", "sun"]);

const app = await (await import("node:fs/promises")).readFile(new URL("../frontend/src/app/App.tsx", import.meta.url), "utf8");
assert.match(app, /record\.reviewStatus==="verified"/);
assert.match(app, /getLanguage\(\)==="fa"&&!useReviewedLocalizedMeanings/);
assert.match(app, /reviewedPersianMeaningUnavailable/);
assert.match(app, /className="example-source-label"/);
const learningCardStyles = await (await import("node:fs/promises")).readFile(new URL("../frontend/src/app/learning-card-enhancements.css", import.meta.url), "utf8");
assert.match(learningCardStyles, /\.learning-meaning-source-note\s*\{/);
assert.match(learningCardStyles, /\.example-source-label\s*\{/);
assert.match(app, /lang=\{e\.meaningLanguage&&e\.meaningLanguage!==\"unknown\"\?e\.meaningLanguage:\"en\"\}/);

console.log("Learner meaning provenance/review contract passed.");
