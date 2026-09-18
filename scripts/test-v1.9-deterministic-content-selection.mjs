import assert from 'node:assert/strict';

const network=await import('../v1.5-network.js');

const words=[
  {word:'学校',reading:'がっこう',meaning:'school',source:'kanjiapi.dev'},
  {word:'学年',reading:'がくねん',meaning:'school year',source:'kanjiapi.dev'}
];
const contexts=[
  {id:'2',text:'学校へ行きます。',english:'I go to school.',source:'tatoeba'},
  {id:'1',text:'学ぶことは大切です。',english:'Learning is important.',source:'tatoeba'}
];

assert.deepEqual(network.selectWord(words),words[0]);
assert.deepEqual(network.selectWord(words),words[0]);
assert.deepEqual(network.selectContextSentence(contexts),contexts[1]);
assert.deepEqual(network.selectContextSentence(contexts),contexts[1]);

console.log('deterministic content selection tests passed.');
