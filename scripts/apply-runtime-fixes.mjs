import fs from "node:fs/promises";

const FILE = "index.html";
const TAG = '<script src="./v1.2-runtime-fixes.js"></script>';

let html = await fs.readFile(FILE, "utf8");

if (!html.includes(TAG)) {
  if (!html.includes("</body>")) throw new Error("Missing </body>");
  html = html.replace("</body>", `${TAG}</body>`);
}

await fs.writeFile(FILE, html, "utf8");
console.log("Injected v1.2 runtime fixes.");
