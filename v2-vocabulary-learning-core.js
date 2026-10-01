import { normalizeVocabularyItem, vocabularyContentId } from './v2-vocabulary-core.js';

export const VOCABULARY_LEARNING_SCHEMA_VERSION=1;
export const VOCABULARY_EVIDENCE_MODE='vocabulary';
export const VOCABULARY_EVIDENCE_STATES=Object.freeze(['unseen','introduced','retrievable','stable']);

const safeObject=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
const text=(value,limit=240)=>String(value??'').normalize('NFKC').trim().slice(0,limit);

function firstLinkedKanji(item){
  const linked=Array.isArray(item?.linkedKanji)?item.linkedKanji:[];
  const first=linked[0];
  return typeof first==='string'&&first.startsWith('kanji:')?first.slice('kanji:'.length):'';
}

function provenanceOf(item){
  const provenance=safeObject(item?.provenance);
  const source=text(provenance.source||item?.source,64);
  const version=text(provenance.sourceVersion,40);
  if(!source)return 'vocabulary';
  return version?source+'@'+version:source;
}

export function normalizeVocabularyEvidenceInput(item,input={}){
  const normalized=normalizeVocabularyItem(item);
  const contentId=text(normalized.contentId)||vocabularyContentId(normalized);
  if(!contentId)throw new Error('VOCABULARY_CONTENT_ID_REQUIRED');
  const outcome=input?.outcome==null?undefined:text(input.outcome,24);
  const evidence={
    mode:VOCABULARY_EVIDENCE_MODE,
    contentId,
    contentKind:'vocabulary',
    provenance:provenanceOf(normalized),
  };
  const character=text(input?.character,16)||firstLinkedKanji(normalized);
  if(character)evidence.character=character;
  if(outcome!==undefined)evidence.outcome=outcome;
  if(input?.selectedAnswer!=null)evidence.selectedAnswer=text(input.selectedAnswer,80);
  if(input?.independent!==undefined)evidence.independent=input.independent!==false;
  if(input?.recovery!==undefined)evidence.recovery=input.recovery===true;
  if(input?.attemptType!=null)evidence.attemptType=text(input.attemptType,32);
  return evidence;
}

export function vocabularyEvidenceAccuracy(record){
  const practice=Math.max(0,Number(record?.practiceCount)||0);
  const correct=Math.max(0,Number(record?.correctCount)||0);
  return practice?Math.max(0,Math.min(1,correct/practice)):null;
}

export function vocabularyRecentErrorRate(record){
  const practice=Math.max(0,Number(record?.practiceCount)||0);
  const wrong=Math.max(0,Number(record?.recentWrongCount)||0);
  return practice?Math.max(0,Math.min(1,wrong/practice)):0;
}

export function projectVocabularyLearning(item,record=null){
  const normalized=normalizeVocabularyItem(item);
  const state=VOCABULARY_EVIDENCE_STATES.includes(String(record?.state))?String(record.state):'unseen';
  return {
    schemaVersion:VOCABULARY_LEARNING_SCHEMA_VERSION,
    domain:'vocabulary',
    contentId:normalized.contentId,
    written:normalized.written,
    reading:normalized.reading,
    glosses:[...normalized.glosses],
    linkedKanji:[...normalized.linkedKanji],
    provenance:{...normalized.provenance},
    state,
    evidence:{
      exposureCount:Math.max(0,Number(record?.exposureCount)||0),
      practiceCount:Math.max(0,Number(record?.practiceCount)||0),
      correctCount:Math.max(0,Number(record?.correctCount)||0),
      wrongCount:Math.max(0,Number(record?.wrongCount)||0),
      recentWrongCount:Math.max(0,Number(record?.recentWrongCount)||0),
      independentPracticeCount:Math.max(0,Number(record?.independentPracticeCount)||0),
      recoveryCount:Math.max(0,Number(record?.recoveryCount)||0),
      currentStreak:Math.max(0,Number(record?.currentStreak)||0),
      lastOutcome:text(record?.lastOutcome,24),
      lastWrongAnswer:text(record?.lastWrongAnswer,80),
      updatedAt:text(record?.updatedAt,80),
    },
    accuracy:vocabularyEvidenceAccuracy(record),
    recentErrorRate:vocabularyRecentErrorRate(record),
  };
}

function assertVocabularyItem(item){
  const normalized=normalizeVocabularyItem(item);
  if(normalized.domain!=='vocabulary'||!normalized.contentId)throw new Error('INVALID_VOCABULARY_ITEM');
  return normalized;
}

export function createVocabularyEvidenceAdapter(store){
  if(!store||typeof store.get!=='function'||typeof store.recordExposure!=='function'||typeof store.recordOutcome!=='function')throw new TypeError('VOCABULARY_EVIDENCE_STORE_REQUIRED');

  const getRecord=(item)=>{
    const normalized=assertVocabularyItem(item);
    return store.get(VOCABULARY_EVIDENCE_MODE,normalized.contentId);
  };

  const readiness=(item)=>store.readiness(VOCABULARY_EVIDENCE_MODE,assertVocabularyItem(item).contentId);

  const expose=(item,input={})=>{
    const normalized=assertVocabularyItem(item);
    const payload=normalizeVocabularyEvidenceInput(normalized,input);
    return store.recordExposure(payload);
  };

  const outcome=(item,input={})=>{
    const normalized=assertVocabularyItem(item);
    const payload=normalizeVocabularyEvidenceInput(normalized,input);
    if(!payload.outcome)throw new Error('VOCABULARY_OUTCOME_REQUIRED');
    return store.recordOutcome(payload);
  };

  const select=(items)=>{
    const normalized=(Array.isArray(items)?items:[]).map(assertVocabularyItem);
    return store.selectContent(normalized,VOCABULARY_EVIDENCE_MODE,{idOf:item=>item.contentId||vocabularyContentId(item)});
  };

  const mistakes=(options={})=>store.listMistakes(options);

  return Object.freeze({
    schemaVersion:VOCABULARY_LEARNING_SCHEMA_VERSION,
    domain:'vocabulary',
    mode:VOCABULARY_EVIDENCE_MODE,
    get:getRecord,
    readiness,
    expose,
    outcome,
    select,
    mistakes,
    projectVocabularyLearning
  });
}
