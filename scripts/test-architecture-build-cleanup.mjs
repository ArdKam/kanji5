import assert from "node:assert/strict";
import fs from "node:fs";

const read=(path)=>fs.readFileSync(path,"utf8");
const index=read("index.html");
const bootstrap=read("app-bootstrap.js");
const entry=read("react-entry.js");
const pages=read(".github/workflows/pages-deploy.yml");
const reactWorkflow=read(".github/workflows/react-frontend.yml");
const gitignore=read(".gitignore");

assert.ok(index.includes("./app-bootstrap.js"));
assert.ok(!index.includes("app-bootstrap-release18.js")&&!index.includes("app-bootstrap-release19.js"));
assert.ok(bootstrap.includes("serviceWorker.register('./sw.js?v="));
assert.ok(!bootstrap.includes("sw-release18")&&!bootstrap.includes("sw-release19"));
assert.ok(entry.includes("react-dist/kanji5-react.js"));
assert.ok(entry.includes("react-dist/kanji5-react.css"));

for(const retired of [
  "app-bootstrap-release18.js",
  "app-bootstrap-release19.js",
  "sw-release18.js",
  "sw-release19.js",
  "react-dist/kanji5-react-release18.js",
  "react-dist/kanji5-react-release18.css",
  "react-dist/kanji5-react.js",
  "react-dist/kanji5-react.css"
]){
  assert.equal(fs.existsSync(retired),false,"retired generated artifact still exists: "+retired);
}

assert.ok(gitignore.split(/\\r?\\n/).includes("/react-dist/"));
assert.ok(pages.includes("npm run build"));
assert.ok(pages.includes("actions/upload-pages-artifact@v4"));
assert.ok(!pages.includes("git add react-dist/"));
assert.ok(!pages.includes("git push origin"));
assert.ok(!pages.includes("react-dist/kanji5-react-release18"));
assert.ok(!pages.includes("sw-release18")&&!pages.includes("sw-release19"));
assert.ok(!reactWorkflow.includes("Materialize release18 React artifact"));
assert.ok(!reactWorkflow.includes("sw-release18.js")&&!reactWorkflow.includes("sw-release19.js"));

console.log("Architecture/build cleanup contract passed.");
