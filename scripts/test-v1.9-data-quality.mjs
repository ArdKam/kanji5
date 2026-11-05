import assert from 'node:assert/strict';
import { validateVocabularyEntry, validateVocabularyList, validateContextSentence, validateContextList, selectDeterministic, safeContentFallback, DATA_QUALITY_VERSION } from '../v1.9-data-quality-core.js';

const vocabulary=[
  {word:'学校',reading:'がっこう',meaning:'school'},
  {word:'学ぶ',reading:'まなぶ',meaning:'to learn'},
  {word:'学',reading:'',meaning:'study'},
  {word:'学校',reading:'がっこう',meaning:'school'},
  {word:'abc',reading:'がく',meaning:'bad target'}
];
const v=validateVocabularyList(vocabulary,'学');
assert.equal(v.version,DATA_QUALITY_VERSION);
assert.equal(v.items.length,2,'valid vocabulary should be retained and exact duplicates removed');
assert.equal(v.rejected.length,2,'both malformed candidates should be rejected');
assert(v.rejected.every(x=>Array.isArray(x.reasons)&&x.reasons.length>0));
assert.equal(validateVocabularyEntry({word:'学校',reading:'gakkou',meaning:'school'},'学').valid,false,'romaji-only reading is invalid for KanjiAPI content');
assert.equal(validateVocabularyEntry({word:'学校',reading:'がっこう',meaning:'school'},'学').valid,true,'kana-only readings should remain valid');
assert.equal(validateVocabularyEntry({word:'学校',reading:'ガッコウ',meaning:'school'},'学').valid,true,'katakana-only readings should remain valid');
const invalidTypedVocabulary = validateVocabularyEntry({word:['学校'],reading:'がっこう',meaning:{}},'学');
assert.equal(invalidTypedVocabulary.valid,false,'non-string vocabulary fields must not be coerced into apparently valid text');
assert(invalidTypedVocabulary.reasons.includes('invalid_word_type'));
assert(invalidTypedVocabulary.reasons.includes('invalid_meaning_type'));
const invalidTypedReading = validateVocabularyEntry({word:'学校',reading:['がっこう'],meaning:'school'},'学');
assert.equal(invalidTypedReading.valid,false,'array readings must not be coerced into kana strings');
assert(invalidTypedReading.reasons.includes('invalid_reading_type'));
assert.equal(validateVocabularyEntry({word:'学校',reading:'gakkouがっこう',meaning:'school'},'学').valid,false,'mixed romaji and kana must not pass the reading gate');
assert.equal(validateVocabularyEntry({word:'学校',reading:'がっこうabc',meaning:'school'},'学').valid,false,'Latin contamination after kana must not pass the reading gate');
assert.equal(validateVocabularyEntry({word:'学校',reading:'学校',meaning:'school'},'学').valid,false,'kanji-only strings are not valid kana readings');
assert.equal(selectDeterministic(v.items,x=>x.word)?.word,'学ぶ','selection must follow the documented stable lexical ordering');

const contexts=[
  {id:2,text:'私は学校へ行きます。',english:'I go to school.'},
  {id:1,text:'学校。',english:'School.'},
  {id:3,text:'私は学へ行く',english:''},
  {id:4,text:'I study',english:'I study'}
];
const c=validateContextList(contexts,'学');
assert.equal(c.items.length,2);
assert.equal(c.rejected.length,2);
assert.equal(validateContextSentence({text:'私は学校へ行きます。',english:'学校へ行きます。'},'学').valid,false,'translation must contain usable English text');
const invalidTypedSentence = validateContextSentence({text:['私は学校へ行きます。'],english:'I go to school.'},'学');
assert.equal(invalidTypedSentence.valid,false,'array sentences must not be coerced into Japanese text');
assert(invalidTypedSentence.reasons.includes('invalid_text_type'));
const invalidTypedTranslation = validateContextSentence({text:'私は学校へ行きます。',english:{}},'学');
assert.equal(invalidTypedTranslation.valid,false,'object translations must not pass the Latin-character check after coercion');
assert(invalidTypedTranslation.reasons.includes('invalid_translation_type'));
assert.equal(selectDeterministic(c.items,x=>String(x.id))?.id,1,'selection must be deterministic');
assert.equal(safeContentFallback(['vocabulary','context'],['meaning','context']),'context');
assert.equal(safeContentFallback(['vocabulary'],['meaning','reading','production']),'meaning');
assert.equal(safeContentFallback(['vocabulary'],[]),null);
console.log('v1.9 data-quality tests passed');
