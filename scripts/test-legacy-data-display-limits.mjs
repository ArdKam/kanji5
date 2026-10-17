import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const runtime = await readFile(new URL("../review-runtime.js", import.meta.url), "utf8");
assert.match(runtime, /item\.meaning\.slice\(0,3\)/, "Legacy fallback card must keep the existing three-gloss visual density");
assert.match(runtime, /Array\.isArray\(item\.on\)\?item\.on\.slice\(0,4\):\[\]/, "Legacy fallback card must display only the first four on'yomi");
assert.match(runtime, /Array\.isArray\(item\.kun\)\?item\.kun\.slice\(0,4\):\[\]/, "Legacy fallback card must display only the first four kun'yomi");
assert.match(runtime, /item\.meaning\.slice\(0,8\)/, "Diagnostic snapshot should retain the existing extended meaning reference allowance");
assert.match(runtime, /item\.on\.slice\(0,8\)/, "Diagnostic snapshot should retain the existing extended on'yomi reference allowance");
assert.match(runtime, /item\.kun\.slice\(0,8\)/, "Diagnostic snapshot should retain the existing extended kun'yomi reference allowance");
console.log("Legacy data display limits: PASS (full source data retained; presentation density preserved)");
