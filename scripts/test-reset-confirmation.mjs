import fs from "node:fs";

const app=fs.readFileSync("frontend/src/app/App.tsx","utf8");
const settings=fs.readFileSync("frontend/src/app/SettingsDialog.tsx","utf8");

if (app.includes("window.confirm(message)")) throw new Error("native reset confirmation should not be used");
if (!settings.includes("resetArmed")) throw new Error("reset confirmation state missing");
if (!settings.includes("This permanently removes learning progress and cannot be undone.")) throw new Error("English reset warning missing");
if (!settings.includes("این کار همهٔ پیشرفت یادگیری را پاک می‌کند و قابل بازگشت نیست.")) throw new Error("Persian reset warning missing");
if (!settings.includes("Yes, reset progress")) throw new Error("explicit reset action missing");
if (!settings.includes("onReset()")) throw new Error("reset action is not wired");

console.log("reset confirmation contract: PASS");
