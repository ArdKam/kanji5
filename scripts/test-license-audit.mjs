import assert from 'node:assert/strict';
import fs from 'node:fs';

const root=JSON.parse(fs.readFileSync('package-lock.json','utf8'));
const frontend=JSON.parse(fs.readFileSync('frontend/package-lock.json','utf8'));

const rootExpected={
  '@playwright/test':['1.59.0','Apache-2.0'],
};
const frontendExpected={
  'react':['19.2.0','MIT'],
  'react-dom':['19.2.0','MIT'],
  'vazirmatn':['33.0.3','OFL'],
  '@types/react':['19.2.0','MIT'],
  '@types/react-dom':['19.2.0','MIT'],
  '@vitejs/plugin-react':['5.2.0','MIT'],
  'typescript':['5.8.3','Apache-2.0'],
  'vite':['8.1.5','MIT'],
};

function assertLock(lock, expected, label){
  for(const [name,[version,license]] of Object.entries(expected)){
    const entry=lock.packages?.['node_modules/'+name];
    assert.ok(entry, label+' dependency missing: '+name);
    assert.equal(entry.version,version,label+' version drifted: '+name);
    assert.equal(entry.license,license,label+' license drifted: '+name);
  }
}
assertLock(root,rootExpected,'root');
assertLock(frontend,frontendExpected,'frontend');

assert.equal(root.packages?.['node_modules/@playwright/test']?.license,'Apache-2.0');
assert.match(fs.readFileSync('README.md','utf8'),/KANJIDIC2.*CC BY-SA 4\.0|Jōyō\/KANJIDIC2.*CC BY-SA 4\.0/);
assert.match(fs.readFileSync('docs/THIRD-PARTY-LICENSES.md','utf8'),/ts-fsrs.*MIT/);

console.log('Kanji 5 third-party license audit passed.');
