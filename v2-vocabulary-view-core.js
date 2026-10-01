import { projectVocabularyLearning, VOCABULARY_EVIDENCE_STATES } from './v2-vocabulary-learning-core.js';

export const VOCABULARY_VIEW_SCHEMA_VERSION=1;
export const VOCABULARY_VIEW_CONTRACT='2.0.0-vocabulary-view';

const STAGE_BY_STATE=Object.freeze({
  unseen:'introduction',
  introduced:'guided',
  retrievable:'retrieval',
  stable:'retrieval',
});

const STATUS_BY_STATE=Object.freeze({
  unseen:'new',
  introduced:'learning',
  retrievable:'retrievable',
  stable:'stable',
});

function text(value,limit=240){return String(value??'').normalize('NFKC').trim().slice(0,limit);}
function finite(value,fallback=0){const n=Number(value);return Number.isFinite(n)?n:fallback;}

export function vocabularyContentStage(state){
  const key=String(state||'unseen');
  return STAGE_BY_STATE[key]||'introduction';
}

export function vocabularyStatus(state){
  const key=String(state||'unseen');
  return STATUS_BY_STATE[key]||'new';
}

export function buildVocabularyItemViewModel(item,record=null){
  const learning=projectVocabularyLearning(item,record);
  const state=VOCABULARY_EVIDENCE_STATES.includes(learning.state)?learning.state:'unseen';
  return Object.freeze({
    contractVersion:VOCABULARY_VIEW_CONTRACT,
    schemaVersion:VOCABULARY_VIEW_SCHEMA_VERSION,
    kind:'vocabulary-item',
    domain:'vocabulary',
    contentId:learning.contentId,
    written:learning.written,
    reading:learning.reading,
    glosses:Object.freeze([...learning.glosses]),
    linkedKanji:Object.freeze([...learning.linkedKanji]),
    provenance:Object.freeze({...learning.provenance}),
    state,
    status:vocabularyStatus(state),
    contentStage:vocabularyContentStage(state),
    evidence:Object.freeze({
      exposureCount:Math.max(0,finite(learning.evidence?.exposureCount)),
      practiceCount:Math.max(0,finite(learning.evidence?.practiceCount)),
      correctCount:Math.max(0,finite(learning.evidence?.correctCount)),
      wrongCount:Math.max(0,finite(learning.evidence?.wrongCount)),
      recentWrongCount:Math.max(0,finite(learning.evidence?.recentWrongCount)),
      independentPracticeCount:Math.max(0,finite(learning.evidence?.independentPracticeCount)),
      recoveryCount:Math.max(0,finite(learning.evidence?.recoveryCount)),
      currentStreak:Math.max(0,finite(learning.evidence?.currentStreak)),
      lastOutcome:text(learning.evidence?.lastOutcome,24),
      updatedAt:text(learning.evidence?.updatedAt,80),
    }),
    accuracy:learning.accuracy==null?null:Math.max(0,Math.min(1,finite(learning.accuracy))),
    errorRate:Math.max(0,Math.min(1,finite(learning.errorRate))),
  });
}

export function buildVocabularyListViewModel(items,recordsByContentId={}){
  const source=recordsByContentId&&typeof recordsByContentId==='object'&&!Array.isArray(recordsByContentId)?recordsByContentId:{};
  return Object.freeze((Array.isArray(items)?items:[]).map(item=>{
    const normalized=projectVocabularyLearning(item,source[item?.contentId]);
    return buildVocabularyItemViewModel(item,source[normalized.contentId]);
  }));
}
