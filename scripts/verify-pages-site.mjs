import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const site=path.resolve("_site");
assert.ok(fs.existsSync(site),"PAGES_SITE_MISSING");

const required=[
  "index.html",
  "sw.js",
  "app-bootstrap.js",
  "react-entry.js",
  "react-dist/kanji5-react.js",
  "react-dist/kanji5-react.css",
  "manifest.webmanifest",
  "kanji-data.json",
  "kanji-components.json",
  "vendor/ts-fsrs-5.4.1.mjs"
];
for(const relative of required){
  assert.ok(fs.existsSync(path.join(site,relative)),"PAGES_SITE_REQUIRED_ASSET_MISSING: "+relative);
}

for(const forbidden of [
  "frontend",
  "node_modules",
  "docs",
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
const buildMatch=index.match(/<meta name="kanji5-build-id" content="([^"]+)">/);
assert.ok(buildMatch&&buildMatch[1],"PAGES_SITE_BUILD_ID_MISSING");
const buildId=buildMatch[1];

const sw=fs.readFileSync(path.join(site,"sw.js"),"utf8");
assert.ok(sw.includes("const BUILD_ID='"+buildId+"';"),"PAGES_SITE_SW_BUILD_ID_MISMATCH");
assert.ok(!sw.includes("__KANJI5_BUILD_ID__"),"PAGES_SITE_SW_BUILD_ID_PLACEHOLDER_REMAINED");
const match=sw.match(/const SHELL=(\[[\s\S]*?\]);/);
assert.ok(match,"PAGES_SITE_SW_SHELL_MISSING");
const shell=JSON.parse(match[1]);
for(const item of shell){
  if(item==="./")continue;
  const relative=String(item).replace(/^\.\//,"");
  assert.ok(fs.existsSync(path.join(site,relative)),"PAGES_SITE_SW_ASSET_MISSING: "+relative);
}
assert.ok(fs.existsSync(path.join(site,"react-dist/assets")),"PAGES_SITE_REACT_ASSETS_MISSING");

console.log(`GitHub Pages staging verification passed (${shell.length} SW shell entries).`);
