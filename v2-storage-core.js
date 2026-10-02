(()=>{
'use strict';
if(window.__KANJI5_STORAGE__)return;
const backend=window.localStorage;
const adapter=Object.freeze({
  getItem(key){return backend.getItem(String(key));},
  setItem(key,value){backend.setItem(String(key),String(value));},
  removeItem(key){backend.removeItem(String(key));},
  key(index){return backend.key(index);},
  clear(){backend.clear();},
  get length(){return backend.length;}
});
window.__KANJI5_STORAGE__=adapter;
})();