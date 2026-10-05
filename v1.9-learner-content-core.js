export const LEARNER_CONTENT_VERSION='1.0.0';

const text=(value,max=240)=>String(value??'').normalize('NFKC').replace(/[\\t\\r\\n]+/g,' ').trim().slice(0,max);
const uniq=values=>[...new Set((Array.isArray(values)?values:[]).map(value=>text(value)).filter(Boolean))];

// Source glosses are preserved verbatim outside this projection. These overrides only
// change learner priority for high-frequency or materially ambiguous entries.
const MEANING_PRIORITY_OVERRIDES=Object.freeze({
  '日':Object.freeze({primary:['day','sun'],secondary:['Japan']}),
  '一':Object.freeze({primary:['one'],reference:['one radical (no.1)']}),
  '会':Object.freeze({primary:['meet','meeting'],secondary:['party']}),
  '生':Object.freeze({primary:['life','birth','live'],secondary:['student'],reference:['raw','uncooked']}),
  '行':Object.freeze({primary:['go','conduct'],secondary:['travel','line']}),
  '前':Object.freeze({primary:['front','before'],secondary:['in front']}),
  '後':Object.freeze({primary:['behind','after'],secondary:['later']}),
  '入':Object.freeze({primary:['enter','insert'],secondary:['put in']}),
  '出':Object.freeze({primary:['exit','leave'],secondary:['come out','put out']}),
  '家':Object.freeze({primary:['house','home'],secondary:['family','professional']}),
  '題':Object.freeze({primary:['topic','subject'],secondary:['title','question']}),
  '勝':Object.freeze({primary:['win','victory'],secondary:['prevail']}),
  '機':Object.freeze({primary:['machine','opportunity'],secondary:['occasion']}),
  '議':Object.freeze({primary:['discussion','deliberation'],secondary:['debate']}),
});

const REFERENCE_MEANING_PATTERNS=Object.freeze([
  /\\bradical\\b/i,
  /\\bno\\.?\\s*\\d+/i,
  /\\bcounter\\b/i,
  /\\bclassifier\\b/i,
  /\\bsuffix\\b/i,
  /\\bprefix\\b/i,
  /\\bvariant\\b/i,
  /\\barchaic\\b/i,
  /\\bobsolete\\b/i,
]);

function referenceLike(value){return REFERENCE_MEANING_PATTERNS.some(pattern=>pattern.test(value));}

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
    readings:Object.freeze({coreOn:Object.freeze(coreOn),coreKun:Object.freeze(coreKun),vocabularySupported:Object.freeze(vocabularySupported),referenceOn:Object.freeze(referenceOn),referenceKun:Object.freeze(referenceKun)})
  });
}

export function learnerPrimaryMeanings(source){return buildLearnerContent(source).meanings.primary;}
export function learnerCoreReadings(source){const model=buildLearnerContent(source);return [...model.readings.coreOn,...model.readings.coreKun];}
export function learnerContentPolicy(){return Object.freeze({version:LEARNER_CONTENT_VERSION,primaryMeaningPolicy:'first 1–2 non-reference source glosses unless a curated ambiguity override exists',secondaryMeaningPolicy:'next common learner-useful non-reference glosses',referenceMeaningPolicy:'radical/counter/affix/variant/archaic-style glossary entries remain available as reference',coreReadingPolicy:'first source on-yomi and kun-yomi are core unless explicit vocabulary-supported targets are provided',referenceReadingPolicy:'remaining source readings stay reference-only until supported by learner-priority evidence'});}
