import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
const apiStart = source.indexOf('async function apiCacheFirst(req){');
const apiEnd = source.indexOf('async function dynamicSameOrigin(req){', apiStart);
assert.ok(apiStart >= 0 && apiEnd > apiStart, 'apiCacheFirst implementation must exist');
const api = source.slice(apiStart, apiEnd);

assert.equal(api.includes('await c.delete(req)'), false, 'Expired API cache must remain available until replacement succeeds');
assert.match(api, /if\(hit\)return hit/, 'A stale cached response must be used after a network failure');
assert.match(api, /if\(!raw\.ok\)\{if\(hit&&raw\.status>=500\)return hit;return raw;\}/, 'Stale cached data must not mask a genuine client-side HTTP error');
assert.match(api, /isWordsApi=req\.url\.startsWith/, 'The legacy empty-array response must be restricted to the words API');
assert.match(api, /'status':503|status:503/, 'Non-word API failures must return a service-unavailable response');
assert.match(api, /X-Kanji5-Offline-Fallback/, 'Offline fallback responses must be explicitly marked');

const navigationStart = source.indexOf('async function networkFirst(req,name,fallback,timeoutMs=3500){');
const navigationEnd = source.indexOf("self.addEventListener('fetch'", navigationStart);
assert.ok(navigationStart >= 0 && navigationEnd > navigationStart, 'Timed navigation strategy must exist');
const navigation = source.slice(navigationStart, navigationEnd);
assert.match(navigation, /new AbortController\(\)/, 'Network-first navigation must have an abort controller');
assert.match(navigation, /setTimeout\(\(\)=>controller\.abort\(\),timeoutMs\)/, 'Navigation network requests must be bounded by a timeout');
assert.match(navigation, /new URL\(fallback,self\.location\.href\)/, 'Offline navigation must resolve the cached app shell correctly');

console.log('Service-worker stale-cache, offline-status, and navigation-timeout contracts passed.');
