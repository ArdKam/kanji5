import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const site=path.join(root,"_site");
fs.rmSync(site,{recursive:true,force:true});

const sw=fs.readFileSync(path.join(root,"sw.js"),"utf8");
const match=sw.match(/const SHELL=(\[[\s\S]*?\]);/);
if(!match)throw new Error("SW_SHELL_NOT_FOUND");
const shell=JSON.parse(match[1]);

const required=new Set([
  "index.html",
  "kanji-data.json",
  "kanji-components.json",
  ...shell.filter(item=>item!=="./").map(item=>String(item).replace(/^\.\//,""))
]);
required.add("react-dist");

function copy(relative){
  const source=path.join(root,relative);
  const destination=path.join(site,relative);
  if(!fs.existsSync(source))throw new Error("PAGE_ASSET_MISSING: "+relative);
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  fs.cpSync(source,destination,{recursive:true});
}

for(const relative of required){
  if(relative==="react-dist"){copy(relative);continue;}
  copy(relative);
}

const entries=fs.readdirSync(site,{withFileTypes:true}).map(x=>x.name).sort();
console.log("Staged GitHub Pages artifact:");
console.log(entries.join("\n"));
