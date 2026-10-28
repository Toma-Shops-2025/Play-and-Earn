#!/usr/bin/env node
/**
 * Cross-platform entry: runs build-apk.ps1 on Windows, build-apk.sh elsewhere.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const isWin = process.platform === "win32";

if (isWin) {
  const ps1 = path.join(root, "build-apk.ps1");
  if (!existsSync(ps1)) {
    console.error("Missing build-apk.ps1");
    process.exit(1);
  }
  const r = spawnSync(
    "powershell",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ps1, ...process.argv.slice(2)],
    { stdio: "inherit", cwd: root },
  );
  process.exit(r.status ?? 1);
}

const sh = path.join(root, "build-apk.sh");
const r = spawnSync("bash", [sh, ...process.argv.slice(2)], {
  stdio: "inherit",
  cwd: root,
});
process.exit(r.status ?? 1);
