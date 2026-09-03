import fs from 'node:fs';

const data=JSON.parse(fs.readFileSync('kanji-data.json','utf8'));
const items=Array.isArray(data)?data:data.kanji;
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
const kana=/^[ぁ-ゖァ-ヺー・.・\-]+$/;
const badLatin=/[A-Za-z]/;

assert(Array.isArray(items)&&items.length===2136,'Runtime dataset must contain exactly 2136 items');
const ids=new Set();
for(const item of items){
  assert(item&&typeof item.character==='string'&&item.character.length>0,`Invalid character entry: ${JSON.stringify(item)}`);
  assert(!ids.has(item.character),`Duplicate character: ${item.character}`); ids.add(item.character);
  for(const kind of ['on','kun']){
    const values=item[kind];
    assert(Array.isArray(values),`${kind} must be an array for ${item.character}`);
    const seen=new Set();
    for(const raw of values){
      const reading=String(raw||'').trim();
      assert(reading,`Empty ${kind} reading for ${item.character}`);
      assert(!badLatin.test(reading),`Latin characters found in ${kind} reading for ${item.character}: ${reading}`);
      assert(kana.test(reading),`Unexpected ${kind} reading format for ${item.character}: ${reading}`);
      const normalized=reading.normalize('NFKC');
      assert(!seen.has(normalized),`Duplicate ${kind} reading for ${item.character}: ${reading}`);
      seen.add(normalized);
    }
  }
  const all=[...(item.on||[]),...(item.kun||[])].map(String);
  assert(new Set(all.map(v=>v.normalize('NFKC'))).size===all.length,`Duplicate reading across on/kun for ${item.character}`);
}

// Compound/example readings must remain source-provided rather than being inferred
// from individual Kanji readings. The runtime example pipeline stores `word` + `reading`.
const index=fs.readFileSync('index.html','utf8');
assert(index.includes("v.pronounced||''"),'Example readings must come from the dictionary/API pronunciation field');
assert(index.includes('candidates.push({word:term,reading})'),'Example pipeline must preserve the source pronunciation');
assert(index.includes("seen.has(term+'|'+reading)"),'Example words/readings must be deduplicated by the pair');

console.log('Kanji 5 v1.5 canonical reading validation passed.');
