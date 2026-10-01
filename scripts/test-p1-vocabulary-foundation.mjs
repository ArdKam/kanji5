import assert from 'node:assert/strict';

const core=await import('../v2-vocabulary-core.js');

const first=core.normalizeVocabularyItem({word:'学校',reading:'がっこう',meaning:'school; schoolhouse',source:'kanjiapi.dev'});
const second=core.normalizeVocabularyItem({word:'学校',reading:'がっこう',meaning:'school building',source:'kanjiapi.dev'});
assert.equal(first.domain,'vocabulary');
assert.equal(first.contentId,second.contentId,'vocabulary identity must not change when glosses change');
assert.deepEqual(first.linkedKanji,['kanji:学','kanji:校']);
assert.deepEqual(first.glosses,['school','schoolhouse']);
assert.equal(first.word,'学校');
assert.equal(first.meaning,'school; schoolhouse');
assert.equal(first.source,'kanjiapi.dev');
assert.equal(first.provenance.source,'kanjiapi.dev');

const sourced=core.normalizeVocabularyItem({id:'jm:12345',word:'日本語',reading:'にほんご',meaning:'Japanese language',source:'jmdict',sourceVersion:'2026-01'});
assert.equal(sourced.contentId,'vocabulary:jmdict:jm:12345');
assert.equal(sourced.provenance.sourceVersion,'2026-01');

const list=core.normalizeVocabularyList([
  {word:'食べる',reading:'たべる',meaning:'to eat'},
  {word:'食べる',reading:'たべる',meaning:'eat'},
  {word:'飲む',reading:'のむ',meaning:'to drink'},
  {word:'',reading:'のむ',meaning:'invalid'}
]);
assert.equal(list.items.length,2);
assert.equal(list.rejected.length,1);
assert(core.vocabularyRelatesToKanji(list.items[0],'食'));
assert.equal(core.filterVocabularyByKanji(list.items,'飲').length,1);
assert(!core.vocabularyRelatesToKanji(list.items[0],'校'));

const invalid=core.validateVocabularyItem({schemaVersion:1,domain:'vocabulary',contentId:'vocabulary:x',written:'学',reading:'',glosses:[]});
assert.equal(invalid.valid,false);
assert(invalid.reasons.includes('missing_reading'));
assert(invalid.reasons.includes('missing_glosses'));

const hashA=core.stableVocabularyHash('学校|がっこう');
const hashB=core.stableVocabularyHash('学校|がっこう|school');
assert.notEqual(hashA,hashB);
console.log('p1 vocabulary foundation: all assertions passed');
