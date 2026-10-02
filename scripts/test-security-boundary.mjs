import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve('frontend/src/app');
const stack=[];
function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,entry.name);
    if(entry.isDirectory())walk(full);else if(/\.(tsx|ts)$/.test(entry.name))stack.push(full);
  }
}
walk(root);
const unsafe=stack.filter(file=>{
  const source=fs.readFileSync(file,'utf8');
  return /dangerouslySetInnerHTML|\.innerHTML\s*=/.test(source);
});
assert.deepEqual(unsafe,[],'React presentation must not inject HTML directly; render external/provider text as data.');
const runtime=fs.readFileSync('review-runtime.js','utf8');
assert.match(runtime,/function escapeHtml\(value\)/);
assert.match(runtime,/escapeHtml\(x\.word\)/);
assert.match(runtime,/escapeHtml\(x\.reading\)/);

const config=fs.readFileSync('supabase-config.js','utf8');
assert.match(config,/anonKey/);
const anonKeyMatch=config.match(/anonKey:\s*["']([^"']+)["']/);
assert.ok(anonKeyMatch,'Supabase publishable anonKey is missing');
assert.doesNotMatch(anonKeyMatch[1],/service_role|service-role|SUPABASE_SERVICE_ROLE/i);
console.log('Kanji 5 public security boundary passed.');