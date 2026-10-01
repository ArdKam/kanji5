import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const jpCss=await readFile(new URL('../frontend/src/noto-serif-jp.css',import.meta.url),'utf8');

assert.doesNotMatch(html,/fonts\.googleapis\.com/);
assert.doesNotMatch(html,/fonts\.gstatic\.com/);
assert.match(html,/react-dist\/assets\/Vazirmatn_wght_-BeciDpKm\.woff2/);
assert.match(jpCss,/assets\/NotoSerifJP-Regular\.subset\.woff2/);
assert.doesNotMatch(html,/rel="preload"[^>]+NotoSerifJP-Regular\.subset\.woff2/);

console.log('Startup font-loading contract: PASS');