import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(path, "utf8");
const app = read("frontend/src/app/App.tsx");
const dictionaryPage = read("frontend/src/app/DictionaryPage.tsx");
const dictionaryCard = read("frontend/src/app/DictionaryKanjiCard.tsx");
const grammar = read("frontend/src/app/GrammarGuide.tsx");
const stroke = read("frontend/src/app/StrokeOrderViewer.tsx");
const styles = read("frontend/src/styles.css");
const navCss = read("frontend/src/experience-nav.css");
const dictionaryCss = read("frontend/src/app/dictionary.css");

assert.match(dictionaryPage, /const \[mnemonicDrafts,setMnemonicDrafts\]=useState<Record<string, string \| undefined>>\(\{\}\)/);
assert.match(dictionaryPage, /mnemonicDraft=\{mnemonicDrafts\[selected\.character\]\}/);
assert.match(dictionaryPage, /if \(mnemonicDraft === undefined && !mnemonicDraftEditedRef.current\) onMnemonicDraftChange\(text\)/);
assert.doesNotMatch(dictionaryPage, /const \[mnemonicDraft, setMnemonicDraft\] = useState/);

assert.match(grammar, /<section className="grammar-guide"/);
assert.doesNotMatch(grammar, /<details className="grammar-guide">/);
assert.doesNotMatch(grammar, /<summary>\{t\("grammarGuide"/);
const grammarQuestions = [...grammar.matchAll(/question:"((?:\\.|[^"])*)"/g)].map(m => m[1]);
assert.equal(grammarQuestions.length, 12);
assert.ok(grammarQuestions.every(q => !/[\u0600-\u06FF]/.test(q)), "Grammar quiz questions must be English in source.");

assert.match(app, /function Learning\(\{card,snapshot,busy,onReveal,onRate\}/);
assert.match(app, /const \[ratingPending,setRatingPending\]=useState\(false\)/);
assert.match(app, /if\(busy\|\|ratingPending\)return/);
assert.match(app, /disabled=\{busy\|\|ratingPending\}/);
assert.match(app, /<Learning card=\{snapshot\.learning\} busy=\{busy\}/);

assert.match(dictionaryCard, /aria-labelledby="dictionary-card-title"/);
assert.match(dictionaryCard, /id="dictionary-card-title"/);

assert.match(stroke, /onClick=\{\(\) => \(isPlaying \? pause\(\) : play\(\)\)\}/);
assert.match(stroke, /isPlaying \? \(language === "fa" \? "مکث" : "Pause"\)/);

assert.match(styles, /--nav-clearance:calc\(var\(--nav-bar-height\) \+ max\(14px,env\(safe-area-inset-bottom\)\)/);
assert.match(styles, /padding:[^;]*var\(--nav-clearance\)/);
assert.match(navCss, /padding-bottom:var\(--nav-clearance\);scroll-padding-bottom:var\(--nav-clearance\)/);
assert.match(dictionaryCss, /padding:8px 2px var\(--nav-clearance\)/);
assert.match(dictionaryCss, /padding-bottom:var\(--nav-clearance\)/);
assert.match(app, /\{!secondaryPage \? <nav className=\{"experience-nav active-tab-"\+experience\}/);

console.log("priority UX safety contracts: PASS");
