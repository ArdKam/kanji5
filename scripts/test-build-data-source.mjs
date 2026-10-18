import assert from 'node:assert/strict';
import fs from 'node:fs';

const build=fs.readFileSync('scripts/build-kanji-data.mjs','utf8');
assert.match(build,/raw\.githubusercontent\.com\/jkindrix\/japanese-language-data\/f79c68c9e35c6f8269a6b66e86c63c3713db06a0\/data\/core\/kanji-joyo\.json/,'Jōyō build input must use a pinned upstream revision');
assert.match(build,/SOURCE_COMMIT\s*=\s*["']f79c68c9e35c6f8269a6b66e86c63c3713db06a0["']/,'Pinned source commit must be explicit');
assert.match(build,/meaning:\s*x\.meanings\?\.en\s*\|\|\s*\[\]/,'English glosses must not be silently truncated');
assert.match(build,/on:\s*x\.readings\?\.on\s*\|\|\s*\[\]/,'On’yomi must not be silently truncated');
assert.match(build,/kun:\s*x\.readings\?\.kun\s*\|\|\s*\[\]/,'Kun’yomi must not be silently truncated');
assert.doesNotMatch(build, /\.slice\(0,\s*[34]\)/,'The generator must preserve every sourced gloss and reading');
assert.equal(fs.existsSync('kanji-joyo.json'),false,'Large upstream Jōyō source must not be tracked in the app repository');
assert.match(fs.readFileSync('.gitignore','utf8'),/^kanji-joyo\.json$/m,'Large upstream Jōyō source must remain ignored');
console.log('Build data source contract: PASS');
