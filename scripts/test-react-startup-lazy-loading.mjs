import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source=await readFile(new URL('../frontend/src/app/App.tsx',import.meta.url),'utf8');

for (const name of ['DictionaryPage','StatsDialog','SettingsDialog','GrammarDialog','ReadingLabDialog','MnemonicsDialog','HandwritingPractice']) {
  assert.match(source,new RegExp('const '+name+' = lazy\\('));
  assert.doesNotMatch(source,new RegExp('import \\{ '+name+' \\} from'));
}
assert.match(source,/from "react";/);
assert.match(source,/import \{ PracticeHome \} from "\.\/PracticeHome";/);
assert.match(source,/Suspense/);

console.log('Non-learning UI lazy-loading contract: PASS');
