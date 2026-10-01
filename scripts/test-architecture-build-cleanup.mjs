import assert from "node:assert/strict";
import fs from "node:fs";

const read=(path)=>fs.readFileSync(path,"utf8");
const index=read("index.html");
const bootstrap=read("app-bootstrap.js");
const entry=read("react-entry.js");
const pages=read(".github/workflows/pages-deploy.yml");
const reactWorkflow=read(".github/workflows/react-frontend.yml");
const gitignore=read(".gitignore");

assert.match(index,/\\.\\/app-bootstrap\\.js/);
assert.doesNotMatch(index,/app-bootstrap-release18|app-bootstrap-release19/);
assert.match(bootstrap,/serviceWorker\\.register\\('\\.\\/sw\\.js\\?v=/);
assert.doesNotMatch(bootstrap,/sw-release18|sw-release19/);
assert.match(entry,/react-dist\\/kanji5-react\\.js/);
assert.match(entry,/react-dist\\/kanji5-react\\.css/);

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

assert.match(gitignore,/^\\/react-dist\\/$/m);
assert.match(pages,/npm run build/);
assert.match(pages,/actions\\/upload-pages-artifact@v4/);
assert.doesNotMatch(pages,/git add react-dist/);
assert.doesNotMatch(pages,/git push origin/);
assert.doesNotMatch(pages,/react-dist\\/kanji5-react-release18/);
assert.doesNotMatch(pages,/sw-release18|sw-release19/);
assert.doesNotMatch(reactWorkflow,/Materialize release18 React artifact/);
assert.doesNotMatch(reactWorkflow,/sw-release18\\.js|sw-release19\\.js/);

console.log("Architecture/build cleanup contract passed.");
