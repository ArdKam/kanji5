import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('v2-observability.js','utf8');
assert.match(source,/kanji5-diagnostics-v1/);
assert.match(source,/uncaught-error/);
assert.match(source,/unhandled-rejection/);
assert.match(source,/asset-load-failure/);
assert.match(source,/release:buildId\(\)/);
assert.match(source,/browser:browser\(\)/);
assert.match(source,/platform/);
assert.match(source,/userAgent/);
assert.match(source,/dataAffected/);
assert.match(source,/slice\(-LIMIT\)/);
assert.doesNotMatch(source,/console\.log|console\.debug/);

const store=new Map();
const localStorage={
  getItem:key=>store.has(key)?store.get(key):null,
  setItem:(key,value)=>store.set(key,String(value)),
  removeItem:key=>store.delete(key),
};
const listeners=new Map();
const window={
  __KANJI5_OBSERVABILITY__:undefined,
  addEventListener:(type,listener)=>listeners.set(type,listener),
  matchMedia:()=>({matches:false}),
};
const document={
  documentElement:{lang:'fa'},
  querySelector:selector=>selector==='meta[name="kanji5-build-id"]'?{getAttribute:()=> 'r11-test-build'}:null,
};
const location={pathname:'/r11-test'};
const navigator={
  userAgent:'Mozilla/5.0 Chrome/154.0.0.0',
  platform:'Win32',
  onLine:false,
};
class Element {}
const context=vm.createContext({window,document,navigator,location,localStorage,Element,Error,Date,JSON,Object,String,Boolean,Number,Array,console});
vm.runInContext(source,context);
assert.equal(typeof window.__KANJI5_OBSERVABILITY__?.capture,'function');

const failure={name:'TypeError',message:'example failure'};
window.__KANJI5_OBSERVABILITY__.capture('sync-failure',failure,{dataAffected:'false',attempts:3});
const scriptTarget=Object.assign(Object.create(Element.prototype),{tagName:'SCRIPT',src:'/missing.js'});
listeners.get('error')?.({target:scriptTarget});
listeners.get('error')?.({error:failure,filename:'/app.js',lineno:12,columnno:4});
listeners.get('unhandledrejection')?.({reason:new Error('rejected')});

const entries=window.__KANJI5_OBSERVABILITY__.list();
assert.equal(entries.at(-1)?.type,'unhandled-rejection');
assert.equal(entries[0]?.release,'r11-test-build');
assert.equal(entries[0]?.browser,'Chrome');
assert.equal(entries[0]?.platform,'Win32');
assert.equal(entries[0]?.online,false);
assert.equal(entries[0]?.dataAffected,'false');
assert.ok(entries.some(entry=>entry.type==='asset-load-failure'));
assert.ok(entries.some(entry=>entry.type==='uncaught-error'));
assert.ok(entries.some(entry=>entry.type==='sync-failure'));

window.__KANJI5_OBSERVABILITY__.clear();
for(let i=0;i<40;i++)window.__KANJI5_OBSERVABILITY__.capture('bounded-test',new Error(String(i)));
assert.equal(window.__KANJI5_OBSERVABILITY__.list().length,24);
console.log('Kanji 5 observability runtime contract passed.');
