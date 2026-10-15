import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = async path => readFile(new URL("../" + path, import.meta.url), "utf8");
const preview = await read("frontend/src/app/KanjiStructurePreview.tsx");
const app = await read("frontend/src/app/App.tsx");
const dictionaryCard = await read("frontend/src/app/DictionaryKanjiCard.tsx");
const network = await read("v1.5-network.js");
const boundary = await read("v1.9-v2-boundary.js");
const sw = await read("sw.js");
const styles = await read("frontend/src/app/learning-card-enhancements.css");

assert.match(preview, /import "\.\/learning-card-enhancements\.css";/);
assert.doesNotMatch(preview, /useEffect|learning-card-enhancements\.css\?inline|data-rinemi-learning-card-styles|enabled:/);
assert.match(preview, /kanji-structure-preview-label/);
assert.match(preview, /No finer components recorded/);
assert.match(preview, /Visual structure unavailable/);
assert.match(preview, /View full structure/);
assert.match(preview, /مشاهدهٔ ساختار کامل/);

const backHeader = app.slice(app.indexOf('<div className="learning-card-face learning-card-back"'), app.indexOf('learning-back-pager-shell'));
assert.doesNotMatch(backHeader, /learning-reference-trigger/);
assert.match(app, /More meanings & readings/);
assert.match(app, /معنی‌ها و خوانش‌های بیشتر/);
assert.match(app, /t\("showAllReadingsInHiragana"\)/);
assert.match(app, /t\("useNormalReadingNotation"\)/);
assert.doesNotMatch(app, /className="example-row"[^>]*lang="ja"/);
assert.match(app, /className="example-meaning" lang="en"/);
assert.match(app, /examplesState\.character===activeCharacter/);
assert.match(app, /personalMnemonicState\.character===activeCharacter/);
assert.match(app, /preparedMnemonicState\.character===activeCharacter/);
assert.match(app, /mnemonicDraftState\.character===activeCharacter/);
assert.match(app, /mnemonicEditingState\.character===activeCharacter/);
assert.match(app, /mnemonicErrorState\.character===activeCharacter/);
assert.match(app, /setExamplesState\(\{character:activeCharacter,status:"loading",items:\[\]\}\)/);
assert.match(app, /Play reading .+ using browser speech/);

assert.match(network, /requestJSON\(.*\{strict:true\}\)/s);
assert.match(network, /X-Kanji5-Offline-Fallback/);
assert.match(network, /KANJI5_VOCABULARY_INVALID_RESPONSE/);
const getVocabulary = boundary.slice(boundary.indexOf("async function getVocabulary"), boundary.indexOf("async function getComponentInfo"));
assert.doesNotMatch(getVocabulary, /catch/);
assert.match(getVocabulary, /throw new Error\('KANJI5_VOCABULARY_INVALID_RESPONSE'\)/);
assert.match(sw, /status:503[\s\S]*X-Kanji5-Offline-Fallback/);
assert.match(app, /<StrokeOrderViewer key=\{card\.character\}/);
assert.match(dictionaryCard, /<StrokeOrderViewer key=\{item\.character\}/);
assert.match(styles, /\.kanji-structure-preview-action[\s\S]*border: 0 !important/);
assert.match(styles, /\.learning-reference-trigger[\s\S]*min-height: 44px/);

console.log("Learning-card follow-up transport, presentation, language and state contracts passed.");
