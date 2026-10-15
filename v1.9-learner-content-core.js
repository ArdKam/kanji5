export const LEARNER_CONTENT_VERSION='1.0.0';

const text=(value,max=240)=>String(value??'').normalize('NFKC').replace(/[\t\r\n]+/g,' ').trim().slice(0,max);
const uniq=values=>[...new Set((Array.isArray(values)?values:[]).map(value=>text(value)).filter(Boolean))];

// Source glosses are preserved verbatim outside this projection. These overrides only
// change learner priority for high-frequency or materially ambiguous entries.
const MEANING_PRIORITY_OVERRIDES=Object.freeze({
  '日':Object.freeze({primary:['day','sun'],secondary:['Japan']}),
  '一':Object.freeze({primary:['one'],reference:['one radical (no.1)']}),
  '会':Object.freeze({primary:['meet','meeting'],secondary:['party']}),
  '生':Object.freeze({primary:['life','birth'],secondary:['genuine']}),
  '行':Object.freeze({primary:['going','journey'],secondary:['carry out']}),
  '前':Object.freeze({primary:['in front','before']}),
  '後':Object.freeze({primary:['behind','later'],secondary:['back']}),
  '入':Object.freeze({primary:['enter','insert']}),
  '出':Object.freeze({primary:['exit','leave'],secondary:['go out']}),
  '家':Object.freeze({primary:['house','home'],secondary:['family']}),
  '題':Object.freeze({primary:['topic','subject']}),
  '勝':Object.freeze({primary:['win','victory'],secondary:['prevail']}),
  '機':Object.freeze({primary:['machine'],secondary:['mechanism','loom']}),
  '議':Object.freeze({primary:['debate','consultation'],secondary:['deliberation']}),
  '中':Object.freeze({primary:['middle','inside'],secondary:['in']}),
  '本':Object.freeze({primary:['book','main'],secondary:['present']}),
  '舞':Object.freeze({primary:['dance'],secondary:['flit','circle']}),
  '優':Object.freeze({primary:['tenderness','excel'],secondary:['surpass']}),
  '減':Object.freeze({primary:['decrease','reduce'],secondary:['dwindle']}),
  '陸':Object.freeze({primary:['land'],reference:['six']}),
  '塔':Object.freeze({primary:['pagoda','tower'],secondary:['steeple']}),
  '張':Object.freeze({primary:['stretch','spread'],reference:['counter for bows & stringed instruments']}),
  '杯':Object.freeze({primary:['glass','wine glass'],reference:['counter for cupfuls']}),
  '箇':Object.freeze({reference:['counter for articles']}),
});

const REFERENCE_MEANING_PATTERNS=Object.freeze([
  /\bradical\b/i,
  /\bno\\.?\s*\\d+/i,
  /\bcounter\b/i,
  /\bclassifier\b/i,
  /\bsuffix\b/i,
  /\bprefix\b/i,
  /\bvariant\b/i,
  /\barchaic\b/i,
  /\bobsolete\b/i,
]);

function referenceLike(value){return REFERENCE_MEANING_PATTERNS.some(pattern=>pattern.test(value));}

const MEANING_LANGUAGES=new Set(['en','fa','ja','unknown']);
const MEANING_PRIORITIES=new Set(['primary','secondary','reference']);
const MEANING_REVIEW_STATES=new Set(['verified','unreviewed','rejected','unavailable']);
function normalizeMeaningRecord(record){
  const value=record&&typeof record==='object'?record:{};
  const sourceText=text(value.text??value.translation,240);
  const language=MEANING_LANGUAGES.has(value.language)?value.language:'unknown';
  const priority=MEANING_PRIORITIES.has(value.priority)?value.priority:'secondary';
  const provenance=value.provenance&&typeof value.provenance==='object'?value.provenance:{};
  const source=text(provenance.source||value.source||'unknown',180)||'unknown';
  const version=text(provenance.version||value.sourceVersion,100)||null;
  const entryId=text(provenance.entryId||value.sourceEntryId,160)||null;
  const url=text(provenance.url||value.sourceUrl,500)||null;
  const requestedReview=MEANING_REVIEW_STATES.has(value.reviewStatus)?value.reviewStatus:'unreviewed';
  const reviewedBy=text(value.reviewedBy,120)||null;
  const reviewedAt=text(value.reviewedAt,80)||null;
  const canVerify=Boolean(sourceText&&language!=='unknown'&&source!=='unknown'&&reviewedBy&&reviewedAt);
  const reviewStatus=requestedReview==='verified'&&!canVerify?'unreviewed':requestedReview;
  const reviewNotes=text(value.reviewNotes,600)||(
    reviewStatus==='unreviewed'?'Translation and learner-facing priority have not been independently reviewed.':''
  );
  if(!sourceText&&reviewStatus!=='unavailable')return null;
  return Object.freeze({
    text:sourceText||null,
    language,
    priority,
    provenance:Object.freeze({source,version,entryId,url}),
    reviewStatus,
    reviewNotes,
    reviewedBy:reviewStatus==='verified'?reviewedBy:null,
    reviewedAt:reviewStatus==='verified'?reviewedAt:null
  });
}
function meaningPriority(meaning,primary,secondary,reference){
  if(primary.includes(meaning))return 'primary';
  if(secondary.includes(meaning))return 'secondary';
  if(reference.includes(meaning))return 'reference';
  return 'secondary';
}
function meaningRecordProjection(value,sourceMeanings,primary,secondary,reference){
  const explicit=(Array.isArray(value.meaningRecords)?value.meaningRecords:[]).map(normalizeMeaningRecord).filter(Boolean);
  const keys=new Set(explicit.filter(record=>record.text).map(record=>record.text+'|'+record.language));
  const provenance=value.meaningProvenance&&typeof value.meaningProvenance==='object'?value.meaningProvenance:{};
  const source=text(provenance.source||value.meaningSource||'unknown',180)||'unknown';
  const version=text(provenance.version||value.meaningSourceVersion,100)||null;
  const records=[...explicit];
  for(const meaning of sourceMeanings){
    const language=MEANING_LANGUAGES.has(value.meaningLanguage)?value.meaningLanguage:'unknown';
    const key=meaning+'|'+language;
    if(keys.has(key))continue;
    keys.add(key);
    records.push(normalizeMeaningRecord({
      text:meaning,
      language,
      priority:meaningPriority(meaning,primary,secondary,reference),
      provenance:{source,version,entryId:text(provenance.entryId,160)||null,url:text(provenance.url,500)||null},
      reviewStatus:'unreviewed',
      reviewNotes:'Legacy source gloss; translation and learner-facing priority have not been independently reviewed.'
    }));
  }
  return Object.freeze(records.filter(Boolean));
}

export function buildLearnerContent(source={}){
  const value=source&&typeof source==='object'?source:{};
  const character=text(value.character||value.id,16);
  const sourceMeanings=uniq(value.meanings||value.meaning);
  const override=character&&MEANING_PRIORITY_OVERRIDES[character];
  let primary=[]; let secondary=[]; let reference=[];
  if(override){
    primary=uniq(override.primary);
    secondary=uniq(override.secondary);
    reference=uniq(override.reference);
    const assigned=new Set([...primary,...secondary,...reference]);
    for(const meaning of sourceMeanings){
      if(assigned.has(meaning))continue;
      if(referenceLike(meaning))reference.push(meaning);
      else secondary.push(meaning);
    }
  }else{
    const nonReference=sourceMeanings.filter(meaning=>!referenceLike(meaning));
    primary=nonReference.slice(0,Math.min(2,nonReference.length));
    secondary=nonReference.slice(primary.length,Math.min(nonReference.length,5));
    reference=sourceMeanings.filter(meaning=>referenceLike(meaning)||!nonReference.includes(meaning));
  }
  const meaningRecords=meaningRecordProjection(value,sourceMeanings,primary,secondary,reference);
  const sourceOn=uniq(value.on); const sourceKun=uniq(value.kun);
  const vocabularySupported=uniq(value.vocabularySupportedReadings);
  const coreOn=uniq(value.coreOn?.length?value.coreOn:sourceOn.slice(0,1));
  const coreKun=uniq(value.coreKun?.length?value.coreKun:sourceKun.slice(0,1));
  const referenceOn=sourceOn.filter(reading=>!coreOn.includes(reading)&&!vocabularySupported.includes(reading));
  const referenceKun=sourceKun.filter(reading=>!coreKun.includes(reading)&&!vocabularySupported.includes(reading));
  return Object.freeze({
    version:LEARNER_CONTENT_VERSION,
    character,
    sourceMeanings,
    meanings:Object.freeze({primary:Object.freeze(uniq(primary)),secondary:Object.freeze(uniq(secondary)),reference:Object.freeze(uniq(reference))}),
    meaningRecords,
    readings:Object.freeze({coreOn:Object.freeze(coreOn),coreKun:Object.freeze(coreKun),vocabularySupported:Object.freeze(vocabularySupported),referenceOn:Object.freeze(referenceOn),referenceKun:Object.freeze(referenceKun)})
  });
}

export function learnerPrimaryMeanings(source){return buildLearnerContent(source).meanings.primary;}
export function learnerCoreReadings(source){const model=buildLearnerContent(source);return [...model.readings.coreOn,...model.readings.coreKun];}
export function learnerContentPolicy(){return Object.freeze({version:LEARNER_CONTENT_VERSION,primaryMeaningPolicy:'first 1–2 non-reference source glosses unless a curated ambiguity override exists',secondaryMeaningPolicy:'next common learner-useful non-reference glosses',referenceMeaningPolicy:'radical/counter/affix/variant/archaic-style glossary entries remain available as reference',coreReadingPolicy:'first source on-yomi and kun-yomi are core unless explicit vocabulary-supported targets are provided',referenceReadingPolicy:'remaining source readings stay reference-only until supported by learner-priority evidence'});}

const JAPANESE_TEXT=/[\u3040-\u30ff\u3400-\u9fff]/;
const KANA=/^[\u3040-\u30ffー・]+$/;
function exampleQuality(example,character){const word=text(example?.word,120),reading=text(example?.reading,120),meaning=text(example?.meaning,240);if(!word||!reading||!meaning||!character||!word.includes(character)||[...word].length<2||!JAPANESE_TEXT.test(word)||!KANA.test(reading))return null;const supportedLanguage=['en','fa','ja'].includes(example?.meaningLanguage)?example.meaningLanguage:'unknown';const source=text(example?.source||example?.provenance?.source,100)||'unknown';const sourceVersion=text(example?.sourceVersion||example?.provenance?.sourceVersion,80)||null;const requestedReview=String(example?.reviewStatus||'').trim();const reviewStatus=['verified','unreviewed'].includes(requestedReview)?requestedReview:(source!=='unknown'?'unreviewed':'unknown');const otherKanji=[...word].filter(ch=>/[\u3400-\u9fff]/.test(ch)&&ch!==character).length;const score=otherKanji*12+Math.max(0,[...word].length-4)*1.5+Math.max(0,[...reading].length-6)*0.3;return{word,reading,meaning,meaningLanguage:supportedLanguage,source,sourceVersion,reviewStatus,score};}
export function selectLearnerExamples(examples,character,limit=6){const rows=[];const seen=new Set();for(const example of Array.isArray(examples)?examples:[]){const quality=exampleQuality(example,character);if(!quality)continue;const key=quality.word+'|'+quality.reading; if(seen.has(key))continue;seen.add(key);rows.push(quality)}rows.sort((a,b)=>a.score-b.score||a.word.localeCompare(b.word)||a.reading.localeCompare(b.reading));return rows.slice(0,Math.max(0,Math.min(6,Number(limit)||0))).map(({word,reading,meaning,meaningLanguage,source,sourceVersion,reviewStatus})=>({word,reading,meaning,meaningLanguage,source,sourceVersion,reviewStatus}));}
