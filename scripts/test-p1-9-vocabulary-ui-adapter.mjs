import assert from 'node:assert/strict';
import { createVocabularyEvidenceAdapter } from '../v2-vocabulary-learning-core.js';
import { createVocabularyUiAdapter, buildVocabularyPageContract } from '../v2-vocabulary-ui-adapter.js';

const components={v19ContentEvidence:{}};
const storeBase=createVocabularyEvidenceAdapter({
  get:(mode,id)=>components.v19ContentEvidence[mode]?.[id]||null,
  readiness:(mode,id)=>components.v19ContentEvidence[mode]?.[id]?.state||'unseen',
  recordExposure:({mode,contentId})=>{
    components.v19ContentEvidence[mode]??={};
    components.v19ContentEvidence[mode][contentId]={state:'introduced',exposureCount:1};
    return components.v19ContentEvidence[mode][contentId];
  },
  recordOutcome:({mode,contentId,outcome})=>{
    components.v19ContentEvidence[mode]??={};
    const previous=components.v19ContentEvidence[mode][contentId]||{};
    const correct=outcome==='correct';
    const next={...previous,state:correct?'stable':'retrievable',practiceCount:(previous.practiceCount||0)+1,correctCount:(previous.correctCount||0)+(correct?1:0),wrongCount:(previous.wrongCount||0)+(correct?0:1)};
    components.v19ContentEvidence[mode][contentId]=next;
    return next;
  },
  selectContent:items=>items[0]||null,
  listMistakes:()=>[],
});

const school={word:'学校',reading:'がっこう',meaning:'school'};
const student={word:'学生',reading:'がくせい',meaning:'student'};
const adapter=createVocabularyUiAdapter({evidenceStore:storeBase});
let contract=adapter.build({items:[school,student],limit:10});
assert.equal(contract.domain,'vocabulary');
assert.equal(contract.total,2);
assert.equal(contract.items[0].state,'unseen');

const normalizedSchool=contract.items[0];
storeBase.expose(normalizedSchool);
contract=adapter.build({items:[school,student],limit:10});
assert.equal(contract.items.find(x=>x.written==='学校').state,'introduced');

storeBase.outcome(normalizedSchool,{outcome:'correct'});
contract=buildVocabularyPageContract({items:[school,student],evidenceStore:storeBase,filter:{status:'stable'}});
assert.equal(contract.total,1);
assert.equal(contract.items[0].written,'学校');

console.log('vocabulary UI adapter: all assertions passed');
