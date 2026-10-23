import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(path, "utf8");
const card = read("frontend/src/app/DictionaryKanjiCard.tsx");
const styles = read("frontend/src/app/dictionary.css");
const form = read(".github/ISSUE_TEMPLATE/content_correction.yml");

assert.match(card, /https:\/\/github\.com\/ArdKam\/kanji5\/issues\/new/, "correction link must target the repository issue intake");
assert.match(card, /searchParams\.set\("template", "content_correction\.yml"\)/, "link must open the structured correction form");
assert.match(card, /searchParams\.set\("title", "\[Content\] " \+ item\.character\)/, "link must identify the current Kanji in the draft title");
assert.match(card, /target="_blank"/, "public reporting must not replace the learner's current learning context");
assert.match(card, /rel="noopener noreferrer"/, "external correction form must not receive opener access");
assert.match(card, /Report a content issue \(public\)/, "English UI must disclose that the report is public");
assert.match(card, /گزارش ایراد محتوایی \(عمومی\)/, "Persian UI must disclose that the report is public");
assert.match(card, /Do not include personal information or private learner notes/, "the interface must warn against posting private information");
assert.match(form, /name: Content correction/, "the GitHub intake form must exist");
for (const field of ["kanji", "area", "problem", "source"]) {
  assert.match(form, new RegExp("id:\\s*" + field + "\\b"), "correction form missing required field: " + field);
}
assert.match(form, /Do not include private learner history or personal mnemonics/, "the intake form must warn against private learner data");
assert.match(styles, /\.dictionary-content-correction-link[\s\S]*?min-height:\s*44px/, "correction link must meet the 44px touch-target contract");

console.log("Content correction entry-point contract: PASS");
