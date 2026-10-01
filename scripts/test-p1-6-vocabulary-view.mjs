import assert from 'node:assert/strict';
import { createContentEvidenceStore } from '../v1.9-content-evidence.js';
import { createVocabularyEvidenceAdapter } from '../v2-vocabulary-learning-core.js';
import {
  buildVocabularyItemViewModel,
  buildVocabularyListViewModel,
  vocabularyContentStage,
  vocabularyStatus,
} from '../v2-vocabulary-view-core.js';

let components={};
const store=createContentEvidenceStore({
  readComponents:()=>components,
  writeComponents:value=>{components=value;return true},
},{now:()=> '2026-10-01T00:00:00.000Z',limit:64});
const adapter=createVocabularyEvidenceAdapter(store);
const school={word:'学校',reading:'がっこう',meaning:'school',source:'kanjiapi.dev'};
const student={word:'学生',reading:'がくせい',meaning:'student',source:'kanjiapi.dev'};

const unseen=buildVocabularyItemViewModel(school);
assert.equal(unseen.domain,'vocabulary');
assert.equal(unseen.state,'unseen');
assert.equal(unseen.status,'new');
assert.equal(unseen.contentStage,'introduction');
assert.equal(unseen.accuracy,null);
assert.deepEqual(unseen.linkedKanji,['kanji:学','kanji:校']);

adapter.expose(school,{});
const introducedRecord=adapter.get(school);
const introduced=buildVocabularyItemViewModel(school,introducedRecord);
assert.equal(introduced.state,'introduced');
assert.equal(introduced.status,'learning');
assert.equal(introduced.contentStage,'guided');
assert.equal(introduced.evidence.exposureCount,1);

adapter.outcome(school,{outcome:'correct',independent:true,attemptType:'cued_recall'});
const retrievable=buildVocabularyItemViewModel(school,adapter.get(school));
assert.equal(retrievable.state,'retrievable');
assert.equal(retrievable.status,'retrievable');
assert.equal(retrievable.contentStage,'retrieval');
assert.equal(retrievable.accuracy,1);

adapter.outcome(school,{outcome:'correct',independent:true,attemptType:'cued_recall'});
const stable=buildVocabularyItemViewModel(school,adapter.get(school));
assert.equal(stable.state,'stable');
assert.equal(stable.status,'stable');
assert.equal(stable.evidence.currentStreak,2);

const records={
  [school.contentId]:adapter.get(school),
};
const list=buildVocabularyListViewModel([school,student],records);
assert.equal(list.length,2);
assert.equal(list[0].contentId,school.contentId);
assert.equal(list[0].status,'stable');
assert.equal(list[1].status,'new');

assert.equal(vocabularyStatus('stable'),'stable');
assert.equal(vocabularyStatus('weird'),'new');
assert.equal(vocabularyContentStage('stable'),'retrieval');
assert.equal(vocabularyContentStage('weird'),'introduction');

console.log('p1.6 vocabulary view model: all assertions passed');
