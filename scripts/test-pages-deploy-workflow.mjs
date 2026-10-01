import assert from "node:assert/strict";
import fs from "node:fs";

const source=fs.readFileSync(".github/workflows/pages-deploy.yml","utf8");
const stagingSource=fs.readFileSync("scripts/stage-pages-site.mjs","utf8");

assert.match(source, /Build shipped React artifact from source/);assert.match(source,/Materialize automatic build hash/);assert.match(source,/__KANJI5_BUILD_HASH__/);assert.match(source,/github\.sha/);
assert.match(source, /react-dist\/kanji5-react\.js/);
assert.match(source, /react-dist\/kanji5-react\.css/);
assert.match(stagingSource, /"sw\.js"/);
assert.doesNotMatch(source, /workflow_run:/);
assert.doesNotMatch(source, /github\.event\.workflow_run/);

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

assert.match(source, /Upload freshly built GitHub Pages artifact/);
assert.doesNotMatch(source, /git add react-dist/);
assert.doesNotMatch(source, /git commit -m "chore\(build\): sync generated React artifact"/);
assert.doesNotMatch(source, /Materialize release18 React artifact for E2E/);

assert.match(source, /Stage production GitHub Pages site/);
assert.match(source, /node scripts\/stage-pages-site\.mjs/);
assert.match(source, /path: _site/);
assert.doesNotMatch(source, /path: \.\s*$/m);

console.log("Pages deployment is single-source and staging includes the service worker shell entry.");
