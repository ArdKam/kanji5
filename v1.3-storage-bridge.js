(()=>{
  'use strict';
  const deckKey='kanji5-deck';
  const stateKey='kanji5-v1';
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
  const compactState=value=>{
    if(typeof value!=='string'||!value)return value;
    try{
      const state=JSON.parse(value);
      if(!state||typeof state!=='object')return value;
      delete state.deck;
      if(Array.isArray(state.reviews)&&state.reviews.length>5000)state.reviews=state.reviews.slice(-5000);
      return JSON.stringify(state);
    }catch(_){return value}
  };
  Storage.prototype.getItem=function(k){
    if(k===deckKey){
      const value=serialized();
      if(value)return value;
    }
    return get.call(this,k);
  };
  Storage.prototype.setItem=function(k,v){
    if(k===deckKey&&typeof v==='string'&&v.length){
      serializedDeck=v;
      serializedSource=null;
    }
    if(k===stateKey)v=compactState(v);
    return set.call(this,k,v);
  };
})();
