import fs from "node:fs";
const app=fs.readFileSync("frontend/src/app/App.tsx","utf8");
if(!app.includes("window.confirm(message)")) throw new Error("reset confirmation missing");
if(!app.includes("همهٔ پیشرفت یادگیری پاک می‌شود")) throw new Error("Persian reset warning missing");
if(!app.includes("All learning progress will be erased")) throw new Error("English reset warning missing");
const resetIndex=app.indexOf("onReset=");
const guard=resetIndex>=0?app.slice(resetIndex,resetIndex+900):"";
if(!guard.includes("window.confirm(message)")||!guard.includes("resetProgress()")) throw new Error("reset action is not guarded by confirmation");
console.log("reset confirmation contract: PASS");
