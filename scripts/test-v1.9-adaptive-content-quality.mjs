import assert from 'node:assert/strict';
import {contentDifficulty,selectAdaptiveContent} from '../v1.9-data-quality-core.js';

const target='学';
const easy={word:'学校',reading:'がっこう',meaning:'school'};
const hard={word:'学生生活',reading:'がくせいせいかつ',meaning:'student life'};
assert.ok(contentDifficulty(easy,target,'vocabulary') < contentDifficulty(hard,target,'vocabulary'));
assert.equal(selectAdaptiveContent([hard,easy],target,{kind:'vocabulary',attempts:1,accuracy:0}),easy);
assert.equal(selectAdaptiveContent([hard,easy],target,{kind:'vocabulary',attempts:6,accuracy:1}),hard);

const short={text:'学校へ行きます。',english:'I go to school.'};
const long={text:'学校へ行ったあとで友だちと図書館で長く勉強しました。',english:'After going to school, I studied for a long time at the library with my friend.'};
assert.ok(contentDifficulty(short,target,'context') < contentDifficulty(long,target,'context'));

console.log('adaptive content difficulty fixtures passed.');
