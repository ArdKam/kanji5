import fs from 'node:fs';
const s=fs.readFileSync('sw.js','utf8');const assert=(x,m)=>{if(!x)throw new Error(m)};
assert(s.includes("const CACHE='kanji5-shell-v45'"),'Shell cache missing');assert(s.includes("const DATA_CACHE='kanji5-data-v24'"),'Data cache missing');assert(s.includes("const API_CACHE='kanji5-api-v14'"),'API cache missing');
const start=s.indexOf('async function dynamicSameOrigin'),end=s.indexOf("self.addEventListener('fetch'",start);const helper=s.slice(start,end);
assert(helper.includes('fetch(req)'),'Dynamic same-origin path must still fetch');assert(!helper.includes('caches.'),'Dynamic same-origin path must not touch CacheStorage');assert(s.includes("if(u.origin===API_ORIGIN&&u.pathname.startsWith('/v1/words/'))"),'Kanji API cache route disappeared');assert(s.includes("if(u.origin===TATOEBA_ORIGIN&&u.pathname.startsWith('/v1/sentences'))"),'Tatoeba cache route disappeared');
console.log('Kanji 5 v1.5 service-worker dynamic cache bound test passed.');
