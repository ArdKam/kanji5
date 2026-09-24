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
const reactJs=fs.readFileSync("react-dist/kanji5-react.js","utf8");
try{
  new Function(reactJs);
}catch(error){
  throw new Error("SHIPPED_REACT_JS_INVALID_SYNTAX: "+(error instanceof Error?error.message:String(error)));
}
if(/data-kanji5-account-injected/.test(reactJs)) throw new Error("SHIPPED_REACT_JS_CONTAINS_EMBEDDED_FALLBACK_PATCH");
console.log("Shipped React JS parses as valid JavaScript.");

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
