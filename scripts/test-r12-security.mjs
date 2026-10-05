import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const read = file => fs.readFileSync(file, "utf8");
const root = path.resolve(".");
const runtimeFiles = fs.readdirSync(root, { withFileTypes: true })
  .filter(entry => entry.isFile() && entry.name.endsWith(".js"))
  .map(entry => entry.name)
  .sort();

for (const file of runtimeFiles) assert.ok(fs.existsSync(path.join(root, file)), `R12_RUNTIME_FILE_MISSING: ${file}`);

const unsafeSink = /(?:dangerouslySetInnerHTML|\.innerHTML\s*=|insertAdjacentHTML\s*\(|outerHTML\s*=|srcdoc\s*=|document\.write\s*\()/;
for (const file of runtimeFiles) {
  const source = read(path.join(root, file));
  if (file === "legacy-loader.js") continue;
  assert.doesNotMatch(source, unsafeSink, `R12_UNSAFE_DOM_SINK: ${file}`);
}

const legacyLoader = read(path.join(root, "legacy-loader.js"));
assert.match(legacyLoader, /document\.write\s*\(/, "R12_LEGACY_COMPAT_LOADER_MISSING");
assert.deepEqual(
  [...legacyLoader.matchAll(/"\.\/[^"]+\.js"/g)].map(match => match[0]),
  [
    '"./v1.4-education-migration.js"',
    '"./v1.4-education-core.js"',
    '"./v1.5-p0.js"',
    '"./v1.2-enhancements.js"',
    '"./v1.2-runtime-fixes.js"',
    '"./v1.9-recovery.js"',
    '"./v1.5-education-ui.js"'
  ],
  "R12_LEGACY_LOADER_URLS_CHANGED"
);
assert.match(legacyLoader, /no user or provider data reaches this sink/);

const index = read(path.join(root, "index.html"));
const csp = index.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/i)?.[1] || "";
assert.ok(csp, "R12_CSP_META_MISSING");
assert.match(csp, /default-src 'self'/);
assert.match(csp, /script-src 'self'/);
assert.doesNotMatch(csp, /script-src[^;]*unsafe-inline/);
assert.match(csp, /object-src 'none'/);
assert.match(csp, /base-uri 'self'/);
assert.match(csp, /form-action 'self'/);
assert.match(csp, /script-src-attr 'none'/);
assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/i.test(index), "R12_INLINE_SCRIPT_REMAINS");
assert.doesNotMatch(index, /https?:\/\/[^"'\s>]+\.js/i, "R12_REMOTE_SCRIPT_TAG");

const supabaseSync = read(path.join(root, "supabase-sync.js"));
assert.match(supabaseSync, /SUPABASE_BROWSER_RUNTIME\s*=\s*'\.\/vendor\/supabase-js-2\.117\.2\.js'/);
assert.doesNotMatch(supabaseSync, /cdn\.jsdelivr\.net|esm\.sh|unpkg\.com/);
assert.doesNotMatch(supabaseSync, /import\(\s*['"]https?:/);
assert.match(supabaseSync, /window\.location\.origin\s*\+\s*window\.location\.pathname/);
assert.match(supabaseSync, /persistSession\s*:\s*true/);
assert.match(supabaseSync, /autoRefreshToken\s*:\s*true/);
assert.match(supabaseSync, /detectSessionInUrl\s*:\s*true/);

const config = read(path.join(root, "supabase-config.js"));
const anon = config.match(/anonKey:\s*["']([^"']+)["']/)?.[1] || "";
assert.ok(anon, "R12_SUPABASE_PUBLISHABLE_KEY_MISSING");
assert.doesNotMatch(anon, /service[-_]role|SUPABASE_SERVICE_ROLE/i);
assert.doesNotMatch(config, /service[-_ ]role/i);

const secretPattern = /(-----BEGIN [A-Z ]*PRIVATE KEY-----|\bsk_(?:live|test)_[A-Za-z0-9]+\b|\bgh[pousr]_[A-Za-z0-9_]+\b|github_pat_[A-Za-z0-9_]+\b)/;
for (const file of runtimeFiles) assert.doesNotMatch(read(path.join(root, file)), secretPattern, `R12_SECRET_PATTERN: ${file}`);

const viteConfig = read(path.join(root, "frontend/vite.config.ts"));
assert.match(viteConfig, /sourcemap:\s*false/);

const schema = read(path.join(root, "supabase/schema.sql"));
for (const policy of [
  'for select',
  'for insert',
  'for update',
  'for delete'
]) assert.match(schema, new RegExp(policy), `R12_SCHEMA_POLICY_MISSING: ${policy}`);
assert.match(schema, /revoke all on public\.user_learning_state from authenticated/);
assert.match(schema, /grant select, insert, update, delete on public\.user_learning_state to authenticated/);
assert.match(schema, /revoke all on public\.user_learning_state from anon/);

const siteArg = process.argv[2];
if (siteArg) {
  const site = path.resolve(siteArg);
  assert.ok(fs.existsSync(site), "R12_SITE_MISSING");
  const required = [
    "index.html",
    "react-dist/kanji5-react.js",
    "react-dist/kanji5-react.css",
    "vendor/ts-fsrs-5.4.1.mjs",
    "vendor/supabase-js-2.117.2.js"
  ];
  for (const file of required) assert.ok(fs.existsSync(path.join(site, file)), `R12_SITE_ASSET_MISSING: ${file}`);
  const files=[];
  (function walk(dir){
    for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
      const full=path.join(dir,entry.name);
      if(entry.isDirectory()) walk(full);
      else files.push(full);
    }
  })(site);
  const maps=files.filter(file=>file.endsWith(".map"));
  assert.deepEqual(maps,[], "R12_SITE_SOURCE_MAPS_EXPOSED");
  for (const file of files.filter(file => /\.(html|js|css)$/.test(file))) {
    const source=read(file);
    assert.doesNotMatch(source, /(?:cdn\.jsdelivr\.net|esm\.sh|unpkg\.com)\/.*(?:supabase|supabase-js)/i, `R12_REMOTE_SUPABASE_RUNTIME: ${path.relative(site,file)}`);
  }
  const vendor=read(path.join(site,"vendor/supabase-js-2.117.2.js"));
  assert.ok(vendor.length>10000 && /createClient/.test(vendor), "R12_SUPABASE_VENDOR_NOT_REAL");
}

console.log(siteArg ? `Kanji5 R12 source + staged-artifact security checks passed: ${path.resolve(siteArg)}` : "Kanji5 R12 source security checks passed.");
