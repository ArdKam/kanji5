import assert from 'node:assert/strict';
import { RELATIONSHIP_SCHEMA_VERSION, canonicalRelationship, buildVocabularyKanjiRelations, buildVocabularyContextRelations } from '../v2-relationship-core.js';

const relation=canonicalRelationship({
  fromDomain:'vocabulary',
  fromContentId:'vocabulary:kanjiapi.dev:abc',
  toDomain:'kanji',
  toContentId:'kanji:学',
  kind:'vocabulary-kanji',
  sourceVersion:'kanjiapi-1'
});
assert.equal(RELATIONSHIP_SCHEMA_VERSION,1);
assert.equal(relation.schemaVersion,1);
assert.equal(relation.fromContentId,'vocabulary:kanjiapi.dev:abc');
assert.equal(relation.toContentId,'kanji:学');
assert.equal(relation.sourceVersion,'kanjiapi-1');

const item={contentId:'vocabulary:kanjiapi.dev:abc',written:'学校',linkedKanji:['kanji:学','kanji:校','kanji:学'],provenance:{sourceVersion:'v1'}};
assert.deepEqual(buildVocabularyKanjiRelations(item).map(x=>x.toContentId),['kanji:学','kanji:校']);

const contexts=[
  {contentId:'context:tatoeba:1',text:'学校へ行く。',sourceVersion:'t1'},
  {contentId:'context:tatoeba:2',text:'学生です。',sourceVersion:'t1'},
  {contentId:'context:tatoeba:3',text:'学校で勉強する。',sourceVersion:'t1'}
];
const links=buildVocabularyContextRelations(item,contexts);
assert.deepEqual(links.map(x=>x.toContentId),['context:tatoeba:1','context:tatoeba:3']);
assert.equal(links[0].kind,'vocabulary-context');
assert.equal(links[0].sourceVersion,'t1');

assert.throws(()=>canonicalRelationship({fromDomain:'audio',fromContentId:'x',toDomain:'kanji',toContentId:'kanji:学',kind:'vocabulary-kanji'}));

console.log('Kanji 5 D3 relationship contract passed.');
