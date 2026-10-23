import assert from 'node:assert/strict';
import { normalizeVocabularyItem } from '../v2-vocabulary-core.js';
import { buildVocabularyContract, selectVocabularyContractItem } from '../v2-vocabulary-contract-core.js';

const school=normalizeVocabularyItem({word:'学校',reading:'がっこう',meaning:'school',source:'kanjiapi.dev'});
const student=normalizeVocabularyItem({word:'学生',reading:'がくせい',meaning:'student',source:'kanjiapi.dev'});
const stableRecord={state:'stable',practiceCount:5,correctCount:5,exposureCount:6};
const learningRecord={state:'introduced',practiceCount:2,correctCount:1,exposureCount:2};

const contract=buildVocabularyContract({
  items:[school,student],
  recordsByContentId:{
    [school.contentId]:stableRecord,
    [student.contentId]:learningRecord
  },
  limit:1,
  selectedContentId:school.contentId
});

assert.equal(contract.domain,'vocabulary');
assert.equal(contract.contractVersion,'2.0.0-vocabulary-contract');
assert.equal(contract.total,2);
assert.equal(contract.limit,1);
assert.equal(contract.hasMore,true);
assert.equal(contract.summary.total,2);
assert.equal(contract.summary.states.stable,1);
assert.equal(contract.summary.states.introduced,1);
assert.equal(contract.summary.stages.retrieval,1);
assert.equal(contract.summary.stages.guided,1);
assert.equal(contract.selectedContentId,school.contentId);
assert.equal(contract.selected.state,'stable');
assert.equal(contract.items.length,1);
assert.equal(contract.items[0].contentId,school.contentId);

const filtered=buildVocabularyContract({
  items:[school,student],
  recordsByContentId:{[school.contentId]:stableRecord,[student.contentId]:learningRecord},
  filter:{stage:'guided'}
});
assert.equal(filtered.total,1);
assert.equal(filtered.items[0].contentId,student.contentId);

const selected=selectVocabularyContractItem(contract,school.contentId);
assert.equal(selected.written,'学校');
assert.equal(selectVocabularyContractItem(contract,student.contentId),null);

const kanjiFiltered=buildVocabularyContract({
  items:[school,student],
  filter:{kanji:'kanji:学'}
});
assert.equal(kanjiFiltered.total,2);

console.log('P1.7 vocabulary contract tests passed');
