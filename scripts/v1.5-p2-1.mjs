import fs from 'node:fs';
const path='sw.js';let s=fs.readFileSync(path,'utf8');const assert=(x,m)=>{if(!x)throw new Error(m)};
const re=/async function dynamicSameOrigin\(req\)\{[\s\S]*?\n\}\nself\.addEventListener\('fetch'/;
const replacement=`async function dynamicSameOrigin(req){try{return await fetch(req)}catch(_){return Response.error()}}\nself.addEventListener('fetch'`;
assert(re.test(s),'dynamic same-origin cache helper not found');s=s.replace(re,replacement);fs.writeFileSync(path,s);
const out=fs.readFileSync(path,'utf8');assert(out.includes('async function dynamicSameOrigin(req){try{return await fetch(req)}catch(_){return Response.error()}}'),'P2-1 dynamic same-origin path was not bounded');assert(!out.slice(out.indexOf('async function dynamicSameOrigin')).split('self.addEventListener(\'fetch\'')[0].includes('cache')&&!out.slice(out.indexOf('async function dynamicSameOrigin')).split('self.addEventListener(\'fetch\'')[0].includes('caches'),'P2-1 dynamic helper still writes/reads cache');console.log('P2-1 service-worker dynamic cache patch passed.');
