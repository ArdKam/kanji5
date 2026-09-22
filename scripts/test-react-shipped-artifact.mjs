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
