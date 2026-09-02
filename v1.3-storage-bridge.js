(()=>{
  'use strict';
  const key='kanji5-deck';
  const get=Storage.prototype.getItem;
  const set=Storage.prototype.setItem;
  const deck=()=>window.__KANJI5_P0_DATA;
  let serializedDeck='';
  let serializedSource=null;
  const serialized=()=>{
    const data=deck();
    if(Array.isArray(data)&&data.length===2136){
      if(data!==serializedSource){
        try{serializedDeck=JSON.stringify(data);serializedSource=data}catch(_){}
      }
      return serializedDeck;
    }
    return '';
  };
  Storage.prototype.getItem=function(k){
    if(k===key){
      const value=serialized();
      if(value)return value;
    }
    return get.call(this,k);
  };
  Storage.prototype.setItem=function(k,v){
    if(k===key&&typeof v==='string'&&v.length){
      serializedDeck=v;
      serializedSource=null;
    }
    return set.call(this,k,v);
  };
})();
