import assert from 'node:assert/strict';

const payload=[
  {
    variants:[{written:'学校',pronounced:'がっこう'}],
    meanings:[{glosses:['school','schoolhouse']}]
  }
];
const payloadChanged=[
  {
    variants:[{written:'学校',pronounced:'がっこう'}],
    meanings:[{glosses:['school building','educational institution']}]
  }
];

let current=payload;
globalThis.fetch=async()=>({ok:true,json:async()=>current});
const network=await import('../v1.5-network.js?network-foundation-test=1');

const first=(await network.fetchWords('学'))[0];
assert(first);
assert.equal(first.domain,'vocabulary');
assert.equal(first.written,'学校');
assert.equal(first.reading,'がっこう');
assert.match(first.contentId,/^vocabulary:kanjiapi\.dev:[0-9a-f]{8}$/);
assert.deepEqual(first.linkedKanji,['kanji:学','kanji:校']);

current=payloadChanged;
const second=(await network.fetchWords('学'))[0];
assert(second);
assert.equal(first.contentId,second.contentId);
assert.equal(second.meaning,'school building; educational institution');

globalThis.fetch=async()=>{throw new Error('offline')};
assert.deepEqual(await network.fetchWords('学'),[]);
console.log('p1 vocabulary network adapter: all assertions passed');
