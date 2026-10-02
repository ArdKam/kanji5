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
  "sw.js",
  "kanji-data.json",
  "kanji-components.json",
  ...shell.filter(item=>item!=="./").map(item=>String(item).replace(/^\.\//,""))
]);
required.add("react-dist");
for (const doc of ["docs/PUBLIC-PRODUCT.md","docs/BROWSER-SUPPORT.md","docs/PRIVACY-AND-DATA.md","docs/FEEDBACK.md"]) required.add(doc);

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

const buildId=String(process.env.KANJI5_BUILD_ID||process.env.GITHUB_SHA||"dev").trim().slice(0,40).replace(/[^A-Za-z0-9._-]/g,"-")||"dev";
const indexPath=path.join(site,"index.html");
const index=fs.readFileSync(indexPath,"utf8");
let stagedIndex=fs.readFileSync(indexPath,"utf8");
stagedIndex=stagedIndex.replace(/(<meta name="kanji5-build-id" content=")[^"]*(">)/,"$1"+buildId+"$2");
stagedIndex=stagedIndex.replace(/\?v=dev/g,"?v="+encodeURIComponent(buildId));
fs.writeFileSync(indexPath,stagedIndex);

const swPath=path.join(site,"sw.js");
const shippedSw=fs.readFileSync(swPath,"utf8");
if(!shippedSw.includes("const BUILD_ID='__KANJI5_BUILD_ID__';"))throw new Error("SW_BUILD_ID_PLACEHOLDER_MISSING");
fs.writeFileSync(swPath,shippedSw.replace("const BUILD_ID='__KANJI5_BUILD_ID__';","const BUILD_ID='"+buildId+"';"));

const entries=fs.readdirSync(site,{withFileTypes:true}).map(x=>x.name).sort();
console.log("Staged GitHub Pages artifact:");
console.log(entries.join("\n"));
