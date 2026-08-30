import fs from "node:fs/promises";
const FILE = "index.html";
const CONFIG_TAG = '<script src="./supabase-config.js"></script>';
const SYNC_TAG = '<script type="module" src="./supabase-sync.js"></script>';
let html = await fs.readFile(FILE, "utf8");
if (!html.includes(CONFIG_TAG)) {
  if (!html.includes("</body>")) throw new Error("Missing </body>");
  html = html.replace("</body>", CONFIG_TAG + SYNC_TAG + "</body>");
} else if (!html.includes(SYNC_TAG)) {
  html = html.replace("</body>", SYNC_TAG + "</body>");
}
await fs.writeFile(FILE, html, "utf8");
console.log("Applied Supabase auth/sync integration.");
