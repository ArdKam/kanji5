import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source=await readFile(new URL('../frontend/src/app/App.tsx',import.meta.url),'utf8');
const vite=await readFile(new URL('../frontend/vite.config.ts',import.meta.url),'utf8');

for (const name of ['DictionaryPage','StatsDialog','SettingsDialog','GrammarDialog','ReadingLabDialog','MnemonicsDialog']) {
  assert.match(source,new RegExp('const '+name+' = lazy\\('));
  assert.doesNotMatch(source,new RegExp('import \\{ '+name+' \\} from'));
}
assert.match(source,/from "react";/);
assert.match(source,/import \{ PracticeHome \} from "\.\/PracticeHome";/);
assert.match(source,/import \{ HandwritingPractice \} from "\.\/HandwritingPractice";/);
assert.match(source,/Suspense/);
assert.match(vite,/dedupe:\s*\["react",\s*"react-dom"\]/);
assert.match(vite,/react:\s+resolve\("node_modules\/react"\)/);
assert.match(vite,/"react-dom": resolve\("node_modules\/react-dom"\)/);
assert.match(vite,/name: "react-vendor"/);
assert.match(vite,/test: \/\\/node_modules\\\/(?:react\|react-dom)\\\//);

console.log('Non-learning UI lazy-loading contract: PASS');
