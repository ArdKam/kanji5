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
      {id:2,text:'私は学校へ行きます。',owner:'jp-author',license:'CC BY 2.0 FR',translations:[[{id:202,text:'I go to school.',owner:'en-translator',license:'CC BY 2.0 FR'}]]},
      {id:1,text:'私は学校へ行きます。',owner:'jp-author',license:'CC BY 2.0 FR',translations:[[{id:201,text:'I go to school.',owner:'en-translator',license:'CC BY 2.0 FR'}]]},
      {id:3,text:'学ぶ。',owner:'jp-author',license:'CC0 1.0',translations:[[{id:203,text:'Learn.',owner:'en-translator',license:'CC BY 2.0 FR'}]]},
      {id:6,text:'学ぶ必要がある。',owner:'jp-author',license:'CC BY 2.0 FR',translations:[[{id:206,text:'This translation is not reusable.',owner:'blocked-translator',license:'PROBLEM'}]]},
      {id:4,text:'私は学へ行く。',translations:[[{text:'学へ行く。'}]]},
      {id:5,text:'I study.',translations:[[{text:'I study.'}]]}
    ]}),{status:200,headers:{'content-type':'application/json'}});
  }
  throw new Error('unexpected URL');
};
try{
  const network=await import('../v1.5-network.js?quality-test=1');
  const vocabularyResult=await network.fetchWordsResult('学');
  assert.equal(vocabularyResult.availability,'available');
  assert.deepEqual(vocabularyResult.items.map(x=>x.word),['学校','学ぶ']);
  const words=await network.fetchWords('学');
  assert.deepEqual(words.map(x=>x.word),['学校','学ぶ']);
  assert(words.every(x=>x.source==='kanjiapi.dev'));
  const sentences=await network.fetchContextSentences('学');
  assert(sentences.length>=2);
  assert(sentences.every(x=>x.source==='tatoeba'));
  assert(sentences.every(x=>x.text.includes('学')));
  const attributedSentence=sentences.find(x=>x.id===2);
  assert.equal(attributedSentence.sourceOwner,'jp-author');
  assert.equal(attributedSentence.sourceLicense,'CC BY 2.0 FR');
  assert.equal(attributedSentence.sourceUrl,'https://tatoeba.org/en/sentences/show/2');
  assert.equal(attributedSentence.translationId,202);
  assert.equal(attributedSentence.translationOwner,'en-translator');
  assert.equal(attributedSentence.translationLicense,'CC BY 2.0 FR');
  assert.equal(attributedSentence.translationUrl,'https://tatoeba.org/en/sentences/show/202');
  assert(!sentences.some(x=>x.id===6),'translation records marked PROBLEM must not be selected');
  const tatoebaCall=calls.find(url=>url.includes('api.tatoeba.org'));
  assert.equal(new URL(tatoebaCall).searchParams.get('license'),'CC BY 2.0 FR,CC0 1.0','the request should explicitly select reusable sentence licenses');
  const selectedWordA=network.selectWord(words);const selectedWordB=network.selectWord(words);
  assert.deepEqual(selectedWordA,selectedWordB);
  assert(words.some(x=>x.word===selectedWordA.word));
  const selectedContextA=network.selectContextSentence(sentences);const selectedContextB=network.selectContextSentence(sentences);
  assert.deepEqual(selectedContextA,selectedContextB);
  assert(sentences.some(x=>x.id===selectedContextA.id));

  globalThis.fetch=async()=>new Response(JSON.stringify([
    {variants:[{written:['学校'],pronounced:'がっこう'}],meanings:[{glosses:['school']}]},
    {variants:[{written:'学校',pronounced:['がっこう']}],meanings:[{glosses:['school']}]},
    {variants:[{written:'学ぶ',pronounced:'まなぶ'}],meanings:[{glosses:[{not:'a glossary string'}]}]}
  ]),{status:200,headers:{'content-type':'application/json'}});
  const malformedResult=await network.fetchWordsResult('学');
  assert.equal(malformedResult.availability,'available');
  assert.deepEqual(malformedResult.items,[],'array-valued written/reading fields and non-string glosses must not be coerced into vocabulary entries');

  globalThis.fetch=async()=>new Response(JSON.stringify([
    {variants:[{written:'日本',pronounced:'にほん'},{written:'日本',pronounced:'にっぽん'},{written:'日本',pronounced:'にほん'}],meanings:[{glosses:['Japan']} ]}
  ]),{status:200,headers:{'content-type':'application/json'}});
  const alternateReadings=await network.fetchWordsResult('日');
  assert.deepEqual(alternateReadings.items.map(({word,reading})=>[word,reading]),[['日本','にほん'],['日本','にっぽん']],
    'the same written form with distinct lexical readings must not be collapsed by the provider adapter');

  globalThis.fetch=async()=>new Response(JSON.stringify({error:'offline-content-unavailable'}),{status:503,headers:{'content-type':'application/json','X-Kanji5-Offline-Fallback':'1'}});
  assert.deepEqual(await network.fetchWordsResult('学'),{availability:'offline',items:[]});
  assert.deepEqual(await network.fetchWords('学'),[]);
  globalThis.fetch=async()=>new Response('[]',{status:200,headers:{'content-type':'application/json'}});
  assert.deepEqual(await network.fetchWordsResult('学'),{availability:'available',items:[]});
  globalThis.fetch=async()=>{throw new Error('offline')};
  assert.deepEqual(await network.fetchWordsResult('学'),{availability:'unavailable',items:[]});
  assert.deepEqual(await network.fetchWords('学'),[]);
  assert.deepEqual(await network.fetchContextSentences('学'),[]);
  assert(calls.length>=2);
  console.log('v1.9 network/content quality tests passed');
} finally {
  globalThis.fetch=originalFetch;
}
