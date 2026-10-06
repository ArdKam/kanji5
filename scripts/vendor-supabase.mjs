import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

const PACKAGE = "@supabase/supabase-js";
const VERSION = "2.117.2";
const RELEASE_COMMIT = "6d21e3f";
const root = process.cwd();
const vendorDir = path.join(root, "vendor");
const output = path.join(vendorDir, `supabase-js-${VERSION}.js`);
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "kanji5-r12-supabase-"));

try {
  fs.writeFileSync(path.join(temp, "package.json"), JSON.stringify({
    private: true,
    name: "kanji5-r12-supabase-vendor"
  }, null, 2));
  execFileSync(npm, [
    "install",
    "--ignore-scripts",
    "--no-fund",
    "--no-progress",
    "--save-exact",
    `${PACKAGE}@${VERSION}`
  ], { cwd: temp, stdio: "inherit" });

  execFileSync(npm, [
    "audit",
    "--audit-level=high",
    "--no-fund"
  ], { cwd: temp, stdio: "inherit" });

  const installed = JSON.parse(fs.readFileSync(
    path.join(temp, "node_modules", "@supabase", "supabase-js", "package.json"),
    "utf8"
  ));
  if (installed.version !== VERSION) {
    throw new Error(`R12_SUPABASE_VERSION_MISMATCH: expected ${VERSION}, got ${installed.version}`);
  }

  const source = path.join(temp, "node_modules", "@supabase", "supabase-js", "dist", "umd", "supabase.js");
  if (!fs.existsSync(source)) throw new Error("R12_SUPABASE_UMD_MISSING");
  fs.mkdirSync(vendorDir, { recursive: true });
  fs.copyFileSync(source, output);

  const digest = createHash("sha256").update(fs.readFileSync(output)).digest("hex");
  const bytes = fs.statSync(output).size;
  if (bytes < 10000) throw new Error("R12_SUPABASE_VENDOR_TOO_SMALL");

  console.log(JSON.stringify({
    package: PACKAGE,
    version: VERSION,
    releaseCommit: RELEASE_COMMIT,
    output: path.relative(root, output),
    bytes,
    sha256: digest
  }, null, 2));
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
