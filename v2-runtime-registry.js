(()=>{ 
'use strict';
if(window.__KANJI5_RUNTIME__)return;
const slots=Object.create(null);
const R={
  version:1,
  register(name,value){if(!name)throw new TypeError('runtime registry key is required');slots[String(name)]=value;return value},
  get(name){return slots[String(name)]??null},
  has(name){return Object.prototype.hasOwnProperty.call(slots,String(name))},
  remove(name){delete slots[String(name)]}
};
window.__KANJI5_RUNTIME__=Object.freeze(R);
})();