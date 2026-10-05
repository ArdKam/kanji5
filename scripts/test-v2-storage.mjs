import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const adapterSource=fs.readFileSync('v2-storage-core.js','utf8');
const stateSource=fs.readFileSync('v1.5-state.js','utf8');
const indexSource=fs.readFileSync('index.html','utf8');
const syncSource=fs.readFileSync('supabase-sync.js','utf8');
const bootstrapSource=fs.readFileSync('app-bootstrap.js','utf8');
const deckSource=fs.readFileSync('v1.3-p0.js','utf8');
const reviewRuntimeSource=fs.readFileSync('review-runtime.js','utf8');

class MemoryStorage {
  constructor(){this.map=new Map();}
  getItem(key){return this.map.has(String(key))?this.map.get(String(key)):null;}
  setItem(key,value){this.map.set(String(key),String(value));}
  removeItem(key){this.map.delete(String(key));}
  key(index){return [...this.map.keys()][Number(index)]??null;}
  clear(){this.map.clear();}
  get length(){return this.map.size;}
}

const backend=new MemoryStorage();
const context=vm.createContext({window:{localStorage:backend},localStorage:backend});
vm.runInContext(adapterSource,context,{filename:'v2-storage-core.js'});
const storage=context.window.__KANJI5_STORAGE__;
assert.ok(storage);
storage.setItem(42,99);
assert.equal(backend.getItem('42'),'99');
assert.equal(storage.getItem(42),'99');
assert.equal(storage.key(0),'42');
assert.equal(storage.length,1);
storage.removeItem(42);
assert.equal(storage.length,0);

for(const [label,source] of [['state',stateSource],['sync',syncSource],['bootstrap',bootstrapSource],['deck',deckSource]]){
  assert.match(source,/const storage=window\.__KANJI5_STORAGE__\|\|localStorage;/,label+' must resolve the storage seam');
  assert.doesNotMatch(source,/localStorage\.(getItem|setItem|removeItem|clear|key)\(/,label+' has direct storage access');
}
assert.match(reviewRuntimeSource,/const storage=window\.__KANJI5_STORAGE__;/,'review runtime must resolve the storage seam');
assert.doesNotMatch(reviewRuntimeSource,/localStorage\.(getItem|setItem|removeItem|clear|key)\(/,'review runtime has direct storage access');
assert.match(indexSource,/v2-storage-core\.js[\s\S]*v1\.5-state\.js/);
console.log('Kanji 5 domain-neutral storage adapter contract passed.');
