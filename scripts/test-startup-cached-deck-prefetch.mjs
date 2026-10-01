import fs from 'node:fs';
const p0=fs.readFileSync('v1.3-p0.js','utf8');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
assert(p0.includes("localStorage.getItem('kanji5-deck')"),'P0 loader must inspect the cached deck');
assert(p0.includes('Array.isArray(deck)&&deck.length===2136'),'Cached deck validity check missing');
assert(p0.includes('hasCachedDeck()?Promise.resolve(null):fetch(DATA_URL'),'Cached decks must skip the redundant dataset prefetch');
assert(p0.includes('fetch(DATA_URL,{cache:\'force-cache\'})'),'Cold-start dataset fallback disappeared');
assert(p0.includes('window.__KANJI5_P0_DATA_PROMISE'),'Shared dataset promise contract disappeared');
console.log('Startup cached-deck prefetch contract passed.');
