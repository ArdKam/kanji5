import assert from 'node:assert/strict';
import fs from 'node:fs';

const files=[
  'app-bootstrap.js',
  'v1.3-p0.js',
  'v1.9-v2-boundary.js',
  'review-runtime.js',
  'supabase-sync.js',
  'frontend/src/app/App.tsx',
  'frontend/src/app/GrammarGuide.tsx',
  'frontend/src/app/HandwritingPractice.tsx',
  'frontend/src/app/MnemonicsDialog.tsx',
  'frontend/src/app/DictionaryPage.tsx',
];

const emptyCatch=/catch\\s*(?:\\([^)]*\\))?\\s*\\{\\s*\\}/;
const offenders=[];
for(const file of files){
  const source=fs.readFileSync(file,'utf8');
  if(emptyCatch.test(source))offenders.push(file);
}
assert.deepEqual(offenders,[], 'Empty catch blocks remain: '+offenders.join(', '));
console.log('Kanji 5 empty-catch contract passed.');
