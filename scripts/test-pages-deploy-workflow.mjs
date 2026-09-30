import assert from "node:assert/strict";
import fs from "node:fs";

const source=fs.readFileSync(".github/workflows/pages-deploy.yml","utf8");

assert.match(source, /Build shipped React artifact from source/);
assert.match(source, /react-dist\/kanji5-react\.js/);
assert.match(source, /react-dist\/kanji5-react\.css/);

assert.match(source, /fetch_with_retry "\$base\/" \/tmp\/kanji5-root\.html "react-entry\.js"/);
assert.match(source, /fetch_with_retry "\$base\/react-entry\.js" \/tmp\/kanji5-entry\.js "react-dist\/kanji5-react\.js"/);
assert.match(source, /fetch_with_retry "\$base\/sw\.js" \/tmp\/kanji5-sw\.js "react-dist\/kanji5-react\.js"/);
assert.match(source, /fetch_with_retry "\$base\/react-dist\/kanji5-react\.js" \/tmp\/kanji5-react\.js "practice-home"/);
assert.match(source, /fetch_with_retry "\$base\/react-dist\/kanji5-react\.css" \/tmp\/kanji5-react\.css "dictionary-card"/);

const liveVerification = source.slice(source.indexOf("      - name: Verify live GitHub Pages artifact"));
assert.doesNotMatch(liveVerification, /react-entry-release18\.js/);
assert.doesNotMatch(liveVerification, /sw-release18\.js/);
assert.doesNotMatch(liveVerification, /react-dist\/kanji5-react-release18\.(js|css)/);

console.log("GitHub Pages live-verification contract uses canonical React assets.");
