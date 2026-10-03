import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const cspMatch = index.match(/<meta\\s+http-equiv=["']Content-Security-Policy["']\\s+content="([^"]+)"\\s*\\/?>/i);
assert.ok(cspMatch, 'index.html must declare an explicit Content-Security-Policy');
const csp = cspMatch[1];
const scriptSource = csp.match(/(?:^|;)\s*script-src\s+([^;]+)/i)?.[1] || '';
assert.ok(scriptSource.includes("'self'"), 'CSP script-src must include self');
assert.ok(!scriptSource.includes("'unsafe-inline'"), 'CSP script-src must not allow unsafe-inline');

const inlineScripts = [...index.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1])
  .filter(source => source.trim());
assert.ok(inlineScripts.length >= 1, 'Expected inline bootstrap script(s) to be detected');
for (const source of inlineScripts) {
  const digest = crypto.createHash('sha256').update(source, 'utf8').digest('base64');
  assert.ok(csp.includes("'sha256-" + digest + "'"), 'Every inline script must be authorized by an exact CSP SHA-256 hash');
}

for (const required of [
  'connect-src',
  'https://vbrtzkejodkddfdbolbo.supabase.co',
  'https://kanjiapi.dev',
  'https://api.tatoeba.org',
  'https://raw.githubusercontent.com',
  'font-src',
  'style-src',
  'object-src \'none\'',
  'base-uri \'self\'',
]) {
  assert.ok(csp.includes(required), `CSP is missing required directive/value: ${required}`);
}

assert.equal((index.match(/document\.write\(/g) || []).length, 1, 'The compatibility loader document.write sink must remain singular and auditable');
assert.match(index, /const legacyScripts = \[/, 'Compatibility loader allowlist is missing');

const reactRoot = path.join(root, 'frontend', 'src', 'app');
const stack = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(tsx|ts)$/.test(entry.name)) stack.push(full);
  }
}
walk(reactRoot);
const unsafeReact = stack.filter(file => /dangerouslySetInnerHTML|\.innerHTML\s*=|insertAdjacentHTML/.test(fs.readFileSync(file, 'utf8')));
assert.deepEqual(unsafeReact, [], 'React presentation must not inject HTML directly');

const excluded = new Set(['scripts', 'e2e', 'node_modules', 'react-dist', 'frontend', '.git']);
const runtimeFiles = fs.readdirSync(root, { withFileTypes: true })
  .filter(entry => entry.isFile() && /\.js$/.test(entry.name))
  .map(entry => path.join(root, entry.name));
const unsafeRuntime = runtimeFiles.filter(file => /\.innerHTML\s*=|insertAdjacentHTML|outerHTML\s*=/.test(fs.readFileSync(file, 'utf8')));
assert.deepEqual(
  unsafeRuntime,
  [],
  'Shipped root runtime JS must not use direct HTML sinks; use DOM APIs + textContent instead',
);

const supabaseSync = fs.readFileSync(path.join(root, 'supabase-sync.js'), 'utf8');
assert.match(supabaseSync, /@supabase\/supabase-js@2\.57\.4/);
assert.doesNotMatch(supabaseSync, /@supabase\/supabase-js@(?:latest|\d+\.\d+|\d+)/);
assert.doesNotMatch(supabaseSync, /service[_-]?role/i);

console.log('Kanji 5 CSP + unsafe-DOM security boundary passed.');
