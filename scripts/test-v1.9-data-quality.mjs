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
assert.equal(v.rejected.length,1,'malformed/empty vocabulary should be rejected');
assert.equal(validateVocabularyEntry({word:'学校',reading:'gakkou',meaning:'school'},'学').valid,false,'romaji-only reading is invalid for KanjiAPI content');
assert.equal(selectDeterministic(v.items,x=>x.word)?.word,'学校');

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
assert.equal(selectDeterministic(c.items,x=>String(x.id))?.id,1,'selection must be deterministic');
assert.equal(safeContentFallback(['vocabulary','context'],['meaning','context']),'context');
assert.equal(safeContentFallback(['vocabulary'],['meaning','reading','production']),'meaning');
assert.equal(safeContentFallback(['vocabulary'],[]),null);
console.log('v1.9 data-quality tests passed');
