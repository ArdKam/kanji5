import assert from 'node:assert/strict';

const originalFetch=globalThis.fetch;
let calls=[];
globalThis.fetch=async url=>{
  calls.push(String(url));
  if(String(url).includes('kanjiapi.dev')){
    return new Response(JSON.stringify([
      {variants:[{written:'学校',pronounced:'がっこう'},{written:'一人',pronounced:'ひとり'}],meanings:[{glosses:['school']}]},
      {variants:[{written:'学ぶ',pronounced:'まなぶ'},{written:'学',pronounced:'がく'}],meanings:[{glosses:['to learn']}]},
      {variants:[{written:'abc',pronounced:'がく'}],meanings:[{glosses:['bad']}]}
    ]),{status:200,headers:{'content-type':'application/json'}});
  }
  if(String(url).includes('api.tatoeba.org')){
    return new Response(JSON.stringify({data:[
      {id:2,text:'私は学校へ行きます。',translations:[[{text:'I go to school.'}]]},
      {id:1,text:'私は学校へ行きます。',translations:[[{text:'I go to school.'}]]},
      {id:3,text:'学ぶ。',translations:[[{text:'Learn.'}]]},
      {id:4,text:'私は学へ行く。',translations:[[{text:'学へ行く。'}]]},
      {id:5,text:'I study.',translations:[[{text:'I study.'}]]}
    ]}),{status:200,headers:{'content-type':'application/json'}});
  }
  throw new Error('unexpected URL');
};
try{
  const network=await import('../v1.5-network.js?quality-test=1');
  const words=await network.fetchWords('学');
  assert.deepEqual(words.map(x=>x.word),['学校','学ぶ']);
  assert(words.every(x=>x.source==='kanjiapi.dev'));
  const sentences=await network.fetchContextSentences('学');
  assert(sentences.length>=2);
  assert(sentences.every(x=>x.source==='tatoeba'));
  assert(sentences.every(x=>x.text.includes('学')));
  const selectedWordA=network.selectWord(words);const selectedWordB=network.selectWord(words);
  assert.deepEqual(selectedWordA,selectedWordB);
  assert(words.some(x=>x.word===selectedWordA.word));
  const selectedContextA=network.selectContextSentence(sentences);const selectedContextB=network.selectContextSentence(sentences);
  assert.deepEqual(selectedContextA,selectedContextB);
  assert(sentences.some(x=>x.id===selectedContextA.id));

  globalThis.fetch=async()=>{throw new Error('offline')};
  assert.deepEqual(await network.fetchWords('学'),[]);
  assert.deepEqual(await network.fetchContextSentences('学'),[]);
  assert(calls.length>=2);
  console.log('v1.9 network/content quality tests passed');
} finally {
  globalThis.fetch=originalFetch;
}
