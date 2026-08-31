(()=>{
  'use strict';
  const key='kanji5-deck';
  const get=Storage.prototype.getItem;
  const set=Storage.prototype.setItem;
  const deck=()=>window.__KANJI5_P0_DATA;
  Storage.prototype.getItem=function(k){
    if(k===key){
      const data=deck();
      if(Array.isArray(data)&&data.length===2136)return JSON.stringify(data);
    }
    return get.call(this,k);
  };
  Storage.prototype.setItem=function(k,v){
    if(k===key)return;
    return set.call(this,k,v);
  };
})();
