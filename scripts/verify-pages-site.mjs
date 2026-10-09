import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const site=path.resolve("_site");
assert.ok(fs.existsSync(site),"PAGES_SITE_MISSING");

const required=[
  "index.html",
  "sw.js",
  "app-bootstrap.js",
  "legacy-loader.js",
  "theme-bootstrap.js",
  "react-entry.js",
  "react-dist/kanji5-react.js",
  "react-dist/kanji5-react.css",
  "manifest.webmanifest",
  "kanji-data.json",
  "kanji-components.json",
  "kanji-visual-structure.json",
  "vendor/ts-fsrs-5.4.1.mjs",
  "vendor/supabase-js-2.117.2.js"
];
for(const relative of required){
  assert.ok(fs.existsSync(path.join(site,relative)),"PAGES_SITE_REQUIRED_ASSET_MISSING: "+relative);
}

const visualStructure=JSON.parse(fs.readFileSync(path.join(site,"kanji-visual-structure.json"),"utf8"));
assert.equal(visualStructure.schema,"kanji-visual-structure/v1","PAGES_SITE_VISUAL_STRUCTURE_SCHEMA_INVALID");
assert.equal(visualStructure.coverage?.available,2136,"PAGES_SITE_VISUAL_STRUCTURE_COVERAGE_INCOMPLETE");
assert.equal(visualStructure.coverage?.total,2136,"PAGES_SITE_VISUAL_STRUCTURE_TOTAL_MISMATCH");
assert.equal(Object.keys(visualStructure.structures||{}).length,2136,"PAGES_SITE_VISUAL_STRUCTURE_RECORD_COUNT_MISMATCH");
assert.deepEqual(visualStructure.missing,[],"PAGES_SITE_VISUAL_STRUCTURE_HAS_UNREVIEWED_GAPS");


for(const forbidden of [
  "frontend",
  "node_modules",
  "scripts",
  "e2e",
  ".github",
  ".git",
  "playwright-report",
  "test-results"
]){
  assert.equal(fs.existsSync(path.join(site,forbidden)),false,"PAGES_SITE_CONTAINS_DEV_TREE: "+forbidden);
}

const index=fs.readFileSync(path.join(site,"index.html"),"utf8");

// Every local script/link resource explicitly referenced by index.html must exist in the staged Pages artifact.
// This catches assets that are accidentally omitted from the SW shell (which drives staging).
const localReferences=[...index.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)="([^"]+)"/gi)]
  .map(match=>match[1])
  .filter(value=>! /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value));
for(const reference of localReferences){
  const pathname=decodeURIComponent(reference.split(/[?#]/,1)[0]).replace(/^\.\//,"").replace(/^\//,"");
  if(!pathname)continue;
  assert.ok(fs.existsSync(path.join(site,pathname)),"PAGES_SITE_INDEX_RESOURCE_MISSING: "+reference);
}
const buildMatch=index.match(/<meta name="kanji5-build-id" content="([^"]+)">/);
assert.ok(buildMatch&&buildMatch[1],"PAGES_SITE_BUILD_ID_MISSING");
const buildId=buildMatch[1];

const sw=fs.readFileSync(path.join(site,"sw.js"),"utf8");
const match=sw.match(/const SHELL=(\[[\s\S]*?\]);/);
assert.ok(sw.includes("const BUILD_ID='"+buildId+"';"),"PAGES_SITE_SW_BUILD_ID_MISMATCH");
assert.ok(!sw.includes("__KANJI5_BUILD_ID__"),"PAGES_SITE_SW_BUILD_ID_PLACEHOLDER_REMAINED");
assert.ok(match,"PAGES_SITE_SW_SHELL_MISSING");
const shell=JSON.parse(match[1]);
for(const item of shell){
  if(item==="./")continue;
  const relative=String(item).replace(/^\.\//,"");
  assert.ok(fs.existsSync(path.join(site,relative)),"PAGES_SITE_SW_ASSET_MISSING: "+relative);
}
assert.ok(fs.existsSync(path.join(site,"react-dist/assets")),"PAGES_SITE_REACT_ASSETS_MISSING");
const maps=[];
(function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,entry.name);
    if(entry.isDirectory())walk(full);
    else if(entry.name.endsWith(".map"))maps.push(path.relative(site,full));
  }
})(site);
assert.deepEqual(maps,[],"PAGES_SITE_SOURCE_MAPS_EXPOSED: "+maps.join(","));


console.log(`GitHub Pages staging verification passed (${shell.length} SW shell entries).`);
