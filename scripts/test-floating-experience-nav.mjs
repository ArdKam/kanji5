import fs from "node:fs";
const css=fs.readFileSync("frontend/src/styles.css","utf8");
const navCss=fs.readFileSync("frontend/src/experience-nav.css","utf8");
const app=fs.readFileSync("frontend/src/app/App.tsx","utf8");

const nav=app.match(/<nav className=\{["']experience-nav active-tab-"\+experience\}[^>]*>[\s\S]*?<\/nav>/)?.[0]??"";
if(!nav) throw new Error("experience navigation markup missing");
if(!nav.includes("experience-tab-indicator")) throw new Error("animated experience indicator missing");
if(!/\.experience-nav\{\s*position:fixed/.test(navCss)) throw new Error("experience nav is not fixed");
if(!navCss.includes("env(safe-area-inset-bottom)")) throw new Error("safe-area bottom inset missing");
if(!navCss.includes("backdrop-filter:blur(14px)")) throw new Error("floating nav surface missing");
if(!css.includes("--nav-bar-height:66px") && !navCss.includes("--nav-bar-height:66px")) throw new Error("shared navigation height token missing");
const clearance="calc(var(--nav-bar-height) + max(14px,env(safe-area-inset-bottom))";
if(!css.includes(clearance) && !navCss.includes(clearance)) throw new Error("shared navigation clearance missing");
if(!navCss.includes(".experience-tab{height:46px;box-sizing:border-box")) throw new Error("experience tab geometry missing");
console.log("floating experience nav contract: PASS");
