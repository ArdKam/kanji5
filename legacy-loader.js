(()=>{
'use strict';
if(new URLSearchParams(location.search).get("legacy")!=="1")return;
const legacyScripts=[
  "./v1.4-education-migration.js",
  "./v1.4-education-core.js",
  "./v1.5-p0.js",
  "./v1.2-enhancements.js",
  "./v1.2-runtime-fixes.js",
  "./v1.9-recovery.js",
  "./v1.5-education-ui.js"
];
// Compatibility-only path. All script URLs are compile-time constants; no user or provider data reaches this sink.
document.write(legacyScripts.map(src=>`<script src="${src}"><\\/script>`).join(""));
})();
