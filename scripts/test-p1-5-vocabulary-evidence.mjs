import assert from 'node:assert/strict';
import { createContentEvidenceStore } from '../v1.9-content-evidence.js';
import {
  createVocabularyEvidenceAdapter,
  normalizeVocabularyEvidenceInput,
  projectVocabularyLearning,
  vocabularyEvidenceAccuracy,
  vocabularyErrorRate,
} from '../v2-vocabulary-learning-core.js';

let components={};
const store=createContentEvidenceStore({
  readComponents:()=>components,
  writeComponents:value=>{components=value;return true},
},{now:()=> '2026-10-01T00:00:00.000Z',limit:64});

const adapter=createVocabularyEvidenceAdapter(store);
const school={word:'学校',reading:'がっこう',meaning:'school',source:'kanjiapi.dev'};
const student={word:'学生',reading:'がくせい',meaning:'student',source:'kanjiapi.dev'};
const schoolItem=adapter.projectVocabularyLearning(school);
assert.equal(schoolItem.domain,'vocabulary');
assert.equal(schoolItem.state,'unseen');
assert.equal(schoolItem.accuracy,null);
assert.deepEqual(schoolItem.linkedKanji,['kanji:学','kanji:校']);

const payload=normalizeVocabularyEvidenceInput(school,{character:'学'});
assert.equal(payload.mode,'vocabulary');
assert.equal(payload.contentKind,'vocabulary');
assert.equal(payload.provenance,'kanjiapi.dev');
assert.equal(payload.character,'学');

const unspecificPayload=normalizeVocabularyEvidenceInput(school,{});
assert.equal(unspecificPayload.character,undefined,'multi-Kanji vocabulary must not be attributed to an arbitrary first Kanji');

assert.equal(adapter.readiness(school),'unseen');
adapter.expose(school,{character:'学'});
assert.equal(adapter.readiness(school),'introduced');

const wrong=adapter.outcome(school,{
  character:'学',
  outcome:'wrong',
  selectedAnswer:'学生',
  independent:true,
  attemptType:'cued_recognition'
});
assert.equal(wrong.state,'introduced');
const selectedAfterWrong=adapter.select([student,school]);
assert.equal(selectedAfterWrong.contentId,schoolItem.contentId,'recent vocabulary mistake should be selected before unseen content');
assert.equal(wrong.practiceCount,1);
assert.equal(wrong.correctCount,0);
assert.equal(wrong.wrongCount,1);
assert.equal(wrong.recentWrongCount,1);
assert.equal(adapter.mistakes({character:'学',limit:5})[0].contentId,schoolItem.contentId);

const recovered=adapter.outcome(school,{
  character:'学',
  outcome:'correct',
  independent:false,
  recovery:true,
  attemptType:'guided_recovery'
});
assert.equal(recovered.practiceCount,1);
assert.equal(recovered.recoveryCount,1);
assert.equal(recovered.correctCount,0);

const firstIndependentCorrect=adapter.outcome(school,{
  character:'学',
  outcome:'correct',
  independent:true,
  attemptType:'cued_recall'
});
assert.equal(firstIndependentCorrect.state,'retrievable');
assert.equal(firstIndependentCorrect.practiceCount,2);
assert.equal(firstIndependentCorrect.correctCount,1);

const secondIndependentCorrect=adapter.outcome(school,{
  character:'学',
  outcome:'correct',
  independent:true,
  attemptType:'cued_recall'
});
assert.equal(secondIndependentCorrect.state,'stable');
assert.equal(secondIndependentCorrect.practiceCount,3);
assert.equal(secondIndependentCorrect.correctCount,2);
assert.equal(vocabularyEvidenceAccuracy(secondIndependentCorrect),2/3);
assert.equal(vocabularyErrorRate(secondIndependentCorrect),1/3);

const projected=adapter.project(school);
assert.equal(projected.state,'stable');
assert.equal(projected.evidence.practiceCount,3);
assert.equal(projected.evidence.recoveryCount,1);
assert.equal(projected.accuracy,2/3);
assert.equal(projected.errorRate,1/3);

assert.throws(
  ()=>adapter.outcome(school,{}),
  /VOCABULARY_OUTCOME_REQUIRED/
);

const invalid={word:'',reading:'',meaning:''};
assert.throws(()=>adapter.readiness(invalid),/VOCABULARY_CONTENT_ID_REQUIRES_WORD_AND_READING/);

assert.equal(Object.keys(components.v19ContentEvidence||{}).length,1);
console.log('p1.5 vocabulary evidence adapter: all assertions passed');
