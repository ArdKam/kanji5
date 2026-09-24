import fs from "node:fs";
const app=fs.readFileSync("frontend/src/app/App.tsx","utf8");
if(!app.includes('window.confirm(message)')) throw new Error("reset confirmation missing");
if(!app.includes("همهٔ پیشرفت یادگیری پاک می‌شود")) throw new Error("Persian reset warning missing");
if(!app.includes("All learning progress will be erased")) throw new Error("English reset warning missing");
const handler=app.match(/onReset=>\{[\s\S]{0,500}?window\.confirm\(message\)[\s\S]{0,300}?resetProgress\(\)/);
if(!handler) throw new Error("reset action is not guarded by confirmation");
console.log("reset confirmation contract: PASS");
