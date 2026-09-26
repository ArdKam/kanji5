import fs from "node:fs";

const css=fs.readFileSync("react-dist/kanji5-react.css","utf8");
const entry=fs.readFileSync("react-entry.js","utf8");
if(!/\.experience-nav\{[^}]*position:fixed/.test(css)){
  throw new Error("SHIPPED_REACT_CSS_MISSING_BOTTOM_EXPERIENCE_NAV");
}
if(!/\.experience-tab\.active/.test(css)){
  throw new Error("SHIPPED_REACT_CSS_MISSING_EXPERIENCE_TAB_STATE");
}
console.log("Shipped React artifact contains bottom experience navigation CSS.");

if(!/react-dist\/kanji5-react\.js\?v=/.test(entry) || !/react-dist\/kanji5-react\.css\?v=/.test(entry)){
  throw new Error("REACT_ENTRY_MISSING_RUNTIME_ASSET_CACHE_BUST");
}
console.log("React entry uses cache-busted shipped runtime assets.");

if(!/react-dist\\/kanji5-react\\.js\\?v=20260926-handwriting-v1/.test(entry)||!/react-dist\\/kanji5-react\\.css\\?v=20260926-handwriting-v1/.test(entry)){
  throw new Error("REACT_ENTRY_HANDWRITING_RELEASE_CACHE_VERSION_MISMATCH");
}
const bootstrap=fs.readFileSync("app-bootstrap.js","utf8");
if(!/sw\\.js\\?v=132/.test(bootstrap)) throw new Error("APP_BOOTSTRAP_SW_CACHE_VERSION_MISMATCH");
const sw=fs.readFileSync("sw.js","utf8");
if(!/const CACHE='kanji5-shell-v160'/.test(sw)) throw new Error("SERVICE_WORKER_SHELL_CACHE_VERSION_MISMATCH");
console.log("Handwriting release cache-busting contract is consistent.");
const reactJs=fs.readFileSync("react-dist/kanji5-react.js","utf8");
try{
  new Function(reactJs);
}catch(error){
  throw new Error("SHIPPED_REACT_JS_INVALID_SYNTAX: "+(error instanceof Error?error.message:String(error)));
}
if(/getVocabulary\(t===`fa`\?character:character\)/.test(reactJs)) throw new Error("SHIPPED_REACT_JS_CONTAINS_UNDEFINED_VOCABULARY_CHARACTER_REFERENCE");
const vocabularyBlock=reactJs.slice(reactJs.indexOf("function VocabularyExamples"),reactJs.indexOf("function je("));
if(/let e=!0[\s\S]{0,300}getVocabulary\(e\)[\s\S]{0,300}\[character\]/.test(vocabularyBlock)) throw new Error("SHIPPED_REACT_JS_VOCABULARY_SCOPE_COLLISION");
if(!/learning-back-identity-visual/.test(reactJs)) throw new Error("SHIPPED_REACT_JS_MISSING_STABLE_IDENTITY_SLOT");
if(!/requestAnimationFrame\(\(\)=>e\(\)\)|setTimeout\(e,0\)/.test(reactJs)) throw new Error("SHIPPED_REACT_JS_MISSING_INTERACTION_YIELD");
if(!/\.experience-tab\{[^}]*height:46px/.test(css)||!/\.experience-tab\{[^}]*box-sizing:border-box/.test(css)) throw new Error("SHIPPED_REACT_CSS_EXPERIENCE_TAB_GEOMETRY_NOT_STABLE");
console.log("Shipped React artifact contains stable layout and interaction-yield guards.");
console.log("Shipped React JS contains a valid VocabularyExamples character reference.");
if(/data-kanji5-account-injected/.test(reactJs)) throw new Error("SHIPPED_REACT_JS_CONTAINS_EMBEDDED_FALLBACK_PATCH");
console.log("Shipped React JS parses as valid JavaScript.");

if(!/data-handwriting-grader/.test(reactJs)||!/vector-v1/.test(reactJs)||!/handwritingSimilarity/.test(reactJs)||/function scoreDrawing\(strokes/.test(reactJs)){
  throw new Error("SHIPPED_REACT_JS_HANDWRITING_GRADER_ARTIFACT_MISMATCH");
}
console.log("Shipped React JS contains the vector handwriting grader and similarity semantics.");

if(!/learning-back-scroll/.test(reactJs)||!/scrollTo/.test(reactJs)||!/smooth/.test(reactJs)) throw new Error("SHIPPED_REACT_JS_MISSING_LEARNING_SCROLL_BEHAVIOR");
console.log("Shipped React JS contains learning-card scroll behavior.");
if(/\\.learning-card\\[data-card-density=dense\\] \\.learning-back-overview\\{[^}]*grid-template-columns:minmax\\(0,1fr\\) minmax\\(0,1fr\\)/.test(css)) throw new Error("SHIPPED_REACT_CSS_CONTAINS_DENSE_TWO_COLUMN_BACK_LAYOUT");
if(!/\.learning-card-back \.learning-back-overview/.test(css)||!/\.learning-card-back \.learning-back-tools/.test(css)) throw new Error("SHIPPED_REACT_CSS_MISSING_ONE_COLUMN_BACK_LAYOUT_GUARD");
console.log("Shipped React CSS contains the learning-card single-column guard.");
const reactEntry=fs.readFileSync("react-entry.js","utf8");
if(!/mountAccountFallback/.test(reactEntry)) throw new Error("REACT_ENTRY_MISSING_ACCOUNT_FALLBACK");
console.log("React entry contains account visibility fallback.");
if(!fs.existsSync("account-fallback.js")) throw new Error("ACCOUNT_FALLBACK_SCRIPT_MISSING");
if(!/__KANJI5_ACCOUNT__|account-button/.test(fs.readFileSync("account-fallback.js","utf8"))) throw new Error("ACCOUNT_FALLBACK_SCRIPT_INCOMPLETE");
console.log("Standalone account fallback is present.");

const accountUi=/account-button|account-dialog|signInWithPassword|sendMagicLink/.test(reactJs);
if(!accountUi) throw new Error("SHIPPED_REACT_JS_MISSING_ACCOUNT_UI");
console.log("Shipped React JS contains Account UI.");

const accountFallback=fs.readFileSync("account-fallback.js","utf8");
try{new Function(accountFallback);}catch(error){throw new Error("ACCOUNT_FALLBACK_JS_INVALID_SYNTAX: "+(error instanceof Error?error.message:String(error)));}
console.log("Account fallback parses as valid JavaScript.");
