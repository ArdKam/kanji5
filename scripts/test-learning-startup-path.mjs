import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const app=await readFile(new URL('../frontend/src/app/App.tsx',import.meta.url),'utf8');
const session=await readFile(new URL('../v1.6-session.js',import.meta.url),'utf8');
const review=await readFile(new URL('../review-runtime.js',import.meta.url),'utf8');
const boundary=await readFile(new URL('../v1.9-v2-boundary.js',import.meta.url),'utf8');

for (const name of ['DictionaryPage','StatsDialog','SettingsDialog','PracticeHome','GrammarDialog','ReadingLabDialog','MnemonicsDialog','HandwritingPractice','StrokeOrderViewer']) {
  assert.match(app,new RegExp('const '+name+' = lazy\\('),`Learning startup must lazy-load ${name}`);
  assert.doesNotMatch(app,new RegExp('import \\{ '+name+' \\} from'),`Eager import remains for ${name}`);
}

assert.match(app,/<Suspense fallback=\\{null\\}><section className="secondary-page-host"/);
assert.match(app,/<Suspense fallback=\\{<LoadingLearning\\/>}><DictionaryPage/);
assert.match(app,/<Suspense fallback=\\{null\\}><StrokeOrderViewer/);
assert.match(app,/<h2>\\{t\("learningCard"\\)\\}<\\/h2>/,"Loading Learning surface should expose the same semantic heading early");

assert.match(session,/let planPromise=null;const loadPlanApi=/);
assert.doesNotMatch(session,/const planPromise=import\('\.\/v1\.6-session-core\.js'\)/);
assert.match(session,/function start\(\)\{if\(!IS_LEGACY\)return;/);
assert.match(session,/void loadPlanApi\(\)/);

assert.match(review,/buildQueue\(\);next\(\);document\.dispatchEvent\(new CustomEvent\('kanji5:v1\.9-review-ready'\)\)/);
assert.match(boundary,/if\(window\.__KANJI5_V19_REVIEW_BRIDGE__\)void refreshLearning\(\);else document\.addEventListener\('kanji5:v1\.9-review-ready'/);
assert.doesNotMatch(boundary,/setTimeout\(\(\)=>\{void refreshLearning\(\)\},100\)/);
assert.doesNotMatch(boundary,/setTimeout\(\(\)=>\{void refreshLearning\(\)\},500\)/);

console.log('Learning startup path contract: PASS');
