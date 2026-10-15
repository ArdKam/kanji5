import assert from 'node:assert/strict';

const payload=[{variants:[{written:'学校',pronounced:'がっこう'}],meanings:[{glosses:['school','schoolhouse']}]}];
const payloadChanged=[{variants:[{written:'学校',pronounced:'がっこう'}],meanings:[{glosses:['school building','educational institution']}]}];
let current=payload;
globalThis.fetch=async()=>({ok:true,headers:{get:()=>null},json:async()=>current});
const network=await import('../v1.5-network.js?network-foundation-test=2');
const first=(await network.fetchWords('学'))[0];
assert(first);
assert.equal(first.domain,'vocabulary');
assert.equal(first.written,'学校');
assert.equal(first.reading,'がっこう');
assert.match(first.contentId,/^vocabulary:kanjiapi\.dev:[0-9a-f]{8}$/);
assert.equal(first.source,'kanjiapi.dev');
assert.deepEqual(first.linkedKanji,['kanji:学','kanji:校']);
current=payloadChanged;
const second=(await network.fetchWords('学'))[0];
assert(second);
assert.equal(first.contentId,second.contentId);
assert.equal(second.meaning,'school building; educational institution');

globalThis.fetch=async()=>({ok:true,headers:{get:()=>null},json:async()=>[]});
assert.deepEqual(await network.fetchWords('学'),[]);

globalThis.fetch=async()=>({ok:false,status:503,headers:{get:()=>null},json:async()=>[]});
await assert.rejects(network.fetchWords('学'),/Network request failed/);
globalThis.fetch=async()=>({ok:true,headers:{get:()=>null},json:async()=>({unexpected:true})});
await assert.rejects(network.fetchWords('学'),/INVALID_RESPONSE/);
globalThis.fetch=async()=>({ok:true,headers:{get:(name)=>name==='X-Kanji5-Offline-Fallback'?'1':null},json:async()=>[]});
await assert.rejects(network.fetchWords('学'),/OFFLINE_FALLBACK/);
globalThis.fetch=async()=>({ok:true,headers:{get:()=>null},json:async()=>{throw new SyntaxError('malformed JSON')}});
await assert.rejects(network.fetchWords('学'),/malformed JSON/);
globalThis.fetch=async()=>{throw new Error('offline')};
await assert.rejects(network.fetchWords('学'),/offline/);

console.log('p1 vocabulary network adapter: non-empty, empty and failure states passed');
