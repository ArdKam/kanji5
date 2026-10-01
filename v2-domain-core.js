export const DOMAIN_SCHEMA_VERSION=1;
export const DOMAINS=Object.freeze(['kanji','vocabulary','grammar']);

const MODE_DEFINITIONS=Object.freeze({
  meaning:Object.freeze({domain:'kanji',skill:'meaning',exercise:'free-recall'}),
  reading:Object.freeze({domain:'kanji',skill:'reading',exercise:'free-recall'}),
  production:Object.freeze({domain:'kanji',skill:'production',exercise:'recognition-choice'}),
  vocabulary:Object.freeze({domain:'kanji',skill:'word-completion',exercise:'word-completion'}),
  context:Object.freeze({domain:'kanji',skill:'context',exercise:'kanji-cloze'})
});

const text=(value,max=240)=>String(value??'').trim().slice(0,max);

export function isDomain(value){
  return DOMAINS.includes(String(value??'').trim().toLowerCase());
}

export function legacyEducationDefinition(mode){
  const key=String(mode??'').trim().toLowerCase();
  const definition=MODE_DEFINITIONS[key];
  if(!definition)throw new Error('UNSUPPORTED_KANJI5_LEARNING_MODE');
  return definition;
}

export function canonicalContentId(domain,sourceId){
  const d=String(domain??'').trim().toLowerCase();
  const source=text(sourceId,200);
  if(!isDomain(d))throw new Error('INVALID_KANJI5_DOMAIN');
  if(!source)throw new Error('KANJI5_CONTENT_ID_SOURCE_REQUIRED');
  const prefix=d+':';
  return source.startsWith(prefix)?source:prefix+source;
}

export function parseContentId(value){
  const raw=text(value,240);
  const index=raw.indexOf(':');
  if(index<=0)return Object.freeze({domain:null,sourceId:raw});
  const domain=raw.slice(0,index).toLowerCase();
  return Object.freeze({domain:isDomain(domain)?domain:null,sourceId:raw.slice(index+1)});
}

export function canonicalCardId({domain='kanji',contentId,skill='integrated',exercise='scheduled-review'}={}){
  const canonical=canonicalContentId(domain,contentId);
  const parsed=parseContentId(canonical);
  return `card:${parsed.domain||String(domain).toLowerCase()}:${text(parsed.sourceId,180)}:${text(skill,64)||'integrated'}:${text(exercise,64)||'scheduled-review'}`;
}

export function buildIdentity({domain='kanji',sourceId,contentId,cardId,skill='integrated',exercise='scheduled-review'}={}){
  const canonical=canonicalContentId(domain,contentId||sourceId);
  const parsed=parseContentId(canonical);
  const nextSkill=text(skill,64)||'integrated';
  const nextExercise=text(exercise,64)||'scheduled-review';
  return Object.freeze({
    identitySchemaVersion:DOMAIN_SCHEMA_VERSION,
    domain:parsed.domain||String(domain).toLowerCase(),
    contentId:canonical,
    cardId:cardId?text(cardId,240):canonicalCardId({domain,contentId:canonical,skill:nextSkill,exercise:nextExercise}),
    skill:nextSkill,
    exercise:nextExercise
  });
}
